const RADIOS = ["Aswat", "Med Radio", "Medina FM", "Medi1", "Cap Radio", "Chada FM", "HIT RADIO", "MFM"];
const AUTO_REFRESH_MS = 10000;

const state = {
  records: [],
  adminPin: sessionStorage.getItem("adminPin") || "",
  apiUrl: getConfiguredApiUrl(),
  refreshTimer: null,
};

const $ = (id) => document.getElementById(id);

const els = {
  setupCard: $("setupCard"),
  settingsBtn: $("settingsBtn"),
  apiUrlInput: $("apiUrlInput"),
  saveApiUrlBtn: $("saveApiUrlBtn"),
  closeSetupBtn: $("closeSetupBtn"),
  setupStatus: $("setupStatus"),
  connectionBadge: $("connectionBadge"),
  dateInput: $("dateInput"),
  radioSelect: $("radioSelect"),
  indexInput: $("indexInput"),
  indexForm: $("indexForm"),
  saveBtn: $("saveBtn"),
  formStatus: $("formStatus"),
  pinInput: $("pinInput"),
  unlockAdminBtn: $("unlockAdminBtn"),
  logoutAdminBtn: $("logoutAdminBtn"),
  adminLogin: $("adminLogin"),
  adminPanel: $("adminPanel"),
  adminBadge: $("adminBadge"),
  refreshBtn: $("refreshBtn"),
  exportBtn: $("exportBtn"),
  searchInput: $("searchInput"),
  recordsList: $("recordsList"),
  summaryBox: $("summaryBox"),
  editDialog: $("editDialog"),
  editForm: $("editForm"),
  editId: $("editId"),
  editDate: $("editDate"),
  editRadio: $("editRadio"),
  editIndex: $("editIndex"),
  editStatus: $("editStatus"),
  cancelEditBtn: $("cancelEditBtn"),
};

init();

function init() {
  fillRadioSelects();
  els.dateInput.value = todayISO();
  updateConnectionBadge();
  bindEvents();

  if (!state.apiUrl) showSetup("Collez le lien Apps Script pour commencer.");
  if (state.adminPin) showAdminPanel();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
  }
}

function bindEvents() {
  els.settingsBtn.addEventListener("click", () => showSetup());
  els.closeSetupBtn.addEventListener("click", () => els.setupCard.classList.add("hidden"));
  els.saveApiUrlBtn.addEventListener("click", saveApiUrlFromInput);
  els.indexForm.addEventListener("submit", addRecord);
  els.unlockAdminBtn.addEventListener("click", unlockAdmin);
  els.logoutAdminBtn.addEventListener("click", logoutAdmin);
  els.refreshBtn.addEventListener("click", () => loadRecords(true));
  els.exportBtn.addEventListener("click", exportExcel);
  els.searchInput.addEventListener("input", renderRecords);
  els.editForm.addEventListener("submit", updateRecord);
  els.cancelEditBtn.addEventListener("click", () => els.editDialog.close());

  [els.indexInput, els.editIndex].forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9., ]/g, "");
    });
  });
}

function getConfiguredApiUrl() {
  const saved = localStorage.getItem("apiUrl") || "";
  const hardcoded = window.APP_CONFIG?.API_URL || "";
  return (hardcoded || saved).trim();
}

function saveApiUrlFromInput() {
  const url = els.apiUrlInput.value.trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
    setStatus(els.setupStatus, "Lien Apps Script incorrect.", "error");
    return;
  }
  localStorage.setItem("apiUrl", url);
  state.apiUrl = url;
  updateConnectionBadge();
  setStatus(els.setupStatus, "Lien enregistré.", "ok");
  setTimeout(() => els.setupCard.classList.add("hidden"), 700);
}

function showSetup(message = "") {
  els.apiUrlInput.value = state.apiUrl || "";
  els.setupCard.classList.remove("hidden");
  if (message) setStatus(els.setupStatus, message, "warn");
}

function updateConnectionBadge() {
  if (state.apiUrl) {
    els.connectionBadge.textContent = "Connecté";
    els.connectionBadge.className = "badge badge-ok";
  } else {
    els.connectionBadge.textContent = "Non connecté";
    els.connectionBadge.className = "badge badge-warn";
  }
}

function fillRadioSelects() {
  [els.radioSelect, els.editRadio].forEach((select) => {
    select.innerHTML = select === els.radioSelect ? '<option value="">Choisir radio</option>' : "";
    RADIOS.forEach((radio) => {
      const opt = document.createElement("option");
      opt.value = radio;
      opt.textContent = radio;
      select.appendChild(opt);
    });
  });
}

