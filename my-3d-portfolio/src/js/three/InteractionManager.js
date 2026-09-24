export class InteractionManager {
  constructor() {
    this.target = {
      x: 0,
      y: 0,
    };

    this.current = {
      x: 0,
      y: 0,
    };

    this.velocity = {
      x: 0,
      y: 0,
    };

    window.addEventListener(
      "pointermove",
      this.handleMouseMove
    );
  }

  handleMouseMove = (event) => {
    if (event.pointerType === "touch" || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.target.x =
      (event.clientX / window.innerWidth) * 2 - 1;

    this.target.y =
      -(event.clientY / window.innerHeight) * 2 + 1;
  };

  update() {
    const previousX = this.current.x;
    const previousY = this.current.y;

    this.current.x +=
      (this.target.x - this.current.x) * 0.05;

    this.current.y +=
      (this.target.y - this.current.y) * 0.05;

    this.velocity.x =
      this.current.x - previousX;

    this.velocity.y =
      this.current.y - previousY;

    return {
      x: this.current.x,
      y: this.current.y,
      velocityX: this.velocity.x,
      velocityY: this.velocity.y,
    };
  }

  destroy() {
    window.removeEventListener("pointermove", this.handleMouseMove);
  }
}
