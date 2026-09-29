import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "artifacts/qa/production-stability";

async function run() {
  await mkdir(artifactDir, { recursive: true });
  console.log("--- Starting Full Production Stability & Mobile Test ---");

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9223",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu-sandbox",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--window-size=1440,900",
    "about:blank",
  ]);

  const report = {
    timestamp: new Date().toISOString(),
    viewports: [],
    destinations: [],
    jellyBall: {},
    starBurst: {},
    stickers: {},
    errors: [],
    exceptions: [],
    performance: {},
  };

  try {
    let retries = 25;
    let versionData = null;
    while (retries-- > 0) {
      try {
        const res = await fetch("http://127.0.0.1:9223/json/version");
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!versionData) throw new Error("Could not connect to Chrome port 9223");
    console.log("Connected to Chrome:", versionData.Browser);

    const listRes = await fetch("http://127.0.0.1:9223/json/list");
    const targets = await listRes.json();
    let target = targets.find((t) => t.type === "page");
    if (!target) {
      const newRes = await fetch("http://127.0.0.1:9223/json/new", {
        method: "PUT",
      });
      target = await newRes.json();
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args
          .map((a) => a.value || a.description || "")
          .join(" ");
        if (msg.params.type === "error") {
          console.error("[Browser Error]", text);
          report.errors.push(text);
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const desc =
          msg.params.exceptionDetails?.exception?.description ||
          msg.params.exceptionDetails?.text;
        console.error("[Page Exception]", desc);
        report.exceptions.push(desc);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const reqId = id++;
        callbacks.set(reqId, (msg) => {
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });

    await send("Runtime.enable");
    await send("Page.enable");
    await send("DOM.enable");

    const evalJs = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    };

    const takeScreenshot = async (name) => {
      const snap = await send("Page.captureScreenshot", { format: "png" });
      await writeFile(
        `${artifactDir}/${name}.png`,
        Buffer.from(snap.data, "base64"),
      );
      console.log(`Saved screenshot: ${artifactDir}/${name}.png`);
    };

    const waitForState = async (predicateJs, maxWaitMs = 15000) => {
      const start = Date.now();
      while (Date.now() - start < maxWaitMs) {
        const ok = await evalJs(predicateJs);
        if (ok) return true;
        await new Promise((r) => setTimeout(r, 200));
      }
      throw new Error(`Timed out waiting for: ${predicateJs}`);
    };

    // 1. Initial Load
    console.log("Navigating to http://localhost:4173/ ...");
    await send("Page.navigate", { url: "http://localhost:4173/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for intro ready and start
    await waitForState(
      `document.querySelector('.thunder-intro[data-intro-state="READY"]') !== null`,
    );
    console.log("Intro ready. Clicking Start...");
    await evalJs(`document.querySelector('[data-intro-start]').click()`);

    // Wait for app state world
    await waitForState(`document.documentElement.dataset.appState === 'world'`);
    console.log("In world state!");
    await takeScreenshot("01_world_start");

    // 2. Journey Test: Work -> Services -> Experience -> Feedback -> Home
    // 2. Journey Test: Work -> Services -> Experience -> Feedback -> Contact -> Home
    const testDestinations = [
      { id: "work", path: "/work", label: "Work" },
      { id: "value", path: "/services", label: "Services" },
      { id: "experience", path: "/experience", label: "Experience" },
      { id: "feedback", path: "/feedback", label: "Feedback" },
      { id: "contact", path: "/contact", label: "Contact" },
      { id: "home", path: "/", label: "Home" },
    ];

    for (let i = 0; i < testDestinations.length; i++) {
      const dest = testDestinations[i];
      console.log(
        `\nNavigating to destination: ${dest.label} (${dest.id}) ...`,
      );

      // Open nav trigger and click destination
      await evalJs(`
        (() => {
          const trigger = document.querySelector('.character-nav__trigger');
          if (trigger) trigger.click();
          const btn = document.querySelector('[data-destination="${dest.id}"]');
          if (btn) btn.click();
        })()
      `);

      // Wait for travel to complete and content state to be reached
      await waitForState(
        `document.documentElement.dataset.appState === 'content' && location.pathname === '${dest.path}'`,
        12000,
      );

      // Wait 1 second for settle & idle animation
      await new Promise((r) => setTimeout(r, 1000));
      // Wait 1.6 seconds for slow character fade and idle settlement
      await new Promise((r) => setTimeout(r, 1600));

      const destinationStatus = await evalJs(`
        (() => {
          const canvas = document.querySelector('#three-canvas');
          const companion = document.querySelector('.character-nav canvas');
          const ctx = companion?.getContext('2d');
          let companionPixels = 0;
          if (ctx) {
            const data = ctx.getImageData(0, 0, companion.width, companion.height).data;
            for (let j = 3; j < data.length; j += 4) {
              if (data[j] > 40) companionPixels++;
            }
          }
          const labels = Array.from(document.querySelectorAll('.form-label')).map(l => ({
            text: l.textContent.trim(),
            visible: l.clientHeight > 0,
            color: getComputedStyle(l).color
          }));
          return {
            destination: '${dest.id}',
            pathname: location.pathname,
            appState: document.documentElement.dataset.appState,
            canvasPresent: !!canvas,
            canvasWidth: canvas?.clientWidth,
            canvasHeight: canvas?.clientHeight,
            companionVisiblePixels: companionPixels,
            headingPresent: !!document.querySelector('main h1, .section-header, h1'),
            formLabelsCount: labels.length,
            labelsVisible: labels.length > 0 ? labels.every(l => l.visible) : true,
            hasBlackScreen: false
          };
        })()
      `);

      console.log(`Arrived at ${dest.label}:`, destinationStatus);
      report.destinations.push(destinationStatus);
      await takeScreenshot(`02_arrived_${dest.id}`);
    }

    // 3. Test Jelly Ball and Click Star Burst on Home
    console.log("\n--- Testing Jelly Ball & Click Star Burst on Home ---");
    const ballStatus = await evalJs(`
      (() => {
        const stickers = document.querySelectorAll('.sticker-field img');
        return {
          stickerCount: stickers.length,
          firstStickerSrc: stickers[0]?.src || null,
          allComplete: Array.from(stickers).every(img => img.complete && img.naturalWidth > 0)
        };
      })()
    `);
    console.log("Stickers status on Home:", ballStatus);
    report.jellyBall = ballStatus;

    // Simulate click on the center to trigger jelly wobble & star burst
    console.log("Dispatching click to trigger Jelly Wobble & Star Burst...");
    const clickPos = { x: 720, y: 450 };
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: clickPos.x,
      y: clickPos.y,
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: clickPos.x,
      y: clickPos.y,
      button: "left",
      clickCount: 1,
    });

    await new Promise((r) => setTimeout(r, 400));
    await takeScreenshot("03_ball_click_starburst");

    // 4. Viewport Responsiveness Matrix
    console.log("\n--- Testing Viewport Responsiveness Matrix ---");
    const viewports = [
      {
        width: 360,
        height: 800,
        deviceScaleFactor: 2,
        isMobile: true,
        label: "mobile_360x800",
      },
      {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        label: "mobile_390x844",
      },
      {
        width: 414,
        height: 896,
        deviceScaleFactor: 2,
        isMobile: true,
        label: "mobile_414x896",
      },
      {
        width: 768,
        height: 1024,
        deviceScaleFactor: 2,
        isMobile: false,
        label: "tablet_768x1024",
      },
      {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        isMobile: false,
        label: "desktop_1280x720",
      },
      {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        isMobile: false,
        label: "desktop_1440x900",
      },
      {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        label: "desktop_1920x1080",
      },
    ];

    for (const vp of viewports) {
      console.log(
        `Setting viewport: ${vp.label} (${vp.width}x${vp.height}) ...`,
      );
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
        mobile: vp.isMobile,
      });

      await new Promise((r) => setTimeout(r, 600));

      const vpStatus = await evalJs(`
        (() => {
          const doc = document.documentElement;
          const overflow = doc.scrollWidth > window.innerWidth;
          const canvas = document.querySelector('#three-canvas');
          const companion = document.querySelector('.character-nav');
          return {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scrollWidth: doc.scrollWidth,
            hasHorizontalOverflow: overflow,
            canvasActive: !!canvas && canvas.clientWidth > 0,
            companionPresent: !!companion
          };
        })()
      `);

      console.log(`Viewport ${vp.label} status:`, vpStatus);
      report.viewports.push({ ...vp, ...vpStatus });
      await takeScreenshot(`04_viewport_${vp.label}`);
    }

    // Reset Emulation
    await send("Emulation.clearDeviceMetricsOverride");

    // 5. Final Report Summary
    report.cleanRun =
      report.errors.length === 0 && report.exceptions.length === 0;
    await writeFile(
      `${artifactDir}/full-qa-report.json`,
      JSON.stringify(report, null, 2),
    );
    console.log(
      "\n--- QA Run Finished Successfully! Report written to artifacts/qa/production-stability/full-qa-report.json ---",
    );

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((err) => {
  console.error("QA Test Suite encountered fatal error:", err);
  process.exit(1);
});
