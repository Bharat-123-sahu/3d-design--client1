let lenis;
const locks = new Set();
export function setOverlayScroller(scroller) { lenis = scroller; }

// A shared lock prevents closing one overlay from unlocking another.
export function containDialog(dialog, opener, background = []) {
  const saved = background.filter(Boolean).map(el => [el, el.inert]);
  saved.forEach(([el]) => { el.inert = true; });
  locks.add(dialog);
  document.documentElement.classList.add("has-dialog");
  lenis?.stop();
  const focusable = () => [...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
  const trap = event => {
    if (event.key !== "Tab") return;
    const items = focusable(), first = items[0], last = items.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  };
  dialog.addEventListener("keydown", trap);
  focusable()[0]?.focus({ preventScroll: true });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    dialog.removeEventListener("keydown", trap);
    saved.forEach(([el, inert]) => { el.inert = inert; });
    locks.delete(dialog);
    if (!locks.size) { document.documentElement.classList.remove("has-dialog"); lenis?.start(); }
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
}
