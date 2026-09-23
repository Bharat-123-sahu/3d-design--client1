export class MouseInteraction {
  constructor() {
    this.current = {
      x: 0,
      y: 0,
    };

    this.target = {
      x: 0,
      y: 0,
    };

    window.addEventListener("mousemove", this.handleMouseMove);
  }

  handleMouseMove = (event) => {
    this.target.x = (event.clientX / window.innerWidth) * 2 - 1;

    this.target.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  update() {
    this.current.x += (this.target.x - this.current.x) * 0.05;

    this.current.y += (this.target.y - this.current.y) * 0.05;

    return this.current;
  }
}
