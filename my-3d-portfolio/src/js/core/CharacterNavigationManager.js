import * as THREE from "three";
import gsap from "gsap";
import {
  navigationNodes,
  getPath,
  CAMERA_LERP,
} from "../data/navigationData.js";
import { characterConfig } from "../data/experienceConfig.js";
import { getViewportProfile } from "../utils/responsive.js";
import { CharacterModel } from "../three/CharacterModel.js";

export const NAV_STATE = Object.freeze({
  IDLE: "idle",
  OPENING_NAV: "opening_nav",
  SELECTING: "selecting",
  MOVING: "moving",
  ARRIVING: "arriving",
  SETTLING: "settling",
});
const allowed = {
  idle: ["opening_nav", "moving"],
  opening_nav: ["selecting", "idle", "moving"],
  selecting: ["idle", "moving"],
  moving: ["arriving"],
  arriving: ["settling"],
  settling: ["idle"],
};

export class CharacterNavigationManager {
  constructor(scene, camera, worldScene) {
    this.scene = scene;
    this.camera = camera;
    this.worldScene = worldScene;
    this.model = new CharacterModel();
    this.character = { group: this.model.root };
    scene.add(this.model.root);
    this.model.root.visible = false;
    this.currentNode = null;
    this.targetNode = null;
    this.navState = NAV_STATE.IDLE;
    this.isLocked = true;
    this.isMoving = false;
    this.profile = getViewportProfile();
    this.look = new THREE.Vector3(0, -0.5, 0);
    this.cameraTarget = new THREE.Vector3();
    this.cameraLook = new THREE.Vector3();
    this.point = new THREE.Vector3();
    this.tangent = new THREE.Vector3();
    this.followOffset = new THREE.Vector3(0, 1.5, 4.5);
    this.travelSpeed = 0;
    this.applyVisualScale();
  }

  setState(state) {
    if (state === this.navState) return;
    if (!allowed[this.navState]?.includes(state))
      throw new Error(
        `Invalid character transition: ${this.navState} -> ${state}`,
      );
    this.navState = state;
    window.dispatchEvent(
      new CustomEvent("characterStateChanged", { detail: { state } }),
    );
  }

  unlock() {
    this.isLocked = false;
    this.model.root.visible = true;
    this.model.root.position.fromArray(characterConfig.waiting.position);
    this.model.root.rotation.y = characterConfig.waiting.rotation;
    this.model.setState("idle");
    this.applyVisualScale();
  }