async function addRecord(event) {
  event.preventDefault();
  if (!ensureApi()) return;

  const date = els.dateInput.value || todayISO();
  const radio = els.radioSelect.value.trim();
  const index = parseIndexValue(els.indexInput.value);

  if (!radio) return setStatus(els.formStatus, "Choisir radio.", "error");
  if (index === null) return setStatus(els.formStatus, "Index invalide. Entrez فقط chiffres, مثلا 15420.", "error");

  els.saveBtn.disabled = true;
  setStatus(els.formStatus, "Enregistrement...", "warn");

  try {
    const result = await apiJsonp({ action: "add", date, radio, index });
    if (!result.ok) {
      setStatus(els.formStatus, getServerMessage(result), "error");
      return;
    }
    els.indexInput.value = "";
    setStatus(els.formStatus, "Index enregistré.", "ok");
    if (state.adminPin) await loadRecords(false);
  } catch (err) {
    setStatus(els.formStatus, readableError(err), "error");
  } finally {
    els.saveBtn.disabled = false;
  }
}

function unlockAdmin() {
  const pin = els.pinInput.value.trim();
  if (!pin) return;
  state.adminPin = pin;
  sessionStorage.setItem("adminPin", pin);
  showAdminPanel();
}

function showAdminPanel() {
  els.adminLogin.classList.add("hidden");
  els.adminPanel.classList.remove("hidden");
  els.adminBadge.textContent = "Ouvert";
  els.adminBadge.className = "badge badge-ok";
  loadRecords(true);
  startAutoRefresh();
}

function logoutAdmin() {
  state.adminPin = "";
  sessionStorage.removeItem("adminPin");
  stopAutoRefresh();
  els.pinInput.value = "";
  els.adminLogin.classList.remove("hidden");
  els.adminPanel.classList.add("hidden");
  els.adminBadge.textContent = "Verrouillé";
  els.adminBadge.className = "badge";
  state.records = [];
}

function startAutoRefresh() {
  stopAutoRefresh();
  state.refreshTimer = setInterval(() => {
    if (state.adminPin && state.apiUrl && !document.hidden) loadRecords(false);
  }, AUTO_REFRESH_MS);
}

function stopAutoRefresh() {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  state.refreshTimer = null;
}

async function loadRecords(showMessage) {
  if (!ensureApi()) return;
  if (!state.adminPin) return;

  if (showMessage) setStatus(els.formStatus, "Actualisation...", "warn");
  try {
    const result = await apiJsonp({ action: "list", pin: state.adminPin });
    if (!result.ok) {
      if (result.error === "BAD_PIN") {
        logoutAdmin();
        setStatus(els.formStatus, "PIN admin incorrect.", "error");
        return;
      }
      throw new Error(result.message || "Erreur de chargement.");
    }
    state.records = result.records || [];
    renderRecords();
    if (showMessage) setStatus(els.formStatus, "Données actualisées.", "ok");
  } catch (err) {
    setStatus(els.formStatus, readableError(err), "error");
  }
}

function renderRecords() {
  const q = els.searchInput.value.trim().toLowerCase();
  const records = [...state.records]
    .filter((r) => !q || String(r.date).toLowerCase().includes(q) || String(r.radio).toLowerCase().includes(q))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  renderSummary(records);

  if (!records.length) {
    els.recordsList.innerHTML = '<p class="muted">Aucun index trouvé.</p>';
    return;
  }

  els.recordsList.innerHTML = records.map((r) => `
    <article class="record">
      <div class="record-head">
        <div>
          <div class="record-title">${escapeHtml(r.radio)}</div>
          <div class="record-meta">${formatDate(r.date)}${r.createdAt ? " • " + escapeHtml(formatDateTime(r.createdAt)) : ""}</div>
        </div>
        <div class="record-index">${escapeHtml(formatNumber(r.index))}</div>
      </div>
      <div class="record-actions">
        <button class="edit-btn" data-edit="${escapeHtml(r.id)}">Modifier</button>
        <button class="delete-btn" data-delete="${escapeHtml(r.id)}">Supprimer</button>
      </div>
    </article>
  `).join("");

  els.recordsList.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openEdit(btn.dataset.edit)));
  els.recordsList.querySelectorAll("[data-delete]").forEach((btn) => btn.addEventListener("click", () => deleteRecord(btn.dataset.delete)));
}

function renderSummary(records) {
  const dates = new Set(records.map((r) => r.date));
  const radios = new Set(records.map((r) => r.radio));
  const latest = records[0]?.date ? formatDate(records[0].date) : "-";
  els.summaryBox.innerHTML = `
    <div class="summary-item"><strong>${records.length}</strong><span>Indexes</span></div>
    <div class="summary-item"><strong>${radios.size}</strong><span>Radios</span></div>
    <div class="summary-item"><strong>${dates.size}</strong><span>Jours</span></div>
    <div class="summary-item"><strong>${escapeHtml(latest)}</strong><span>Dernière date</span></div>
  `;
}

