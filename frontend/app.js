// /frontend/app.js
/**
 * FinWise AI - Loan Advisory Engine Frontend Controller
 */

// Determine API base URL
const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
  ? window.location.origin
  : "http://localhost:8000";

// App State
let sessionId = null;
let currentPhase = "greeting";
let turnCount = 0;
let completenessPct = 0;
let currentTargetField = null;
let lastExtractedProfile = null;
let isProcessing = false;

// DOM Elements
const messagesContainer = document.getElementById("messagesContainer");
const interactiveArea = document.getElementById("interactiveArea");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const btnSend = document.getElementById("btnSend");
const btnNewSession = document.getElementById("btnNewSession");
const sessionIdShort = document.getElementById("sessionIdShort");
const currentPhaseBadge = document.getElementById("currentPhaseBadge");
const turnCounter = document.getElementById("turnCounter");
const completenessPctLabel = document.getElementById("completenessPctLabel");
const completenessProgressBar = document.getElementById("completenessProgressBar");
const fieldsFilledCount = document.getElementById("fieldsFilledCount");
const warningsSection = document.getElementById("warningsSection");
const warningsList = document.getElementById("warningsList");
const completedPayloadSection = document.getElementById("completedPayloadSection");
const btnViewPayload = document.getElementById("btnViewPayload");
const jsonModal = document.getElementById("jsonModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const jsonPayloadDisplay = document.getElementById("jsonPayloadDisplay");
const btnCopyJson = document.getElementById("btnCopyJson");
const copyJsonText = document.getElementById("copyJsonText");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const btnCloseSidebar = document.getElementById("btnCloseSidebar");
const sidebarPanel = document.getElementById("sidebarPanel");

// Field summary elements
const cardLoanType = document.getElementById("cardLoanType");
const cardLoanAmount = document.getElementById("cardLoanAmount");
const cardIncome = document.getElementById("cardIncome");
const cardEmployment = document.getElementById("cardEmployment");
const cardDebts = document.getElementById("cardDebts");
const cardCreditScore = document.getElementById("cardCreditScore");
const cardTenureAge = document.getElementById("cardTenureAge");
const cardUrgency = document.getElementById("cardUrgency");

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  setupEventListeners();
  startNewSession();
});

function setupEventListeners() {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || isProcessing) return;
    sendMessage(text, currentTargetField);
  });

  btnNewSession.addEventListener("click", () => {
    if (confirm("Start a new loan advisory session?")) {
      startNewSession();
    }
  });

  sessionIdShort.addEventListener("click", () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId).then(() => {
      const orig = sessionIdShort.innerText;
      sessionIdShort.innerText = "Copied!";
      setTimeout(() => (sessionIdShort.innerText = orig), 1500);
    });
  });

  btnViewPayload.addEventListener("click", () => {
    if (!lastExtractedProfile) return;
    jsonPayloadDisplay.textContent = JSON.stringify(lastExtractedProfile, null, 2);
    jsonModal.classList.remove("hidden");
    jsonModal.classList.add("flex");
  });

  btnCloseModal.addEventListener("click", () => {
    jsonModal.classList.add("hidden");
    jsonModal.classList.remove("flex");
  });

  btnCopyJson.addEventListener("click", () => {
    if (!lastExtractedProfile) return;
    navigator.clipboard.writeText(JSON.stringify(lastExtractedProfile, null, 2)).then(() => {
      copyJsonText.innerText = "Copied!";
      setTimeout(() => (copyJsonText.innerText = "Copy JSON"), 2000);
    });
  });

  // Mobile sidebar toggle
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener("click", () => {
      sidebarPanel.classList.remove("translate-x-full");
    });
  }
  if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener("click", () => {
      sidebarPanel.classList.add("translate-x-full");
    });
  }
}

