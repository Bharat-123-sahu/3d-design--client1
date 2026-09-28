import { getViewportProfile } from "../utils/responsive.js";
import * as THREE from "three";
import gsap from "gsap";
import { navigationNodes, getPath, CAMERA_LERP } from "../data/navigationData.js";
import { characterConfig } from "../data/experienceConfig.js";
import { getViewportProfile } from "../utils/responsive.js";
import { CharacterModel } from "../three/CharacterModel.js";

export const NAV_STATE = Object.freeze({ IDLE: "idle", OPENING_NAV: "opening_nav", SELECTING: "selecting", MOVING: "moving", ARRIVING: "arriving", SETTLING: "settling" });
const allowed = { idle: ["opening_nav", "moving"], opening_nav: ["selecting", "idle", "moving"], selecting: ["idle", "moving"], moving: ["arriving"], arriving: ["settling"], settling: ["idle"] };

export class CharacterNavigationManager {
  constructor(scene, camera, worldScene) {
    this.scene = scene;
    this.camera = camera;
    this.worldScene = worldScene;

    // State
    this.currentNode = null;
    this.targetNode = null;
    this.isMoving = false;
    this.isLocked = true; // Locked until introComplete
    this.navState = NAV_STATE.IDLE;

    // Path walking
    this.currentPath = null;
    this.pathProgress = 0;
    this.pathLength = 0;
    this.walkDir = new THREE.Vector3();
    this.targetRotY = 0;

    // Camera targets
    this._camTargetPos = new THREE.Vector3(0, 1.2, 5.5);
    this._camTargetLook = new THREE.Vector3(0, -0.5, 0);
    this._camCurrentLook = new THREE.Vector3(0, -0.5, 0);
    this._responsiveCamera = new THREE.Vector3();
    this.profile = getViewportProfile();

    // Walk animation time
    this._walkTime = 0;
    this._sitProgress = 0;
    this._isSitting = false;
    this._lookAngle = 0;

    // Build character
    this.character = buildCharacter(scene);

    // Hide until intro completes
    this.character.group.visible = false;

    // Pending navigation queue (only one item max)
    this._pendingNode = null;

    // Optional status UI is intentionally disabled. The visible character and
    // red path are the travel indicator.
    this._travelEl = null;
  }

  /* ── Travel Indicator UI ──────────────────────────────────────── */

  _createTravelIndicator() {
    const el = document.createElement("div");
    el.className = "travel-indicator";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Navigation status");
    el.innerHTML = `<span class="travel-indicator__dot"></span><span class="travel-indicator__text"></span>`;
    document.body.appendChild(el);
    this._travelEl = el;
  }

  setState(state) {
    if (state === this.navState) return;
    if (!allowed[this.navState]?.includes(state)) throw new Error(`Invalid character transition: ${this.navState} -> ${state}`);
    this.navState = state;
    window.dispatchEvent(new CustomEvent("characterStateChanged", { detail: { state } }));
  }

