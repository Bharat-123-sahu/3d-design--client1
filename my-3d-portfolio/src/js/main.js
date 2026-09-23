import "../scss/main.scss";

import { ThreeScene } from "./three/ThreeScene.js";
import { SceneController } from "./core/SceneController.js";
import { TransitionManager } from "./core/TransitionManager.js";
import { Router } from "./core/Router.js";
import { ThemeManager } from "./core/ThemeManager.js";
import { ThunderIntro } from "./core/ThunderIntro.js";
import { CharacterNavigationManager } from "./core/CharacterNavigationManager.js";
import { cleanupRouteAnimations } from "./utils/animationRegistry.js";

import { Navbar } from "./components/Navbar.js";
import { Footer } from "./components/Footer.js";

import { HomePage } from "./pages/HomePage.js";
import { AboutPage } from "./pages/AboutPage.js";
import { ValuePage } from "./pages/ValuePage.js";
import { WorkPage } from "./pages/WorkPage.js";
import { TeamPage } from "./pages/TeamPage.js";
import { CompanyPage } from "./pages/CompanyPage.js";
import { ContactPage } from "./pages/ContactPage.js";

// Existing animation systems — preserved
import { initSmoothScroll } from "./animations/smoothScroll.js";
import { initPageLoad } from "./animations/pageLoad.js";
import { initScrollAnimations } from "./animations/scrollAnimations.js";
import { initTextAnimations } from "./animations/textAnimations.js";
import { initServiceAnimations } from "./animations/serviceAnimations.js";
import { initThreeScrollAnimations } from "./animations/threeScrollAnimations.js";
import { initAboutAnimations } from "./animations/aboutAnimations.js";
import { initProcessAnimations } from "./animations/processAnimations.js";
import { initCursorEffects } from "./animations/cursorEffects.js";
import { initParallaxElements } from "./animations/parallaxElements.js";
import { initCardEffects } from "./animations/cardEffects.js";
import { initGlitchText } from "./animations/glitchText.js";
import { initImageReveal } from "./animations/imageReveal.js";
import { initStackedCarousels } from "./animations/StackedCarouselManager.js";
import { initScrollProgress } from "./animations/scrollProgress.js";

// New animation systems
import {
  initWorkFilter,
  initGalleryDrag,
  initServiceRowAnimations,
} from "./animations/galleryEffects.js";
import {
  initCounterAnimations,
  initSectionReveal,
  initProcessStepsAnimation,
  initCaseStudyAnimations,
  initTestimonialAnimations,
  initStatCardAnimations,
} from "./animations/sectionsAnimations.js";
import { initContactFormHandler } from "./animations/contactFormHandler.js";
import { initNavbarStateManager } from "./animations/navbarStateManager.js";

function initPageAnimations(sceneController) {
  // Existing systems
  try {
    initScrollAnimations();
  } catch (e) {
    console.warn("[scrollAnimations]", e);
  }
  try {
    initTextAnimations();
  } catch (e) {
    console.warn("[textAnimations]", e);
  }
  try {
    initServiceAnimations();
  } catch (e) {
    console.warn("[serviceAnimations]", e);
  }
  try {
    initAboutAnimations();
  } catch (e) {
    console.warn("[aboutAnimations]", e);
  }
  try {
    initProcessAnimations();
  } catch (e) {
    console.warn("[processAnimations]", e);
  }
  try {
    initCursorEffects();
  } catch (e) {
    console.warn("[cursorEffects]", e);
  }
  try {
    initParallaxElements();
  } catch (e) {
    console.warn("[parallaxElements]", e);
  }
  try {
    initCardEffects();
  } catch (e) {
    console.warn("[cardEffects]", e);
  }
  try {
    initGlitchText();
  } catch (e) {
    console.warn("[glitchText]", e);
  }
  try {
    initThreeScrollAnimations(sceneController?.threeScene, sceneController);
  } catch (e) {
    console.warn("[threeScrollAnimations]", e);
  }
  try {
    initImageReveal();
  } catch (e) {
    console.warn("[imageReveal]", e);
  }
  try {
    initStackedCarousels();
  } catch (e) {
    console.warn("[stackedCarousels]", e);
  }
  try {
    initScrollProgress();
  } catch (e) {
    console.warn("[scrollProgress]", e);
  }

  // New systems
  try {
    initWorkFilter();
  } catch (e) {
    console.warn("[workFilter]", e);
  }
  try {
    initGalleryDrag();
  } catch (e) {
    console.warn("[galleryDrag]", e);
  }
  try {
    initServiceRowAnimations();
  } catch (e) {
    console.warn("[serviceRowAnimations]", e);
  }
  try {
    initCounterAnimations();
  } catch (e) {
    console.warn("[counterAnimations]", e);
  }
  try {
    initSectionReveal();
  } catch (e) {
    console.warn("[sectionReveal]", e);
  }
  try {
    initProcessStepsAnimation();
  } catch (e) {
    console.warn("[processStepsAnimation]", e);
  }
  try {
    initCaseStudyAnimations();
  } catch (e) {
    console.warn("[caseStudyAnimations]", e);
  }
  try {
    initTestimonialAnimations();
  } catch (e) {
    console.warn("[testimonialAnimations]", e);
  }
  try {
    initStatCardAnimations();
  } catch (e) {
    console.warn("[statCardAnimations]", e);
  }
  try {
    initContactFormHandler();
  } catch (e) {
    console.warn("[contactFormHandler]", e);
  }

  try {
    initPageLoad({ sceneController });
  } catch (e) {
    console.warn("[pageLoad]", e);
  }
}

