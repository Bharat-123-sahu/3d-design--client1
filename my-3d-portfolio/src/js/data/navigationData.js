import * as THREE from "three";

/**
 * Navigation world node definitions.
 * position  — where the character stands at this destination
 * sign      — where the 3D sign/label floats above the marker
 * camera    — where the camera dolly-moves to when at this destination
 * lookAt    — where the camera looks at when at this destination
 * action    — what the character does on arrival
 * color     — accent color for this node's glow
 */
export const navigationNodes = {
  home: {
    id: "home",
    label: "HOME",
    position: new THREE.Vector3(0, -1.6, 1.5),
    signPosition: new THREE.Vector3(0, 0.8, 1.5),
    cameraPosition: new THREE.Vector3(0, 1.2, 5.5),
    cameraLookAt: new THREE.Vector3(0, -0.5, 0),
    action: "idle",
    color: "#ff3322",
    markerType: "house",
  },
  about: {
    id: "about",
    label: "ABOUT",
    position: new THREE.Vector3(-3.5, -1.6, -0.5),
    signPosition: new THREE.Vector3(-3.5, 0.8, -0.5),
    cameraPosition: new THREE.Vector3(-2, 1.0, 3.8),
    cameraLookAt: new THREE.Vector3(-3.0, -0.5, -0.5),
    action: "sit",
    color: "#ff3322",
    markerType: "chair",
  },
  work: {
    id: "work",
    label: "WORK",
    position: new THREE.Vector3(3.5, -1.6, -0.5),
    signPosition: new THREE.Vector3(3.5, 0.8, -0.5),
    cameraPosition: new THREE.Vector3(2, 1.0, 3.8),
    cameraLookAt: new THREE.Vector3(3.0, -0.2, -0.5),
    action: "look",
    color: "#ff3322",
    markerType: "monitor",
  },
  value: {
    id: "value",
    label: "SERVICES",
    position: new THREE.Vector3(0, -1.6, -3.5),
    signPosition: new THREE.Vector3(0, 0.8, -3.5),
    cameraPosition: new THREE.Vector3(0, 1.2, 1.2),
    cameraLookAt: new THREE.Vector3(0, -0.5, -3.5),
    action: "inspect",
    color: "#ff3322",
    markerType: "board",
  },
  contact: {
    id: "contact",
    label: "CONTACT",
    position: new THREE.Vector3(0, -1.6, 3.5),
    signPosition: new THREE.Vector3(0, 0.8, 3.5),
    cameraPosition: new THREE.Vector3(0, 1.0, 6.2),
    cameraLookAt: new THREE.Vector3(0, -0.5, 3.5),
    action: "interact",
    color: "#ff3322",
    markerType: "desk",
  },
};

/**
 * Walking paths between nodes.
 * Key format: "fromId_toId"
 * Value: array of THREE.Vector3 waypoints (including start and end positions).
 * CatmullRomCurve3 will interpolate through them.
 */
