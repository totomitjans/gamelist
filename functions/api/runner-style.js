import { FONT_OPTIONS, resolveSiteTheme } from "../../theme-system.js";

export async function runnerThemeSettings(env) {
  if (!env?.GAMELIST) return {};
  const data = await env.GAMELIST.get("gamelist-data", "json").catch(() => null);
  return data?.settings && typeof data.settings === "object" ? data.settings : {};
}

export function runnerStyle({ maxWidth = "980px", settings = {}, page = "gamelist" } = {}) {
  const theme = resolveSiteTheme(settings, page);
  const titleFont = runnerFontFamily(theme.accentFont);
  const defaultBackdrop = theme.mode === "light" ? "/assets/backdrop_light.png" : "/assets/backdrop.png";
  const customBackdrop = theme.backgroundImage || defaultBackdrop;
  const titleColor = theme.gradient ? "transparent" : "var(--accent)";
  const titleBackground = theme.gradient ? `background:linear-gradient(135deg,var(--title-gradient-start),var(--title-gradient-end));-webkit-background-clip:text;background-clip:text;` : "";
  const titleTransform = theme.uppercaseTitles ? "uppercase" : "none";
  return `<style>
    @font-face{font-family:"Cascadia Code";src:url("/assets/fonts/CascadiaCode.woff2") format("woff2");font-weight:200 700;font-style:normal;font-display:swap}
    @font-face{font-family:"Antique Olive Nord";src:url("/assets/fonts/AntiqueOliveNord.woff2") format("woff2");font-weight:800 950;font-style:normal;font-display:swap}
    :root{--bg:${theme.mode === "light" ? "#f3f4f8" : "#161619"};--panel:rgba(20,22,28,.58);--panel-strong:rgba(28,31,40,.82);--line:${theme.mode === "light" ? "rgba(31,42,61,.32)" : "rgba(255,255,255,.13)"};--text:${theme.mode === "light" ? "#142033" : "#f6f7fb"};--muted:${theme.mode === "light" ? "rgba(34,47,68,.68)" : "#a6adbd"};--dim:${theme.mode === "light" ? "rgba(38,52,74,.62)" : "#6f7789"};--accent:${cssValue(theme.mainColor)};--accent-1:${cssValue(theme.accentColor)};--accent-2:${cssValue(theme.accentColor)};--accent-3:${cssValue(theme.accent3)};--extra-color:${cssValue(theme.extraColor)};--title-gradient-start:${cssValue(theme.gradient ? theme.gradientColor : theme.mainColor)};--title-gradient-end:${cssValue(theme.mainColor)};--glow-primary:${theme.disableGlow ? "transparent" : colorMix(themeColorBySource(theme, theme.glowPrimary), .22)};--glow-secondary:${theme.disableGlow ? "transparent" : colorMix(themeColorBySource(theme, theme.glowSecondary), .14)};--shadow:0 24px 80px rgba(0,0,0,.48);--custom-backdrop-image:url("${cssUrl(customBackdrop)}")}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;padding:26px clamp(16px,4vw,46px);color:var(--text);background:var(--bg);font:14px/1.45 "Cascadia Code",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overscroll-behavior-y:none}
    body::before{content:"";position:fixed;inset:-26px;z-index:-2;background:radial-gradient(circle at 78% 9%,var(--glow-primary),transparent 30%),radial-gradient(circle at 11% 84%,var(--glow-secondary),transparent 34%),linear-gradient(120deg,rgba(255,255,255,.04),transparent 38%),var(--custom-backdrop-image) top left/cover repeat,#161619;filter:saturate(1.1);transform:scale(1.02)}
    body::after{content:"";position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.22),rgba(0,0,0,.46));pointer-events:none}
    main{max-width:${maxWidth};margin:auto;display:grid;gap:16px}
    h1{margin:0;color:${titleColor};${titleBackground}font-family:${titleFont};font-size:clamp(44px,8vw,86px);font-weight:950;line-height:.88;letter-spacing:0;text-transform:${titleTransform};text-shadow:0 16px 46px color-mix(in srgb,var(--accent) 22%,rgba(0,0,0,.62))}
    h2{margin:0 0 10px;color:var(--text);font-size:15px;font-weight:850}
    p{margin:0;color:var(--muted);max-width:78ch}
    .row,.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
    label{color:var(--dim);font-size:11px;font-weight:760;text-transform:uppercase}
    .row>label,.control{display:grid;gap:6px;max-width:190px}
    label:has(input[type="checkbox"]){display:inline-flex;align-items:center;gap:8px;min-height:42px;max-width:none;padding:0 12px;color:var(--text);background:#1e2530;border:1px solid #3d4655;border-radius:7px;text-transform:none}
    input:not([type="checkbox"]),select{height:42px;min-height:42px;min-width:0;padding:0 34px 0 11px;color:#f6f7fb;font:inherit;font-size:14px;line-height:42px;background:#1e2530;border:1px solid #3d4655;border-radius:7px;box-shadow:none}
    select{appearance:none;background:#1e2530 url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.5 5.25 7 8.75l3.5-3.5' fill='none' stroke='%23f6f7fb' stroke-opacity='.78' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") right 15px center/14px 14px no-repeat}
    input[type="number"]{width:82px;padding-right:11px}
    input[type="checkbox"]{appearance:none;display:inline-grid;place-items:center;width:18px;height:18px;margin:0;border:1px solid #3d4655;border-radius:5px;background:#1e2530}
    input[type="checkbox"]:checked{border-color:color-mix(in srgb,var(--accent) 72%,transparent);background:center/15px 15px no-repeat url("data:image/svg+xml,%3Csvg width='15' height='15' viewBox='0 0 15 15' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.4 7.6 6.3 10.5 11.8 4.8' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"),var(--accent)}
    button,a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:8px 12px;color:#f6f7fb;font:inherit;font-weight:800;text-decoration:none;background:#1e2530;border:1px solid #3d4655;border-radius:7px;cursor:pointer}
    button.primary{color:#fff;background:var(--accent);border-color:transparent;text-shadow:0 1px 8px rgba(0,0,0,.32);box-shadow:0 3px 24px color-mix(in srgb,var(--accent) 26%,transparent)}
    button:hover,a:hover,input:not([type="checkbox"]):hover,select:hover,label:has(input[type="checkbox"]):hover{border-color:#526075;box-shadow:none}
    button.primary:hover{border-color:color-mix(in srgb,var(--accent) 68%,#fff);background:color-mix(in srgb,var(--accent) 88%,#fff)}
    button:disabled{opacity:.55;cursor:wait}
    .bar{height:10px;background:rgba(255,255,255,.1);border:1px solid var(--line);border-radius:999px;overflow:hidden}.bar span{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent-1));box-shadow:0 0 22px color-mix(in srgb,var(--accent) 45%,transparent)}
    pre,section{min-width:0;color:var(--text);background:rgba(20,22,28,.72);border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow)}
    pre{white-space:pre-wrap;padding:14px;min-height:260px;max-height:58vh;overflow:auto}
    section{padding:14px}
    .lists{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    ol{margin:0;padding-left:22px;display:grid;gap:6px}
    li{word-break:break-word}small{color:var(--muted)}
    @media (max-width:760px){body{padding:18px 14px}.lists{grid-template-columns:1fr}h1{font-size:clamp(38px,14vw,58px)}}
  </style>`;
}

function runnerFontFamily(value) {
  const font = FONT_OPTIONS.find((item) => item.value === value);
  if (!font || !font.value) return "\"Cascadia Code\", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  return `"${font.family}", "Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
}

function themeColorBySource(theme, source) {
  if (source === "accent") return theme.accentColor;
  if (source === "gradient") return theme.gradientColor;
  if (source === "extra") return theme.extraColor;
  return theme.mainColor;
}

function colorMix(hex, alpha) {
  const color = String(hex || "#ffffff").match(/^#[0-9a-fA-F]{6}$/) ? hex : "#ffffff";
  const int = Number.parseInt(color.slice(1), 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function cssValue(value) {
  return String(value || "").replace(/[;"'{}]/g, "");
}

function cssUrl(value) {
  return String(value || "").replace(/["\\\n\r]/g, "");
}
