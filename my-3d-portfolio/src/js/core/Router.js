import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ContentVisibilityManager } from "./ContentVisibilityManager.js";

gsap.registerPlugin(ScrollTrigger);

export const APP_STATE = {
  INTRO: "INTRO",
  WORLD: "WORLD",
  TRAVELING: "TRAVELING",
  DESTINATION: "DESTINATION",
  CONTENT: "CONTENT",
};

export class Router {
  constructor({ rootElement, sceneController, lenis, onRouteChange }) {
    this.root = rootElement;
    this.sceneController = sceneController;
    this.lenis = lenis;
    this.onRouteChange = onRouteChange;
    this.routes = {};
    this.currentPath = null;
    this.activePath = null;
    this._setAppState(APP_STATE.INTRO);
    this.isTransitioning = false;
    this.overlay = document.querySelector(".page-transition");
    this.contentManager = new ContentVisibilityManager(this.root);

    this.navManager = null;

    this._bindEvents();
  }

  register(routeDefs) {
    for (const def of routeDefs) {
      this.routes[def.path] = def;
    }
    return this;
  }

  start() {
    this.currentPath = this._normalizePath(window.location.pathname);
    this.activePath = null;
    this._setAppState(APP_STATE.INTRO);
    this.contentManager.hideAll({ clear: true, animate: false });
  }

  enterWorldMode() {
    this._setAppState(APP_STATE.WORLD);
    this.activePath = null;
    this.contentManager.hideAll({ clear: true, animate: false });
    this._updateActiveLink(null);
    this._updateActivePill(null);
  }

  async navigateTo(path, animate = true) {
    const normPath = this._normalizePath(path);
    if (this.isTransitioning) return;
    if (normPath === this.activePath && this.appState === APP_STATE.CONTENT)
      return;

    const route = this.routes[normPath] || this.routes["/"];
    if (!route) return;

    this.isTransitioning = true;

    if (normPath !== this.currentPath) {
      window.history.pushState(null, "", normPath);
      this.currentPath = normPath;
    }

    await this.contentManager.hideAll({
      clear: true,
      animate: animate && this.appState === APP_STATE.CONTENT,
    });
    this.activePath = null;
    this._updateActiveLink(null);
    this._updateActivePill(null);

    if (this.navManager && !this.navManager.isLocked) {
      await this.navManager.standUp();

      const sceneId = route.scene;
      const didNavigate = this.navManager.navigate(sceneId);

      if (!didNavigate) {
        this.isTransitioning = false;
        return;
      }

      this._setAppState(APP_STATE.TRAVELING);
      await this._waitForCharacterArrival(sceneId);
    } else {
      await this._swapContent(route, animate);
    }

    this.activePath = normPath;
    this._updateActiveLink(normPath);
    this._updateActivePill(normPath);
    this.isTransitioning = false;
  }

  _waitForCharacterArrival(expectedSceneId) {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.detail?.node !== expectedSceneId) return;

        window.removeEventListener("characterArrived", handler);
        this._setAppState(APP_STATE.DESTINATION);
        this._swapContent(
          this.routes[this.currentPath] || this.routes["/"],
          true,
        ).then(resolve);
      };

      window.addEventListener("characterArrived", handler);
    });
  }

  async _swapContent(route, animate) {
    await this.contentManager.hideAll({ clear: true, animate: false });

    this.root.innerHTML = route.page();
    this.contentManager.prepareHidden(route.scene);

    if (this.lenis) {
      this.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    this.sceneController?.setState(route.scene);
    this.onRouteChange?.(route);

    if (animate) {
      await Promise.all([
        this.contentManager.show(route.scene, { animate: true }),
        gsap.to(this.overlay, {
          scaleY: 0,
          transformOrigin: "top",
          duration: 0.62,
          ease: "power3.inOut",
          delay: 0.06,
        }),
      ]);
    } else {
      await this.contentManager.show(route.scene, { animate: false });
    }

    this._setAppState(APP_STATE.CONTENT);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  _setAppState(state) {
    this.appState = state;
    document.documentElement.dataset.appState = state.toLowerCase();
  }

  _bindEvents() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-route]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto"))
        return;

      e.preventDefault();

      const path = this._normalizePath(href);
      if (path === this.activePath || this.isTransitioning) return;

      document.getElementById("mobile-menu")?.classList.remove("is-open");
      document.getElementById("hamburger-btn")?.classList.remove("is-open");

      this.navigateTo(href, true);
    });

    window.addEventListener("popstate", () => {
      const path = this._normalizePath(window.location.pathname);
      this.currentPath = path;
      if (path !== this.activePath) {
        this.navigateTo(path, true);
      }
    });
  }

  async _renderRoute(path, animate) {
    const route = this.routes[path] || this.routes["/"];
    this.currentPath = path;
    this.activePath = path;
    this.isTransitioning = true;

    this._updateActiveLink(path);
    this._updateActivePill(path);

    await this._swapContent(route, animate);

    this.isTransitioning = false;
  }

  _updateActiveLink(path) {
    document
      .querySelectorAll(".navbar__link, .navbar__mobile-link")
      .forEach((link) => {
        const href = this._normalizePath(link.getAttribute("href") || "");
        link.classList.toggle("is-active", Boolean(path) && href === path);
      });
  }

  _updateActivePill(path) {
    const pill = document.getElementById("navbar-active-pill");
    const activeLink = document.querySelector(".navbar__link.is-active");
    if (!pill) return;

    if (!path || !activeLink) {
      gsap.to(pill, { opacity: 0, duration: 0.2, ease: "power2.out" });
      return;
    }

    const navRect = activeLink.closest(".navbar__nav")?.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    if (!navRect) return;

    gsap.to(pill, {
      x: linkRect.left - navRect.left,
      width: linkRect.width,
      opacity: 1,
      duration: 0.42,
      ease: "power3.out",
    });
  }

  _normalizePath(path) {
    return path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  }
}
