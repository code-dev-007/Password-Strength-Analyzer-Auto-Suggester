"use strict";

/* ═══════════════════════════════════════════════════════════════
   dashboard.js — PassShield Dashboard
   Features:
   - Password Trend Graph (Canvas line chart)
   - Download Report (HTML → printable PDF)
   - Security Radar Chart (bonus visual)
   - All existing dashboard features
═══════════════════════════════════════════════════════════════ */

const HISTORY_KEY = "passguard-history";
const STATS_KEY   = "passguard-stats";
const GEN_KEY     = "passguard-generated";

/* ─── THEME ─── */
const themeToggle = document.getElementById("themeToggle");
const themeLabel  = document.getElementById("themeLabel");

function applyTheme(isDark) {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
  localStorage.setItem("passguard-theme", isDark ? "dark" : "light");
  // Re-render charts on theme change
  const history = getHistory();
  const stats   = getStats();
  renderTrendGraph(history);
  renderRadarChart(stats);
}
function loadTheme() {
  const saved  = localStorage.getItem("passguard-theme");
  const isDark = saved ? saved === "dark" : true;
  themeToggle.checked = isDark;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
}
themeToggle.addEventListener("change", () => applyTheme(themeToggle.checked));

/* ─── DATA HELPERS ─── */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function getStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || defaultStats(); } catch { return defaultStats(); }
}
function defaultStats() {
  return { total: 0, sumScore: 0, best: 0, weakCount: 0, fairCount: 0, strongCount: 0, vstrongCount: 0 };
}

/* ─── STAT CARDS ─── */
function renderStats(stats) {
  document.getElementById("statTotal").textContent     = stats.total;
  document.getElementById("statGenerated").textContent = localStorage.getItem(GEN_KEY) || "0";
  document.getElementById("statBest").textContent      = stats.total ? stats.best + " / 100" : "—";
  const avg = stats.total ? Math.round(stats.sumScore / stats.total) : null;
  document.getElementById("statAvg").textContent = avg !== null ? avg + " / 100" : "—";
}

/* ─── DISTRIBUTION CHART ─── */
function renderDistribution(stats) {
  const counts = [stats.weakCount, stats.fairCount, stats.strongCount, stats.vstrongCount];
  const max    = Math.max(...counts, 1);
  const ids    = ["distWeak", "distFair", "distStrong", "distVstrong"];
  const cntIds = ["distWeakCount", "distFairCount", "distStrongCount", "distVstrongCount"];
  ids.forEach((id, i) => {
    const bar = document.getElementById(id);
    const cnt = document.getElementById(cntIds[i]);
    const pct = ((counts[i] / max) * 100).toFixed(1);
    requestAnimationFrame(() => {
      setTimeout(() => { bar.style.height = pct + "%"; }, 100);
    });
    cnt.textContent = counts[i];
  });
}

/* ─── SECURITY GAUGE ─── */
function renderGauge(stats) {
  const scoreEl   = document.getElementById("gaugeScore");
  const descEl    = document.getElementById("gaugeDesc");
  const gaugeWrap = document.querySelector(".security-gauge");
  if (!stats.total) return;
  const avg = Math.round(stats.sumScore / stats.total);
  scoreEl.textContent = avg;
  if (avg >= 76) {
    gaugeWrap.classList.add("good");
    descEl.textContent = "Excellent! Most of your passwords are strong.";
  } else if (avg >= 51) {
    gaugeWrap.classList.add("ok");
    descEl.textContent = "Decent security. Consider adding more symbols and length.";
  } else {
    gaugeWrap.classList.add("bad");
    descEl.textContent = "Your passwords need improvement. Use the Analyzer to strengthen them.";
  }
}

/* ─── HISTORY LIST ─── */
function renderHistory(history) {
  const container = document.getElementById("historyList");
  if (!history.length) return;
  container.innerHTML = "";
  history.forEach((entry, idx) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.style.animationDelay = (idx * 0.05) + "s";
    item.innerHTML = `
      <span class="history-masked">${escapeHtml(entry.masked)}</span>
      <span class="history-score ${entry.cls}">${entry.score}/100</span>
      <span class="history-time">${entry.time || ""}</span>
    `;
    container.appendChild(item);
  });
}