// ── 1. Start Session ──────────────────────────────────────────────────
async function startNewSession() {
  resetUI();
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/chat/start?user_type=guest`, {
      method: "POST",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    sessionId = data.session_id;
    sessionIdShort.innerText = `${sessionId.slice(0, 8)}...`;
    
    handleBotResponse(data);
  } catch (err) {
    console.error("Failed to start session:", err);
    appendMessage("assistant", "❌ **Failed to connect to backend.** Please ensure the server is running (`python backend/run.py`).");
  } finally {
    setLoading(false);
  }
}

// ── 2. Send Message ───────────────────────────────────────────────────
async function sendMessage(messageText, fieldTarget = null) {
  if (!sessionId || isProcessing) return;

  // Render user message bubble
  appendMessage("user", messageText);
  userInput.value = "";
  clearInteractiveArea();
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: String(messageText),
        field_target: fieldTarget,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    handleBotResponse(data);
  } catch (err) {
    console.error("Error sending message:", err);
    appendMessage("assistant", "⚠️ Connection glitch. Please try again.");
  } finally {
    setLoading(false);
  }
}

// ── 3. Handle Bot Response ───────────────────────────────────────────
function handleBotResponse(data) {
  turnCount++;
  turnCounter.innerText = `Turns: ${turnCount}/20`;

  // Update session state
  if (data.session_state) {
    const s = data.session_state;
    currentPhase = s.current_phase || currentPhase;
    completenessPct = s.completeness_pct || 0;

    currentPhaseBadge.innerText = currentPhase.replace(/_/g, " ");
    completenessPctLabel.innerText = `${completenessPct}%`;
    completenessProgressBar.style.width = `${completenessPct}%`;
    fieldsFilledCount.innerText = `${s.fields_filled ? s.fields_filled.length : 0} fields extracted`;

    if (s.is_complete && confetti) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  // Check for extracted profile
  if (data.extracted_profile) {
    lastExtractedProfile = data.extracted_profile;
    completedPayloadSection.classList.remove("hidden");
  }

  // Render bot messages
  if (data.messages && data.messages.length > 0) {
    data.messages.forEach((msg, idx) => {
      setTimeout(() => {
        appendMessage("assistant", msg.content);
        
        // If this is the last message and contains a UI component, render it
        if (idx === data.messages.length - 1 && msg.ui_component) {
          currentTargetField = msg.field_target;
          renderInteractiveComponent(msg.ui_component, msg.field_target);
        }
      }, idx * 150);
    });
  }

  // Fetch full state for sidebar summary cards
  updateSidebarProfile();
}

// ── 4. Fetch Full Profile State for Sidebar ──────────────────────────
async function updateSidebarProfile() {
  if (!sessionId) return;
  try {
    const res = await fetch(`${API_BASE}/api/chat/${sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    const p = data.profile || {};

    if (p.intent) {
      cardLoanType.innerText = p.intent.replace(/_/g, " ").toUpperCase();
      cardLoanType.className = "text-cyan-400 font-mono font-bold";
    }
    if (p.requested_loan_amount) {
      cardLoanAmount.innerText = `₹${Number(p.requested_loan_amount).toLocaleString("en-IN")}`;
      cardLoanAmount.className = "text-emerald-400 font-mono font-bold";
    }
    if (p.monthly_income) {
      cardIncome.innerText = `₹${Number(p.monthly_income).toLocaleString("en-IN")}/mo`;
      cardIncome.className = "text-slate-200 font-mono font-semibold";
    }
    if (p.employment_type) {
      cardEmployment.innerText = p.employment_type.replace(/_/g, " ").toUpperCase();
      cardEmployment.className = "text-slate-200 font-mono font-semibold";
    }
    if (p.has_existing_loans !== undefined) {
      if (p.has_existing_loans) {
        cardDebts.innerText = `₹${Number(p.existing_emi_obligations || 0).toLocaleString("en-IN")}/mo`;
      } else {
        cardDebts.innerText = "None (₹0)";
      }
      cardDebts.className = "text-slate-200 font-mono font-semibold";
    }
    if (p.credit_score_band) {
      cardCreditScore.innerText = p.credit_score_band.toUpperCase();
      cardCreditScore.className = "text-indigo-400 font-mono font-bold";
    }
    if (p.preferred_tenure_months || p.age) {
      const t = p.preferred_tenure_months ? `${(p.preferred_tenure_months / 12).toFixed(0)} yrs` : "-";
      const a = p.age ? `${p.age} y/o` : "-";
      cardTenureAge.innerText = `${t} • ${a}`;
      cardTenureAge.className = "text-slate-200 font-mono font-semibold";
    }
    if (p.urgency) {
      cardUrgency.innerText = p.urgency.replace(/_/g, " ").toUpperCase();
      cardUrgency.className = "text-amber-400 font-mono font-bold";
    }

    // Warnings
    if (data.warnings && data.warnings.length > 0) {
      warningsSection.classList.remove("hidden");
      warningsList.innerHTML = data.warnings
        .map(
          (w) => `
        <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start space-x-2">
          <span class="mt-0.5 shrink-0">⚠️</span>
          <span>${w}</span>
        </div>
      `
        )
        .join("");
    }
  } catch (e) {
    // Silent catch
  }
}

