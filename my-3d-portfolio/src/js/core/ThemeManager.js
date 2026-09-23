import gsap from "gsap";

const STORAGE_KEY = "portfolio-theme";

export class ThemeManager {
  constructor({ sceneController } = {}) {
    this.sceneController = sceneController;
    this.theme = localStorage.getItem(STORAGE_KEY) || "dark";
    this.listeners = new Set();
    this.button = null;

    this.apply(this.theme, { animate: false });
    this.bind();
  }

  bind() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme-toggle]");
      if (!button) return;
      this.toggle();
    });
  }

  registerButton(button) {
    this.button = button;
    this.syncButton();
  }

  subscribe(listener) {
    if (typeof listener === "function") {
      this.listeners.add(listener);
      listener(this.theme, false);
    }
    return () => this.listeners.delete(listener);
  }

  toggle() {
    this.apply(this.theme === "dark" ? "light" : "dark", { animate: true });
  }

  apply(theme, { animate = true } = {}) {
    this.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    if (animate) {
      gsap.fromTo(
        document.documentElement,
        { "--theme-wash": theme === "dark" ? 1 : 0 },
        { "--theme-wash": theme === "dark" ? 0 : 1, duration: 0.75, ease: "power2.inOut" },
      );
      gsap.fromTo(
        "[data-theme-toggle]",
        { rotate: -12, scale: 0.9 },
        { rotate: 0, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" },
      );
    }

    this.syncButton();
    this.sceneController?.threeScene?.setTheme?.(theme, animate);
    this.listeners.forEach((listener) => listener(theme, animate));
  }

  syncButton() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(this.theme === "light"));
      button.dataset.themeState = this.theme;
      const label = this.theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
      button.setAttribute("aria-label", label);
      button.title = label;
    });
  }
}