  async navigate(nodeId, { immediate = false } = {}) {
    const node = navigationNodes[nodeId];
    if (!node || this.isLocked || this.isMoving) return false;
    if (this.currentNode === nodeId) return true;
    this.isMoving = true;
    this.targetNode = nodeId;
    this.model.reactionUntil = 0;
    this.setState(NAV_STATE.MOVING);
    const from = this.currentNode || "home";
    window.dispatchEvent(
      new CustomEvent("characterNavigating", { detail: { from, to: nodeId } }),
    );
    this.worldScene?.highlightActivePath(from, nodeId);
    const waypoints = getPath(from, nodeId).map((p) => p.clone());
    waypoints[0] = this.model.root.position.clone();
    if (waypoints.length < 2) waypoints.push(node.position.clone());
    const curve = new THREE.CatmullRomCurve3(waypoints, false, "centripetal");
    const motion = { phase: 0 };
    const timing = characterConfig.travel;
    const length = curve.getLength();
    const allowRun = length >= timing.runDistance;
    const peakSpeed = allowRun ? timing.runSpeed : timing.walkSpeed;
    const duration = THREE.MathUtils.clamp(
      (length * Math.PI) / (2 * peakSpeed),
      timing.min,
      timing.max,
    );
    this.travelDuration = duration;
    const fast = immediate || this.profile.reduced;
    this.model.setState(this.model.restState === "sit" ? "stand" : "look");
    this.timeline = gsap.timeline();
    this.timeline.to({}, { duration: fast ? 0 : timing.turn });
    this.timeline.call(() => this.model.setState("turn"));
    curve.getTangentAt(0, this.tangent);
    const facing = Math.atan2(this.tangent.x, this.tangent.z);
    const currentFacing = this.model.root.rotation.y;
    this.timeline.to(this.model.root.rotation, {
      y:
        currentFacing +
        Math.atan2(
          Math.sin(facing - currentFacing),
          Math.cos(facing - currentFacing),
        ),
      duration: fast ? 0 : timing.turn,
      ease: "power2.out",
    });
    this.timeline.call(() => {
      this.lastTravelUpdate = performance.now();
      this.model.setLocomotion(0, allowRun);
    });
    // Integrating a sine velocity profile yields a bounded curved journey with
    // zero speed at both endpoints. Gait selection uses actual path velocity.
    this.timeline.to(motion, {
      phase: 1,
      duration: fast ? 0 : duration,
      ease: "none",
      onUpdate: () => {
        const progress = 0.5 - 0.5 * Math.cos(Math.PI * motion.phase);
        this.travelSpeed = fast
          ? 0
          : ((length * Math.PI) / (2 * duration)) *
            Math.sin(Math.PI * motion.phase);
        curve.getPointAt(progress, this.point);
        // A small forward look smooths heading changes at bends without cutting
        // corners or moving the character off the path.
        curve.getTangentAt(Math.min(1, progress + 0.012), this.tangent);
        this.model.root.position.copy(this.point);
        const target = Math.atan2(this.tangent.x, this.tangent.z);
        const now = performance.now();
        const delta = Math.min(
          0.1,
          Math.max(0, (now - this.lastTravelUpdate) / 1000),
        );
        this.lastTravelUpdate = now;
        const rotation = this.model.root.rotation;
        rotation.y +=
          Math.atan2(
            Math.sin(target - rotation.y),
            Math.cos(target - rotation.y),
          ) *
          (1 - Math.exp(-timing.turnResponse * delta));
        this.model.setLocomotion(this.travelSpeed, allowRun);
        if (motion.phase >= 0.8 && this.navState === NAV_STATE.MOVING)
          this.setState(NAV_STATE.ARRIVING);
      },
    });
    this.timeline.call(() => {
      if (this.navState === NAV_STATE.MOVING) this.setState(NAV_STATE.ARRIVING);
      this.travelSpeed = 0;
      this.model.setState("stop");
    });
    // Turn along the shortest arc; never spin through a full circle on arrival.
    this.timeline.call(() => {
      const rotation = this.model.root.rotation;
      rotation.y =
        node.rotation +
        Math.atan2(
          Math.sin(rotation.y - node.rotation),
          Math.cos(rotation.y - node.rotation),
        );
    });
    this.timeline.to(this.model.root.rotation, {
      y: node.rotation,
      duration: fast ? 0 : timing.settle,
      ease: "power2.out",
    });
    this.timeline.call(() => {
      this.setState(NAV_STATE.SETTLING);
      this.model.setState(node.action);
    });
    this.timeline.to({}, { duration: fast ? 0 : timing.settle });
    await this.timeline;
    this.model.root.position.copy(node.position);
    this.applyVisualScale(node);
    this.currentNode = nodeId;
    this.targetNode = null;
    this.isMoving = false;
    this.setState(NAV_STATE.IDLE);
    window.dispatchEvent(
      new CustomEvent("characterArrived", { detail: { node: nodeId } }),
    );
    return true;
  }

  react(state) {
    if (!this.isMoving) this.model.react(state);
  }
  applyVisualScale(
    node = navigationNodes[this.targetNode || this.currentNode],
  ) {
    const settings = characterConfig.visualScale;
    const scale =
      this.profile.width <= settings.mobileMax
        ? settings.mobile
        : this.profile.width <= settings.tabletMax
          ? settings.tablet
          : settings.desktop;
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
    this.cameraTarget
      .sub(this.cameraLook)
      .multiplyScalar(fit)
      .add(this.cameraLook);
    if (
      !Number.isFinite(this.cameraTarget.x) ||
      !Number.isFinite(this.cameraTarget.y) ||
      !Number.isFinite(this.cameraTarget.z)
    ) {
      this.cameraTarget.copy(
        node?.cameraPosition || new THREE.Vector3(0, 1.2, 5.5),
      );
    }
    if (
      !Number.isFinite(this.cameraLook.x) ||
      !Number.isFinite(this.cameraLook.y) ||
      !Number.isFinite(this.cameraLook.z)
    ) {
      this.cameraLook.copy(node?.cameraLookAt || new THREE.Vector3(0, -0.5, 0));
    }
    const damping = this.profile.reduced
      ? 1
      : 1 - Math.pow(1 - CAMERA_LERP, delta * 60);
    this.camera.position.lerp(this.cameraTarget, damping);
    this.look.lerp(this.cameraLook, damping);
    this.camera.lookAt(this.look);
  }
  setTheme() {
    /* Pip retains a consistent fur palette under the scene lighting. */
  }
  destroy() {
    this.timeline?.kill();
    this.model.dispose();
  }
}