// ── 5. Render Interactive UI Components ──────────────────────────────
function renderInteractiveComponent(comp, fieldTarget) {
  clearInteractiveArea();
  if (!comp) return;

  const card = document.createElement("div");
  card.className = "p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-4xl mx-auto msg-animate";

  // MCQ
  if (comp.type === "mcq" && comp.options) {
    card.innerHTML = `
      <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
        <i data-lucide="mouse-pointer-click" class="w-3.5 h-3.5 text-cyan-400"></i>
        <span>Select an option or type below:</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        ${comp.options
          .map(
            (opt, i) => `
          <button 
            type="button" 
            class="mcq-btn text-left p-3 rounded-xl bg-slate-800/80 hover:bg-brand-600/30 hover:border-brand-500 border border-slate-700/60 text-slate-200 hover:text-white transition active:scale-98 flex items-center justify-between group"
            data-val="${opt.value}"
          >
            <span class="text-xs font-semibold">${opt.label}</span>
            <span class="text-[10px] text-slate-500 group-hover:text-cyan-400 font-mono">#${i + 1}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `;

    card.querySelectorAll(".mcq-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-val");
        sendMessage(val, fieldTarget);
      });
    });
  }

  // YES / NO
  else if (comp.type === "yes_no" || comp.type === "yesno") {
    card.innerHTML = `
      <div class="flex items-center justify-center space-x-3 py-1">
        <button 
          type="button" 
          id="btnYes" 
          class="flex-1 py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-sm transition active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>✅ Yes</span>
        </button>
        <button 
          type="button" 
          id="btnNo" 
          class="flex-1 py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-bold text-sm transition active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>❌ No</span>
        </button>
      </div>
    `;
    card.querySelector("#btnYes").addEventListener("click", () => sendMessage("yes", fieldTarget));
    card.querySelector("#btnNo").addEventListener("click", () => sendMessage("no", fieldTarget));
  }

  // SLIDER
  else if (comp.type === "slider") {
    const min = comp.min_value || 12;
    const max = comp.max_value || 360;
    const step = comp.step || 12;
    const def = comp.default_value || min;
    const unit = comp.unit || "months";

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400">Select Duration:</span>
          <span id="sliderValueDisplay" class="text-sm font-extrabold text-cyan-400 font-mono">
            ${def} ${unit} (${(def / 12).toFixed(1)} years)
          </span>
        </div>
        <input 
          type="range" 
          id="rangeInput" 
          min="${min}" 
          max="${max}" 
          step="${step}" 
          value="${def}" 
          class="w-full"
        />
        <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>${min} ${unit}</span>
          <span>${max} ${unit}</span>
        </div>
        <div class="flex items-center space-x-2 pt-1">
          <button type="button" class="preset-btn px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300" data-months="36">3 Yrs</button>
          <button type="button" class="preset-btn px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300" data-months="60">5 Yrs</button>
          <button type="button" class="preset-btn px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300" data-months="120">10 Yrs</button>
          <button type="button" class="preset-btn px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300" data-months="240">20 Yrs</button>
          <button 
            type="button" 
            id="btnConfirmSlider" 
            class="ml-auto px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
          >
            Confirm Tenure
          </button>
        </div>
      </div>
    `;

    const slider = card.querySelector("#rangeInput");
    const display = card.querySelector("#sliderValueDisplay");

    slider.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      display.innerText = `${val} ${unit} (${(val / 12).toFixed(1)} years)`;
    });

    card.querySelectorAll(".preset-btn").forEach((b) => {
      b.addEventListener("click", () => {
        slider.value = b.getAttribute("data-months");
        slider.dispatchEvent(new Event("input"));
      });
    });

    card.querySelector("#btnConfirmSlider").addEventListener("click", () => {
      sendMessage(slider.value, fieldTarget);
    });
  }

  // NUMBER INPUT / CURRENCY
  else if (comp.type === "number_input") {
    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center space-x-2">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input 
              type="number" 
              id="numInput" 
              placeholder="${comp.placeholder || 'Enter amount in INR'}" 
              class="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <button 
            type="button" 
            id="btnConfirmNumber" 
            class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition active:scale-95"
          >
            Confirm
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 pt-1">
          <button type="button" class="amount-chip px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-400" data-amt="500000">₹5 Lakh</button>
          <button type="button" class="amount-chip px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-400" data-amt="2500000">₹25 Lakh</button>
          <button type="button" class="amount-chip px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-400" data-amt="5000000">₹50 Lakh</button>
          <button type="button" class="amount-chip px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-400" data-amt="10000000">₹1 Crore</button>
        </div>
      </div>
    `;

    const nInp = card.querySelector("#numInput");
    card.querySelectorAll(".amount-chip").forEach((b) => {
      b.addEventListener("click", () => {
        nInp.value = b.getAttribute("data-amt");
        sendMessage(nInp.value, fieldTarget);
      });
    });

    card.querySelector("#btnConfirmNumber").addEventListener("click", () => {
      if (nInp.value) sendMessage(nInp.value, fieldTarget);
    });
  }

  interactiveArea.appendChild(card);
  if (window.lucide) lucide.createIcons();
  scrollToBottom();
}

