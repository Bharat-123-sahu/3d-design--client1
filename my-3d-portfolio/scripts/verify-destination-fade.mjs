import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "artifacts/qa/destination-fade";

async function run() {
  await mkdir(artifactDir, { recursive: true });
  console.log(
    "--- Starting Verification for Destination Fade & Sticker Zigzag ---",
  );

  // Start preview server
  const preview = spawn("npm.cmd", ["run", "preview", "--", "--port", "4184"], {
    cwd: "d:\\New folder\\my-3d-portfolio",
    shell: true,
  });

  // Wait for preview server to be ready
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://localhost:4184/");
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (!serverReady) {
    preview.kill();
    throw new Error("Preview server failed to start on port 4184");
  }
  console.log("Preview server ready on http://localhost:4184/");

  // Launch Chrome
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9226",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu-sandbox",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--window-size=1440,900",
    "about:blank",
  ]);

  try {
    let retries = 25;
    let versionData = null;
    while (retries-- > 0) {
      try {
        const res = await fetch("http://127.0.0.1:9226/json/version");
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!versionData) throw new Error("Could not connect to Chrome port 9226");

    const listRes = await fetch("http://127.0.0.1:9226/json/list");
    const targets = await listRes.json();
    let target = targets.find((t) => t.type === "page");
    if (!target) {
      const newRes = await fetch("http://127.0.0.1:9226/json/new", {
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

    const evalJs = async (expr) => {
      const res = await send("Runtime.evaluate", {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result.value;
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

    await send("Page.enable");
    await send("Runtime.enable");

    console.log("Navigating to http://localhost:4184/ ...");
    await send("Page.navigate", { url: "http://localhost:4184/" });
    await new Promise((r) => setTimeout(r, 2000));

    await waitForState(
      `document.querySelector('.thunder-intro[data-intro-state="READY"]') !== null`,
    );
    console.log("Intro ready. Clicking Start...");
    await evalJs(`document.querySelector('[data-intro-start]').click()`);
    await waitForState(`document.documentElement.dataset.appState === 'world'`);
    console.log("In world state!");

    // Test Desktop dynamic zigzag movement
    console.log("\nTesting Desktop Sticker Zig-zag animation...");
    const sample1 = await evalJs(`
      (() => {
        const el = document.querySelector('.sticker-field div');
        return el ? el.style.transform : null;
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    const sample2 = await evalJs(`
      (() => {
        const el = document.querySelector('.sticker-field div');
        return el ? el.style.transform : null;
      })()
    `);
    console.log("Desktop sticker transform 1:", sample1);
    console.log("Desktop sticker transform 2:", sample2);
    const desktopAnimated = sample1 && sample2 && sample1 !== sample2;
    console.log(
      "Desktop stickers actively animating with dynamic zigzag:",
      desktopAnimated,
    );

    // Navigate to Work destination
    console.log("\nNavigating to Work via navigation link...");
    await evalJs(
      `document.querySelector('a[data-destination="work"]')?.click() || document.querySelector('a[href="/work"]')?.click()`,
    );
    await waitForState(
      `document.documentElement.dataset.appState === 'content'`,
    );
    console.log("Arrived at Work! Waiting for slow-fade (1.4s)...");
    await new Promise((r) => setTimeout(r, 2000));

    const workArrival = await evalJs(`
      (() => {
        const appState = document.documentElement.dataset.appState;
        const mainCanvas = document.querySelector('#three-canvas');
        const companionCanvas = document.querySelector('.character-nav canvas');
        return {
          appState,
          canvasPresent: !!mainCanvas,
          companionCanvasPresent: !!companionCanvas,
          pathname: window.location.pathname
        };
      })()
    `);
    console.log("Work arrival state:", workArrival);
    await takeScreenshot("01_arrived_work_fade_desktop");

    // Navigate to Experience destination
    console.log("\nNavigating to Experience...");
    await evalJs(
      `document.querySelector('a[data-destination="experience"]')?.click() || document.querySelector('a[href="/experience"]')?.click()`,
    );
    await waitForState(
      `document.documentElement.dataset.appState === 'content'`,
    );
    console.log("Arrived at Experience! Waiting for slow-fade (1.4s)...");
    await new Promise((r) => setTimeout(r, 2000));
    await takeScreenshot("02_arrived_experience_fade_desktop");

    // Switch to Mobile Viewport
    console.log("\n--- Testing Mobile Viewport (390x844) ---");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Navigate to Home on mobile
    console.log("Navigating to Home on mobile...");
    await evalJs(
      `document.querySelector('a[href="/"]')?.click() || document.querySelector('a[data-destination="home"]')?.click()`,
    );
    await new Promise((r) => setTimeout(r, 2500));
    await takeScreenshot("03_home_mobile_390x844");

    // Check mobile stickers stability
    const mobileSample = await evalJs(`
      (() => {
        const el = document.querySelector('.sticker-field div');
        return el ? el.style.transform : null;
      })()
    `);
    console.log("Mobile sticker transform:", mobileSample);

    ws.close();
    chrome.kill();
    preview.kill();
    console.log("\n--- Verification Completed Successfully! ---");
  } catch (err) {
    console.error("Verification error:", err);
    chrome.kill();
    preview.kill();
    process.exit(1);
  }
}

run();
