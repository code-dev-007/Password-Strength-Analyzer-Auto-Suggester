"use strict";

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — DOM ELEMENT REFERENCES
═══════════════════════════════════════════════════════════════ */
const passwordInput  = document.getElementById("passwordInput");
const toggleVis      = document.getElementById("toggleVis");
const eyeIcon        = document.getElementById("eyeIcon");
const charCount      = document.getElementById("charCount");
const meterBar       = document.getElementById("meterBar");
const strengthBadge  = document.getElementById("strengthBadge");
const entropyVal     = document.getElementById("entropyVal");
const crackTime      = document.getElementById("crackTime");
const scoreVal       = document.getElementById("scoreVal");
const themeToggle    = document.getElementById("themeToggle");
const themeLabel     = document.getElementById("themeLabel");
const generateBtn    = document.getElementById("generateBtn");
const generatedList  = document.getElementById("generatedList");
const genLength      = document.getElementById("genLength");
const lenDisplay     = document.getElementById("lenDisplay");
const incUpper       = document.getElementById("incUpper");
const incLower       = document.getElementById("incLower");
const incNumbers     = document.getElementById("incNumbers");
const incSymbols     = document.getElementById("incSymbols");

/* Character Analysis elements */
const barUpper    = document.getElementById("barUpper");
const barLower    = document.getElementById("barLower");
const barNumber   = document.getElementById("barNumber");
const barSymbol   = document.getElementById("barSymbol");
const countUpper  = document.getElementById("countUpper");
const countLower  = document.getElementById("countLower");
const countNumber = document.getElementById("countNumber");
const countSymbol = document.getElementById("countSymbol");
const hashDisplay = document.getElementById("hashDisplay");

/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — CONSTANTS & CHARACTER SETS
═══════════════════════════════════════════════════════════════ */
const CHAR_SETS = {
  upper:   "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower:   "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;':\",./<>?"
};

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "123456789",
  "12345678", "12345", "1234567", "1234567890", "qwerty", "qwerty123",
  "abc123", "letmein", "monkey", "dragon", "1q2w3e4r", "sunshine",
  "princess", "welcome", "shadow", "superman", "michael", "football",
  "master", "hello", "charlie", "donald", "password!", "admin",
  "login", "admin123", "root", "toor", "pass", "test", "guest",
  "iloveyou", "111111", "000000", "1111111", "123123", "654321"
]);

const STRENGTH_LEVELS = [
  { min: 0,  max: 25,  label: "WEAK",        cls: "weak",    pct: 25  },
  { min: 26, max: 50,  label: "FAIR",        cls: "fair",    pct: 50  },
  { min: 51, max: 75,  label: "STRONG",      cls: "strong",  pct: 75  },
  { min: 76, max: 100, label: "VERY STRONG", cls: "vstrong", pct: 100 }
];

