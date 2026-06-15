/**
 * Preview renderer — turns a Blueprint into a fully self-contained HTML
 * document rendered inside a sandboxed iframe (sandbox="allow-scripts").
 *
 * No external resources are loaded: all CSS and JS is inlined, so the
 * preview works offline and can never break the host app. Interactivity
 * (page navigation, todo toggling, booking slots, form submits) is plain
 * vanilla JS scoped to the iframe.
 */

import type { Blueprint, Page, Section } from "@/types";
import { escapeHtml as esc } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(v.slice(0, 2), 16) || 139,
    parseInt(v.slice(2, 4), 16) || 92,
    parseInt(v.slice(4, 6), 16) || 246,
  ];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Inline SVG icons for the preview shell nav
// ---------------------------------------------------------------------------

const ICONS: Record<string, string> = {
  layout: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};

function icon(name: string, size = 16): string {
  const body = ICONS[name] || ICONS.grid;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

function buildCss(bp: Blueprint): string {
  const t = bp.theme;
  const dark = t.mode === "dark";
  const accent = t.accent;

  const bg = dark ? (t.premium ? "#08080d" : "#0b0c10") : t.premium ? "#f7f6fb" : "#f6f7f9";
  const surface = dark ? (t.premium ? "rgba(255,255,255,0.045)" : "#13141a") : "#ffffff";
  const surfaceSolid = dark ? "#15161d" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.09)" : "rgba(15,18,25,0.10)";
  const text = dark ? "#eceef2" : "#171a21";
  const muted = dark ? "#9aa1ad" : "#5d6470";
  const font =
    t.font === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : t.font === "mono"
        ? "'Cascadia Code', 'SF Mono', Consolas, monospace"
        : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif";

  const cardShadow = dark
    ? t.premium
      ? `0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`
      : "0 2px 12px rgba(0,0,0,0.3)"
    : "0 2px 14px rgba(20,24,35,0.07)";

  const premiumBgLayer = t.premium
    ? `body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:
        radial-gradient(800px 500px at 85% -10%, ${rgba(accent, dark ? 0.22 : 0.14)}, transparent 60%),
        radial-gradient(700px 500px at -10% 100%, ${rgba(accent, dark ? 0.14 : 0.08)}, transparent 60%);}`
    : "";

  const glass = t.premium ? "backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);" : "";

  return `
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:${accent};--bg:${bg};--surface:${surface};--border:${border};--text:${text};--muted:${muted};--radius:${t.radius}px}
html{font-size:15px}
body{background:var(--bg);color:var(--text);font-family:${font};-webkit-font-smoothing:antialiased;min-height:100vh}
${premiumBgLayer}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer}
.shell{display:flex;min-height:100vh;position:relative;z-index:1}
.sidebar{width:228px;flex-shrink:0;border-right:1px solid var(--border);padding:20px 12px;display:flex;flex-direction:column;gap:4px;background:${dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)"};${glass}}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.05rem;padding:6px 10px 20px}
.brand-dot{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--accent),${rgba(accent, 0.55)});display:flex;align-items:center;justify-content:center;color:#fff;font-size:.8rem;font-weight:800;box-shadow:0 4px 14px ${rgba(accent, 0.45)}}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:calc(var(--radius) - 4px);color:var(--muted);font-size:.92rem;font-weight:500;border:none;background:none;width:100%;text-align:left;transition:all .15s}
.nav-item:hover{color:var(--text);background:${dark ? "rgba(255,255,255,0.05)" : "rgba(15,18,25,0.05)"}}
.nav-item.active{color:var(--text);background:${rgba(accent, dark ? 0.16 : 0.1)};color:${dark ? "#fff" : accent}}
.nav-item.active svg{color:var(--accent)}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid var(--border);background:${dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.65)"};${glass}}
.topbar h1{font-size:1.02rem;font-weight:650}
.avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent),${rgba(accent, 0.5)});display:flex;align-items:center;justify-content:center;color:#fff;font-size:.72rem;font-weight:700}
.content{padding:28px;display:flex;flex-direction:column;gap:22px;max-width:1100px;width:100%;margin:0 auto}
.page{display:none}
.page.active{display:block;animation:fadein .35s ease}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;box-shadow:${cardShadow};${glass}}
.card h3{font-size:.95rem;font-weight:650;margin-bottom:14px}
.section-gap{display:flex;flex-direction:column;gap:22px}
/* stats */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.stat .label{font-size:.78rem;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.04em}
.stat .value{font-size:1.65rem;font-weight:750;margin-top:6px;letter-spacing:-.02em}
.stat .delta{font-size:.78rem;margin-top:6px;font-weight:600;color:var(--accent)}
.stat .delta.neg{color:#f43f5e}
/* table */
table{width:100%;border-collapse:collapse;font-size:.88rem}
th{text-align:left;color:var(--muted);font-weight:600;font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;padding:8px 10px;border-bottom:1px solid var(--border)}
td{padding:11px 10px;border-bottom:1px solid var(--border)}
tr:last-child td{border-bottom:none}
tr:hover td{background:${dark ? "rgba(255,255,255,0.025)" : "rgba(15,18,25,0.025)"}}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:.74rem;font-weight:600;background:${rgba(accent, dark ? 0.16 : 0.1)};color:${dark ? "#fff" : accent};border:1px solid ${rgba(accent, 0.25)}}
/* hero */
.hero{text-align:center;padding:72px 24px 56px}
.hero h2{font-size:2.6rem;font-weight:800;letter-spacing:-.03em;line-height:1.12;max-width:680px;margin:0 auto;${t.premium ? `background:linear-gradient(120deg,var(--text),${accent});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;` : ""}}
.hero p{color:var(--muted);font-size:1.08rem;max-width:540px;margin:18px auto 0;line-height:1.6}
.hero .btns{margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:calc(var(--radius) - 2px);font-weight:650;font-size:.92rem;border:1px solid transparent;transition:all .15s}
.btn-primary{background:var(--accent);color:#fff;box-shadow:0 6px 20px ${rgba(accent, 0.4)}}
.btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
.btn-ghost{border-color:var(--border);color:var(--text);background:${dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)"}}
.btn-ghost:hover{border-color:${rgba(accent, 0.5)}}
/* cards grid */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.feature-icon{width:38px;height:38px;border-radius:10px;background:${rgba(accent, dark ? 0.18 : 0.1)};color:var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.cards-grid .card h4{font-size:.95rem;font-weight:650;margin-bottom:6px}
.cards-grid .card p{font-size:.85rem;color:var(--muted);line-height:1.55}
/* pricing */
.pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;align-items:stretch}
.tier{position:relative;display:flex;flex-direction:column}
.tier.hl{border-color:${rgba(accent, 0.6)};box-shadow:0 8px 32px ${rgba(accent, 0.22)}}
.tier .badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:.68rem;font-weight:700;padding:3px 12px;border-radius:99px;letter-spacing:.04em}
.tier .price{font-size:2rem;font-weight:800;margin:10px 0 2px}
.tier .period{color:var(--muted);font-size:.8rem;margin-bottom:14px}
.tier ul{list-style:none;display:flex;flex-direction:column;gap:8px;font-size:.86rem;color:var(--muted);flex:1;margin-bottom:16px}
.tier ul li{display:flex;gap:8px;align-items:center}
.tier ul li svg{color:var(--accent);flex-shrink:0}
/* form */
.form-grid{display:flex;flex-direction:column;gap:14px;max-width:440px}
.form-grid label{font-size:.82rem;font-weight:600;display:block;margin-bottom:6px}
.form-grid input{width:100%;padding:10px 12px;border-radius:calc(var(--radius) - 4px);border:1px solid var(--border);background:${dark ? "rgba(255,255,255,0.04)" : "#fff"};color:var(--text);font-size:.9rem;outline:none;font-family:inherit}
.form-grid input:focus{border-color:var(--accent);box-shadow:0 0 0 3px ${rgba(accent, 0.18)}}
.form-sub{color:var(--muted);font-size:.86rem;margin:-8px 0 6px}
/* todo */
.todo-list{display:flex;flex-direction:column;gap:8px}
.todo-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--border);border-radius:calc(var(--radius) - 4px);background:${dark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.7)"};cursor:pointer;transition:all .15s;font-size:.92rem}
.todo-item:hover{border-color:${rgba(accent, 0.45)}}
.todo-check{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:transparent;transition:all .15s}
.todo-item.done .todo-check{background:var(--accent);border-color:var(--accent);color:#fff}
.todo-item.done span{color:var(--muted);text-decoration:line-through}
.todo-add{display:flex;gap:8px;margin-top:12px}
.todo-add input{flex:1;padding:10px 12px;border-radius:calc(var(--radius) - 4px);border:1px solid var(--border);background:${dark ? "rgba(255,255,255,0.04)" : "#fff"};color:var(--text);outline:none;font-family:inherit}
.todo-add input:focus{border-color:var(--accent)}
/* booking */
.days{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.day{padding:9px 16px;border-radius:calc(var(--radius) - 4px);border:1px solid var(--border);font-size:.86rem;font-weight:600;background:none;color:var(--text)}
.day.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px}
.slot{padding:10px 0;border-radius:calc(var(--radius) - 4px);border:1px solid var(--border);font-size:.85rem;font-weight:600;background:none;color:var(--text);transition:all .12s}
.slot:hover{border-color:var(--accent)}
.slot.active{background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:0 4px 14px ${rgba(accent, 0.4)}}
.booking-confirm{margin-top:16px;display:none;align-items:center;gap:10px;padding:12px 16px;border-radius:calc(var(--radius) - 4px);background:${rgba(accent, 0.12)};border:1px solid ${rgba(accent, 0.4)};font-size:.88rem;font-weight:600}
.booking-confirm.show{display:flex}
/* testimonials */
.testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.testimonials .card p{font-size:.92rem;line-height:1.6;margin-bottom:14px}
.t-author{font-size:.84rem;font-weight:650}
.t-role{font-size:.78rem;color:var(--muted)}
/* cta */
.cta-banner{text-align:center;padding:48px 24px;border-radius:var(--radius);background:linear-gradient(135deg,${rgba(accent, dark ? 0.25 : 0.14)},${rgba(accent, dark ? 0.08 : 0.04)});border:1px solid ${rgba(accent, 0.35)}}
.cta-banner h2{font-size:1.7rem;font-weight:750;letter-spacing:-.02em}
.cta-banner p{color:var(--muted);margin:10px auto 22px;max-width:440px}
/* activity */
.feed{display:flex;flex-direction:column}
.feed-item{display:flex;gap:14px;padding:12px 4px;border-bottom:1px solid var(--border);font-size:.9rem;align-items:flex-start}
.feed-item:last-child{border-bottom:none}
.feed-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:7px;flex-shrink:0;box-shadow:0 0 0 4px ${rgba(accent, 0.15)}}
.feed-time{margin-left:auto;color:var(--muted);font-size:.78rem;white-space:nowrap;padding-top:2px}
/* chart */
.chart-wrap svg{width:100%;height:auto;display:block}
/* login */
.login-card{max-width:380px;margin:0 auto;text-align:center}
.login-card .form-grid{max-width:none;text-align:left;margin-top:18px}
.login-sub{color:var(--muted);font-size:.88rem;margin-top:6px}
/* toast */
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(80px);background:${surfaceSolid};border:1px solid ${rgba(accent, 0.5)};color:var(--text);padding:11px 20px;border-radius:10px;font-size:.88rem;font-weight:600;box-shadow:0 10px 40px rgba(0,0,0,.35);transition:transform .3s ease;z-index:99}
.toast.show{transform:translateX(-50%) translateY(0)}
/* landing top nav */
.topnav{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid var(--border);position:sticky;top:0;background:${dark ? "rgba(11,12,16,0.8)" : "rgba(246,247,249,0.85)"};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:10}
.topnav .links{display:flex;gap:22px;font-size:.88rem;color:var(--muted);font-weight:500}
.topnav .links a:hover{color:var(--text)}
.landing-main{max-width:1020px;margin:0 auto;padding:0 24px 64px;display:flex;flex-direction:column;gap:56px;position:relative;z-index:1}
.section-title{text-align:center;font-size:1.5rem;font-weight:750;letter-spacing:-.02em;margin-bottom:22px}
.footer{border-top:1px solid var(--border);padding:28px;text-align:center;color:var(--muted);font-size:.82rem}
/* responsive */
@media(max-width:780px){
  .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:30;transform:translateX(-100%);transition:transform .25s ease;background:${surfaceSolid}}
  .sidebar.open{transform:none;box-shadow:0 0 60px rgba(0,0,0,.5)}
  .hamburger{display:flex !important}
  .content{padding:18px}
  .hero h2{font-size:1.9rem}
  .topnav .links{display:none}
}
.hamburger{display:none;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text)}
.scrim{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:25;display:none}
.scrim.show{display:block}
`;
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderChartSvg(s: Extract<Section, { type: "chart" }>, accent: string): string {
  const w = 640;
  const h = 220;
  const pad = 30;
  const max = Math.max(...s.series, 1);
  const n = s.series.length;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const gridLines = [0.25, 0.5, 0.75, 1]
    .map((f) => {
      const y = h - pad - innerH * f;
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="currentColor" stroke-opacity="0.08"/>`;
    })
    .join("");

  const labels = s.labels
    .map((l, i) => {
      const x = pad + (innerW / Math.max(n - 1, 1)) * i;
      return `<text x="${x}" y="${h - 8}" font-size="10" fill="currentColor" fill-opacity="0.5" text-anchor="middle">${esc(l)}</text>`;
    })
    .join("");

  if (s.kind === "bar") {
    const bw = (innerW / n) * 0.55;
    const bars = s.series
      .map((v, i) => {
        const bh = (v / max) * innerH;
        const x = pad + (innerW / n) * i + (innerW / n - bw) / 2;
        return `<rect x="${x}" y="${h - pad - bh}" width="${bw}" height="${bh}" rx="5" fill="${accent}" fill-opacity="0.85"/>`;
      })
      .join("");
    const barLabels = s.labels
      .map((l, i) => {
        const x = pad + (innerW / n) * i + innerW / n / 2;
        return `<text x="${x}" y="${h - 8}" font-size="10" fill="currentColor" fill-opacity="0.5" text-anchor="middle">${esc(l)}</text>`;
      })
      .join("");
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${gridLines}${bars}${barLabels}</svg>`;
  }

  const points = s.series.map((v, i) => {
    const x = pad + (innerW / Math.max(n - 1, 1)) * i;
    const y = h - pad - (v / max) * innerH;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    s.kind === "area"
      ? `<path d="${path} L${points[points.length - 1][0]},${h - pad} L${pad},${h - pad} Z" fill="${accent}" fill-opacity="0.14"/>`
      : "";
  const dots = points
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${accent}"/>`)
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${gridLines}${area}<path d="${path}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}

function renderSection(s: Section, bp: Blueprint, idx: number): string {
  const accent = bp.theme.accent;
  switch (s.type) {
    case "hero":
      return `<div class="hero">
        <h2>${esc(s.headline)}</h2>
        <p>${esc(s.sub)}</p>
        <div class="btns">
          <button class="btn btn-primary" data-toast="Let's go! (demo)">${esc(s.cta)}</button>
          ${s.secondaryCta ? `<button class="btn btn-ghost" data-toast="Demo coming soon">${esc(s.secondaryCta)}</button>` : ""}
        </div>
      </div>`;

    case "stats":
      return `<div class="stats">${s.items
        .map(
          (it) => `<div class="card stat">
            <div class="label">${esc(it.label)}</div>
            <div class="value">${esc(it.value)}</div>
            ${it.delta ? `<div class="delta${it.delta.startsWith("-") ? " neg" : ""}">${esc(it.delta)} vs last period</div>` : ""}
          </div>`
        )
        .join("")}</div>`;

    case "chart":
      return `<div class="card chart-wrap"><h3>${esc(s.title)}</h3>${renderChartSvg(s, accent)}</div>`;

    case "table":
      return `<div class="card"><h3>${esc(s.title)}</h3><div style="overflow-x:auto"><table>
        <thead><tr>${s.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${s.rows
          .map(
            (r) =>
              `<tr>${r
                .map((cell, ci) =>
                  ci === r.length - 1 ? `<td><span class="pill">${esc(cell)}</span></td>` : `<td>${esc(cell)}</td>`
                )
                .join("")}</tr>`
          )
          .join("")}</tbody>
      </table></div></div>`;

    case "cards":
      return `${s.title ? `<h2 class="section-title">${esc(s.title)}</h2>` : ""}<div class="cards-grid">${s.items
        .map(
          (it) => `<div class="card">
            <div class="feature-icon">${icon(ICONS[it.icon] ? it.icon : "zap", 18)}</div>
            <h4>${esc(it.title)}</h4><p>${esc(it.desc)}</p>
          </div>`
        )
        .join("")}</div>`;

    case "pricing":
      return `<h2 class="section-title">${esc(s.title)}</h2><div class="pricing">${s.tiers
        .map(
          (t) => `<div class="card tier${t.highlight ? " hl" : ""}">
            ${t.highlight ? `<div class="badge">POPULAR</div>` : ""}
            <h4 style="font-weight:650">${esc(t.name)}</h4>
            <div class="price">${esc(t.price)}</div>
            <div class="period">${esc(t.period)}</div>
            <ul>${t.features.map((f) => `<li>${icon("check", 14)}${esc(f)}</li>`).join("")}</ul>
            <button class="btn ${t.highlight ? "btn-primary" : "btn-ghost"}" style="width:100%;justify-content:center" data-toast="Checkout coming soon">Choose ${esc(t.name)}</button>
          </div>`
        )
        .join("")}</div>`;

    case "form":
      return `<div class="card"><h3>${esc(s.title)}</h3>
        ${s.sub ? `<p class="form-sub">${esc(s.sub)}</p>` : ""}
        <form class="form-grid" data-form>
          ${s.fields
            .map(
              (f) => `<div><label>${esc(f.label)}</label><input type="${esc(f.inputType)}" placeholder="${esc(f.placeholder || "")}"/></div>`
            )
            .join("")}
          <button type="submit" class="btn btn-primary" style="align-self:flex-start">${esc(s.submitLabel)}</button>
        </form></div>`;

    case "todo":
      return `<div class="card"><h3>${esc(s.title)}</h3>
        <div class="todo-list" id="todo-${idx}">
          ${s.items
            .map(
              (it) => `<div class="todo-item${it.done ? " done" : ""}" data-todo>
                <div class="todo-check">${icon("check", 12)}</div><span>${esc(it.text)}</span>
              </div>`
            )
            .join("")}
        </div>
        <form class="todo-add" data-todo-add="todo-${idx}">
          <input placeholder="Add a task and press Enter…"/>
          <button type="submit" class="btn btn-primary">Add</button>
        </form></div>`;

    case "booking":
      return `<div class="card"><h3>${esc(s.title)}</h3>
        <div class="days" data-days>${s.days
          .map((d, i) => `<button class="day${i === 0 ? " active" : ""}">${esc(d)}</button>`)
          .join("")}</div>
        <div class="slots" data-slots>${s.slots
          .map((sl) => `<button class="slot">${esc(sl)}</button>`)
          .join("")}</div>
        <div class="booking-confirm" data-confirm>${icon("check", 16)}<span></span></div>
      </div>`;

    case "testimonials":
      return `<h2 class="section-title">${esc(s.title)}</h2><div class="testimonials">${s.items
        .map(
          (t) => `<div class="card"><p>&ldquo;${esc(t.quote)}&rdquo;</p>
            <div class="t-author">${esc(t.author)}</div><div class="t-role">${esc(t.role)}</div></div>`
        )
        .join("")}</div>`;

    case "cta":
      return `<div class="cta-banner">
        <h2>${esc(s.headline)}</h2><p>${esc(s.sub)}</p>
        <button class="btn btn-primary" data-toast="Welcome aboard! (demo)">${esc(s.cta)}</button>
      </div>`;

    case "login":
      return `<div class="card login-card">
        <div class="feature-icon" style="margin:0 auto 12px">${icon("lock", 18)}</div>
        <h3 style="margin-bottom:0">${esc(s.title)}</h3>
        <p class="login-sub">${esc(s.sub)}</p>
        <form class="form-grid" data-form>
          <div><label>Email</label><input type="email" placeholder="you@example.com"/></div>
          <div><label>Password</label><input type="password" placeholder="••••••••"/></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Sign in</button>
        </form>
        <p class="login-sub" style="margin-top:14px">No account? <a href="#" style="color:var(--accent);font-weight:600">Sign up</a></p>
      </div>`;

    case "custom":
      return `<div class="card">${s.title ? `<h3>${esc(s.title)}</h3>` : ""}
        <iframe sandbox="allow-scripts" srcdoc="${esc(s.html)}" style="width:100%;height:${Math.max(200, Math.min(s.height ?? 560, 1200))}px;border:0;border-radius:8px;background:#fff;display:block"></iframe>
      </div>`;

    case "activity":
      return `<div class="card"><h3>${esc(s.title)}</h3><div class="feed">${s.items
        .map(
          (it) => `<div class="feed-item"><div class="feed-dot"></div><span>${esc(it.text)}</span><span class="feed-time">${esc(it.time)}</span></div>`
        )
        .join("")}</div></div>`;
  }
}

function renderPage(p: Page, bp: Blueprint, active: boolean): string {
  return `<div class="page${active ? " active" : ""}" data-page="${esc(p.id)}">
    <div class="section-gap">${p.sections.map((s, i) => renderSection(s, bp, i)).join("\n")}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Shell layouts
// ---------------------------------------------------------------------------

function appShell(bp: Blueprint): string {
  const initials = bp.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<div class="shell">
    <div class="scrim" data-scrim></div>
    <aside class="sidebar" data-sidebar>
      <div class="brand"><div class="brand-dot">${esc(initials[0] || "A")}</div>${esc(bp.name)}</div>
      ${bp.pages
        .map(
          (p, i) =>
            `<button class="nav-item${i === 0 ? " active" : ""}" data-nav="${esc(p.id)}">${icon(p.icon)}${esc(p.name)}</button>`
        )
        .join("")}
      <div style="flex:1"></div>
      ${bp.features.auth ? `<button class="nav-item" data-nav-login>${icon("lock")}Sign in</button>` : ""}
      <div style="padding:10px;font-size:.72rem;color:var(--muted)">Built with ForgeAI</div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="hamburger" data-hamburger>${icon("list", 16)}</button>
          <h1 data-page-title>${esc(bp.pages[0]?.name || bp.name)}</h1>
        </div>
        <div class="avatar">${esc(initials)}</div>
      </header>
      <main class="content">
        ${bp.pages.map((p, i) => renderPage(p, bp, i === 0)).join("\n")}
        ${bp.features.auth ? renderLoginPage(bp) : ""}
      </main>
    </div>
  </div>`;
}

function renderLoginPage(bp: Blueprint): string {
  return `<div class="page" data-page="__login">
    <div class="section-gap">${renderSection(
      { type: "login", title: `Sign in to ${bp.name}`, sub: "Welcome back. Enter your details to continue." },
      bp,
      999
    )}</div>
  </div>`;
}

function landingShell(bp: Blueprint): string {
  const home = bp.pages[0];
  const extraPages = bp.pages.slice(1);
  return `<nav class="topnav">
    <div class="brand" style="padding:0"><div class="brand-dot">${esc(bp.name[0] || "A")}</div>${esc(bp.name)}</div>
    <div class="links">
      ${["Product", "Features", "Pricing", "Docs"].map((l) => `<a href="#" data-toast="Demo link">${l}</a>`).join("")}
      ${extraPages.map((p) => `<a href="#" data-nav-link="${esc(p.id)}">${esc(p.name)}</a>`).join("")}
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      ${bp.features.auth ? `<button class="btn btn-ghost" style="padding:8px 16px" data-nav-link="__login">Sign in</button>` : ""}
      <button class="btn btn-primary" style="padding:8px 16px" data-toast="Sign up flow (demo)">Get started</button>
    </div>
  </nav>
  <main class="landing-main">
    ${home ? renderPage(home, bp, true) : ""}
    ${extraPages.map((p) => renderPage(p, bp, false)).join("\n")}
    ${bp.features.auth ? renderLoginPage(bp) : ""}
  </main>
  <footer class="footer">© 2026 ${esc(bp.name)} — ${esc(bp.tagline)}. Built with ForgeAI.</footer>`;
}

// ---------------------------------------------------------------------------
// JS runtime for the preview
// ---------------------------------------------------------------------------

const RUNTIME_JS = `
(function(){
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.from((c||document).querySelectorAll(s))}

  var toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);
  var toastTimer;
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
  }

  // page navigation (app shell sidebar)
  function activate(id){
    $$('.page').forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-page')===id); });
    $$('[data-nav]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-nav')===id); });
    var active = $('[data-nav="'+id+'"]');
    var title = $('[data-page-title]');
    if(title && active) title.textContent = active.textContent.trim();
    var sb = $('[data-sidebar]'); if(sb) sb.classList.remove('open');
    var sc = $('[data-scrim]'); if(sc) sc.classList.remove('show');
  }
  $$('[data-nav]').forEach(function(b){ b.addEventListener('click', function(){ activate(b.getAttribute('data-nav')); }); });
  $$('[data-nav-login]').forEach(function(b){ b.addEventListener('click', function(){
    $$('.page').forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-page')==='__login'); });
    var title = $('[data-page-title]'); if(title) title.textContent='Sign in';
  }); });
  // landing nav links scroll/show
  $$('[data-nav-link]').forEach(function(a){ a.addEventListener('click', function(e){
    e.preventDefault();
    var id = a.getAttribute('data-nav-link');
    $$('.page').forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-page')===id); });
    window.scrollTo({top:0, behavior:'smooth'});
  }); });

  // hamburger
  var hb = $('[data-hamburger]');
  if(hb) hb.addEventListener('click', function(){
    $('[data-sidebar]').classList.toggle('open');
    $('[data-scrim]').classList.toggle('show');
  });
  var scrim = $('[data-scrim]');
  if(scrim) scrim.addEventListener('click', function(){
    $('[data-sidebar]').classList.remove('open');
    scrim.classList.remove('show');
  });

  // toasts
  $$('[data-toast]').forEach(function(b){ b.addEventListener('click', function(){ showToast(b.getAttribute('data-toast')); }); });

  // forms
  $$('[data-form]').forEach(function(f){ f.addEventListener('submit', function(e){
    e.preventDefault(); showToast('Saved! (demo)');
  }); });

  // todos
  document.addEventListener('click', function(e){
    var item = e.target.closest('[data-todo]');
    if(item){ item.classList.toggle('done'); }
  });
  $$('[data-todo-add]').forEach(function(f){ f.addEventListener('submit', function(e){
    e.preventDefault();
    var input = f.querySelector('input');
    var text = (input.value||'').trim();
    if(!text) return;
    var list = document.getElementById(f.getAttribute('data-todo-add'));
    var div = document.createElement('div');
    div.className = 'todo-item';
    div.setAttribute('data-todo','');
    div.innerHTML = '<div class="todo-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><span></span>';
    div.querySelector('span').textContent = text;
    list.appendChild(div);
    input.value='';
    showToast('Task added');
  }); });

  // booking
  $$('[data-days] .day').forEach(function(d){ d.addEventListener('click', function(){
    $$('[data-days] .day').forEach(function(x){ x.classList.remove('active'); });
    d.classList.add('active');
    updateConfirm();
  }); });
  $$('[data-slots] .slot').forEach(function(s){ s.addEventListener('click', function(){
    $$('[data-slots] .slot').forEach(function(x){ x.classList.remove('active'); });
    s.classList.add('active');
    updateConfirm();
  }); });
  function updateConfirm(){
    var day = $('[data-days] .day.active');
    var slot = $('[data-slots] .slot.active');
    var c = $('[data-confirm]');
    if(c && day && slot){
      c.classList.add('show');
      c.querySelector('span').textContent = 'Booked: ' + day.textContent + ' at ' + slot.textContent + ' — confirmation sent!';
    }
  }
})();
`;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function renderPreviewHtml(bp: Blueprint): string {
  const body = bp.appType === "landing-page" ? landingShell(bp) : appShell(bp);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(bp.name)}</title>
<style>${buildCss(bp)}</style>
</head>
<body>
${body}
<script>${RUNTIME_JS}</script>
</body>
</html>`;
}

export function emptyPreviewHtml(): string {
  return `<!DOCTYPE html><html><head><style>
  body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0b0c10;color:#9aa1ad;font-family:-apple-system,'Segoe UI',sans-serif}
  </style></head><body><div>Nothing to preview yet</div></body></html>`;
}
