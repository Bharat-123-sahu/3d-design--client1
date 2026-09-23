import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export class Router {
  constructor({ rootElement, sceneController, lenis, onRouteChange }) {
    this.root = rootElement;
    this.sceneController = sceneController;
    this.lenis = lenis;
    this.onRouteChange = onRouteChange;
    this.routes = {};
    this.currentPath = null;
    this.isTransitioning = false;
    this.overlay = document.querySelector(".page-transition");

    // Character navigation manager — injected by main.js after creation
    this.navManager = null;

    this._bindEvents();
  }

  /**
   * Register route definitions: { path: string, page: () => string, scene: string }
   */
  register(routeDefs) {
    for (const def of routeDefs) {
      this.routes[def.path] = def;
    }
    return this;
  }

  /**
   * Start the router — render the current URL without character navigation
   * (intro hasn't fired yet, so just render content).
   */
  start() {
    const path = this._normalizePath(window.location.pathname);
    this._renderRoute(path, false);
  }

  /**
   * Navigate to a route WITH character walking.
   * Called after introComplete fires.
   */
  async navigateTo(path, animate = true) {
    const normPath = this._normalizePath(path);
    if (normPath === this.currentPath || this.isTransitioning) return;

    const route = this.routes[normPath] || this.routes["/"];
    if (!route) return;

    this.isTransitioning = true;
    this.currentPath = normPath;

    // Update URL without triggering popstate
    window.history.pushState(null, "", normPath);

    // 1. Tell character to walk to destination
    if (this.navManager && !this.navManager.isLocked) {
      // Stand up first if sitting
      await this.navManager.standUp();

      // Start walking — content swap deferred to characterArrived
      const sceneId = route.scene;
      const didNavigate = this.navManager.navigate(sceneId);

      if (didNavigate) {
        // Wait for characterArrived event to swap content
        await this._waitForCharacterArrival(sceneId);
      } else {
        // Already at destination or still moving
        await this._swapContent(route, animate);
      }
    } else {
      // No nav manager yet — fallback to instant content swap
      await this._swapContent(route, animate);
    }

    // Update active nav link AFTER arrival
    this._updateActiveLink(normPath);
    this._updateActivePill(normPath);

    this.isTransitioning = false;
  }

  _waitForCharacterArrival(expectedSceneId) {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.detail?.node === expectedSceneId) {
          window.removeEventListener("characterArrived", handler);
          this._swapContent(
            this.routes[this.currentPath] || this.routes["/"],
            true,
          ).then(resolve);
        }
      };
      window.addEventListener("characterArrived", handler);

      // Safety timeout: if character never arrives in 8 seconds, reveal anyway
      setTimeout(() => {
        window.removeEventListener("characterArrived", handler);
        this._swapContent(
          this.routes[this.currentPath] || this.routes["/"],
          true,
        ).then(resolve);
      }, 8000);
    });
  }

  async _swapContent(route, animate) {
    if (animate) {
      await Promise.all([
        gsap.to(this.root, {
          opacity: 0,
          y: -24,
          filter: "blur(6px)",
          duration: 0.38,
          ease: "power3.in",
        }),
        gsap.to(this.overlay, {
          scaleY: 1,
          transformOrigin: "bottom",
          duration: 0.5,
          ease: "power3.inOut",
        }),
      ]);
    }

    // Swap HTML
    this.root.innerHTML = route.page();

    // Scroll to top
    if (this.lenis) {
      this.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    // Switch 3D scene effect
    if (this.sceneController) {
      this.sceneController.setState(route.scene);
    }

    // Re-init animations
    this.onRouteChange?.(route);

    if (animate) {
      await Promise.all([
        gsap.fromTo(
          this.root,
          { opacity: 0, y: 32, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.72,
            ease: "power3.out",
            delay: 0.06,
          },
        ),
        gsap.to(this.overlay, {
          scaleY: 0,
          transformOrigin: "top",
          duration: 0.62,
          ease: "power3.inOut",
          delay: 0.06,
        }),
      ]);
    } else {
      gsap.set(this.root, { opacity: 1, y: 0, filter: "none" });
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  _bindEvents() {
    // Intercept all clicks on [data-route] links
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-route]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto")) return;

      e.preventDefault();

      const path = this._normalizePath(href);
      if (path === this.currentPath || this.isTransitioning) return;

      // Close mobile menu if open
      document.getElementById("mobile-menu")?.classList.remove("is-open");
      document.getElementById("hamburger-btn")?.classList.remove("is-open");

      this.navigateTo(href, true);
    });

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
      const path = this._normalizePath(window.location.pathname);
      if (path !== this.currentPath) {
        // Popstate: swap content, character won't walk for browser nav (UX tradeoff)
        this._renderRoute(path, true);
      }
    });
  }

  /**
   * Legacy direct render (no character nav) — used for initial page load and popstate.
   */
  async _renderRoute(path, animate) {
    const route = this.routes[path] || this.routes["/"];
    this.currentPath = path;
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
        link.classList.toggle("is-active", href === path);
      });
  }

  _updateActivePill(path) {
    const activeLink = document.querySelector(`.navbar__link.is-active`);
    const pill = document.getElementById("navbar-active-pill");
    if (!pill || !activeLink) return;

    const navRect = activeLink.closest(".navbar__nav")?.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    if (!navRect) return;

    const x = linkRect.left - navRect.left;
    const w = linkRect.width;

    gsap.to(pill, {
      x,
      width: w,
      duration: 0.42,
      ease: "power3.out",
    });
  }

  _normalizePath(path) {
    return path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  }
}
