import {
  appState,
  buildConfigsFromRecords,
  buildOptionalsFromRecords,
  effectiveLength,
  getConfigs,
  getOptionals,
  getPricingMatrix,
  mapRowToRecord,
  matrixHeaders,
  normalizeCellsLength,
  parseTsvInput,
  resetDataToDefaults,
  setConfigs,
  setOptionals,
  defaultConfigs,
  defaultOptionals,
  cleanNumber,
  normalizeTextCell,
  formatPrice,
} from "./state.js";
import { renderCatalog, renderUserPanels, updateSummary } from "./ui.js";

const pricingTables = document.getElementById("pricingTables");
const jsonPreview = document.getElementById("jsonPreview");
const pasteModal = document.getElementById("pasteModal");
const pasteArea = document.getElementById("pasteArea");
const pastePreview = document.getElementById("pastePreview");
const pasteErrors = document.getElementById("pasteErrors");
const parsePasteBtn = document.getElementById("parsePaste");
const confirmPasteBtn = document.getElementById("confirmPaste");
const pasteBadges = document.getElementById("pasteBadges");
const openPasteModalBtn = document.getElementById("openPasteModal");
const closePasteModalBtn = document.getElementById("closePasteModal");
const fileInput = document.getElementById("fileInput");

let lastParsedRecords = [];

const renderPastePreview = (rows) => {
  if (!rows.length) {
    pastePreview.innerHTML = "";
    return;
  }

  const headerHtml = `<thead><tr>${matrixHeaders.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;

  const bodyHtml = rows
    .map(({ cells, mismatch }) => {
      const rowCells = cells.map((c) => `<td>${c}</td>`).join("");
      return `<tr class="${mismatch ? "error" : ""}">${rowCells}</tr>`;
    })
    .join("");

  pastePreview.innerHTML = `${headerHtml}<tbody>${bodyHtml}</tbody>`;
};

const isHeaderRow = (cells) =>
  matrixHeaders.every((header, idx) => (cells[idx] || "").trim().toLowerCase() === header.toLowerCase());

export const renderAdminTables = () => {
  if (!pricingTables) return;
  pricingTables.innerHTML = "";
  const configs = getConfigs();
  const optionals = getOptionals();

  const cfgWrapper = document.createElement("div");
  cfgWrapper.className = "admin-table";
  const cfgHeader = document.createElement("header");
  cfgHeader.textContent = "Configs (solo lettura)";
  cfgWrapper.appendChild(cfgHeader);
  const cfgTable = document.createElement("table");
  cfgTable.innerHTML =
    "<thead><tr><th>Codice</th><th>MT Dorin</th><th>MT Bitzer</th></tr></thead>";
  const cfgBody = document.createElement("tbody");
  configs.forEach((cfg) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${cfg.code}</td><td>${formatPrice(cfg.mt.dorin?.price)}</td><td>${formatPrice(
      cfg.mt.bitzer?.price
    )}</td>`;
    cfgBody.appendChild(row);
  });
  cfgTable.appendChild(cfgBody);
  cfgWrapper.appendChild(cfgTable);
  pricingTables.appendChild(cfgWrapper);

  const optWrapper = document.createElement("div");
  optWrapper.className = "admin-table";
  const optHeader = document.createElement("header");
  optHeader.textContent = "Optionals";
  optWrapper.appendChild(optHeader);
  const optTable = document.createElement("table");
  optTable.innerHTML = "<thead><tr><th>Voce</th><th>Prezzo</th></tr></thead>";
  const optBody = document.createElement("tbody");
  optionals.forEach((opt) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = opt.name;
    const priceCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.value = opt.price;
    input.dataset.category = "optionals";
    input.dataset.id = opt.id;
    priceCell.appendChild(input);
    row.appendChild(nameCell);
    row.appendChild(priceCell);
    optBody.appendChild(row);
  });
  optTable.appendChild(optBody);
  optWrapper.appendChild(optTable);
  pricingTables.appendChild(optWrapper);

  if (jsonPreview) {
    jsonPreview.value = JSON.stringify(getPricingMatrix(), null, 2);
  }
};

export const saveAdminChanges = () => {
  document.querySelectorAll(".admin-table input").forEach((input) => {
    const { category, id } = input.dataset;
    const value = Number(input.value);
    if (category === "optionals") {
      const optionals = getOptionals();
      const item = optionals.find((i) => i.id === id);
      if (item && !Number.isNaN(value)) item.price = value;
      setOptionals(optionals);
    }
  });
  if (jsonPreview) jsonPreview.value = JSON.stringify(getPricingMatrix(), null, 2);
  renderUserPanels();
  updateSummary();
  renderCatalog();
};

export const resetPasteModal = () => {
  if (pasteArea) pasteArea.value = "";
  if (pasteErrors) pasteErrors.textContent = "";
  if (pastePreview) pastePreview.innerHTML = "";
  if (confirmPasteBtn) confirmPasteBtn.disabled = true;
  lastParsedRecords = [];
};