/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — ALGORITHM: PASSWORD SCORING
═══════════════════════════════════════════════════════════════ */
function analyzePassword(password) {
  let score = 0;
  const criteria = {
    length8:    password.length >= 8,
    length12:   password.length >= 12,
    hasUpper:   /[A-Z]/.test(password),
    hasLower:   /[a-z]/.test(password),
    hasNumber:  /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    notCommon:  !COMMON_PASSWORDS.has(password.toLowerCase()),
    noRepeat:   !hasExcessiveRepeats(password)
  };

  if (criteria.length8)    score += 10;
  if (criteria.length12)   score += 15;
  if (criteria.hasUpper)   score += 10;
  if (criteria.hasLower)   score += 10;
  if (criteria.hasNumber)  score += 15;
  if (criteria.hasSpecial) score += 20;
  if (criteria.notCommon)  score += 10;
  if (criteria.noRepeat)   score += 10;
  if (password.length >= 20) score = Math.min(100, score + 5);
  if (password.length < 6 && password.length > 0) score = Math.min(score, 15);

  const entropy       = calculateEntropy(password);
  const crackTimeStr  = estimateCrackTime(password);

  return { score: Math.min(100, score), criteria, entropy, crackTimeStr };
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — ALGORITHM: SHANNON ENTROPY
   H = L × log₂(N)
═══════════════════════════════════════════════════════════════ */
function calculateEntropy(password) {
  if (!password.length) return 0;
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[ ]/.test(password))   poolSize += 1;
  if (/[^A-Za-z0-9 ]/.test(password)) poolSize += 33;
  if (poolSize === 0) return 0;
  return parseFloat((password.length * Math.log2(poolSize)).toFixed(1));
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — ALGORITHM: CRACK TIME ESTIMATION
   T = N^L ÷ 10^9 (1 billion guesses/sec GPU model)
═══════════════════════════════════════════════════════════════ */
function estimateCrackTime(password) {
  if (!password.length) return "—";
  let N = 0;
  if (/[a-z]/.test(password)) N += 26;
  if (/[A-Z]/.test(password)) N += 26;
  if (/[0-9]/.test(password)) N += 10;
  if (/[^A-Za-z0-9]/.test(password)) N += 33;
  if (N === 0) return "—";
  const log10Combinations = password.length * Math.log10(N);
  const log10Seconds = log10Combinations - 9;
  return log10ToHumanTime(log10Seconds);
}

function log10ToHumanTime(log10secs) {
  const MINUTE    = Math.log10(60);
  const HOUR      = Math.log10(3600);
  const DAY       = Math.log10(86400);
  const MONTH     = Math.log10(2.628e6);
  const YEAR      = Math.log10(3.154e7);
  const CENTURY   = Math.log10(3.154e9);
  const MILLENNIUM= Math.log10(3.154e10);
  if (log10secs < 0)          return "Instant";
  if (log10secs < MINUTE)     return `${Math.round(Math.pow(10, log10secs))}s`;
  if (log10secs < HOUR)       return `${Math.round(Math.pow(10, log10secs - MINUTE))} min`;
  if (log10secs < DAY)        return `${Math.round(Math.pow(10, log10secs - HOUR))} hrs`;
  if (log10secs < MONTH)      return `${Math.round(Math.pow(10, log10secs - DAY))} days`;
  if (log10secs < YEAR)       return `${Math.round(Math.pow(10, log10secs - MONTH))} months`;
  if (log10secs < CENTURY)    return `${Math.round(Math.pow(10, log10secs - YEAR))} years`;
  if (log10secs < MILLENNIUM) return `${Math.round(Math.pow(10, log10secs - CENTURY))} centuries`;
  return "Longer than human history";
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — ALGORITHM: REPEAT CHARACTER DETECTION
═══════════════════════════════════════════════════════════════ */
function hasExcessiveRepeats(password) {
  return /(.)\1{2,}/.test(password);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — ALGORITHM: STRONG PASSWORD GENERATOR
   Fisher-Yates shuffle for unbiased permutation
═══════════════════════════════════════════════════════════════ */
function generateStrongPassword(length, options) {
  const { useUpper, useLower, useNumbers, useSymbols } = options;
  let pool = "";
  if (useUpper)   pool += CHAR_SETS.upper;
  if (useLower)   pool += CHAR_SETS.lower;
  if (useNumbers) pool += CHAR_SETS.numbers;
  if (useSymbols) pool += CHAR_SETS.symbols;
  if (!pool) pool = CHAR_SETS.upper + CHAR_SETS.lower + CHAR_SETS.numbers + CHAR_SETS.symbols;

  const guaranteed = [];
  if (useUpper)   guaranteed.push(randomChar(CHAR_SETS.upper));
  if (useLower)   guaranteed.push(randomChar(CHAR_SETS.lower));
  if (useNumbers) guaranteed.push(randomChar(CHAR_SETS.numbers));
  if (useSymbols) guaranteed.push(randomChar(CHAR_SETS.symbols));

  const passwordChars = [...guaranteed];
  for (let i = 0; i < length - guaranteed.length; i++) {
    passwordChars.push(randomChar(pool));
  }

  /* Fisher-Yates Shuffle — O(n), unbiased */
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

function randomChar(str) {
  return str[Math.floor(Math.random() * str.length)];
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — SHA-256 HASH (Web Crypto API)
   Demonstrates how passwords are stored securely in databases.
   NOTE: In production, always use salted bcrypt/Argon2, not raw SHA-256.
═══════════════════════════════════════════════════════════════ */

/**
 * computeSHA256(message)
 * ─────────────────────
 * Uses the browser's built-in SubtleCrypto API for a real
 * cryptographic SHA-256 hash — no external libraries needed.
 *
 * @param {string} message
 * @returns {Promise<string>} hex digest
 */
async function computeSHA256(message) {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * updateHashDisplay(password)
 * ────────────────────────────
 * Computes and renders the SHA-256 hash in the UI.
 * Uses async/await — does not block the main thread.
 */
async function updateHashDisplay(password) {
  if (!hashDisplay) return;
  if (!password.length) {
    hashDisplay.innerHTML = `<span class="hash-placeholder">— enter a password to see its hash —</span>`;
    hashDisplay.classList.remove("active");
    return;
  }
  hashDisplay.innerHTML = `<span class="hash-placeholder processing">Computing hash…</span>`;
  try {
    const hash = await computeSHA256(password);
    hashDisplay.textContent = hash;
    hashDisplay.classList.add("active");
  } catch {
    hashDisplay.innerHTML = `<span class="hash-placeholder">SHA-256 unavailable in this browser.</span>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 9 — CHARACTER ANALYSIS
   Breaks down password into char-type counts with visual bars.
═══════════════════════════════════════════════════════════════ */

/**
 * updateCharAnalysis(password)
 * ─────────────────────────────
 * Counts each character type and updates the breakdown bar chart.
 */
function updateCharAnalysis(password) {
  if (!barUpper) return; /* Guard: only run on index.html */

  const counts = { upper: 0, lower: 0, number: 0, symbol: 0 };
  for (const ch of password) {
    if (/[A-Z]/.test(ch))      counts.upper++;
    else if (/[a-z]/.test(ch)) counts.lower++;
    else if (/[0-9]/.test(ch)) counts.number++;
    else                        counts.symbol++;
  }

  const total = password.length || 1; /* avoid div-by-zero */

  /* Update bars */
  barUpper.style.width  = ((counts.upper  / total) * 100).toFixed(1) + "%";
  barLower.style.width  = ((counts.lower  / total) * 100).toFixed(1) + "%";
  barNumber.style.width = ((counts.number / total) * 100).toFixed(1) + "%";
  barSymbol.style.width = ((counts.symbol / total) * 100).toFixed(1) + "%";

  /* Update count labels */
  countUpper.textContent  = counts.upper;
  countLower.textContent  = counts.lower;
  countNumber.textContent = counts.number;
  countSymbol.textContent = counts.symbol;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 10 — SESSION HISTORY (localStorage)
   Saves analysis results for the Dashboard page.
   Passwords are masked before saving — never stored in plaintext.
═══════════════════════════════════════════════════════════════ */

const HISTORY_KEY = "passguard-history";
const STATS_KEY   = "passguard-stats";
const GEN_KEY     = "passguard-generated";

/**
 * maskPassword(password)
 * ───────────────────────
 * Obscures the actual password before localStorage storage.
 * Only the length, first char, and last char are preserved.
 * This is intentional — we never store real passwords.
 */
function maskPassword(password) {
  if (password.length <= 2) return "*".repeat(password.length);
  return password[0] + "•".repeat(password.length - 2) + password[password.length - 1];
}

/**
 * saveToHistory(password, score, cls)
 * ─────────────────────────────────────
 * Appends one entry to the analysis history in localStorage.
 * Keeps max 20 entries (rolling).
 */
function saveToHistory(password, score, cls) {
  const history = getHistory();
  history.unshift({
    masked: maskPassword(password),
    length: password.length,
    score,
    cls,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  if (history.length > 20) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  updateStats(score, cls);
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function updateStats(score, cls) {
  let stats = getStats();
  stats.total++;
  stats.sumScore += score;
  stats.best = Math.max(stats.best, score);
  stats[cls + "Count"] = (stats[cls + "Count"] || 0) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function getStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || defaultStats(); }
  catch { return defaultStats(); }
}

function defaultStats() {
  return { total: 0, sumScore: 0, best: 0, weakCount: 0, fairCount: 0, strongCount: 0, vstrongCount: 0 };
}

function incrementGenerated() {
  const n = parseInt(localStorage.getItem(GEN_KEY) || "0", 10) + 5;
  localStorage.setItem(GEN_KEY, n.toString());
}

/* Debounce: only save to history after user stops typing for 700ms */
let saveTimer = null;
function debouncedSave(password, score, cls) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (password.length >= 4) saveToHistory(password, score, cls);
  }, 700);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 11 — UI UPDATE FUNCTIONS
═══════════════════════════════════════════════════════════════ */
function updateUI(password) {
  charCount.textContent = password.length;

  if (!password.length) {
    resetUI();
    updateCharAnalysis("");
    updateHashDisplay("");
    return;
  }

  const { score, criteria, entropy, crackTimeStr } = analyzePassword(password);
  const level = STRENGTH_LEVELS.find(l => score >= l.min && score <= l.max) || STRENGTH_LEVELS[0];

  /* Strength meter */
  meterBar.style.width  = level.pct + "%";
  meterBar.className    = "meter-bar " + level.cls;
  strengthBadge.textContent = level.label;
  strengthBadge.className   = "strength-badge " + level.cls;

  /* Stats */
  entropyVal.textContent = entropy + " bits";
  crackTime.textContent  = crackTimeStr;
  scoreVal.textContent   = score + " / 100";

  /* Criteria */
  updateCriteria(criteria);

  /* Character Analysis */
  updateCharAnalysis(password);

  /* SHA-256 Hash (async) */
  updateHashDisplay(password);

  /* Save to history (debounced) */
  debouncedSave(password, score, level.cls);
}

function updateCriteria(criteria) {
  const mapping = {
    "crit-length":   criteria.length8,
    "crit-length12": criteria.length12,
    "crit-upper":    criteria.hasUpper,
    "crit-lower":    criteria.hasLower,
    "crit-number":   criteria.hasNumber,
    "crit-special":  criteria.hasSpecial,
    "crit-nocommon": criteria.notCommon,
    "crit-norepeat": criteria.noRepeat
  };
  for (const [id, passed] of Object.entries(mapping)) {
    const el   = document.getElementById(id);
    if (!el) continue;
    const icon = el.querySelector(".crit-icon");
    el.setAttribute("data-done", passed ? "true" : "false");
    icon.textContent = passed ? "✓" : "○";
  }
}

function resetUI() {
  meterBar.style.width      = "0%";
  meterBar.className        = "meter-bar";
  strengthBadge.textContent = "—";
  strengthBadge.className   = "strength-badge";
  entropyVal.textContent    = "0.0 bits";
  crackTime.textContent     = "—";
  scoreVal.textContent      = "0 / 100";
  document.querySelectorAll(".criterion").forEach(el => {
    el.setAttribute("data-done", "false");
    el.querySelector(".crit-icon").textContent = "○";
  });
  /* Reset char bars */
  if (barUpper) {
    [barUpper, barLower, barNumber, barSymbol].forEach(b => b.style.width = "0%");
    [countUpper, countLower, countNumber, countSymbol].forEach(c => c.textContent = "0");
  }
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 12 — PASSWORD GENERATOR UI
═══════════════════════════════════════════════════════════════ */
function renderGeneratedPasswords(passwords) {
  generatedList.innerHTML = "";
  passwords.forEach((pass, idx) => {
    const item = document.createElement("div");
    item.className = "gen-item";
    item.style.animationDelay = (idx * 0.07) + "s";
    item.innerHTML = `
      <span class="gen-num">#${idx + 1}</span>
      <span class="gen-pass">${pass}</span>
      <button class="copy-btn" data-pass="${escapeHtml(pass)}">Copy</button>
      <button class="use-btn" data-pass="${escapeHtml(pass)}">Use This</button>
    `;
    generatedList.appendChild(item);
  });

  generatedList.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => copyToClipboard(btn.getAttribute("data-pass"), btn));
  });

  generatedList.querySelectorAll(".use-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-pass");
      passwordInput.value = text;
      updateUI(text);
      passwordInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = "✓ Copied!";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 2000);
  }).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    btn.textContent = "✓ Copied!";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 13 — DARK / LIGHT MODE TOGGLE
═══════════════════════════════════════════════════════════════ */
function applyTheme(isDark) {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
  localStorage.setItem("passguard-theme", isDark ? "dark" : "light");
}

function loadThemePreference() {
  const saved  = localStorage.getItem("passguard-theme");
  const isDark = saved ? saved === "dark" : true;
  themeToggle.checked = isDark;
  applyTheme(isDark);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 14 — EVENT LISTENERS
═══════════════════════════════════════════════════════════════ */
passwordInput.addEventListener("input", e => updateUI(e.target.value));

const EYE_OPEN   = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

toggleVis.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  eyeIcon.innerHTML  = isPassword ? EYE_CLOSED : EYE_OPEN;
});

genLength.addEventListener("input", () => { lenDisplay.textContent = genLength.value; });

generateBtn.addEventListener("click", () => {
  const length = parseInt(genLength.value, 10);
  if (!incUpper.checked && !incLower.checked && !incNumbers.checked && !incSymbols.checked) {
    generatedList.innerHTML = `<p class="gen-placeholder" style="color:var(--red)">⚠ Please select at least one character type.</p>`;
    return;
  }
  const options = { useUpper: incUpper.checked, useLower: incLower.checked, useNumbers: incNumbers.checked, useSymbols: incSymbols.checked };
  const passwords = Array.from({ length: 5 }, () => generateStrongPassword(length, options));
  renderGeneratedPasswords(passwords);
  incrementGenerated();
});

themeToggle.addEventListener("change", () => applyTheme(themeToggle.checked));

/* ═══════════════════════════════════════════════════════════════
   SECTION 15 — INITIALISATION
═══════════════════════════════════════════════════════════════ */
function init() {
  loadThemePreference();
  resetUI();
  lenDisplay.textContent = genLength.value;
  setTimeout(() => passwordInput.focus(), 300);

  console.log(`
  ╔════════════════════════════════════════╗
  ║   PassShield — Password Analyzer       ║
  ║   MCA Project | Security & Cryptography║
  ╠════════════════════════════════════════╣
  ║  Algorithm Modules Loaded:             ║
  ║  ✓ Shannon Entropy Calculator          ║
  ║  ✓ Brute-force Crack Time Estimator   ║
  ║  ✓ Strength Scoring Engine (0–100)    ║
  ║  ✓ Common Password Dictionary         ║
  ║  ✓ Fisher-Yates Password Generator    ║
  ║  ✓ SHA-256 Hash (Web Crypto API)      ║
  ║  ✓ Character Breakdown Analysis       ║
  ║  ✓ Session History (localStorage)     ║
  ║  ✓ Dark/Light Mode Toggle             ║
  ╚════════════════════════════════════════╝
  `);
}

document.addEventListener("DOMContentLoaded", init);

/* ═══════════════════════════════════════════════════════════════
   COUNTER ANIMATION — Live Stats Section
═══════════════════════════════════════════════════════════════ */
function animateCounters() {
  const counters = document.querySelectorAll(".counter-num[data-target]");
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1600;
      const start = performance.now();
      const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(ease(t) * target);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

document.addEventListener("DOMContentLoaded", () => {
  animateCounters();
});