function wp(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

const GROUND_Y = -1.6;

export const navigationPaths = {
  home_about: [
    wp(0, GROUND_Y, 1.5),
    wp(-1.0, GROUND_Y, 1.0),
    wp(-2.0, GROUND_Y, 0.4),
    wp(-3.5, GROUND_Y, -0.5),
  ],
  about_home: [
    wp(-3.5, GROUND_Y, -0.5),
    wp(-2.0, GROUND_Y, 0.4),
    wp(-1.0, GROUND_Y, 1.0),
    wp(0, GROUND_Y, 1.5),
  ],
  home_work: [
    wp(0, GROUND_Y, 1.5),
    wp(1.0, GROUND_Y, 1.0),
    wp(2.0, GROUND_Y, 0.4),
    wp(3.5, GROUND_Y, -0.5),
  ],
  work_home: [
    wp(3.5, GROUND_Y, -0.5),
    wp(2.0, GROUND_Y, 0.4),
    wp(1.0, GROUND_Y, 1.0),
    wp(0, GROUND_Y, 1.5),
  ],
  home_value: [
    wp(0, GROUND_Y, 1.5),
    wp(0, GROUND_Y, 0.5),
    wp(0, GROUND_Y, -1.5),
    wp(0, GROUND_Y, -3.5),
  ],
  value_home: [
    wp(0, GROUND_Y, -3.5),
    wp(0, GROUND_Y, -1.5),
    wp(0, GROUND_Y, 0.5),
    wp(0, GROUND_Y, 1.5),
  ],
  home_contact: [
    wp(0, GROUND_Y, 1.5),
    wp(0, GROUND_Y, 2.5),
    wp(0, GROUND_Y, 3.5),
  ],
  contact_home: [
    wp(0, GROUND_Y, 3.5),
    wp(0, GROUND_Y, 2.5),
    wp(0, GROUND_Y, 1.5),
  ],
  about_work: [
    wp(-3.5, GROUND_Y, -0.5),
    wp(-1.5, GROUND_Y, -1.2),
    wp(0, GROUND_Y, -1.0),
    wp(1.5, GROUND_Y, -1.2),
    wp(3.5, GROUND_Y, -0.5),
  ],
  work_about: [
    wp(3.5, GROUND_Y, -0.5),
    wp(1.5, GROUND_Y, -1.2),
    wp(0, GROUND_Y, -1.0),
    wp(-1.5, GROUND_Y, -1.2),
    wp(-3.5, GROUND_Y, -0.5),
  ],
  about_value: [
    wp(-3.5, GROUND_Y, -0.5),
    wp(-1.8, GROUND_Y, -1.5),
    wp(0, GROUND_Y, -3.5),
  ],
  value_about: [
    wp(0, GROUND_Y, -3.5),
    wp(-1.8, GROUND_Y, -1.5),
    wp(-3.5, GROUND_Y, -0.5),
  ],
  about_contact: [
    wp(-3.5, GROUND_Y, -0.5),
    wp(-1.5, GROUND_Y, 0.5),
    wp(0, GROUND_Y, 1.5),
    wp(0, GROUND_Y, 3.5),
  ],
  contact_about: [
    wp(0, GROUND_Y, 3.5),
    wp(0, GROUND_Y, 1.5),
    wp(-1.5, GROUND_Y, 0.5),
    wp(-3.5, GROUND_Y, -0.5),
  ],
  work_value: [
    wp(3.5, GROUND_Y, -0.5),
    wp(1.8, GROUND_Y, -1.5),
    wp(0, GROUND_Y, -3.5),
  ],
  value_work: [
    wp(0, GROUND_Y, -3.5),
    wp(1.8, GROUND_Y, -1.5),
    wp(3.5, GROUND_Y, -0.5),
  ],
  work_contact: [
    wp(3.5, GROUND_Y, -0.5),
    wp(1.5, GROUND_Y, 0.5),
    wp(0, GROUND_Y, 1.5),
    wp(0, GROUND_Y, 3.5),
  ],
  contact_work: [
    wp(0, GROUND_Y, 3.5),
    wp(0, GROUND_Y, 1.5),
    wp(1.5, GROUND_Y, 0.5),
    wp(3.5, GROUND_Y, -0.5),
  ],
  value_contact: [
    wp(0, GROUND_Y, -3.5),
    wp(0, GROUND_Y, -1.5),
    wp(0, GROUND_Y, 1.5),
    wp(0, GROUND_Y, 3.5),
  ],
  contact_value: [
    wp(0, GROUND_Y, 3.5),
    wp(0, GROUND_Y, 1.5),
    wp(0, GROUND_Y, -1.5),
    wp(0, GROUND_Y, -3.5),
  ],
};

/**
 * Get the path waypoints between two nodes.
 * Falls back to going via home if no direct path.
 */
export function getPath(fromId, toId) {
  const key = `${fromId}_${toId}`;
  if (navigationPaths[key]) return navigationPaths[key];

  // Fallback: via home
  const toHome = navigationPaths[`${fromId}_home`] || [];
  const fromHome = navigationPaths[`home_${toId}`] || [];
  if (toHome.length && fromHome.length) {
    return [...toHome, ...fromHome.slice(1)];
  }
  return [
    navigationNodes[fromId]?.position,
    navigationNodes[toId]?.position,
  ].filter(Boolean);
}

/**
 * Walk speed: units per second
 */
export const WALK_SPEED = 2.2;

/**
 * Camera smooth factor (lerp per frame)
 */
export const CAMERA_LERP = 0.035;
