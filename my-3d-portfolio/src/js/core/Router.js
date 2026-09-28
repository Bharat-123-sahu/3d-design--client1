import { navigationNodes } from "../data/navigationData.js";
import { prefersReducedMotion } from "../utils/animationRegistry.js";
import { cleanupRouteAnimations } from "../utils/animationRegistry.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ContentVisibilityManager } from "./ContentVisibilityManager.js";
import { mountDestinationHero } from "../components/DestinationHero.js";

gsap.registerPlugin(ScrollTrigger);

export const APP_STATE = {
  INTRO: "INTRO",
  WORLD: "WORLD",
  TRAVELING: "TRAVELING",
  DESTINATION: "DESTINATION",
  CONTENT: "CONTENT",
};

export class Router {
  constructor({ rootElement, sceneController, lenis, onRouteChange, transitionManager }) {
    this.root = rootElement;
    this.sceneController = sceneController;
    this.lenis = lenis;
    this.onRouteChange = onRouteChange;
    this.transitionManager = transitionManager;
    this.pendingHistory = null;
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
    window.history.scrollRestoration = "manual";
    this.currentPath = this._normalizePath(window.location.pathname);
    this.activePath = null;
    this._setAppState(APP_STATE.INTRO);
    this.contentManager.hideAll({ clear: true, animate: false });
  }

  enterWorldMode() {
    cleanupRouteAnimations();
    this._setAppState(APP_STATE.WORLD);
    this.activePath = null;
    this.contentManager.hideAll({ clear: true, animate: false });
    this._updateActiveLink(null);
    this._updateActivePill(null);
  }

  async navigateTo(path, animate = true, { history = true } = {}) {
    const requested = this._normalizePath(path);
    if (this.appState === APP_STATE.INTRO) return false;
    if (this.isTransitioning) {
      if (!history) this.pendingHistory = requested;
      return false;
    }
    const route = this.routes[requested] || this.routes["/"];
    if (!route) return false;
    const normPath = route.path;
    if (normPath === this.activePath && this.appState === APP_STATE.CONTENT) return true;
    animate = animate && !prefersReducedMotion();
    this.isTransitioning = true;
    this.transitionManager.isTransitioning = true;
    window.dispatchEvent(new CustomEvent("routeTransition", { detail: { busy: true } }));
    this.lenis?.stop();
    try {
      cleanupRouteAnimations();
      await this.transitionManager.exitContent(this.contentManager, animate && this.appState === APP_STATE.CONTENT);
      this.activePath = null;
      this._setAppState(APP_STATE.TRAVELING);
      this.sceneController?.setState("transition");
      if (this.navManager && navigationNodes[route.scene]) {
        await this.navManager.navigate(route.scene, { immediate: !animate });
      }
      this._setAppState(APP_STATE.DESTINATION);
      await this._swapContent(route, animate);
      this.currentPath = this.activePath = normPath;
      if (this.pendingHistory === null) {
        const state = { ...window.history.state, destination: normPath };
        if (history && window.location.pathname !== normPath) window.history.pushState(state, "", normPath);
        else window.history.replaceState(state, "", normPath + window.location.search + window.location.hash);
      }
      this._updateActiveLink(normPath);
      this._updateActivePill(normPath);
      const heading = this.root.querySelector("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
      window.dispatchEvent(new CustomEvent("routeChanged", { detail: { path: normPath, scene: route.scene } }));
      // Preserve valid in-page deep links on initial entry and browser history.
      if (!history && window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (target) this.lenis?.scrollTo(target, { immediate: true, force: true });
      }
      return true;
    } finally {
      this.isTransitioning = false;
      this.transitionManager.isTransitioning = false;
      this.lenis?.start();
      window.dispatchEvent(new CustomEvent("routeTransition", { detail: { busy: false } }));
      if (this.pendingHistory !== null) {
        const pending = this.pendingHistory;
        this.pendingHistory = null;
        this.navigateTo(pending, true, { history: false });
      }
    }
  }

  async _swapContent(route, animate) {
    cleanupRouteAnimations();
    await this.contentManager.hideAll({ clear: true, animate: false });

    this.root.innerHTML = route.page();
    mountDestinationHero(this.root, route.scene, this.sceneController);
    this.contentManager.prepareHidden(route.scene);

    if (this.lenis) {
      this.lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }

    await this.transitionManager.enterContent(this.contentManager, route.scene, animate);

    this._setAppState(APP_STATE.CONTENT);
    this.onRouteChange?.(route);
    ScrollTrigger.refresh();
    this.lenis?.resize();
  }

  _setAppState(state) {
    this.appState = state;
    document.documentElement.dataset.appState = state.toLowerCase();
    this.sceneController?.threeScene?.setCharacterPresentation(state === APP_STATE.CONTENT);
  }

  _bindEvents() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-route]");
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank" || link.hasAttribute("download")) return;

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
      this.navigateTo(path, true, { history: false });
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
    const normalized = (path || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
    if (normalized === "/home") return "/";
    return normalized === "/value" ? "/services" : normalized;
  }
}
