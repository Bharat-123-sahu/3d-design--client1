import gsap from "gsap";
import * as THREE from "three";
import { characterConfig } from "../data/experienceConfig.js";
import { destinationOrder, navigationNodes } from "../data/navigationData.js";
import { NAV_STATE } from "../core/CharacterNavigationManager.js";

export class CharacterNavigation {
  constructor(manager, router) {
    this.manager = manager;
    this.router = router;
    this.events = new AbortController();
    const options = { signal: this.events.signal };
    this.root = document.createElement("aside");
    this.root.className = "character-nav";
    this.root.setAttribute("aria-label", `${characterConfig.name}, your guide`);
    this.root.innerHTML = `
      <nav id="character-destinations" class="character-nav__destinations" aria-label="Explore with ${characterConfig.name}" hidden>
        <p>Where to next?</p>
        <div class="character-nav__orbit">${destinationOrder.map((id, index) => {
          const node = navigationNodes[id];
          return `<a href="${node.route}" data-route data-destination="${id}" style="--order:${index}"><span>${String(index + 1).padStart(2, "0")}</span>${node.label}</a>`;
        }).join("")}</div>
        <button type="button" class="character-nav__close" aria-label="Close destinations">Close ×</button>
      </nav>
      <button type="button" class="character-nav__trigger" aria-controls="character-destinations" aria-expanded="false" aria-label="Explore with ${characterConfig.name}. Open destinations.">
        <span class="character-nav__viewport" aria-hidden="true"></span>
        <span class="character-nav__caption">Explore with ${characterConfig.name} <span aria-hidden="true">↗</span></span>
      </button>
      <span class="sr-only" role="status" aria-live="polite"></span>`;
    document.body.append(this.root);
    this.viewport = this.root.querySelector(".character-nav__viewport");
    this.trigger = this.root.querySelector(".character-nav__trigger");
    this.panel = this.root.querySelector("nav");
    this.links = [...this.panel.querySelectorAll("a")];
    this.status = this.root.querySelector('[role="status"]');
    this.status.textContent = "Pip is waiting. Choose a destination to begin.";
    this.trigger.addEventListener("click", () => {
      if (this.openedByHover && this.opened) { this.openedByHover = false; this.links[0].focus(); }
      else this.opened ? this.close() : this.open();
    }, options);
    this.trigger.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse" && matchMedia("(hover: hover)").matches) this.open(false);
    }, options);
    this.root.querySelector(".character-nav__close").addEventListener("click", () => this.close(true), options);
    this.root.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); this.close(true); }
      if (this.opened && ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const index = this.links.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? this.links.length - 1 : (index + (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1) + this.links.length) % this.links.length;
        this.links[next].focus();
      }
    }, options);
    document.addEventListener("pointerdown", event => { if (!this.root.contains(event.target)) this.close(); }, options);
    this.root.addEventListener("focusout", event => { if (!this.root.contains(event.relatedTarget)) this.close(); }, options);
    this.panel.addEventListener("click", event => {
      if (!event.target.closest("a")) return;
      if (this.busy) { event.preventDefault(); event.stopPropagation(); }
      this.close();
    }, options);
    window.addEventListener("routeTransition", event => this.setBusy(event.detail.busy), options);
    window.addEventListener("routeChanged", event => {
      const node = navigationNodes[event.detail.scene];
      this.links.forEach(link => {
        if (link.dataset.destination === node?.id) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      this.status.textContent = node ? `Arrived at ${node.label.toLowerCase()}. Pip is ready to explore.` : "Pip is ready to explore.";
    }, options);
    this.links.forEach(link => {
      link.addEventListener("pointermove", event => {
        if (!manager.profile.fine || manager.profile.reduced) return;
        const bounds = link.getBoundingClientRect();
        gsap.to(link, { x: (event.clientX - bounds.left - bounds.width / 2) * 0.07, y: (event.clientY - bounds.top - bounds.height / 2) * 0.07, duration: 0.2, overwrite: "auto" });
      }, options);
      link.addEventListener("pointerleave", () => gsap.to(link, { x: 0, y: 0, duration: 0.2, overwrite: "auto" }), options);
    });
  }

  bindWorldCharacter(threeScene) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const sphere = new THREE.Sphere();
    const point = new THREE.Vector3();
    const hitsCharacter = event => {
      if (document.documentElement.dataset.appState !== "world" || this.busy) return false;
      const bounds = threeScene.container.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      raycaster.setFromCamera(pointer, threeScene.camera);
      sphere.center.copy(this.manager.model.root.position);
      sphere.center.y += 0.55;
      // The selection volume remains generous when the visual model shrinks.
      sphere.radius = 0.65;
      return raycaster.ray.intersectSphere(sphere, point) !== null;
    };
    const options = { capture: true, signal: this.events.signal };
    threeScene.container.addEventListener("click", event => {
      if (!hitsCharacter(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.open();
    }, options);
    threeScene.container.addEventListener("pointermove", event => {
      if (event.pointerType === "mouse" && hitsCharacter(event)) this.open(false);
    }, options);
  }

  open(focus = true) {
    if (this.opened || this.busy || this.manager.isMoving) return;
    this.opened = true;
    this.openedByHover = !focus;
    this.manager.setState(NAV_STATE.OPENING_NAV);
    this.panel.hidden = false;
    this.trigger.setAttribute("aria-expanded", "true");
    this.manager.react("wave");
    this.reveal?.kill();
    this.reveal = gsap.fromTo(this.links, { opacity: 0, y: 12, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, stagger: this.manager.profile.reduced ? 0 : 0.025, duration: this.manager.profile.reduced ? 0 : characterConfig.navDuration, onComplete: () => {
      if (this.opened && !this.manager.isMoving) this.manager.setState(NAV_STATE.SELECTING);
    } });
    if (focus) this.links[0].focus();
  }
  close(focus = false) {
    this.opened = false;
    this.reveal?.kill();
    this.panel.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
    if ([NAV_STATE.OPENING_NAV, NAV_STATE.SELECTING].includes(this.manager.navState)) this.manager.setState(NAV_STATE.IDLE);
    if (focus) this.trigger.focus();
  }
  setBusy(busy) {
    this.busy = busy;
    this.root.classList.toggle("is-traveling", busy);
    this.trigger.setAttribute("aria-disabled", String(busy));
    if (busy) { this.close(); this.status.textContent = "Pip is on the way."; }
  }
  destroy() { this.events.abort(); this.reveal?.kill(); gsap.killTweensOf(this.links); this.root.remove(); }
}