export const handlePasteParse = () => {
  if (!pasteArea) return;
  const raw = pasteArea.value;
  if (!raw.trim()) {
    pasteErrors.textContent = "Incolla qualche dato per generare l'anteprima.";
    confirmPasteBtn.disabled = true;
    pasteBadges.innerHTML = "";
    pastePreview.innerHTML = "";
    return;
  }

  const rawRows = parseTsvInput(raw);
  const previewRows = rawRows.map((row) => {
    const len = effectiveLength(row);
    const mismatch = len !== matrixHeaders.length;
    return { cells: normalizeCellsLength(row, matrixHeaders.length), mismatch, rawLen: len };
  });

  const errors = previewRows
    .map((row, idx) =>
      row.mismatch ? `Riga ${idx + 1}: ${row.rawLen} colonne effettive, attese ${matrixHeaders.length}` : null
    )
    .filter(Boolean);

  pasteErrors.textContent = errors.join(" | ");
  confirmPasteBtn.disabled = previewRows.length === 0;
  renderPastePreview(previewRows);

  const mismatchCount = previewRows.filter((r) => r.mismatch).length;
  const badgeTemplates = [
    { label: "Righe", value: previewRows.length },
    { label: "Colonne attese", value: matrixHeaders.length },
    { label: "Mismatch", value: mismatchCount },
  ];
  pasteBadges.innerHTML = badgeTemplates
    .map((b) => `<span class="badge"><strong>${b.value}</strong><span>${b.label}</span></span>`)
    .join("");

  const filledCells = previewRows.reduce(
    (acc, row) =>
      acc +
      row.cells.filter((c, idx) => {
        if (idx >= matrixHeaders.length) return false;
        return normalizeTextCell(c) !== null || cleanNumber(c) !== null;
      }).length,
    0
  );
  pasteBadges.innerHTML = badgeTemplates
    .concat([{ label: "Celle valorizzate", value: filledCells }])
    .map((b) => `<span class="badge"><strong>${b.value}</strong><span>${b.label}</span></span>`)
    .join("");

  const rowsForRecords = previewRows.filter((row, idx) => {
    const code = normalizeTextCell(row.cells[0]);
    const isHeader = idx === 0 && isHeaderRow(row.cells);
    const hasCode = code && code !== "0";
    return !isHeader && hasCode;
  });
  lastParsedRecords = rowsForRecords.map((row) => mapRowToRecord(row.cells));
  confirmPasteBtn.disabled = lastParsedRecords.length === 0;
};

export const openPasteModal = () => {
  pasteModal?.classList.remove("hidden");
  resetPasteModal();
  pasteArea?.focus();
};

export const closePasteModal = () => {
  pasteModal?.classList.add("hidden");
};

export const confirmParsedRecords = () => {
  const nextConfigs = buildConfigsFromRecords(lastParsedRecords);
  const nextOptionals = buildOptionalsFromRecords(lastParsedRecords);
  setConfigs(nextConfigs);
  setOptionals(nextOptionals);
  renderUserPanels();
  updateSummary();
  renderAdminTables();
  renderCatalog();
  if (jsonPreview) jsonPreview.value = JSON.stringify(getPricingMatrix(), null, 2);
  closePasteModal();
};

export const exportJson = () => {
  const blob = new Blob([JSON.stringify(getPricingMatrix(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pricing-matrix.json";
  a.click();
  URL.revokeObjectURL(url);
};

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(",").map((h) => h.trim());
  const result = [];

  rows.forEach((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const record = Object.fromEntries(headers.map((h, idx) => [h, cells[idx]]));
    result.push({
      id: record.id,
      name: record.name,
      price: Number(record.price),
      category: record.category || "onboard",
    });
  });
  return { optionals: result, configs: getConfigs() };
};

export const handleFileImport = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target.result;
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = parseCsv(content);
      }
      if (parsed.configs) setConfigs(parsed.configs);
      if (parsed.optionals) setOptionals(parsed.optionals);
      renderUserPanels();
      updateSummary();
      renderAdminTables();
      renderCatalog();
    } catch (err) {
      alert("Errore di importazione. Controlla il formato.");
      console.error(err);
    }
  };
  reader.readAsText(file);
};

export const loadPricingMatrix = async () => {
  try {
    const res = await fetch("pricing-matrix.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("missing pricing-matrix.json");
    const data = await res.json();
    if (data.configs && data.configs.length) {
      setConfigs(data.configs);
    } else {
      setConfigs(JSON.parse(JSON.stringify(defaultConfigs)));
    }
    if (data.optionals && data.optionals.length) {
      setOptionals(data.optionals);
    } else {
      setOptionals(JSON.parse(JSON.stringify(defaultOptionals)));
    }
  } catch (err) {
    console.warn("Uso dati di default, file mancante o non leggibile:", err.message);
    resetDataToDefaults();
  }
  renderUserPanels();
  renderAdminTables();
  updateSummary();
  renderCatalog();
  if (jsonPreview) jsonPreview.value = JSON.stringify(getPricingMatrix(), null, 2);
};

export const initAdminEvents = () => {
  parsePasteBtn?.addEventListener("click", handlePasteParse);
  confirmPasteBtn?.addEventListener("click", confirmParsedRecords);
  pasteArea?.addEventListener("input", handlePasteParse);
  pasteArea?.addEventListener("paste", () => {
    setTimeout(handlePasteParse, 0);
  });
  pasteModal?.addEventListener("click", (event) => {
    if (event.target === pasteModal) closePasteModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !pasteModal?.classList.contains("hidden")) {
      closePasteModal();
    }
  });
  openPasteModalBtn?.addEventListener("click", openPasteModal);
  closePasteModalBtn?.addEventListener("click", closePasteModal);
  fileInput?.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) handleFileImport(file);
  });
};
