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

const paginatePrintPages = () => {
  const printSheet = document.querySelector(".print-sheet");
  const pages = document.getElementById("printPages");
  const template = document.getElementById("printPageTemplate");
  const flow = document.getElementById("printContent");

  if (!printSheet || !pages || !template || !flow) {
    return;
  }

  const sheetStyles = window.getComputedStyle(printSheet);
  const wasHidden = sheetStyles.display === "none";
  if (wasHidden) {
    printSheet.style.display = "block";
    printSheet.style.visibility = "hidden";
    printSheet.style.position = "absolute";
    printSheet.style.left = "-9999px";
    printSheet.style.top = "0";
  }

  pages.innerHTML = "";

  const head = flow.querySelector(".print-head");
  const config = flow.querySelector(".print-config");
  const signature = flow.querySelector(".print-signature");
  const descriptions = config ? config.querySelector("#printDescriptions") : null;

  const headClone = head ? head.cloneNode(true) : null;
  const configClone = config ? config.cloneNode(true) : null;
  const signatureClone = signature ? signature.cloneNode(true) : null;
  const descriptionSections = descriptions
    ? Array.from(descriptions.children).filter((child) => child.classList.contains("print-desc-section"))
    : [];

  if (!headClone && !configClone && !signatureClone && descriptionSections.length === 0) {
    return;
  }

  const createPage = () => {
    const page = template.content.firstElementChild.cloneNode(true);
    pages.appendChild(page);
    return page;
  };

  const measurePage = createPage();
  measurePage.style.visibility = "hidden";
  measurePage.style.position = "absolute";
  measurePage.style.left = "-9999px";
  measurePage.style.top = "0";
  pages.removeChild(measurePage);

  let page = createPage();
  let body = page.querySelector(".print-page-body");

  const isOverflowing = () => body.scrollHeight > body.clientHeight + 1;

  const startNewPage = () => {
    page = createPage();
    body = page.querySelector(".print-page-body");
  };

  const appendBlock = (node) => {
    body.appendChild(node);
    if (isOverflowing()) {
      body.removeChild(node);
      if (body.childElementCount === 0) {
        body.appendChild(node);
        return;
      }
      startNewPage();
      body.appendChild(node);
    }
  };

  const buildSectionShell = (section) => {
    const shell = document.createElement("div");
    shell.className = section.className;
    const title = section.querySelector(".print-desc-title");
    if (title) {
      shell.appendChild(title.cloneNode(true));
    }
    const list = section.querySelector(".print-desc-list");
    if (list) {
      shell.appendChild(list.cloneNode(false));
    }
    return shell;
  };

  const appendSection = (section) => {
    const list = section.querySelector(".print-desc-list");
    const note = section.querySelector(".print-desc-note");
    const items = list ? Array.from(list.children) : [];

    if (items.length === 0) {
      appendBlock(section.cloneNode(true));
      return;
    }

    let shell = buildSectionShell(section);
    body.appendChild(shell);
    let listClone = shell.querySelector(".print-desc-list");

    items.forEach((item) => {
      listClone.appendChild(item.cloneNode(true));
      if (isOverflowing()) {
        listClone.removeChild(listClone.lastChild);
        if (listClone.children.length === 0) {
          body.removeChild(shell);
        }
        startNewPage();
        shell = buildSectionShell(section);
        body.appendChild(shell);
        listClone = shell.querySelector(".print-desc-list");
        listClone.appendChild(item.cloneNode(true));
      }
    });

    if (note) {
      const noteClone = note.cloneNode(true);
      shell.appendChild(noteClone);
      if (isOverflowing()) {
        shell.removeChild(noteClone);
        startNewPage();
        const noteSection = buildSectionShell(section);
        noteSection.appendChild(noteClone);
        body.appendChild(noteSection);
        if (isOverflowing()) {
          // If the note is still too tall, keep it anyway.
        }
      }
    }
  };

  if (configClone) {
    const configDescriptions = configClone.querySelector("#printDescriptions");
    if (configDescriptions) {
      configDescriptions.remove();
    }
  }

  if (headClone) {
    appendBlock(headClone);
  }

  if (configClone) {
    appendBlock(configClone);
  }

  descriptionSections.forEach((section) => {
    if (section.classList.contains("print-desc-page-break")) {
      if (body.childElementCount > 0) {
        startNewPage();
      }
    }
    appendSection(section);
  });

  if (signatureClone) {
    appendBlock(signatureClone);
  }

  if (wasHidden) {
    printSheet.style.display = "";
    printSheet.style.visibility = "";
    printSheet.style.position = "";
    printSheet.style.left = "";
    printSheet.style.top = "";
  }
};

let printHandlersBound = false;

export const setupPrintButton = () => {
  const printBtn = document.getElementById("printBtn");

  if (!printHandlersBound) {
    window.addEventListener("beforeprint", () => {
      renderPrintSheet();
      paginatePrintPages();
    });
    printHandlersBound = true;
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      renderPrintSheet();
      paginatePrintPages();
      setTimeout(() => {
        window.print();
      }, 100);
    });
  }
};