function openEdit(id) {
  const r = state.records.find((item) => String(item.id) === String(id));
  if (!r) return;
  els.editId.value = r.id;
  els.editDate.value = r.date;
  els.editRadio.value = r.radio;
  els.editIndex.value = r.index;
  setStatus(els.editStatus, "", "");
  els.editDialog.showModal();
}

async function updateRecord(event) {
  event.preventDefault();
  if (!ensureApi()) return;

  const index = parseIndexValue(els.editIndex.value);
  if (index === null) return setStatus(els.editStatus, "Index invalide. Entrez فقط chiffres.", "error");

  const payload = {
    action: "update",
    pin: state.adminPin,
    id: els.editId.value,
    date: els.editDate.value,
    radio: els.editRadio.value,
    index,
  };

  setStatus(els.editStatus, "Modification...", "warn");
  try {
    const result = await apiJsonp(payload);
    if (!result.ok) {
      setStatus(els.editStatus, getServerMessage(result), "error");
      return;
    }
    els.editDialog.close();
    await loadRecords(true);
  } catch (err) {
    setStatus(els.editStatus, readableError(err), "error");
  }
}

async function deleteRecord(id) {
  if (!confirm("Supprimer cet index ?")) return;
  try {
    const result = await apiJsonp({ action: "delete", pin: state.adminPin, id });
    if (!result.ok) throw new Error(getServerMessage(result));
    await loadRecords(true);
  } catch (err) {
    setStatus(els.formStatus, readableError(err), "error");
  }
}

function exportExcel() {
  const records = [...state.records];
  if (!records.length) {
    setStatus(els.formStatus, "Aucune donnée à exporter.", "warn");
    return;
  }

  const dates = [...new Set(records.map((r) => r.date))].sort();
  const byDateRadio = new Map();
  for (const r of records) byDateRadio.set(`${r.date}|||${r.radio}`, r.index);

  const rows = [];
  rows.push(`<tr><th colspan="${RADIOS.length + 1}" class="title">Relevé du compteur d'électricité de Radio</th></tr>`);
  rows.push(`<tr><th colspan="${RADIOS.length + 1}" class="subtitle">Au centre émetteur de Figuig</th></tr>`);
  rows.push(`<tr><th>Date</th>${RADIOS.map((r) => `<th>${escapeHtml(r)}</th>`).join("")}</tr>`);

  for (const date of dates) {
    rows.push(`<tr><td>${escapeHtml(formatDate(date))}</td>${RADIOS.map((radio) => `<td>${escapeHtml(formatNumber(byDateRadio.get(`${date}|||${radio}`) ?? ""))}</td>`).join("")}</tr>`);
  }

  rows.push(`<tr><td><strong>Puissance</strong></td>${RADIOS.map(() => "<td></td>").join("")}</tr>`);

  const html = `
    <html><head><meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; }
      th, td { border: 1px solid #000; padding: 6px 10px; text-align: center; }
      .title { font-size: 16px; font-weight: bold; background: #d9ead3; }
      .subtitle { font-size: 14px; background: #f3f3f3; }
      th { background: #d9ead3; }
    </style></head><body><table>${rows.join("")}</table></body></html>`;

  const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `releve-index-radio-${todayISO()}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function apiJsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonp_cb_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const url = new URL(state.apiUrl);

    Object.entries({ ...params, callback: callbackName, t: Date.now() }).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Connexion impossible. Vérifiez le déploiement Apps Script."));
    }, 15000);

    window[callbackName] = (data) => {
      clearTimeout(timer);
      cleanup();
      resolve(data || { ok: false, message: "Réponse vide." });
    };

    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Lien Apps Script invalide ou non autorisé."));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function ensureApi() {
  if (state.apiUrl) return true;
  showSetup("Collez d'abord le lien Apps Script.");
  setStatus(els.formStatus, "Application non connectée à Google Sheets.", "error");
  return false;
}

function parseIndexValue(value) {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

  const number = Number(cleaned);
  if (!Number.isFinite(number) || number < 0) return null;
  return number;
}

function getServerMessage(result) {
  if (result.error === "INDEX_ERRONE") return "Index erroné";
  if (result.error === "DUPLICATE") return "Cette radio est déjà enregistrée aujourd'hui.";
  if (result.error === "BAD_INDEX") return "Index invalide. Entrez فقط chiffres.";
  if (result.error === "BAD_RADIO") return "Radio invalide.";
  if (result.error === "BAD_PIN") return "PIN admin incorrect.";
  return result.message || "Erreur.";
}

function setStatus(el, message, type) {
  el.textContent = message || "";
  el.className = `status ${type || ""}`.trim();
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch (_) {
    return value;
  }
}

function formatNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readableError(err) {
  return err?.message || "Erreur de connexion.";
}
