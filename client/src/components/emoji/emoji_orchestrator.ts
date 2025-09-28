/**
 * Emoji Orchestrator — centralise les triggers, la densité et le rate-limiting.
 * Usage :
 *   import { initEmojiOrchestrator, triggerEmoji } from "./emoji_orchestrator";
 *   initEmojiOrchestrator(config); triggerEmoji("category_open", { section:"films", profile:"visitor", x, y });
 */
import EmojiBurst from "./EmojiBurst";

type Profile = "visitor"|"investisseur"|"porteur"|"admin";
type Density = "low"|"medium"|"high";
type Cfg = {
  enabled: boolean;
  global: { maxPerMinute: number; cooldownMs: number; };
  profiles: Record<Profile, { density: Density }>;
  events: Record<string, any>;
};

let CONFIG: Cfg | null = null;
let lastTs = 0;
let countWindow = 0;
let windowStart = 0;
let reducedMotion = false;
let onceSessionFlags = new Set<string>();

// Mount point (single overlay) where bursts are rendered
let container: HTMLDivElement | null = null;
function ensureContainer() {
  if (!container) {
    container = document.createElement("div");
    container.id = "emoji-overlay-root";
    document.body.appendChild(container);
  }
}

export function initEmojiOrchestrator(cfg: Cfg) {
  CONFIG = cfg;
  reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ensureContainer();
  window.addEventListener("beforeunload", () => { onceSessionFlags.clear(); });
}

function canFire(): boolean {
  if (!CONFIG || !CONFIG.enabled) return false;
  const now = Date.now();
  if (now - windowStart > 60_000) { windowStart = now; countWindow = 0; }
  if (countWindow >= CONFIG.global.maxPerMinute) return false;
  if (now - lastTs < CONFIG.global.cooldownMs) return false;
  lastTs = now; countWindow++;
  return true;
}

type TriggerCtx = { section?: string; profile?: Profile; x?: number; y?: number; };

export function triggerEmoji(event: string, ctx: TriggerCtx = {}) {
  if (!CONFIG || !CONFIG.enabled) return;
  if (!canFire()) return;
  const profile: Profile = (ctx.profile || "visitor");
  const density: Density = CONFIG.profiles[profile]?.density || "low";
  const cfg = CONFIG.events[event];
  if (!cfg) return;

  if (cfg.oncePerSession) {
    const key = `once:${event}`;
    if (onceSessionFlags.has(key)) return;
    onceSessionFlags.add(key);
  }

  // Determine emojis & count
  let emojis: string[] = [];
  if (cfg.packs && ctx.section && cfg.packs[ctx.section]) emojis = cfg.packs[ctx.section];
  else if (cfg.emojis) emojis = cfg.emojis;
  const countBy = cfg.count || { low: 6, medium: 10, high: 14 };
  const count = countBy[density] ?? 8;

  // Render burst via React if dispo, sinon fallback DOM
  ensureContainer();
  if (!container) return;
  const mount = document.createElement("div");
  container.appendChild(mount);

  const cleanup = () => {
    setTimeout(() => mount.remove(), 200);
  };

  // @ts-ignore
  const React = (window as any).React || null;
  // @ts-ignore
  const ReactDOM = (window as any).ReactDOM || null;

  if (React && ReactDOM && typeof React.createElement === "function") {
    const el = React.createElement(EmojiBurst, {
      emojis, count, x: ctx.x, y: ctx.y, onDone: cleanup, reduced: reducedMotion
    });
    // @ts-ignore
    const root = (ReactDOM.createRoot ? ReactDOM.createRoot(mount) : ReactDOM);
    // @ts-ignore
    if (root.createRoot) { const r = root.createRoot(mount); r.render(el); setTimeout(()=>r.unmount(), 1200); }
    else { ReactDOM.render(el, mount); setTimeout(()=>ReactDOM.unmountComponentAtNode(mount), 1200); }
  } else {
    // Fallback minimal
    const span = document.createElement("span");
    span.className = "emoji-particle";
    span.textContent = (emojis[0] || "✨");
    span.style.left = (ctx.x || window.innerWidth/2) + "px";
    span.style.top  = (ctx.y || window.innerHeight/2) + "px";
    span.style.position = "fixed";
    span.style.transform = "translate(-50%,-50%)";
    span.style.animation = "emoji-rise 700ms ease-out forwards";
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 900);
  }
}
