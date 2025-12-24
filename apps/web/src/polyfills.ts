import { Buffer } from "buffer";

// Polyfill Buffer
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

// Polyfill global
if (typeof globalThis.global === "undefined") {
  (globalThis as any).global = globalThis;
}

// Polyfill process with nextTick
if (typeof globalThis.process === "undefined") {
  (globalThis as any).process = {
    env: {},
    cwd: () => "/",
    nextTick: (fn: (...args: any[]) => void, ...args: any[]) => {
      queueMicrotask(() => fn(...args));
    },
    browser: true,
    version: "v20.0.0", // Fake Node version for libraries that check it
    versions: { node: "20.0.0" },
    platform: "browser",
    arch: "x64",
    release: { name: "node" },
    hrtime: () => [0, 0],
    stdout: { isTTY: false },
    stderr: { isTTY: false },
  };
} else {
  // process exists but some properties might be missing
  const proc = globalThis.process as any;
  if (typeof proc.nextTick === "undefined") {
    proc.nextTick = (fn: (...args: any[]) => void, ...args: any[]) => {
      queueMicrotask(() => fn(...args));
    };
  }
  if (!proc.version) {
    proc.version = "v20.0.0";
  }
  if (!proc.versions) {
    proc.versions = { node: "20.0.0" };
  }
}

export {};
