import * as THREE from 'three';

export class CharacterModel {
  constructor(options = {}) {
    this.root = new THREE.Group();
    this.root.name = 'ProceduralBoyCharacter';

    this.height = options.height ?? 1.8;
    this.scale = options.scale ?? 1;

    this.parts = {};
    this.materials = {};

    this.#createMaterials();
    this.#buildCharacter();

    this.root.scale.setScalar(this.scale);

    // Animation state
    this.state = 'idle';
    this.time = 0;
    this.walkTime = 0;
    this.transition = 0;

    // Pose targets
    this.pose = {
      leftArmX: 0,
      rightArmX: 0,
      leftLegX: 0,
      rightLegX: 0,
      bodyY: 0,
      headX: 0,
      headY: 0,
      bodyRotZ: 0,
    };
  }

  #createMaterials() {
    this.materials.skin = new THREE.MeshStandardMaterial({
      color: 0xc98f72,
      roughness: 0.72,
      metalness: 0.02,
    });

    this.materials.hair = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.55,
      metalness: 0.05,
    });

    this.materials.shirt = new THREE.MeshStandardMaterial({
      color: 0x161b22,
      roughness: 0.68,
      metalness: 0.08,
    });

    this.materials.pants = new THREE.MeshStandardMaterial({
      color: 0x11151b,
      roughness: 0.78,
      metalness: 0.04,
    });

    this.materials.shoes = new THREE.MeshStandardMaterial({
      color: 0x08090b,
      roughness: 0.5,
      metalness: 0.1,
    });

    this.materials.backpack = new THREE.MeshStandardMaterial({
      color: 0x202735,
      roughness: 0.68,
      metalness: 0.05,
    });
  }

  #mesh(geometry, material, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  #buildCharacter() {
    const scale = this.height / 1.8;

    // ROOT
    const bodyRoot = new THREE.Group();
    bodyRoot.name = 'BodyRoot';
    this.root.add(bodyRoot);

    // --------------------------------------------
    // LEGS
    // --------------------------------------------

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.15, 0.95, 0);
    leftLeg.name = 'LeftLeg';
    bodyRoot.add(leftLeg);

    const leftLowerLeg = new THREE.Group();
    leftLowerLeg.name = 'LeftLowerLeg';
    leftLeg.add(leftLowerLeg);

    const leftUpperMesh = this.#mesh(
      new THREE.CapsuleGeometry(0.085, 0.32, 6, 10),
      this.materials.pants,
      'LeftUpperLegMesh'
    );
    leftUpperMesh.position.y = -0.18;
    leftLeg.add(leftUpperMesh);

    const leftLowerMesh = this.#mesh(
      new THREE.CapsuleGeometry(0.07, 0.30, 6, 10),
      this.materials.pants,
      'LeftLowerLegMesh'
    );
    leftLowerMesh.position.y = -0.34;
    leftLowerLeg.add(leftLowerMesh);

    const leftFoot = this.#mesh(
      new THREE.BoxGeometry(0.17, 0.10, 0.34),
      this.materials.shoes,
      'LeftFoot'
    );
    leftFoot.position.set(0, -0.53, 0.08);
    leftLowerLeg.add(leftFoot);

    // Right leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.15, 0.95, 0);
    rightLeg.name = 'RightLeg';
    bodyRoot.add(rightLeg);

    const rightLowerLeg = new THREE.Group();
    rightLowerLeg.name = 'RightLowerLeg';
    rightLeg.add(rightLowerLeg);

    const rightUpperMesh = this.#mesh(
      new THREE.CapsuleGeometry(0.085, 0.32, 6, 10),
      this.materials.pants,
      'RightUpperLegMesh'
    );
    rightUpperMesh.position.y = -0.18;
    rightLeg.add(rightUpperMesh);

    const rightLowerMesh = this.#mesh(
      new THREE.CapsuleGeometry(0.07, 0.30, 6, 10),
      this.materials.pants,
      'RightLowerLegMesh'
    );
    rightLowerMesh.position.y = -0.34;
    rightLowerLeg.add(rightLowerMesh);

    const rightFoot = this.#mesh(
      new THREE.BoxGeometry(0.17, 0.10, 0.34),
      this.materials.shoes,
      'RightFoot'
    );
    rightFoot.position.set(0, -0.53, 0.08);
    rightLowerLeg.add(rightFoot);

    // --------------------------------------------
    // TORSO
    // --------------------------------------------

    const torso = this.#mesh(
      new THREE.CapsuleGeometry(0.23, 0.38, 8, 16),
      this.materials.shirt,
      'Torso'
    );

    torso.position.y = 1.30;
    torso.scale.set(1, 1.08, 0.72);

    bodyRoot.add(torso);

    // --------------------------------------------
    // NECK + HEAD
    // --------------------------------------------

    const neck = this.#mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12),
      this.materials.skin,
      'Neck'
    );

    neck.position.y = 1.62;
    bodyRoot.add(neck);

    const head = this.#mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      this.materials.skin,
      'Head'
    );

    head.position.y = 1.83;
    head.scale.set(0.95, 1.08, 0.95);
    bodyRoot.add(head);

    // Hair
    const hair = this.#mesh(
      new THREE.SphereGeometry(0.185, 18, 18),
      this.materials.hair,
      'Hair'
    );

    hair.position.set(0, 1.91, -0.015);
    hair.scale.set(1, 0.58, 1.02);
    bodyRoot.add(hair);

    // --------------------------------------------
    // ARMS
    // --------------------------------------------

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.30, 1.48, 0);
    leftArm.name = 'LeftArm';
    bodyRoot.add(leftArm);

    const leftUpperArm = this.#mesh(
      new THREE.CapsuleGeometry(0.06, 0.22, 6, 10),
      this.materials.shirt,
      'LeftUpperArmMesh'
    );
    leftUpperArm.position.y = -0.12;
    leftArm.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.28;
    leftForearm.name = 'LeftForearm';
    leftArm.add(leftForearm);

    const leftForearmMesh = this.#mesh(
      new THREE.CapsuleGeometry(0.055, 0.20, 6, 10),
      this.materials.shirt,
      'LeftForearmMesh'
    );
    leftForearmMesh.position.y = -0.11;
    leftForearm.add(leftForearmMesh);

    const leftHand = this.#mesh(
      new THREE.SphereGeometry(0.055, 10, 10),
      this.materials.skin,
      'LeftHand'
    );
    leftHand.position.y = -0.25;
    leftForearm.add(leftHand);

    // Right arm
    const rightArm = new THREE.Group();
    rightArm.position.set(0.30, 1.48, 0);
    rightArm.name = 'RightArm';
    bodyRoot.add(rightArm);

    const rightUpperArm = this.#mesh(
      new THREE.CapsuleGeometry(0.06, 0.22, 6, 10),
      this.materials.shirt,
      'RightUpperArmMesh'
    );
    rightUpperArm.position.y = -0.12;
    rightArm.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.28;
    rightForearm.name = 'RightForearm';
    rightArm.add(rightForearm);

    const rightForearmMesh = this.#mesh(
      new THREE.CapsuleGeometry(0.055, 0.20, 6, 10),
      this.materials.shirt,
      'RightForearmMesh'
    );
    rightForearmMesh.position.y = -0.11;
    rightForearm.add(rightForearmMesh);

    const rightHand = this.#mesh(
      new THREE.SphereGeometry(0.055, 10, 10),
      this.materials.skin,
      'RightHand'
    );
    rightHand.position.y = -0.25;
    rightForearm.add(rightHand);

    // --------------------------------------------
    // BACKPACK
    // --------------------------------------------

    const backpack = this.#mesh(
      new THREE.BoxGeometry(0.30, 0.40, 0.13),
      this.materials.backpack,
      'Backpack'
    );

    backpack.position.set(0, 1.34, -0.20);
    bodyRoot.add(backpack);

    // Backpack top
    const backpackTop = this.#mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.12),
      this.materials.backpack,
      'BackpackTop'
    );

    backpackTop.position.set(0, 1.57, -0.20);
    bodyRoot.add(backpackTop);

    this.parts = {
      bodyRoot,

      torso,
      neck,
      head,
      hair,

      leftArm,
      leftForearm,
      leftHand,

      rightArm,
      rightForearm,
      rightHand,

      leftLeg,
      leftLowerLeg,
      leftFoot,

      rightLeg,
      rightLowerLeg,
      rightFoot,

      backpack,
    };

    // Apply global scaling to all body dimensions through the root.
    this.root.scale.setScalar(scale * this.scale);
  }

  setState(state) {
    if (!state) return;

    const normalized = state.toLowerCase();

    if (
      ![
        'idle',
        'walk',
        'stand',
        'sit',
        'look',
        'interact'
      ].includes(normalized)
    ) {
      return;
    }

    if (this.state !== normalized) {
      this.state = normalized;
      this.transition = 0;
    }
  }

  getObject() {
    return this.root;
  }

  setPosition(position) {
    this.root.position.copy(position);
  }

  setRotationY(rotation) {
    this.root.rotation.y = rotation;
  }

  update(delta) {
    this.time += delta;

    switch (this.state) {
      case 'idle':
        this.#animateIdle(delta);
        break;

      case 'walk':
        this.#animateWalk(delta);
        break;

      case 'stand':
        this.#animateStand(delta);
        break;

      case 'sit':
        this.#animateSit(delta);
        break;

      case 'look':
        this.#animateLook(delta);
        break;

      case 'interact':
        this.#animateInteract(delta);
        break;
    }
  }

  #smooth(current, target, speed = 10) {
    return THREE.MathUtils.damp(
      current,
      target,
      speed,
      1 / 60
    );
  }

  #animateIdle() {
    const breathe = Math.sin(this.time * 1.8) * 0.012;

    this.parts.bodyRoot.position.y =
      this.#smooth(
        this.parts.bodyRoot.position.y,
        breathe,
        7
      );

    this.parts.head.rotation.x =
      this.#smooth(
        this.parts.head.rotation.x,
        Math.sin(this.time * 0.7) * 0.018,
        5
      );

    this.parts.leftArm.rotation.x =
      this.#smooth(
        this.parts.leftArm.rotation.x,
        0.03,
        7
      );

    this.parts.rightArm.rotation.x =
      this.#smooth(
        this.parts.rightArm.rotation.x,
        -0.03,
        7
      );

    this.parts.leftLeg.rotation.x =
      this.#smooth(this.parts.leftLeg.rotation.x, 0, 7);

    this.parts.rightLeg.rotation.x =
      this.#smooth(this.parts.rightLeg.rotation.x, 0, 7);
  }

  #animateWalk() {
    this.walkTime += 0.20;

    const legSwing = Math.sin(this.walkTime) * 0.65;
    const armSwing = Math.sin(this.walkTime) * 0.45;

    this.parts.leftLeg.rotation.x =
      this.#smooth(
        this.parts.leftLeg.rotation.x,
        legSwing,
        15
      );

    this.parts.rightLeg.rotation.x =
      this.#smooth(
        this.parts.rightLeg.rotation.x,
        -legSwing,
        15
      );

    this.parts.leftArm.rotation.x =
      this.#smooth(
        this.parts.leftArm.rotation.x,
        -armSwing,
        15
      );

    this.parts.rightArm.rotation.x =
      this.#smooth(
        this.parts.rightArm.rotation.x,
        armSwing,
        15
      );

    this.parts.bodyRoot.position.y =
      0.015 + Math.abs(Math.sin(this.walkTime * 2)) * 0.018;

    this.parts.bodyRoot.rotation.z =
      Math.sin(this.walkTime * 2) * 0.01;

    this.parts.head.rotation.x =
      Math.sin(this.walkTime * 2) * 0.012;
  }

  #animateStand() {
    this.parts.leftLeg.rotation.x =
      this.#smooth(
        this.parts.leftLeg.rotation.x,
        0,
        6
      );

    this.parts.rightLeg.rotation.x =
      this.#smooth(
        this.parts.rightLeg.rotation.x,
        0,
        6
      );

    this.parts.leftArm.rotation.x =
      this.#smooth(
        this.parts.leftArm.rotation.x,
        0,
        6
      );

    this.parts.rightArm.rotation.x =
      this.#smooth(
        this.parts.rightArm.rotation.x,
        0,
        6
      );

    this.parts.bodyRoot.position.y =
      this.#smooth(
        this.parts.bodyRoot.position.y,
        0,
        5
      );
  }

  #animateSit() {
    this.parts.leftLeg.rotation.x =
      this.#smooth(
        this.parts.leftLeg.rotation.x,
        -1.15,
        5
      );

    this.parts.rightLeg.rotation.x =
      this.#smooth(
        this.parts.rightLeg.rotation.x,
        -1.15,
        5
      );

    this.parts.leftArm.rotation.x =
      this.#smooth(
        this.parts.leftArm.rotation.x,
        -0.15,
        5
      );

    this.parts.rightArm.rotation.x =
      this.#smooth(
        this.parts.rightArm.rotation.x,
        -0.15,
        5
      );

    this.parts.bodyRoot.position.y =
      this.#smooth(
        this.parts.bodyRoot.position.y,
        -0.28,
        5
      );

    this.parts.bodyRoot.rotation.x =
      this.#smooth(
        this.parts.bodyRoot.rotation.x,
        -0.08,
        5
      );
  }

  #animateLook() {
    this.#animateIdle();

    this.parts.head.rotation.y =
      this.#smooth(
        this.parts.head.rotation.y,
        0.25,
        5
      );
  }

  #animateInteract() {
    this.#animateIdle();

    this.parts.rightArm.rotation.x =
      this.#smooth(
        this.parts.rightArm.rotation.x,
        -0.85,
        6
      );

    this.parts.rightForearm.rotation.x =
      this.#smooth(
        this.parts.rightForearm.rotation.x,
        -0.35,
        6
      );

    this.parts.head.rotation.x =
      this.#smooth(
        this.parts.head.rotation.x,
        -0.05,
        5
      );
  }
}