function initHamburger() {
  const btn = document.getElementById("hamburger-btn");
  const menu = document.getElementById("mobile-menu");
  const close = document.getElementById("mobile-close");

  if (!btn || !menu) return;

  const open = () => {
    btn.classList.add("is-open");
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
  };
  const shut = () => {
    btn.classList.remove("is-open");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", () =>
    menu.classList.contains("is-open") ? shut() : open(),
  );
  close?.addEventListener("click", shut);

  // Close when a route link inside the menu is clicked
  menu.addEventListener("click", (e) => {
    if (e.target.closest("[data-route]")) shut();
  });
}

function bindSectionNavigation(transitionManager) {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-nav-target]");
    if (!link) return;
    e.preventDefault();
    transitionManager.goTo(link.dataset.navTarget);
  });
}

function initThreeLayer(sceneController) {
  const canvas = document.getElementById("three-canvas");
  if (!canvas) return null;

  const threeScene = new ThreeScene(canvas, (sceneInstance) => {
    sceneController.attach(sceneInstance);
    sceneController.refresh();
  });

  sceneController.attach(threeScene);
  return threeScene;
}

/**
 * Initialize the active navbar pill after DOM is ready.
 */
function initNavPill() {
  const pill = document.getElementById("navbar-active-pill");
  const activeLink = document.querySelector(".navbar__link.is-active");
  if (!pill || !activeLink) return;

  const navEl = activeLink.closest(".navbar__nav");
  if (!navEl) return;
  const navRect = navEl.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();

  // Position pill under the active link instantly on first render
  import("gsap").then(({ default: gsapMod }) => {
    const g = gsapMod || window.gsap;
    if (g) {
      g.set(pill, {
        x: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    }
  });
}

function bootstrap() {
  const app = document.querySelector("#app");
  if (!app) return;

  app.innerHTML = `
    ${Navbar()}
    <main id="page-content"></main>
    <div id="three-canvas" aria-hidden="true"></div>
    ${Footer()}
    <div class="scroll-progress" aria-hidden="true"></div>
    <div class="page-transition" aria-hidden="true"></div>
  `;

  initHamburger();
  initNavbarStateManager();

  const lenis = initSmoothScroll();
  const sceneController = new SceneController();
  const threeScene = initThreeLayer(sceneController);
  new ThemeManager({ sceneController });

  const transitionManager = new TransitionManager({ lenis, sceneController });

  const router = new Router({
    rootElement: document.getElementById("page-content"),
    sceneController,
    lenis,
    onRouteChange: () => {
      cleanupRouteAnimations();
      setTimeout(() => initPageAnimations(sceneController), 120);
    },
  });

  bindSectionNavigation(transitionManager);

  router.register([
    { path: "/", page: HomePage, scene: "home" },
    { path: "/about", page: AboutPage, scene: "about" },
    { path: "/value", page: ValuePage, scene: "value" },
    { path: "/work", page: WorkPage, scene: "work" },
    { path: "/team", page: TeamPage, scene: "team" },
    { path: "/company", page: CompanyPage, scene: "company" },
    { path: "/contact", page: ContactPage, scene: "contact" },
  ]);

  // Initial render (no character nav yet — intro hasn't fired)
  router.start();

  // Initialize Thunder Intro
  if (threeScene) {
    new ThunderIntro({ threeScene, sceneController, lenis });

    // When intro completes: create CharacterNavigationManager and unlock navigation
    window.addEventListener(
      "introComplete",
      () => {
        // Create character navigation system
        const navManager = new CharacterNavigationManager(
          threeScene.scene,
          threeScene.camera,
          threeScene.worldScene,
        );

        // Link navManager into ThreeScene animate loop and theme system
        threeScene.navManager = navManager;

        // Link navManager into Router so clicks trigger character walking
        router.navManager = navManager;

        // Activate the persistent 3D world (fade it in)
        threeScene.worldScene?.activate?.();

        // Unlock character and auto-walk to home
        // This also fires characterArrived('home') which triggers content reveal
        // But home content is already rendered, so we just set active state.
        navManager.unlock();

        // When character first arrives at home, update nav active state
        const homeHandler = (e) => {
          if (e.detail?.node === "home") {
            window.removeEventListener("characterArrived", homeHandler);
            router._updateActiveLink("/");
            router._updateActivePill("/");
            initNavPill();
          }
        };
        window.addEventListener("characterArrived", homeHandler);
      },
      { once: true },
    );
  }
}

bootstrap();