/* ─── CLEAR HISTORY ─── */
document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  if (!confirm("Clear all history and stats?")) return;
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(STATS_KEY);
  localStorage.removeItem(GEN_KEY);
  window.location.reload();
});

/* ─── SESSION TIMER ─── */
let sessionSeconds = 0;
const clockEl = document.getElementById("sessionClock");
setInterval(() => {
  sessionSeconds++;
  const m = String(Math.floor(sessionSeconds / 60)).padStart(2, "0");
  const s = String(sessionSeconds % 60).padStart(2, "0");
  clockEl.textContent = `Session: ${m}:${s}`;
}, 1000);

/* ═══════════════════════════════════════════════════════════════
   NEW FEATURE 1 — PASSWORD TREND GRAPH (Canvas Line Chart)
═══════════════════════════════════════════════════════════════ */
function renderTrendGraph(history) {
  const canvas = document.getElementById("trendCanvas");
  if (!canvas) return;
  const ctx  = canvas.getContext("2d");
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  // Colors
  const bg        = isDark ? "#0f1628" : "#ffffff";
  const gridColor = isDark ? "#1e3a5f" : "#c8d5f0";
  const textColor = isDark ? "#7a9fc0" : "#4a6080";
  const accentColor = isDark ? "#00d4ff" : "#0077ff";
  const dotFill   = isDark ? "#0a0e1a" : "#f0f4ff";

  // HiDPI
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = canvas.offsetHeight;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = { top: 20, right: 24, bottom: 40, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // No data state
  if (!history.length) {
    ctx.fillStyle = textColor;
    ctx.font = "13px 'Share Tech Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("— No data yet. Analyze passwords to see the trend —", W / 2, H / 2);
    return;
  }

  const scores = history.map(h => h.score);
  const last30 = scores.slice(-30);
  const N      = last30.length;

  // Draw grid lines + Y labels
  ctx.strokeStyle = gridColor;
  ctx.lineWidth   = 0.5;
  ctx.setLineDash([4, 4]);
  [0, 25, 50, 75, 100].forEach(val => {
    const y = PAD.top + chartH - (val / 100) * chartH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle   = textColor;
    ctx.font        = "10px 'Share Tech Mono', monospace";
    ctx.textAlign   = "right";
    ctx.fillText(val, PAD.left - 8, y + 3);
  });
  ctx.setLineDash([]);

  // X axis
  ctx.beginPath();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth   = 1;
  ctx.moveTo(PAD.left, PAD.top + chartH);
  ctx.lineTo(PAD.left + chartW, PAD.top + chartH);
  ctx.stroke();

  // X labels (every ~5 points)
  ctx.fillStyle = textColor;
  ctx.font      = "9px 'Share Tech Mono', monospace";
  ctx.textAlign = "center";
  last30.forEach((_, i) => {
    if (i % Math.ceil(N / 6) === 0 || i === N - 1) {
      const x = PAD.left + (i / Math.max(N - 1, 1)) * chartW;
      ctx.fillText(`#${scores.length - N + i + 1}`, x, PAD.top + chartH + 16);
    }
  });

  // Gradient fill under line
  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
  grad.addColorStop(0,   isDark ? "rgba(0,212,255,0.25)" : "rgba(0,119,255,0.18)");
  grad.addColorStop(0.6, isDark ? "rgba(0,212,255,0.06)" : "rgba(0,119,255,0.04)");
  grad.addColorStop(1,   "rgba(0,0,0,0)");

  ctx.beginPath();
  last30.forEach((score, i) => {
    const x = PAD.left + (i / Math.max(N - 1, 1)) * chartW;
    const y = PAD.top  + chartH - (score / 100) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.lineTo(PAD.left + chartW, PAD.top + chartH);
  ctx.lineTo(PAD.left, PAD.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = "round";
  ctx.lineCap     = "round";
  last30.forEach((score, i) => {
    const x = PAD.left + (i / Math.max(N - 1, 1)) * chartW;
    const y = PAD.top  + chartH - (score / 100) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots + color coding
  last30.forEach((score, i) => {
    const x   = PAD.left + (i / Math.max(N - 1, 1)) * chartW;
    const y   = PAD.top  + chartH - (score / 100) * chartH;
    const col = score >= 76 ? (isDark ? "#00ff9d" : "#00a86b")
              : score >= 51 ? (isDark ? "#ffd700" : "#cc9900")
              : score >= 26 ? (isDark ? "#ff8c00" : "#e06600")
              :               (isDark ? "#ff3366" : "#cc0044");
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle   = dotFill;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2;
    ctx.stroke();
  });

  // Moving average line
  if (N >= 3) {
    ctx.beginPath();
    ctx.strokeStyle = isDark ? "rgba(255,215,0,0.5)" : "rgba(204,153,0,0.5)";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6, 3]);
    last30.forEach((_, i) => {
      if (i < 2) return;
      const avg3 = (last30[i] + last30[i - 1] + last30[i - 2]) / 3;
      const x = PAD.left + (i / Math.max(N - 1, 1)) * chartW;
      const y = PAD.top  + chartH - (avg3 / 100) * chartH;
      if (i === 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Legend
  const legendY = H - 6;
  ctx.font      = "9px 'Share Tech Mono', monospace";
  ctx.textAlign = "left";
  [[accentColor, "Score"], [isDark ? "rgba(255,215,0,0.8)" : "rgba(204,153,0,0.8)", "3-pt Avg"]].forEach(([col, label], i) => {
    const lx = PAD.left + i * 100;
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2;
    if (i === 1) ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(lx, legendY);
    ctx.lineTo(lx + 22, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = textColor;
    ctx.fillText(label, lx + 28, legendY + 3);
  });
}

/* ═══════════════════════════════════════════════════════════════
   NEW FEATURE 2 — SECURITY RADAR CHART (Canvas)
═══════════════════════════════════════════════════════════════ */
function renderRadarChart(stats) {
  const canvas = document.getElementById("radarCanvas");
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  const dpr = window.devicePixelRatio || 1;
  const S   = canvas.offsetWidth;
  canvas.width  = S * dpr;
  canvas.height = S * dpr;
  ctx.scale(dpr, dpr);

  // Smaller polygon radius so labels have room to breathe
  const cx = S / 2, cy = S / 2, R = S * 0.28;

  ctx.clearRect(0, 0, S, S);

  const gridColor  = isDark ? "#1e3a5f" : "#c8d5f0";
  const textColor  = isDark ? "#c0e0ff" : "#0d1b3e";  // brighter for visibility
  const accentFill = isDark ? "rgba(0,212,255,0.18)" : "rgba(0,119,255,0.14)";
  const accentLine = isDark ? "#00d4ff" : "#0077ff";

  // Derive radar values from stats (0–1)
  const total = stats.total || 1;
  const avg   = stats.total ? stats.sumScore / stats.total : 0;
  const axes  = [
    { label: "Avg Score",  val: avg / 100 },
    { label: "V.Strong %", val: stats.vstrongCount / total },
    { label: "Strong %",   val: (stats.strongCount + stats.vstrongCount) / total },
    { label: "Best",       val: (stats.best || 0) / 100 },
    { label: "Diversity",  val: Math.min((stats.total > 0 ? (stats.fairCount + stats.strongCount + stats.vstrongCount) / total : 0), 1) },
    { label: "Volume",     val: Math.min(stats.total / 20, 1) }
  ];
  const N = axes.length;

  function angleOf(i) { return (Math.PI * 2 * i / N) - Math.PI / 2; }
  function polarPt(r, i) {
    return { x: cx + r * Math.cos(angleOf(i)), y: cy + r * Math.sin(angleOf(i)) };
  }

  // Grid circles
  [0.25, 0.5, 0.75, 1].forEach(frac => {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const p = polarPt(R * frac, i);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  });

  // Spokes
  for (let i = 0; i < N; i++) {
    const outer = polarPt(R, i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(outer.x, outer.y);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  axes.forEach((ax, i) => {
    const p = polarPt(R * ax.val, i);
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle   = accentFill;
  ctx.fill();
  ctx.strokeStyle = accentLine;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Data dots
  axes.forEach((ax, i) => {
    const p = polarPt(R * ax.val, i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle   = isDark ? "#0a0e1a" : "#f0f4ff";
    ctx.fill();
    ctx.strokeStyle = accentLine;
    ctx.lineWidth   = 2;
    ctx.stroke();
  });

  // Labels — fixed per-quadrant positions, guaranteed no clipping
  // 6 axes at 60° each starting from top (-90°):
  // i=0 top, i=1 top-right, i=2 bottom-right, i=3 bottom, i=4 bottom-left, i=5 top-left
  const M = 8; // margin from canvas edge
  const labelPositions = [
    { x: cx,      y: M,        align: "center", base: "top"    }, // 0 Avg Score  — top
    { x: S - M,   y: cy * 0.3, align: "right",  base: "middle" }, // 1 V.Strong % — top-right
    { x: S - M,   y: cy * 1.7, align: "right",  base: "middle" }, // 2 Strong %   — bottom-right
    { x: cx,      y: S - M,    align: "center",  base: "bottom" }, // 3 Best       — bottom
    { x: M,       y: cy * 1.7, align: "left",   base: "middle" }, // 4 Diversity  — bottom-left
    { x: M,       y: cy * 0.3, align: "left",   base: "middle" }, // 5 Volume     — top-left
  ];

  axes.forEach((ax, i) => {
    const pos = labelPositions[i];
    const label = ax.label;

    // Pill background
    ctx.font = `bold 11px 'Share Tech Mono', monospace`;
    const tw = ctx.measureText(label).width;
    const th = 11;
    const px = 7, py = 3;

    let bx;
    if (pos.align === "center") bx = pos.x - tw / 2 - px;
    else if (pos.align === "right") bx = pos.x - tw - px;
    else bx = pos.x - px;

    let by;
    if (pos.base === "top")    by = pos.y - py;
    else if (pos.base === "bottom") by = pos.y - th - py;
    else by = pos.y - th / 2 - py;

    const bw = tw + px * 2, bh = th + py * 2, rr = 4;
    ctx.fillStyle = isDark ? "rgba(5,10,22,0.85)" : "rgba(235,242,255,0.90)";
    ctx.beginPath();
    ctx.moveTo(bx + rr, by);
    ctx.lineTo(bx + bw - rr, by); ctx.arcTo(bx + bw, by, bx + bw, by + rr, rr);
    ctx.lineTo(bx + bw, by + bh - rr); ctx.arcTo(bx + bw, by + bh, bx + bw - rr, by + bh, rr);
    ctx.lineTo(bx + rr, by + bh); ctx.arcTo(bx, by + bh, bx, by + bh - rr, rr);
    ctx.lineTo(bx, by + rr); ctx.arcTo(bx, by, bx + rr, by, rr);
    ctx.closePath();
    ctx.fill();

    // Label text
    ctx.fillStyle = textColor;
    ctx.textAlign = pos.align;
    ctx.textBaseline = pos.base;
    ctx.fillText(label, pos.x, pos.y);

    // Percentage inside polygon near the data dot
    ctx.font = `bold 9px 'Share Tech Mono', monospace`;
    ctx.fillStyle = accentLine;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const vp = polarPt(R * ax.val * 0.65 + 2, i);
    if (ax.val > 0.12) ctx.fillText(Math.round(ax.val * 100) + "%", vp.x, vp.y);
  });

  // Center label
  ctx.font         = "bold 11px 'Orbitron', sans-serif";
  ctx.fillStyle    = isDark ? "#e0f0ff" : "#0d1b3e";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("RADAR", cx, cy);
}

/* ═══════════════════════════════════════════════════════════════
   NEW FEATURE 3 — DOWNLOAD REPORT
═══════════════════════════════════════════════════════════════ */
function downloadReport() {
  const history = getHistory();
  const stats   = getStats();
  const avg     = stats.total ? Math.round(stats.sumScore / stats.total) : 0;
  const now     = new Date().toLocaleString();
  const genCount = localStorage.getItem(GEN_KEY) || "0";

  const strengthLabel = avg >= 76 ? "VERY STRONG" : avg >= 51 ? "STRONG" : avg >= 26 ? "FAIR" : "WEAK";
  const strengthColor = avg >= 76 ? "#00c875" : avg >= 51 ? "#e6b800" : avg >= 26 ? "#e06600" : "#e0003a";

  const historyRows = history.slice(-20).map(h => `
    <tr>
      <td style="font-family:monospace;letter-spacing:2px;color:#555">${h.masked}</td>
      <td style="text-align:center;font-weight:bold;color:${
        h.cls === 'vstrong' ? '#00c875' : h.cls === 'strong' ? '#ccaa00' : h.cls === 'fair' ? '#e06600' : '#e0003a'
      }">${h.score}/100</td>
      <td style="text-align:center;color:#888;font-size:11px">${
        h.cls === 'vstrong' ? 'Very Strong' : h.cls === 'strong' ? 'Strong' : h.cls === 'fair' ? 'Fair' : 'Weak'
      }</td>
      <td style="text-align:center;color:#aaa;font-size:11px">${h.time || '—'}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>PassShield Security Report — ${now}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Share+Tech+Mono&family=Inter:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #111; padding: 40px; max-width: 860px; margin: 0 auto; }
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0070ff; padding-bottom: 20px; margin-bottom: 32px; }
  .logo { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 700; color: #0070ff; }
  .logo span { color: #111; }
  .report-meta { text-align: right; font-size: 11px; color: #777; font-family: 'Share Tech Mono', monospace; line-height: 1.7; }
  .section-title { font-family: 'Orbitron', sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #0070ff; margin-bottom: 14px; border-left: 3px solid #0070ff; padding-left: 10px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-box { border: 1px solid #dde4f5; border-radius: 8px; padding: 16px; text-align: center; background: #f8faff; }
  .stat-num { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 700; color: #0070ff; }
  .stat-lbl { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .score-banner { background: linear-gradient(135deg, #f8faff 0%, #eef3ff 100%); border: 1px solid #dde4f5; border-radius: 10px; padding: 24px 32px; margin-bottom: 32px; display: flex; align-items: center; gap: 28px; }
  .score-circle { width: 90px; height: 90px; border-radius: 50%; border: 4px solid ${strengthColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .score-big { font-family: 'Orbitron', sans-serif; font-size: 26px; font-weight: 700; color: ${strengthColor}; line-height: 1; }
  .score-sub { font-family: 'Share Tech Mono', monospace; font-size: 8px; color: #888; }
  .score-info h3 { font-family: 'Orbitron', sans-serif; font-size: 14px; color: ${strengthColor}; margin-bottom: 6px; }
  .score-info p { font-size: 12px; color: #555; line-height: 1.6; }
  .dist-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
  .dist-box { border-radius: 8px; padding: 14px; text-align: center; }
  .dist-box.weak    { background: #fff0f4; border: 1px solid #ffb3c6; }
  .dist-box.fair    { background: #fff8ed; border: 1px solid #ffc966; }
  .dist-box.strong  { background: #fffbea; border: 1px solid #ffe066; }
  .dist-box.vstrong { background: #edfff5; border: 1px solid #a0f0cc; }
  .dist-cnt { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 700; }
  .dist-box.weak    .dist-cnt { color: #e0003a; }
  .dist-box.fair    .dist-cnt { color: #e06600; }
  .dist-box.strong  .dist-cnt { color: #aa8800; }
  .dist-box.vstrong .dist-cnt { color: #00a86b; }
  .dist-lbl { font-family: 'Share Tech Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead tr { background: #f0f4ff; }
  thead td { font-family: 'Share Tech Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #0070ff; padding: 10px 12px; }
  tbody tr { border-bottom: 1px solid #eef2ff; }
  tbody tr:hover { background: #f8faff; }
  tbody td { padding: 9px 12px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; font-family: 'Share Tech Mono', monospace; }
  .no-data { text-align: center; padding: 30px; color: #aaa; font-family: 'Share Tech Mono', monospace; font-size: 12px; }
  @media print {
    body { padding: 20px; }
    .stat-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>
</head>
<body>

<div class="report-header">
  <div class="logo">Pass<span>Shield</span></div>
  <div class="report-meta">
    <div>Security Analysis Report</div>
    <div>Generated: ${now}</div>
    <div>MCA Project — Security &amp; Cryptography</div>
  </div>
</div>

<div class="section-title">Summary Statistics</div>
<div class="stat-grid">
  <div class="stat-box"><div class="stat-num">${stats.total}</div><div class="stat-lbl">Analyzed</div></div>
  <div class="stat-box"><div class="stat-num" style="color:${strengthColor}">${avg || "—"}</div><div class="stat-lbl">Avg Score</div></div>
  <div class="stat-box"><div class="stat-num">${stats.best || "—"}</div><div class="stat-lbl">Best Score</div></div>
  <div class="stat-box"><div class="stat-num">${genCount}</div><div class="stat-lbl">Generated</div></div>
</div>

<div class="section-title">Overall Security Rating</div>
<div class="score-banner">
  <div class="score-circle">
    <div class="score-big">${avg || "—"}</div>
    <div class="score-sub">/ 100</div>
  </div>
  <div class="score-info">
    <h3>${strengthLabel}</h3>
    <p>${
      avg >= 76 ? "Excellent security posture! The majority of your analyzed passwords are strong. Keep using diverse characters and avoid reusing passwords." :
      avg >= 51 ? "Good security foundation. Consider increasing password length and adding more special characters to push your scores higher." :
      avg >= 26 ? "Moderate security level. Several weak passwords detected. Use the PassShield generator to create stronger alternatives." :
      "Security posture needs immediate attention. Most passwords are weak. Use the auto-generator and update your accounts."
    }</p>
  </div>
</div>

<div class="section-title">Strength Distribution</div>
<div class="dist-row">
  <div class="dist-box weak"><div class="dist-cnt">${stats.weakCount}</div><div class="dist-lbl">Weak (0–25)</div></div>
  <div class="dist-box fair"><div class="dist-cnt">${stats.fairCount}</div><div class="dist-lbl">Fair (26–50)</div></div>
  <div class="dist-box strong"><div class="dist-cnt">${stats.strongCount}</div><div class="dist-lbl">Strong (51–75)</div></div>
  <div class="dist-box vstrong"><div class="dist-cnt">${stats.vstrongCount}</div><div class="dist-lbl">Very Strong (76+)</div></div>
</div>

<div class="section-title">Analysis History (Last 20)</div>
${history.length ? `
<table>
  <thead><tr>
    <td>Masked Password</td>
    <td style="text-align:center">Score</td>
    <td style="text-align:center">Level</td>
    <td style="text-align:center">Time</td>
  </tr></thead>
  <tbody>${historyRows}</tbody>
</table>` : `<div class="no-data">No passwords analyzed yet.</div>`}

<div class="footer">
  <span>PassShield v1.0 — MCA Project 2026</span>
  <span>Algorithms: Shannon Entropy · Brute-Force Model · Fisher-Yates · SHA-256</span>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `PassShield_Report_${new Date().toISOString().slice(0,10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Flash button
  const btn = document.getElementById("downloadReportBtn");
  if (btn) {
    btn.textContent = "✓ Downloaded!";
    btn.classList.add("downloaded");
    setTimeout(() => {
      btn.textContent = "⬇ Download Report";
      btn.classList.remove("downloaded");
    }, 2500);
  }
}

/* ─── UTILITY ─── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ═══ INIT ═══ */
function init() {
  loadTheme();
  const history = getHistory();
  const stats   = getStats();

  renderStats(stats);
  renderDistribution(stats);
  renderGauge(stats);
  renderHistory(history);
  renderTrendGraph(history);
  renderRadarChart(stats);

  // Download button
  const dlBtn = document.getElementById("downloadReportBtn");
  if (dlBtn) dlBtn.addEventListener("click", downloadReport);

  // Re-render canvas on resize
  window.addEventListener("resize", () => {
    renderTrendGraph(getHistory());
    renderRadarChart(getStats());
  });
}

document.addEventListener("DOMContentLoaded", init);
