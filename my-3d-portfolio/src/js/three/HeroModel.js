import gsap from "gsap";

export class HeroModel {
  constructor(model) {
    this.model = model;

    this.basePositionX = 0;
this.basePositionY = 0;

    this.time = 0;

    this.baseRotationY = -0.4;

    this.currentRotationX = 0;
    this.currentRotationY = this.baseRotationY;

    this.targetRotationX = 0;
    this.targetRotationY = this.baseRotationY;

    this.scrollRotationY = 0;
this.scrollPositionX = 0;
this.scrollPositionY = 0;

    this.setPosition();

    window.addEventListener("resize", this.setPosition);
  }

  setPosition = () => {
    const isMobile = window.innerWidth < 768;

    this.model.scale.set(0.5, 0.5, 0.5);

    if (isMobile) {
      this.basePositionX = 0;
      this.basePositionY = -0.5;
    } else {
      this.basePositionX = 1.8;
      this.basePositionY = 0;
    }

    this.model.position.x = this.basePositionX;
    this.model.position.y = this.basePositionY;
  };

  update(mouseX, mouseY) {
    const mouseRotationY = mouseX * 0.35;
    const mouseRotationX = mouseY * 0.15;

    this.targetRotationY = this.baseRotationY + mouseRotationY + this.scrollRotationY;
    this.targetRotationX = mouseRotationX;

    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.03;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.03;

    this.model.rotation.x = this.currentRotationX;
    this.model.rotation.y = this.currentRotationY;

    this.model.position.x = this.basePositionX + this.scrollPositionX;
    this.model.position.y = this.basePositionY + this.scrollPositionY;
  }

  setVisible(visible) {
    this.model.visible = visible;
  }

  setScale(value) {
    this.model.scale.setScalar(value);
  }

  show({ scale = 0.5, duration = 1, ease = "power3.out" } = {}) {
    this.setVisible(true);

    gsap.to(this.model.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration,
      ease,
    });
  }

  hide({ scale = 0.05, duration = 0.6, ease = "power3.in" } = {}) {
    gsap.to(this.model.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration,
      ease,
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  destroy() {
    window.removeEventListener("resize", this.setPosition);
  }
}
