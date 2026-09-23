import * as THREE from "three";
import gsap from "gsap";
import {
  navigationNodes,
  getPath,
  WALK_SPEED,
  CAMERA_LERP,
} from "../data/navigationData.js";

/* ── Navigation States ────────────────────────────────────────────── */
export const NAV_STATE = {
  IDLE: "idle",
  ROTATING: "rotating",
  WALKING: "walking",
  ARRIVING: "arriving",
  AT_DESTINATION: "at_destination",
};

/* ── Synthetic Character ──────────────────────────────────────────── */

function buildCharacter(scene) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#e0e8ff",
    emissive: "#aabbff",
    emissiveIntensity: 0.35,
    roughness: 0.5,
    metalness: 0.2,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: "#ff2200",
    emissive: "#ff2200",
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.5,
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bodyMat);
  head.position.y = 0.82;

  // Torso
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.3, 6, 8),
    bodyMat,
  );
  torso.position.y = 0.52;

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.045, 0.28, 4, 6);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  armL.position.set(-0.18, 0.5, 0);
  armL.rotation.z = 0.2;
  const armR = new THREE.Mesh(armGeo, bodyMat);
  armR.position.set(0.18, 0.5, 0);
  armR.rotation.z = -0.2;

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.055, 0.28, 4, 6);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-0.08, 0.15, 0);
  const legR = new THREE.Mesh(legGeo, bodyMat);
  legR.position.set(0.08, 0.15, 0);

  // Red energy core glow
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), redMat);
  core.position.y = 0.52;

  group.add(head, torso, armL, armR, legL, legR, core);

  // Shadow plane
  const shadowGeo = new THREE.CircleGeometry(0.18, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: "#000000",
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.005;
  group.add(shadow);

  scene.add(group);

  return {
    group,
    head,
    torso,
    armL,
    armR,
    legL,
    legR,
    core,
    shadow,
    bodyMat,
    redMat,
  };
}

