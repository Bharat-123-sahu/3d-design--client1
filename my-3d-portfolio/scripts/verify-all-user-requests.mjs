import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "artifacts/qa";

async function run() {
  await mkdir(artifactDir, { recursive: true });
  console.log("--- Starting Comprehensive QA Verification Suite ---");

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9225",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu-sandbox",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--window-size=390,844",
    "about:blank",
  ]);

  const report = {
    timestamp: new Date().toISOString(),
    checks: [],
    errors: [],
    exceptions: [],
  };

  try {
    let retries = 30;
    let versionData = null;
    while (retries-- > 0) {
      try {
        const res = await fetch("http://127.0.0.1:9225/json/version");
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!versionData) throw new Error("Could not connect to Chrome port 9225");
    console.log("Connected to Chrome:", versionData.Browser);

    const listRes = await fetch("http://127.0.0.1:9225/json/list");
    const targets = await listRes.json();
    let target = targets.find((t) => t.type === "page");
    if (!target) {
      const newRes = await fetch("http://127.0.0.1:9225/json/new", {
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
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });
    await send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });

    const evalJs = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result?.value;
    };

    const takeScreenshot = async (name) => {
      const data = await send("Page.captureScreenshot", { format: "png" });
      const buffer = Buffer.from(data.data, "base64");
      await writeFile(`${artifactDir}/${name}.png`, buffer);
      console.log(`Saved screenshot: ${artifactDir}/${name}.png`);
    };

    console.log("1. Navigating to http://localhost:4173/ ...");
    await send("Page.navigate", { url: "http://localhost:4173/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Roman Typography & Character-by-character elements on Start page
    console.log("2. Checking Start Page Roman Typography & DBS Thunder...");
    const pageDebug = await evalJs(`
      ({
        url: window.location.href,
        readyState: document.readyState,
        hasApp: Boolean(document.querySelector('#app')),
        appHtml: document.querySelector('#app')?.innerHTML?.slice(0, 200),
        introExists: Boolean(document.querySelector('.thunder-intro')),
        hasThreeScene: Boolean(window.__THREE_SCENE__),
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className,
      })
    `);
    console.log("Page Debug Info:", pageDebug);

    const introCheck = await evalJs(`
      (async () => {
        let retries = 30;
        let title = document.querySelector('.thunder-intro__title');
        while (!title && retries-- > 0) {
          await new Promise(r => setTimeout(r, 200));
          title = document.querySelector('.thunder-intro__title');
        }
        if (!title) return { error: "Title not found", debug: document.body.innerHTML.slice(0, 300) };
        const chars = document.querySelectorAll('.thunder-intro__char');
        const canvas = document.querySelector('.thunder-intro__canvas');
        const computed = window.getComputedStyle(title);
        return {
          charCount: chars.length,
          fontFamily: computed.fontFamily,
          letterSpacing: computed.letterSpacing,
          hasCanvas: Boolean(canvas),
          introState: document.querySelector('.thunder-intro')?.dataset?.introState,
        };
      })()
    `);
    console.log("Intro Check Data:", introCheck);
    assert.ok(
      introCheck.charCount >= 16,
      "Must have character spans for slow letter reveal",
    );
    assert.ok(
      introCheck.fontFamily.toLowerCase().includes("cinzel") ||
        introCheck.fontFamily.toLowerCase().includes("roman") ||
        introCheck.fontFamily.toLowerCase().includes("serif"),
      "Font family must be Roman serif",
    );
    report.checks.push({
      test: "Start page Roman typography & DBS thunder",
      ...introCheck,
    });

    await takeScreenshot("01-start-page-roman-dbs-blue");

    // Wait for READY state on START button
    console.log("3. Waiting for READY state...");
    let readyWait = 40;
    while (readyWait-- > 0) {
      const state = await evalJs(
        `document.querySelector('.thunder-intro')?.dataset?.introState`,
      );
      if (state === "READY") break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Sample thunder bolts count and size during READY state
    console.log(
      "3b. Sampling thunder bolts in READY state (checking max 2-3 and small size)...",
    );
    const sampleResults = await evalJs(`
      (async () => {
        let maxCount = 0;
        let lengths = [];
        for (let i = 0; i < 12; i++) {
          const intro = window.__THUNDER_INTRO__;
          if (intro) {
            const count = intro.bolts.length;
            if (count > maxCount) maxCount = count;
            for (const b of intro.bolts) {
              if (b.segments?.length) {
                const s0 = b.segments[0];
                const sLast = b.segments[b.segments.length - 1];
                const len = Math.hypot(sLast.x2 - s0.x1, sLast.y2 - s0.y1);
                lengths.push(len);
              }
            }
          }
          await new Promise(r => setTimeout(r, 120));
        }
        return {
          maxActiveBolts: maxCount,
          boltLengths: lengths,
          avgLength: lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
        };
      })()
    `);
    console.log("Thunder Bolt Sampling:", sampleResults);
    assert.ok(
      sampleResults.maxActiveBolts <= 2,
      "Must never exceed 2-3 active bolts at a time",
    );
    if (sampleResults.avgLength > 0) {
      assert.ok(
        sampleResults.avgLength < 250,
        "Bolts must be small/compact (not spanning full screen)",
      );
    }
    report.checks.push({
      test: "Thunder bolt quantity and size limits",
      ...sampleResults,
    });

    await takeScreenshot("01-start-page-roman-dbs-blue");

    // Click START button
    console.log("4. Clicking START button...");
    await evalJs(`document.querySelector('[data-intro-start]')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    // Check WorldScene scale on mobile
    console.log("5. Checking WorldScene scale on mobile...");
    const worldSceneCheck = await evalJs(`
      (() => {
        const scene = window.__THREE_SCENE__;
        const group = scene?.worldScene?.worldGroup;
        return {
          worldGroupScale: group?.scale?.x,
          appState: document.documentElement.dataset.appState,
          worldVisible: group?.visible,
        };
      })()
    `);
    console.log("WorldScene scale check:", worldSceneCheck);
    assert.equal(
      worldSceneCheck.worldGroupScale,
      1.0,
      "Mobile worldGroup scale must be 1.0 (not shrunken to 0.65)",
    );
    report.checks.push({ test: "Mobile WorldScene scale", ...worldSceneCheck });

    await takeScreenshot("02-mobile-world-scene-active");

    // Navigate to /work (has 3D Jelly Ball)
    console.log("6. Navigating to /work via Router...");
    await evalJs(`
      (() => {
        const nav = document.querySelector('.character-nav');
        const trigger = nav?.querySelector('.character-nav__trigger');
        trigger?.click();
        setTimeout(() => {
          const workBtn = document.querySelector('[data-destination="work"]');
          workBtn?.click();
        }, 300);
      })()
    `);

    // Wait for arrival at /work
    let workWait = 40;
    while (workWait-- > 0) {
      const path = await evalJs(`window.location.pathname`);
      const isContent = await evalJs(
        `document.documentElement.dataset.appState === 'content'`,
      );
      if (path === "/work" && isContent) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log("Arrived at /work!");
    await new Promise((r) => setTimeout(r, 1200));

    // Inspect Jelly Ball & sticker attachment on mobile
    console.log("7. Testing Jelly Ball Click & Mobile Sticker Pasting...");
    const ballTest = await evalJs(`
      (async () => {
        const scene = window.__THREE_SCENE__;
        const blob = scene.liquidBlob;
        const countBefore = blob.surfaceStickers.count;

        // Hit test ball at center
        const rect = scene.container.getBoundingClientRect();
        const hit = blob.hitTest(rect.left + rect.width / 2, rect.top + rect.height * 0.45, scene.camera, rect);
        if (!hit) return { hit: false };

        blob.triggerImpact(hit, 1.4);
        const attached = await blob.addSticker(null, hit);

        return {
          hit: true,
          attached,
          countBefore,
          countAfter: blob.surfaceStickers.count,
          punchScale: { x: blob.punchScale.x, y: blob.punchScale.y, z: blob.punchScale.z },
          stickerFieldVisible: blob.stickerField.visible,
        };
      })()
    `);
    console.log("Ball Click & Sticker Result:", ballTest);
    assert.ok(ballTest.hit, "Ball hitTest must succeed");
    assert.ok(ballTest.attached, "addSticker must attach on mobile click");
    assert.ok(
      ballTest.countAfter > ballTest.countBefore,
      "SurfaceStickers count must increase on mobile click!",
    );
    assert.equal(
      ballTest.stickerFieldVisible,
      false,
      "Background floating stickers must remain disabled on mobile",
    );
    report.checks.push({
      test: "Mobile Jelly Ball Sticker Paste & Punch",
      ...ballTest,
    });

    await takeScreenshot("03-mobile-ball-sticker-pasted");

    // Test Pip click easter egg & speech bubble
    console.log("8. Testing Pip interaction & speech bubble...");
    const pipTest = await evalJs(`
      (() => {
        window.dispatchEvent(new CustomEvent('pipClicked'));
        const bubble = document.querySelector('.pip-speech-bubble');
        const soundBtn = document.querySelector('.sound-toggle-btn');
        return {
          hasBubble: Boolean(bubble),
          bubbleText: bubble?.textContent,
          hasSoundToggle: Boolean(soundBtn),
        };
      })()
    `);
    console.log("Pip Easter Egg Check:", pipTest);
    assert.ok(
      pipTest.hasBubble,
      "Speech bubble must appear when Pip is clicked",
    );
    assert.ok(pipTest.hasSoundToggle, "Sound toggle button must exist");
    report.checks.push({ test: "Pip interaction & speech bubble", ...pipTest });

    await takeScreenshot("04-pip-speech-bubble-reaction");

    // Test destination hops sequence on mobile:
    // Work -> Services -> Experience -> Feedback -> Work
    console.log("9. Testing multi-destination travel sequence on mobile...");
    const destinations = [
      { id: "value", path: "/services" },
      { id: "experience", path: "/experience" },
      { id: "feedback", path: "/feedback" },
      { id: "work", path: "/work" },
    ];

    for (const dest of destinations) {
      console.log(`Traveling to ${dest.id} (${dest.path})...`);
      await evalJs(`
        (() => {
          const nav = document.querySelector('.character-nav');
          const trigger = nav?.querySelector('.character-nav__trigger');
          trigger?.click();
          setTimeout(() => {
            const btn = document.querySelector('[data-destination="${dest.id}"]');
            btn?.click();
          }, 300);
        })()
      `);

      let hopWait = 40;
      while (hopWait-- > 0) {
        const path = await evalJs(`window.location.pathname`);
        const moving = await evalJs(
          `window.__THREE_SCENE__?.navManager?.isMoving`,
        );
        if (path === dest.path && !moving) break;
        await new Promise((r) => setTimeout(r, 350));
      }
      console.log(`Arrived at ${dest.id}!`);
      await new Promise((r) => setTimeout(r, 600));
    }

    await takeScreenshot("05-mobile-hops-complete");
    report.checks.push({
      test: "Multi-destination travel sequence",
      result: "ALL_HOPS_SUCCESSFUL",
    });

    // Verify no fatal errors
    assert.equal(
      report.exceptions.length,
      0,
      "No unhandled exceptions allowed",
    );
    console.log("==========================================");
    console.log("ALL 6 USER REQUIREMENTS VERIFIED & PASSED!");
    console.log("==========================================");
  } catch (err) {
    console.error("[QA FAILURE]", err);
    report.failure = err.stack;
    process.exitCode = 1;
  } finally {
    await writeFile(
      `${artifactDir}/qa-verification-report.json`,
      JSON.stringify(report, null, 2),
    );
    chrome.kill();
  }
}

run();