  unlock() {
    this.isLocked = false;
    this.character.group.visible = true;

    // Place character slightly below home (approach from contact side).
    const homeNode = navigationNodes.home;
    this.character.group.position.set(
      homeNode.position.x,
      homeNode.position.y,
      homeNode.position.z + 2.2,
    );
    this.character.group.scale.setScalar(0);
    this.currentNode = null;

    gsap.to(this.character.group.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.0,
      ease: "back.out(1.5)",
    });
  }

  /**
   * Navigate to a destination node.
   * Returns false if already moving (navigation locked).
   */
  navigate(nodeId) {
    if (!navigationNodes[nodeId]) {
      console.warn(`[CharacterNav] Unknown node: ${nodeId}`);
      return false;
    }

    if (this.isLocked) {
      this._pendingNode = nodeId;
      return false;
    }

    if (this.isMoving) {
      // Queue the next destination — will execute after arrival
      this._pendingNode = nodeId;
      return false;
    }

    if (this.currentNode === nodeId) {
      // Already at destination — fire arrival event
      this._onArrival(nodeId);
      return true;
    }

    this._startNavigation(nodeId);
    return true;
  }

  _startNavigation(nodeId) {
    const fromId = this.currentNode || "home";
    const toNode = navigationNodes[nodeId];

    if (!toNode) return;

    this.isMoving = true;
    this.targetNode = nodeId;
    this.model.reactionUntil = 0;
    this.setState(NAV_STATE.MOVING);
    const from = this.currentNode || "home";
    window.dispatchEvent(new CustomEvent("characterNavigating", { detail: { from, to: nodeId } }));
    this.worldScene?.highlightActivePath(from, nodeId);
    const waypoints = getPath(from, nodeId).map(p => p.clone());
    waypoints[0] = this.model.root.position.clone();
    if (waypoints.length < 2) waypoints.push(node.position.clone());
    const curve = new THREE.CatmullRomCurve3(waypoints, false, "centripetal");
    const motion = { phase: 0 };
    const timing = characterConfig.travel;
    const length = curve.getLength();
    const allowRun = length >= timing.runDistance;
    const peakSpeed = allowRun ? timing.runSpeed : timing.walkSpeed;
    const duration = THREE.MathUtils.clamp(length * Math.PI / (2 * peakSpeed), timing.min, timing.max);
    this.travelDuration = duration;
    const fast = immediate || this.profile.reduced;
    this.model.setState(this.model.restState === "sit" ? "stand" : "look");
    this.timeline = gsap.timeline();
    this.timeline.to({}, { duration: fast ? 0 : timing.turn });
    this.timeline.call(() => this.model.setState("turn"));
    curve.getTangentAt(0, this.tangent);
    const facing = Math.atan2(this.tangent.x, this.tangent.z);
    const currentFacing = this.model.root.rotation.y;
    this.timeline.to(this.model.root.rotation, { y: currentFacing + Math.atan2(Math.sin(facing - currentFacing), Math.cos(facing - currentFacing)), duration: fast ? 0 : timing.turn, ease: "power2.out" });
    this.timeline.call(() => { this.lastTravelUpdate = performance.now(); this.model.setLocomotion(0, allowRun); });
    // Integrating a sine velocity profile yields a bounded curved journey with
    // zero speed at both endpoints. Gait selection uses actual path velocity.
    this.timeline.to(motion, { phase: 1, duration: fast ? 0 : duration, ease: "none", onUpdate: () => {
      const progress = 0.5 - 0.5 * Math.cos(Math.PI * motion.phase);
      this.travelSpeed = fast ? 0 : length * Math.PI / (2 * duration) * Math.sin(Math.PI * motion.phase);
      curve.getPointAt(progress, this.point);
      // A small forward look smooths heading changes at bends without cutting
      // corners or moving the character off the path.
      curve.getTangentAt(Math.min(1, progress + 0.012), this.tangent);
      this.model.root.position.copy(this.point);
      const target = Math.atan2(this.tangent.x, this.tangent.z);
      const now = performance.now();
      const delta = Math.min(0.1, Math.max(0, (now - this.lastTravelUpdate) / 1000));
      this.lastTravelUpdate = now;
      const rotation = this.model.root.rotation;
      rotation.y += Math.atan2(Math.sin(target - rotation.y), Math.cos(target - rotation.y)) * (1 - Math.exp(-timing.turnResponse * delta));
      this.model.setLocomotion(this.travelSpeed, allowRun);
      if (motion.phase >= 0.8 && this.navState === NAV_STATE.MOVING) this.setState(NAV_STATE.ARRIVING);
    } });
    this.timeline.call(() => {
      if (this.navState === NAV_STATE.MOVING) this.setState(NAV_STATE.ARRIVING);
      this.travelSpeed = 0;
      this.model.setState("stop");
    });
    // Turn along the shortest arc; never spin through a full circle on arrival.
    this.timeline.call(() => {
      const rotation = this.model.root.rotation;
      rotation.y = node.rotation + Math.atan2(Math.sin(rotation.y - node.rotation), Math.cos(rotation.y - node.rotation));
    });
    this.timeline.to(this.model.root.rotation, { y: node.rotation, duration: fast ? 0 : timing.settle, ease: "power2.out" });
    this.timeline.call(() => { this.setState(NAV_STATE.SETTLING); this.model.setState(node.action); });
    this.timeline.to({}, { duration: fast ? 0 : timing.settle });
    await this.timeline;
    this.model.root.position.copy(node.position);
    this.applyVisualScale(node);
    this.currentNode = nodeId;
    this.targetNode = null;
    this.isMoving = false;
    this.setState(NAV_STATE.IDLE);
    window.dispatchEvent(new CustomEvent("characterArrived", { detail: { node: nodeId } }));
    return true;
  }

  react(state) { if (!this.isMoving) this.model.react(state); }
  applyVisualScale(node = navigationNodes[this.targetNode || this.currentNode]) {
    const settings = characterConfig.visualScale;
    const scale = this.profile.width <= settings.mobileMax ? settings.mobile : this.profile.width <= settings.tabletMax ? settings.tablet : settings.desktop;
    this.model.root.scale.setScalar(scale * (node?.scale ?? 1));
  }
  handleResize(profile = getViewportProfile()) {
    this.profile = profile;
    this.applyVisualScale();
    if (profile.reduced && this.isMoving) this.timeline?.progress(1);
  }
  update(delta) {
    if (this.isLocked) return;
    this.model.update(delta, this.profile.reduced);
    const node = navigationNodes[this.targetNode || this.currentNode || "home"];
    if (!this.currentNode && !this.targetNode) {
      this.cameraLook.fromArray(characterConfig.waiting.lookAt);
      this.cameraTarget.fromArray(characterConfig.waiting.camera);
    } else if (this.isMoving) {
      this.cameraLook.copy(this.model.root.position);
      this.cameraLook.y += 0.6;
      this.cameraTarget.copy(this.cameraLook).add(this.followOffset);
    } else {
      this.cameraLook.copy(node.cameraLookAt);
      this.cameraTarget.copy(node.cameraPosition);
    }
    const fit = Math.max(1, this.profile.cameraDistance * 0.8);
    this.cameraTarget.sub(this.cameraLook).multiplyScalar(fit).add(this.cameraLook);
    const damping = this.profile.reduced ? 1 : 1 - Math.pow(1 - CAMERA_LERP, delta * 60);
    this.camera.position.lerp(this.cameraTarget, damping);
    this.look.lerp(this.cameraLook, damping);
    this.camera.lookAt(this.look);
  }
  setTheme() { /* Pip retains a consistent fur palette under the scene lighting. */ }
  destroy() { this.timeline?.kill(); this.model.dispose(); }
}
