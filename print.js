import {
  appState,
  formatDate,
  formatPrice,
  getExtraCosts,
  getOptionalsForConfig,
  getSelectedConfig,
  groupMtByName,
  machineTypes,
} from "./state.js";
import { getDictionary } from "./i18n.js";
import { getPrintDescriptions } from "./print-descriptions.js";
import {
  getCablingExtraPrice,
  getCablingStandardPrice,
  getLtDisplayPressure,
  getTagoProbesRule,
  isCablingChoiceMissing,
  parseCablingMeters,
} from "./summary.js";

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
          <span class="print-meta-label">${(dict.meta_offer_number || "OFFERTA N°").toUpperCase()}:</span>
          <span class="print-meta-value">${offerNumber || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">${(dict.meta_revision || "REVISIONE").toUpperCase()}:</span>
          <span class="print-meta-value">${revision || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">${(dict.meta_client || "CLIENTE").toUpperCase()}:</span>
          <span class="print-meta-value">${client || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">${(dict.meta_requested_by || "RICHIESTO DA").toUpperCase()}:</span>
          <span class="print-meta-value">${requestedBy || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">${(dict.meta_owner || "OWNER").toUpperCase()}:</span>
          <span class="print-meta-value">${owner || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">${(dict.meta_project_name || "PROGETTO").toUpperCase()}:</span>
          <span class="print-meta-value">${name || "—"}</span>
        </div>
        <div class="print-meta-row">
          <span class="print-meta-label">${(dict.machine_title || "MODELLO SELEZIONATO").toUpperCase()}:</span>
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
  const selectedConfig = getSelectedConfig();
  const tagoProbes = getTagoProbesRule();

  if (appState.selections.brand) {
    rows.push([dict.summary_brand_label || "Brand", appState.selections.brand === "dorin" ? "Dorin" : "Bitzer", null]);
  }

  if (mtSelected) {
    const mtPrice = selectedConfig?.mt?.[appState.selections.brand]?.price ?? mtSelected.mtPrice;
    rows.push([dict.summary_mt_label || "MT", `${mtSelected.mtName}`, mtPrice]);
    if (mtPrice !== null && mtPrice !== undefined) {
      total += mtPrice;
    }
  }


  if (ltSelected && appState.selections.ltChoice !== "none") {
    const displayPressure = getLtDisplayPressure(ltSelected.pressure, appState.selections.brand);
    rows.push([
      dict.summary_lt_label || "LT",
      `${appState.selections.brand === "dorin" ? "Dorin" : "Bitzer"} ${displayPressure} bar - ${ltSelected.name}`,
      ltSelected.price,
    ]);
    total += ltSelected.price;
  }

  const optItems = getOptionalsForConfig().filter((o) => appState.selections.optionals.has(o.id));
  optItems.forEach((o) => {
    rows.push([dict.summary_optional_label || "Optional", o.name, o.price]);
    if (o.price !== null && o.price !== undefined && o.price !== -1 && o.price !== -2) {
      total += o.price;
    }
  });

  if (appState.selections.electricalPanelChoice === "none") {
    rows.push([dict.summary_optional_label || "Optional", dict.step4_electrical_panel_none || "Nessun quadro fornito", 0]);
  }

  if (!isCablingChoiceMissing()) {
    const basePrice = getCablingStandardPrice();
    const meters = parseCablingMeters(appState.selections.cablingExtraMeters);
    const cablingChoice = appState.selections.cablingChoice;
    const cablingName =
      cablingChoice === "extra"
        ? `${dict.step4_cabling_extra || "Cablaggio extra"} (${meters} m)`
        : dict.step4_cabling_standard || "Cablaggio standard";
    const cablingPrice = cablingChoice === "extra" ? getCablingExtraPrice(basePrice, meters) : basePrice;

    rows.push([dict.summary_cabling_label || "Cablaggio", cablingName, cablingPrice]);
    if (
      cablingPrice !== null &&
      cablingPrice !== undefined &&
      cablingPrice !== -1 &&
      cablingPrice !== -2
    ) {
      total += cablingPrice;
    }
  }

  const probeSelectedId = tagoProbes.optionId || appState.selections.probesChoice;
  if (probeSelectedId) {
    const probe = getOptionalsForConfig().find((o) => o.id === probeSelectedId);
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

  const oilKgRaw = parseInt(appState.selections.oilKg, 10);
  const oilKg = Number.isNaN(oilKgRaw) ? 0 : Math.max(0, oilKgRaw);
  if (appState.selections.oilEnabled && oilKg > 0 && oilKg % 5 === 0) {
    const oilPricePerKg = getExtraCosts().oilPricePerKg;
    const oilPrice = (Number.isFinite(oilPricePerKg) ? oilPricePerKg : 0) * oilKg;
    const oilLabel = dict.step6_oil_label || "Olio";
    rows.push([dict.summary_optional_label || "Optional", `${oilLabel} (${oilKg} kg)`, oilPrice]);
    total += oilPrice;
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

  // Gascooler sempre alla fine in grassetto
  const gascoolerRows = [];
  if (appState.selections.gascooler) {
    const gascoolerPrice = Number(appState.selections.gascoolerPrice) || 0;
    gascoolerRows.push([dict.summary_gascooler_label || "Gascooler", dict.step7_label || "Gascooler", gascoolerPrice, true]);
    total += gascoolerPrice;
    
    // Aggiungi voci custom gascooler
    appState.selections.gascoolerCustomItems.forEach((item) => {
      if (item.description && item.description.trim()) {
        const itemPrice = Number(item.price) || 0;
        gascoolerRows.push([dict.summary_optional_label || "Optional", item.description, itemPrice, true]);
        total += itemPrice;
      }
    });
  }

  const summaryHtml = rows
    .map(
      ([label, name, price]) => {
        const priceLabel = price === null || price === undefined ? "" : formatPrice(price);
        return `<div class="summary-row"><span>${label}: ${name}</span><span>${priceLabel}</span></div>`;
      }
    )
    .join("");

  const gascoolerHtml = gascoolerRows
    .map(
      ([label, name, price]) => {
        const priceLabel = price === null || price === undefined ? "" : formatPrice(price);
        return `<div class="summary-row gascooler-row"><span><strong>${label}: ${name}</strong></span><span><strong>${priceLabel}</strong></span></div>`;
      }
    )
    .join("");

  const totalLabel = dict.print_total_label || "Totale";
  const totalRow = `<div class="summary-row total-row"><span><strong>${totalLabel}</strong></span><span><strong>${formatPrice(total)}</strong></span></div>`;

  if (printSummaryList) {
    printSummaryList.innerHTML = summaryHtml + gascoolerHtml + totalRow;
  }

  if (printTotal) {
    printTotal.textContent = formatPrice(total);
  }

  if (printDescriptions) {
    const sections = getPrintDescriptions(appState.selections.machineType, appState.selections.project.language);
    const hasElectricalPanel = appState.selections.electricalPanelChoice === "electrical_panel";
    const hasWurmCustomer = appState.selections.optionals.has("wurm_customer");
    const hasProbesCustomer = appState.selections.probesChoice === "probes_customer_supplied";
    
    const filteredSections = sections.filter((section) => {
      if (section.requiresElectricalPanel && !hasElectricalPanel) {
        return false;
      }
      if (section.id === "controller_wurm_customer" && !hasWurmCustomer) {
        return false;
      }
      if (section.id === "probes_customer" && !hasProbesCustomer) {
        return false;
      }
      return true;
    });
    const hasLT = appState.selections.ltChoice && appState.selections.ltChoice !== "none";
    const isLt60 = hasLT && appState.selections.ltPressure === "60";
    const mtSuction = isLt60 ? 60 : 52;
    const brand = appState.selections.brand;
    const ltSuction = !hasLT ? null : isLt60 ? 60 : brand === "bitzer" ? 30 : 36;
    const psMaxItems = [
      `${dict.psmax_hp_label || "HP"}: 120 bar`,
      `${dict.psmax_liquid_receiver_label || "Liquid receiver"}: ${
        dict.psmax_liquid_receiver_values || "60 bar during operation"
      }`,
      `${dict.psmax_mt_suction_label || "MT suction"}: ${mtSuction} bar`,
    ];
    if (ltSuction !== null) {
      psMaxItems.push(`${dict.psmax_lt_suction_label || "LT suction"}: ${ltSuction} bar`);
    }
    const psMaxSection = {
      title: dict.psmax_title || "PS MAX",
      items: psMaxItems,
      className: "print-desc-psmax",
    };
    if (filteredSections.length === 0) {
      const renderedOnly = [psMaxSection]
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
      printDescriptions.innerHTML = renderedOnly.length ? renderedOnly.join("") : "";
    } else {
      const renderedSections = [psMaxSection, ...filteredSections]
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
  let summaryRows = [];
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
    const configSummaryList = configClone.querySelector(".summary-list");
    if (configSummaryList) {
      summaryRows = Array.from(configSummaryList.children);
      configSummaryList.innerHTML = "";
    }
  }

  if (summaryRows.length > 0 && !summaryRows.some((row) => row.classList.contains("total-row"))) {
    const dict = getDictionary();
    const totalLabel = dict.print_total_label || "Totale";
    const printTotalEl = document.getElementById("printTotal");
    const totalValue = printTotalEl ? printTotalEl.textContent : "";
    const totalRow = document.createElement("div");
    totalRow.className = "summary-row total-row";
    totalRow.innerHTML = `<span><strong>${totalLabel}</strong></span><span><strong>${totalValue}</strong></span>`;
    summaryRows.push(totalRow);
  }

  if (headClone) {
    appendBlock(headClone);
  }

  const appendConfigRows = () => {
    if (!configClone || summaryRows.length === 0) {
      return;
    }
    const buildShell = () => {
      const shell = configClone.cloneNode(true);
      const list = shell.querySelector(".summary-list");
      if (list) {
        list.innerHTML = "";
      }
      return shell;
    };

    let shell = buildShell();
    let list = shell.querySelector(".summary-list");
    body.appendChild(shell);
    if (isOverflowing()) {
      body.removeChild(shell);
      startNewPage();
      shell = buildShell();
      list = shell.querySelector(".summary-list");
      body.appendChild(shell);
    }

    summaryRows.forEach((row) => {
      if (!list) {
        return;
      }
      list.appendChild(row.cloneNode(true));
      if (isOverflowing()) {
        list.removeChild(list.lastChild);
        if (list.children.length === 0) {
          list.appendChild(row.cloneNode(true));
          return;
        }
        startNewPage();
        shell = buildShell();
        list = shell.querySelector(".summary-list");
        if (list) {
          body.appendChild(shell);
          list.appendChild(row.cloneNode(true));
        }
      }
    });
  };

  if (configClone) {
    if (summaryRows.length > 0) {
      appendConfigRows();
    } else {
      appendBlock(configClone);
    }
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

export const renderPrintPreview = () => {
  renderPrintSheet();
  paginatePrintPages();
};

let activePrintFrame = null;
const PRINT_PAGINATION_TRIM = "8mm";

const buildPreviewPrintHtml = (pagesHtml) => {
  const baseHref = (document.baseURI || "").replace(/"/g, "&quot;");
  const lang = document.documentElement.lang || "it";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <base href="${baseHref}">
  <title>Print preview</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body { margin: 0; }
    body.print-preview,
    body.print-preview.dark-mode { background: #ffffff; }
    .print-preview-toolbar { display: none !important; }
    @page { size: A4; margin: 0; }
    body.print-preview .print-sheet { --print-page-trim: ${PRINT_PAGINATION_TRIM} !important; }
    @media print {
      body.print-preview { margin: 0; background: #ffffff !important; }
      body.print-preview .print-sheet { --print-page-trim: ${PRINT_PAGINATION_TRIM} !important; }
      body.print-preview .print-page {
        page-break-after: always;
        break-after: page;
        box-shadow: none !important;
        outline: none !important;
        margin: 0;
      }
      body.print-preview .print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      body.print-preview .print-debug-strip { display: none !important; }
      body.print-preview .print-page::before,
      body.print-preview .print-page::after { content: none !important; }
    }
  </style>
</head>
<body class="print-preview">
  <section class="print-sheet">
    <div class="print-pages">${pagesHtml}</div>
  </section>
</body>
</html>`;
};

const waitForImages = (doc) => {
  const images = Array.from(doc.images || []);
  if (images.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
    )
  );
};

const cleanupPrintFrame = () => {
  if (activePrintFrame) {
    activePrintFrame.remove();
    activePrintFrame = null;
  }
};

const withPrintPreviewClass = (callback) => {
  const body = document.body;
  const hadClass = body ? body.classList.contains("print-preview") : false;
  if (body && !hadClass) {
    body.classList.add("print-preview");
  }
  callback();
  if (body && !hadClass) {
    body.classList.remove("print-preview");
  }
};

const withPrintPaginationTrim = (callback) => {
  const printSheet = document.querySelector(".print-sheet");
  const previous = printSheet ? printSheet.style.getPropertyValue("--print-page-trim") : "";
  if (printSheet) {
    printSheet.style.setProperty("--print-page-trim", PRINT_PAGINATION_TRIM);
  }
  callback();
  if (printSheet) {
    if (previous) {
      printSheet.style.setProperty("--print-page-trim", previous);
    } else {
      printSheet.style.removeProperty("--print-page-trim");
    }
  }
};

export const renderPrintPreviewForPrint = () => {
  withPrintPreviewClass(() => {
    withPrintPaginationTrim(() => {
      renderPrintPreview();
    });
  });
};

export const printFromPreview = () => {
  renderPrintPreviewForPrint();
  const pages = document.getElementById("printPages");
  if (!pages || pages.childElementCount === 0 || !document.body) {
    return false;
  }

  cleanupPrintFrame();
  const html = buildPreviewPrintHtml(pages.innerHTML);

  const frame = document.createElement("iframe");
  frame.setAttribute("title", "print-preview");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.visibility = "hidden";
  frame.style.pointerEvents = "none";

  frame.addEventListener(
    "load",
    () => {
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      if (!doc || !win) {
        cleanupPrintFrame();
        return;
      }
      win.addEventListener("afterprint", cleanupPrintFrame, { once: true });
      waitForImages(doc).then(() => {
        win.focus();
        win.print();
        setTimeout(cleanupPrintFrame, 5000);
      });
    },
    { once: true }
  );

  activePrintFrame = frame;
  frame.srcdoc = html;
  document.body.appendChild(frame);
  return true;
};

let printHandlersBound = false;

export const setupPrintButton = () => {
  const printBtn = document.getElementById("printBtn");

  if (!printHandlersBound) {
    window.addEventListener("beforeprint", () => {
      renderPrintPreviewForPrint();
    });
    printHandlersBound = true;
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      if (!printFromPreview()) {
        renderPrintPreviewForPrint();
        setTimeout(() => {
          window.print();
        }, 100);
      }
    });
  }
};
