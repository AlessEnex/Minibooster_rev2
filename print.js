import { appState, formatDate, formatPrice, getOptionals, groupMtByName, machineTypes } from "./state.js";
import { getDictionary } from "./i18n.js";

export const renderPrintSheet = () => {
  const dict = getDictionary();
  const printTitle = document.getElementById("printTitle");
  const printProjectMeta = document.getElementById("printProjectMeta");
  const printSummaryList = document.getElementById("printSummaryList");
  const printTotal = document.getElementById("printTotal");

  // Titolo
  if (printTitle) {
    printTitle.textContent = dict.print_title || "Offerta";
  }

  // Metadati progetto
  if (printProjectMeta) {
    const { name, date, owner, language } = appState.selections.project;
    const machineType = machineTypes.find((m) => m.id === appState.selections.machineType);
    
    printProjectMeta.innerHTML = `
      <div><strong>Progetto:</strong> ${name || "—"}</div>
      <div><strong>Data richiesta:</strong> ${formatDate(date) || "—"}</div>
      <div><strong>Owner:</strong> ${owner || "—"}</div>
      <div><strong>Lingua:</strong> ${language || "—"}</div>
      ${machineType ? `<div><strong>Tipo macchina:</strong> ${machineType.name}</div>` : ""}
    `;
  }

  // Configurazione
  const rows = [];
  let total = 0;
  const grouped = appState.selections.brand ? groupMtByName(appState.selections.brand) : [];
  const mtSelected = grouped.find((g) => g.id === appState.selections.mtKey);
  const ltOptionsList =
    appState.selections.ltPressure === "36"
      ? mtSelected?.lt36Options || []
      : appState.selections.ltPressure === "60"
      ? mtSelected?.lt60Options || []
      : [];
  const ltSelected = ltOptionsList.find((o) => o.id === appState.selections.ltChoice);

  if (appState.selections.brand) {
    rows.push([dict.summary_brand_label || "Brand", appState.selections.brand === "dorin" ? "Dorin" : "Bitzer", null]);
  }

  if (mtSelected) {
    rows.push([dict.summary_mt_label || "MT", `${mtSelected.mtName}`, mtSelected.mtPrice]);
    total += mtSelected.mtPrice;
  }

  if (ltSelected && appState.selections.ltChoice !== "none") {
    rows.push([
      dict.summary_lt_label || "LT",
      `${appState.selections.brand === "dorin" ? "Dorin" : "Bitzer"} ${ltSelected.pressure} bar - ${ltSelected.name}`,
      ltSelected.price,
    ]);
    total += ltSelected.price;
  }

  const optItems = getOptionals().filter((o) => appState.selections.optionals.has(o.id));
  optItems.forEach((o) => {
    rows.push([dict.summary_optional_label || "Optional", o.name, o.price]);
    total += o.price;
  });

  if (appState.selections.gascooler) {
    rows.push([dict.summary_gascooler_label || "Gascooler", dict.step5_label || "Gascooler", 0]);
  }

  if (appState.selections.transport.enabled) {
    const km = appState.selections.transport.km || 0;
    const price = appState.selections.transport.price || 0;
    const kmSuffix = dict.summary_km_suffix || "km";
    rows.push([dict.summary_transport_label || dict.step6_label || "Trasporto", `${km} ${kmSuffix}`, price]);
    total += price;
  }

  const discountPerc = Number(appState.selections.discount) || 0;
  if (discountPerc > 0) {
    const discountValue = (total * discountPerc) / 100;
    rows.push([`${dict.summary_discount_label || "Discount"} (${discountPerc}%)`, "", -discountValue]);
    total -= discountValue;
  }

  const summaryHtml = rows
    .map(
      ([label, name, price]) =>
        `<div class="summary-row"><span>${label}: ${name}</span><span>${formatPrice(price)}</span></div>`
    )
    .join("");

  const totalLabel = dict.print_total_label || "Totale";
  const totalRow = `<div class="summary-row total-row"><span><strong>${totalLabel}</strong></span><span><strong>${formatPrice(total)}</strong></span></div>`;

  if (printSummaryList) {
    printSummaryList.innerHTML = summaryHtml + totalRow;
  }

  if (printTotal) {
    printTotal.textContent = formatPrice(total);
  }
};

export const setupPrintButton = () => {
  const printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      renderPrintSheet();
      setTimeout(() => {
        window.print();
      }, 100);
    });
  }
};
