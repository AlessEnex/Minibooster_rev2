import { appState, formatDate, formatPrice, getOptionals, groupMtByName, machineTypes } from "./state.js";
import { getDictionary } from "./i18n.js";
import { getPrintDescriptions } from "./print-descriptions.js";

export const renderPrintSheet = () => {
  const dict = getDictionary();
  const printTitle = document.getElementById("printTitle");
  const printProjectMeta = document.getElementById("printProjectMeta");
  const printSummaryList = document.getElementById("printSummaryList");
  const printTotal = document.getElementById("printTotal");
  const printDescriptions = document.getElementById("printDescriptions");

  // Titolo
  if (printTitle) {
    printTitle.textContent = dict.print_title || "Offerta";
  }

  // Metadati progetto
  if (printProjectMeta) {
    const { name, date, owner, language, offerNumber, revision, client, requestedBy } = appState.selections.project;
    const machineType = machineTypes.find((m) => m.id === appState.selections.machineType);
    const machineTypeName = machineType ? machineType.name : "—";
    
    printProjectMeta.innerHTML = `
      <div class="print-meta-grid">
        <div class="print-meta-row">
          <span class="print-meta-label">OFFERTA N°:</span>
          <span class="print-meta-value">${offerNumber || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">REVISIONE:</span>
          <span class="print-meta-value">${revision || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">CLIENTE:</span>
          <span class="print-meta-value">${client || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">RICHIESTO DA:</span>
          <span class="print-meta-value">${requestedBy || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">OWNER:</span>
          <span class="print-meta-value">${owner || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">PROGETTO:</span>
          <span class="print-meta-value">${name || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">MODELLO SELEZIONATO:</span>
          <span class="print-meta-value">${machineTypeName}</span>
        </div>
      </div>
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
    if (o.price !== null && o.price !== undefined && o.price !== -1 && o.price !== -2) {
      total += o.price;
    }
  });

  const probeSelectedId = appState.selections.probesChoice;
  if (probeSelectedId) {
    const probe = getOptionals().find((o) => o.id === probeSelectedId);
    if (probe) {
      rows.push([dict.summary_probes_label || "Sonde", probe.name, probe.price]);
      if (
        probe.price !== null &&
        probe.price !== undefined &&
        probe.price !== -1 &&
        probe.price !== -2
      ) {
        total += probe.price;
      }
    }
  }

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

  if (printDescriptions) {
    const sections = getPrintDescriptions(appState.selections.machineType, appState.selections.project.language);
    const hasElectricalPanel = appState.selections.electricalPanelChoice === "electrical_panel";
    const filteredSections = sections.filter((section) => {
      if (section.requiresElectricalPanel && !hasElectricalPanel) {
        return false;
      }
      return true;
    });
    if (filteredSections.length === 0) {
      printDescriptions.innerHTML = "";
    } else {
      const renderedSections = filteredSections
        .map((section) => {
          const cleanedItems = Array.isArray(section.items)
            ? section.items.filter((item) => typeof item === "string" && item.trim().length > 0)
            : [];
          const hasItems = cleanedItems.length > 0;
          const hasNote = typeof section.note === "string" && section.note.trim().length > 0;
          const hasTitle = typeof section.title === "string" && section.title.trim().length > 0;

          if (!hasItems && !hasNote) {
            return "";
          }

          const title = hasTitle ? `<h4 class="print-desc-title">${section.title}</h4>` : "";
          const items = hasItems
            ? `<ul class="print-desc-list">${cleanedItems
                .map((item) => `<li>${item}</li>`)
                .join("")}</ul>`
            : "";
          const note = hasNote ? `<p class="print-desc-note">${section.note}</p>` : "";
          const classNames = ["print-desc-section"];
          if (section.className) {
            classNames.push(section.className);
          }
          if (section.pageBreakBefore) {
            classNames.push("print-desc-page-break");
          }
          return `<div class="${classNames.join(" ")}">${title}${items}${note}</div>`;
        })
        .filter(Boolean);

      printDescriptions.innerHTML = renderedSections.length ? renderedSections.join("") : "";
    }
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