function clearInteractiveArea() {
  interactiveArea.innerHTML = "";
}

// ── 6. Message Bubble Renderer ───────────────────────────────────────
function appendMessage(role, content) {
  const isUser = role === "user";
  const wrapper = document.createElement("div");
  wrapper.className = `flex items-start space-x-3 msg-animate ${isUser ? "flex-row-reverse space-x-reverse" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = `w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
    isUser
      ? "bg-gradient-to-tr from-cyan-600 to-blue-500 text-white"
      : "bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 text-white"
  }`;
  avatar.innerHTML = isUser ? `<i data-lucide="user" class="w-4 h-4"></i>` : `<i data-lucide="bot" class="w-4 h-4"></i>`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-[85%] sm:max-w-xl p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
    isUser
      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-brand-600/20"
      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-lg chat-content"
  }`;

  bubble.innerHTML = formatMarkdown(content);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesContainer.appendChild(wrapper);

  if (window.lucide) lucide.createIcons();
  scrollToBottom();
}

function formatMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

function scrollToBottom() {
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 50);
}

function setLoading(loading) {
  isProcessing = loading;
  btnSend.disabled = loading;
  userInput.disabled = loading;
  if (loading) {
    btnSend.innerHTML = `<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>`;
  } else {
    btnSend.innerHTML = `<span>Send</span><i data-lucide="send" class="w-4 h-4"></i>`;
    if (window.lucide) lucide.createIcons();
    userInput.focus();
  }
}

function resetUI() {
  messagesContainer.innerHTML = "";
  clearInteractiveArea();
  turnCount = 0;
  completenessPct = 0;
  turnCounter.innerText = "Turns: 0/20";
  completenessPctLabel.innerText = "0%";
  completenessProgressBar.style.width = "0%";
  fieldsFilledCount.innerText = "0 fields extracted";
  completedPayloadSection.classList.add("hidden");
  warningsSection.classList.add("hidden");

  // Reset cards
  [cardLoanType, cardLoanAmount, cardIncome, cardEmployment, cardDebts, cardCreditScore, cardTenureAge, cardUrgency].forEach((c) => {
    c.innerText = "Pending...";
    c.className = "text-slate-500 font-mono font-medium";
  });
}