/* ── CharacterNavigationManager ──────────────────────────────────── */

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

    // Travel indicator element
    this._travelEl = null;
    this._createTravelIndicator();
  }

  /* ── Travel Indicator UI ──────────────────────────────────────── */

  _createTravelIndicator() {
    const el = document.createElement("div");
    el.className = "travel-indicator";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Navigation status");
    el.innerHTML = `<span class="travel-indicator__dot"></span><span class="travel-indicator__text">TRAVELING...</span>`;
    document.body.appendChild(el);
    this._travelEl = el;
  }

  _showTravelIndicator(label) {
    if (!this._travelEl) return;
    this._travelEl.querySelector(".travel-indicator__text").textContent =
      `TRAVELING TO ${label.toUpperCase()}...`;
    gsap.to(this._travelEl, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
    });
    this._travelEl.classList.add("is-active");
  }

  _hideTravelIndicator() {
    if (!this._travelEl) return;
    gsap.to(this._travelEl, {
      opacity: 0,
      y: -8,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => this._travelEl.classList.remove("is-active"),
    });
  }

  /* ── Public API ────────────────────────────────────────────────── */

  /**
   * Unlock navigation after intro complete.
   * Places character at start position and navigates to home.
   */
  unlock() {
    this.isLocked = false;
    this.character.group.visible = true;

    // Place character slightly below home (approach from contact side)
    const homeNode = navigationNodes.home;
    this.character.group.position.set(
      homeNode.position.x,
      homeNode.position.y,
      homeNode.position.z + 1.5,
    );
    this.character.group.scale.setScalar(0);

    // Reveal character
    gsap.to(this.character.group.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.0,
      ease: "back.out(1.5)",
      onComplete: () => {
        this.navigate("home");
      },
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
    this.navState = NAV_STATE.ROTATING;

    // Get waypoints
    const waypoints = getPath(fromId, nodeId);

    // Build CatmullRomCurve
    this.currentPath = new THREE.CatmullRomCurve3(
      waypoints,
      false,
      "catmullrom",
      0.5,
    );
    this.pathProgress = 0;
    this.pathLength = this.currentPath.getLength();

    // Show travel indicator
    const label = toNode.label || nodeId;
    this._showTravelIndicator(label);

    // Dispatch navigation start event
    window.dispatchEvent(
      new CustomEvent("characterNavigating", {
        detail: { from: fromId, to: nodeId },
      }),
    );

    // Highlight active path
    this.worldScene?.highlightActivePath?.(fromId, nodeId);

    // Set nav state to walking
    this.navState = NAV_STATE.WALKING;
    this._isSitting = false;
    this._walkTime = 0;
  }

  /* ── Per-frame Update ─────────────────────────────────────────── */

  update(delta) {
    const char = this.character;
    const elapsed = (this._walkTime += delta);

    if (this.navState === NAV_STATE.WALKING && this.currentPath) {
      this._updateWalking(delta, char, elapsed);
    }

    if (
      this.navState === NAV_STATE.IDLE ||
      this.navState === NAV_STATE.AT_DESTINATION
    ) {
      this._updateIdleAnimation(delta, char, elapsed);
    }

    // Camera follow
    this._updateCamera(delta);

    // Red core pulsation
    char.core.material.emissiveIntensity = 1.5 + 0.7 * Math.sin(elapsed * 3.5);
  }

  _updateWalking(delta, char, elapsed) {
    if (!this.currentPath || this.pathLength <= 0) return;

    const speed = WALK_SPEED * delta;
    this.pathProgress = Math.min(this.pathProgress + speed, this.pathLength);

    const t = this.pathProgress / this.pathLength;
    const pt = this.currentPath.getPoint(t);
    const tangent = this.currentPath.getTangent(t);

    // Move character
    char.group.position.set(pt.x, pt.y, pt.z);

    // Rotate toward movement direction
    if (tangent.lengthSq() > 0.001) {
      this.targetRotY = Math.atan2(tangent.x, tangent.z);
    }
    const rotDiff = this.targetRotY - char.group.rotation.y;
    char.group.rotation.y += rotDiff * 0.12;

    // Walk animation — bob limbs
    const walkFreq = 8;
    const swing = 0.35;
    char.legL.rotation.x = Math.sin(elapsed * walkFreq) * swing;
    char.legR.rotation.x = -Math.sin(elapsed * walkFreq) * swing;
    char.armL.rotation.x = -Math.sin(elapsed * walkFreq) * swing * 0.7;
    char.armR.rotation.x = Math.sin(elapsed * walkFreq) * swing * 0.7;
    char.group.position.y =
      pt.y + 0.04 * Math.abs(Math.sin(elapsed * walkFreq));

    // Update camera target to follow character
    this._camTargetPos.set(
      char.group.position.x * 0.4,
      navigationNodes[this.targetNode]?.cameraPosition.y ?? 1.2,
      char.group.position.z + 4.5,
    );
    this._camTargetLook
      .copy(char.group.position)
      .add(new THREE.Vector3(0, 0.3, 0));

    // Arrival check
    if (t >= 0.99) {
      this._handleArrival();
    }
  }

  _handleArrival() {
    const nodeId = this.targetNode;
    const node = navigationNodes[nodeId];
    if (!node) return;

    this.navState = NAV_STATE.ARRIVING;
    this.isMoving = false;

    // Snap character to exact destination
    gsap.to(this.character.group.position, {
      x: node.position.x,
      y: node.position.y,
      z: node.position.z,
      duration: 0.5,
      ease: "power2.out",
    });

    // Reset limb animation
    gsap.to(this.character.legL.rotation, { x: 0, duration: 0.4 });
    gsap.to(this.character.legR.rotation, { x: 0, duration: 0.4 });
    gsap.to(this.character.armL.rotation, { x: 0, duration: 0.4 });
    gsap.to(this.character.armR.rotation, { x: 0, duration: 0.4 });

    // Move camera to destination framing
    this._camTargetPos.copy(node.cameraPosition);
    this._camTargetLook.copy(node.cameraLookAt);

    // Destination-specific action after brief pause
    const delay = node.action === "sit" ? 600 : 450;

    setTimeout(() => {
      this._performDestinationAction(nodeId, node);
    }, delay);
  }

  _performDestinationAction(nodeId, node) {
    this.navState = NAV_STATE.AT_DESTINATION;
    this.currentNode = nodeId;
    this.targetNode = null;
    this.currentPath = null;
    this.pathProgress = 0;

    // Face the destination object (rotate toward it)
    const toSign = new THREE.Vector3().subVectors(
      node.signPosition,
      node.position,
    );
    const targetFaceRot = Math.atan2(toSign.x, toSign.z);
    gsap.to(this.character.group.rotation, {
      y: targetFaceRot,
      duration: 0.6,
      ease: "power2.out",
    });

    // Perform action
    switch (node.action) {
      case "sit":
        this._doSit();
        break;
      case "look":
        this._doLook();
        break;
      case "inspect":
        this._doInspect();
        break;
      case "interact":
        this._doInteract();
        break;
      default:
        this._doIdle();
    }

    // Hide travel indicator
    this._hideTravelIndicator();

    // Highlight active node
    this.worldScene?.setActiveNode?.(nodeId);

    // Fire arrival event
    this._onArrival(nodeId);
  }

  _onArrival(nodeId) {
    window.dispatchEvent(
      new CustomEvent("characterArrived", {
        detail: { node: nodeId },
      }),
    );

    // Handle pending navigation
    if (this._pendingNode && this._pendingNode !== nodeId) {
      const next = this._pendingNode;
      this._pendingNode = null;
      setTimeout(() => this.navigate(next), 200);
    }
  }

  /* ── Destination Actions ──────────────────────────────────────── */

  _doIdle() {
    this._isSitting = false;
    this._currentAction = "idle";
  }

  _doSit() {
    this._isSitting = true;
    this._currentAction = "sit";
    // Compress legs (sitting posture)
    gsap.to(this.character.legL.rotation, {
      x: -1.2,
      duration: 0.6,
      ease: "power2.out",
    });
    gsap.to(this.character.legR.rotation, {
      x: -1.2,
      duration: 0.6,
      ease: "power2.out",
    });
    gsap.to(this.character.torso.rotation, { x: -0.1, duration: 0.6 });
    gsap.to(this.character.group.position, {
      y: this.character.group.position.y - 0.28,
      duration: 0.6,
      ease: "power2.out",
    });
  }

  _doLook() {
    this._currentAction = "look";
    this._isSitting = false;
    // Tilt head slightly upward to "look at display"
    gsap.to(this.character.head.rotation, {
      x: -0.18,
      duration: 0.7,
      ease: "power2.out",
    });
  }

  _doInspect() {
    this._currentAction = "inspect";
    this._isSitting = false;
    // Lean forward slightly
    gsap.to(this.character.torso.rotation, {
      x: 0.15,
      duration: 0.6,
      ease: "power2.out",
    });
  }

  _doInteract() {
    this._currentAction = "interact";
    this._isSitting = false;
    // Arm extend forward
    gsap.to(this.character.armR.rotation, {
      x: -0.7,
      duration: 0.6,
      ease: "power2.out",
    });
  }

  /* ── Idle Animation ───────────────────────────────────────────── */

  _updateIdleAnimation(delta, char, elapsed) {
    if (this._isSitting) {
      // Subtle breathing
      char.torso.scale.y = 1 + 0.015 * Math.sin(elapsed * 1.8);
    } else {
      // Subtle sway
      char.group.rotation.z = 0.015 * Math.sin(elapsed * 1.4);
      char.torso.scale.y = 1 + 0.012 * Math.sin(elapsed * 2.2);
    }
  }

  /* ── Camera Follow ────────────────────────────────────────────── */

  _updateCamera(delta) {
    // Smooth camera position
    this.camera.position.lerp(this._camTargetPos, CAMERA_LERP);

    // Smooth look-at
    this._camCurrentLook.lerp(this._camTargetLook, CAMERA_LERP);
    this.camera.lookAt(this._camCurrentLook);
  }

  /**
   * Stand up from sitting before leaving (called by Router before navigate).
   * Returns a promise that resolves after stand animation.
   */
  standUp() {
    if (!this._isSitting) return Promise.resolve();
    return new Promise((resolve) => {
      this._isSitting = false;
      gsap.to(this.character.legL.rotation, {
        x: 0,
        duration: 0.55,
        ease: "power2.out",
      });
      gsap.to(this.character.legR.rotation, {
        x: 0,
        duration: 0.55,
        ease: "power2.out",
      });
      gsap.to(this.character.torso.rotation, { x: 0, duration: 0.55 });
      gsap.to(this.character.head.rotation, { x: 0, duration: 0.4 });
      gsap.to(this.character.armR.rotation, { x: 0, duration: 0.4 });
      gsap.to(this.character.group.position, {
        y: this.character.group.position.y + 0.28,
        duration: 0.55,
        ease: "power2.out",
        onComplete: resolve,
      });
    });
  }

  setTheme(theme) {
    const dark = theme === "dark";
    const bodyColor = dark ? "#e0e8ff" : "#334466";
    const emColor = dark ? "#aabbff" : "#6688cc";
    gsap.to(this.character.bodyMat.color, {
      r: new THREE.Color(bodyColor).r,
      g: new THREE.Color(bodyColor).g,
      b: new THREE.Color(bodyColor).b,
      duration: 0.8,
    });
    gsap.to(this.character.bodyMat.emissive, {
      r: new THREE.Color(emColor).r,
      g: new THREE.Color(emColor).g,
      b: new THREE.Color(emColor).b,
      duration: 0.8,
    });
  }

  destroy() {
    this._travelEl?.remove();
    this.scene.remove(this.character.group);
  }
}
