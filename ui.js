import {
  appState,
  catalogFilters,
  formatDate,
  formatPrice,
  getOptionals,
  groupMtByName,
  machineTypes,
  isProjectComplete,
  getFilteredConfigs,
} from "./state.js";
import { getDictionary } from "./i18n.js";

const machineTypeOptions = document.getElementById("machineTypeOptions");
const machineTypeSelector = document.getElementById("machineTypeSelector");
const funnelSection = document.getElementById("funnel");
const summaryPanel = document.querySelector(".summary-panel");
const brandOptions = document.getElementById("brandOptions");
const codeOptions = document.getElementById("codeOptions");
const ltOptions = document.getElementById("ltOptions");
const optionalOptions = document.getElementById("optionalOptions");
const summaryList = document.getElementById("summaryList");
const projectMetaView = document.getElementById("projectMetaView");
const printSummaryList = document.getElementById("printSummaryList");
const printTotal = document.getElementById("printTotal");
const printProjectMeta = document.getElementById("printProjectMeta");
const totalPriceEl = document.getElementById("totalPrice");
const discountInput = document.getElementById("discountInput");
const gascoolerToggle = document.getElementById("gascoolerToggle");
const transportToggle = document.getElementById("transportToggle");
const transportCountrySelect = document.getElementById("transportCountry");
const transportCityInput = document.getElementById("transportCity");
const transportInfo = document.getElementById("transportInfo");
const transportResetBtn = document.getElementById("transportReset");
const transportSuggestions = document.getElementById("transportSuggestions");
const stepDots = document.getElementById("stepDots");
const catalogList = document.getElementById("catalogList");
const catalogEmpty = document.getElementById("catalogEmpty");
const catalogOnlyLtToggle = document.getElementById("catalogOnlyLt");
const catalogBrandButtons = document.querySelectorAll("[data-catalog-brand]");
const catalogSection = document.getElementById("catalog");
const catalogToggleBtn = document.getElementById("catalogToggle");
const themeToggleBtn = document.getElementById("themeToggle");

const renderOptionCard = (item, group, multiple, opts = {}) => {
  const option = document.createElement("div");
  option.className = "option";
  option.innerHTML = `
    <div class="title-row">
      <div>
        <strong>${item.name}</strong>
        ${item.subtitle ? `<div class="subtitle">${item.subtitle}</div>` : ""}
      </div>
      ${item.badge ? `<span class="pill subtle">${item.badge}</span>` : ""}
    </div>
    <p class="price">${formatPrice(item.price)}</p>
  `;

  const isSelected = multiple
    ? appState.selections[group].has(item.id)
    : appState.selections[group] === item.id;
  if (isSelected) option.classList.add("selected");

  option.addEventListener("click", () => {
    if (multiple) {
      if (appState.selections[group].has(item.id)) {
        appState.selections[group].delete(item.id);
      } else {
        if (opts.exclusiveIds && Array.isArray(opts.exclusiveIds)) {
          opts.exclusiveIds.forEach((id) => appState.selections[group].delete(id));
        }
        appState.selections[group].add(item.id);
      }
    } else {
      appState.selections[group] = item.id;
      if (group === "machineType") {
        // Reset tutto quando cambia tipo macchina
        appState.selections.brand = null;
        appState.selections.mtKey = null;
        appState.selections.ltPressure = null;
        appState.selections.ltChoice = null;
        appState.selections.optionals = new Set();
        // Mostra il funnel e renderizza
        if (funnelSection) funnelSection.classList.remove("hidden");
        renderUserPanels();
        updateSummary();
        goToStep(1);
        // Forza scroll con spazio temporaneo
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (funnelSection) {
              const rect = funnelSection.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const targetPosition = rect.top + scrollTop;
              const viewportHeight = window.innerHeight;
              
              // Aggiungi padding-bottom per garantire spazio di scroll
              const body = document.body;
              const neededPadding = viewportHeight;
              body.style.paddingBottom = neededPadding + "px";
              
              // Scroll
              window.scrollTo({ top: targetPosition, behavior: "smooth" });
            }
          });
        });
        return; // Evita doppio render sotto
      }
      if (group === "brand") {
        appState.selections.mtKey = null;
        appState.selections.ltPressure = null;
        appState.selections.ltChoice = null;
        appState.selections.optionals = new Set();
      }
      if (group === "mtKey") {
        appState.selections.ltPressure = null;
        appState.selections.ltChoice = null;
        appState.selections.optionals = new Set();
      }
      if (group === "ltChoice") {
        if (item.pressure) {
          appState.selections.ltPressure = item.pressure;
        }
        // Rimuovi differentials incompatibili quando cambia LT
        const hasLT = item.id !== "none";
        if (hasLT) {
          // Se ora c'è LT, rimuovi "diff_mt" e mantieni solo "diff_mt_lt"
          appState.selections.optionals.delete("diff_mt");
        } else {
          // Se ora NON c'è LT, rimuovi "diff_mt_lt" e mantieni solo "diff_mt"
          appState.selections.optionals.delete("diff_mt_lt");
        }
      }
    }
    renderUserPanels();
    updateSummary();
    
    // Auto-avanzamento per gli step 1, 2, 3 (selezioni singole)
    if (!multiple && (group === "brand" || group === "mtKey" || group === "ltChoice")) {
      setTimeout(() => goToStep(appState.step + 1), 300);
    }
  });

  return option;
};

const renderMachineTypeOptions = () => {
  if (!machineTypeOptions) return;
  machineTypeOptions.innerHTML = "";
  machineTypes.forEach((machine) => {
    const option = renderOptionCard(
      {
        id: machine.id,
        name: machine.name,
        price: 0,
      },
      "machineType",
      false
    );
    machineTypeOptions.appendChild(option);
  });
};

const renderBrandOptions = () => {
  if (!brandOptions) return;
  brandOptions.innerHTML = "";
  [
    { id: "dorin", name: "Dorin" },
    { id: "bitzer", name: "Bitzer" },
  ].forEach((item) =>
    brandOptions.appendChild(
      renderOptionCard(
        {
          id: item.id,
          name: item.name,
          price: 0,
        },
        "brand",
        false
      )
    )
  );
};

const renderCodeOptions = () => {
  if (!codeOptions) return;
  codeOptions.innerHTML = "";
  if (!appState.selections.brand) {
    codeOptions.innerHTML = `<p class="hint">Seleziona una marca per vedere le combinazioni MT.</p>`;
    return;
  }
  const grouped = groupMtByName(appState.selections.brand);
  grouped.forEach((item) => {
    const option = renderOptionCard(
      {
        id: item.id,
        name: item.mtName,
        price: item.mtPrice,
      },
      "mtKey",
      false
    );
    codeOptions.appendChild(option);
  });
};

const renderLtOptions = () => {
  if (!ltOptions) return;
  ltOptions.innerHTML = "";
  if (!appState.selections.brand) {
    ltOptions.innerHTML = `<p class="hint">Seleziona marca e combinazione MT per vedere LT disponibili.</p>`;
    return;
  }
  const grouped = groupMtByName(appState.selections.brand);
  const mtSelected = grouped.find((g) => g.id === appState.selections.mtKey);
  if (!mtSelected) {
    ltOptions.innerHTML = `<p class="hint">Seleziona prima la combinazione MT.</p>`;
    return;
  }

  const pressures = [];
  if (mtSelected.lt36Options.length) pressures.push("36");
  if (mtSelected.lt60Options.length) pressures.push("60");

  const pressureRow = document.createElement("div");
  pressureRow.className = "pressure-row";
  pressures.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "button" + (appState.selections.ltPressure === p ? " primary" : " ghost");
    btn.textContent = `${p} bar`;
    btn.addEventListener("click", () => {
      appState.selections.ltPressure = p;
      appState.selections.ltChoice = null;
      renderLtOptions();
      updateSummary();
    });
    pressureRow.appendChild(btn);
  });
  if (pressureRow.children.length) {
    ltOptions.appendChild(pressureRow);
  }

  const options = [{ id: "none", name: "Nessun LT", subtitle: "Solo MT", price: 0, pressure: null }];
  const selectedPressure = appState.selections.ltPressure || pressures[0] || null;
  if (selectedPressure === "36") {
    mtSelected.lt36Options.forEach((opt) =>
      options.push({
        id: opt.id,
        name: `${selectedPressure} bar - ${opt.name}`,
        subtitle: "",
        price: opt.price,
        pressure: "36",
      })
    );
  }
  if (selectedPressure === "60") {
    mtSelected.lt60Options.forEach((opt) =>
      options.push({
        id: opt.id,
        name: `${selectedPressure} bar - ${opt.name}`,
        subtitle: "",
        price: opt.price,
        pressure: "60",
      })
    );
  }

  options.forEach((opt) => {
    const optionEl = renderOptionCard(opt, "ltChoice", false);
    ltOptions.appendChild(optionEl);
  });

  if (options.length === 1) {
    ltOptions.insertAdjacentHTML(
      "beforeend",
      `<p class="hint">Per questa combinazione MT non ci sono LT associati (${appState.selections.brand}).</p>`
    );
  }
};

const renderOptionalOptions = () => {
  if (!optionalOptions) return;
  optionalOptions.innerHTML = "";
  const optionals = getOptionals();
  
  // Verifica se c'è LT selezionato (diverso da null e "none")
  const hasLT = appState.selections.ltChoice && appState.selections.ltChoice !== "none";
  
  const groups = [
    { title: "Controllori", ids: ["carel", "danfoss_782"], exclusiveIds: [] },
    { title: "Opzioni", ids: ["heat_recovery", "ducting"], exclusiveIds: [] },
    { title: "Carenatura", ids: ["cladding_indoor", "cladding_outdoor"], exclusiveIds: ["cladding_indoor", "cladding_outdoor"] },
    { title: "Quadro elettrico", ids: ["diff_mt", "diff_mt_lt", "mx_coil"], exclusiveIds: ["diff_mt", "diff_mt_lt"] },
    {
      title: "Accessori spare parts",
      ids: ["muffler_sp", "ccmt_sp", "gascooler_spare", "carton_572a", "carton_300t", "carton_782a"],
      exclusiveIds: [],
    },
  ];

  groups.forEach((group) => {
    const container = document.createElement("div");
    container.className = "option-group";
    container.innerHTML = `<h4>${group.title}</h4>`;
    group.ids.forEach((id) => {
      // Filtra i differentials basandosi sulla presenza di LT
      if (id === "diff_mt" && hasLT) return; // Salta "Differential MT" se c'è LT
      if (id === "diff_mt_lt" && !hasLT) return; // Salta "Differentials MT/LT" se NON c'è LT
      
      const opt = optionals.find((o) => o.id === id);
      if (!opt) return;
      const exclusiveIds = group.exclusiveIds?.includes(id) ? group.exclusiveIds : [];
      const optionEl = renderOptionCard(
        {
          id: opt.id,
          name: opt.name,
          price: opt.price,
          badge: opt.category === "onboard" ? "On-board" : "Spare",
        },
        "optionals",
        true,
        { exclusiveIds }
      );
      container.appendChild(optionEl);
    });
    optionalOptions.appendChild(container);
  });
};

const renderProjectMeta = () => {
  if (!projectMetaView) return;
  const { name, date, owner, language } = appState.selections.project;
  projectMetaView.innerHTML = `
    <div><strong>Progetto:</strong> ${name || "—"}</div>
    <div><strong>Data richiesta:</strong> ${formatDate(date) || "—"}</div>
    <div><strong>Owner:</strong> ${owner || "—"}</div>
    <div><strong>Lingua:</strong> ${language || "—"}</div>
  `;
  if (printProjectMeta) {
    printProjectMeta.innerHTML = projectMetaView.innerHTML;
  }
};

export const renderUserPanels = () => {
  renderMachineTypeOptions();
  renderBrandOptions();
  renderCodeOptions();
  renderLtOptions();
  renderOptionalOptions();
  renderProjectMeta();
  updateProjectFlow();
};

export const updateProjectFlow = () => {
  const projectComplete = isProjectComplete();
  const wasHidden = machineTypeSelector?.classList.contains("hidden");
  
  if (projectComplete) {
    if (machineTypeSelector) {
      machineTypeSelector.classList.remove("hidden");
      // Scroll solo se era nascosto prima (prima volta che diventa completo)
      if (wasHidden) {
        setTimeout(() => {
          const rect = machineTypeSelector.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetPosition = rect.top + scrollTop;
          const viewportHeight = window.innerHeight;
          
          // Aggiungi padding-bottom per garantire spazio di scroll
          const body = document.body;
          const neededPadding = viewportHeight;
          body.style.paddingBottom = neededPadding + "px";
          
          // Scroll
          window.scrollTo({ top: targetPosition, behavior: "smooth" });
        }, 100);
      }
    }
    if (summaryPanel) summaryPanel.classList.remove("hidden");
  } else {
    if (machineTypeSelector) machineTypeSelector.classList.add("hidden");
    if (funnelSection) funnelSection.classList.add("hidden");
    if (summaryPanel) summaryPanel.classList.add("hidden");
  }
};

export const updateSummary = () => {
  const rows = [];
  let total = 0;
  const dict = getDictionary();
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

  summaryList.innerHTML = summaryHtml;
  if (printSummaryList) {
    printSummaryList.innerHTML = summaryHtml;
  }

  totalPriceEl.textContent = formatPrice(total);
  if (printTotal) {
    printTotal.textContent = formatPrice(total);
  }
  renderProjectMeta();
};

const getOptionalCounts = () =>
  getOptionals().reduce(
    (acc, item) => {
      if (item.category === "spare") {
        acc.spare += 1;
      } else {
        acc.onboard += 1;
      }
      return acc;
    },
    { onboard: 0, spare: 0 }
  );

export const renderCatalog = () => {
  if (!catalogList) return;
  const dict = getDictionary();
  const counts = getOptionalCounts();
  const optionalsText = `${dict.catalog_optionals_label}: ${counts.onboard} ${dict.catalog_optionals_onboard}, ${counts.spare} ${dict.catalog_optionals_spare}`;

  const items = ["dorin", "bitzer"]
    .flatMap((brand) =>
      groupMtByName(brand).map((g) => ({
        ...g,
        brand,
      }))
    )
    .filter((item) => {
      const matchesBrand = catalogFilters.brand === "all" || catalogFilters.brand === item.brand;
      const hasLt = item.lt36Options.length + item.lt60Options.length > 0;
      const matchesLt = catalogFilters.onlyLt ? hasLt : true;
      return matchesBrand && matchesLt;
    });

  catalogList.innerHTML = "";

  if (!items.length) {
    catalogEmpty?.classList.remove("hidden");
    return;
  }
  catalogEmpty?.classList.add("hidden");

  items.forEach((item) => {
    const brandLabel = item.brand === "dorin" ? "Dorin" : "Bitzer";
    const ltRows = [
      ...item.lt36Options.map((lt) => ({ ...lt, pressure: "36" })),
      ...item.lt60Options.map((lt) => ({ ...lt, pressure: "60" })),
    ];
    const ltHtml = ltRows.length
      ? ltRows
          .map(
            (lt) => `
        <div class="lt-line">
          <span class="pill subtle">${lt.pressure} bar</span>
          <div class="lt-line-name">${lt.name}</div>
          <span class="price">${formatPrice(lt.price)}</span>
        </div>
      `
          )
          .join("")
      : `<div class="lt-line"><div class="lt-line-name">${dict.catalog_lt_none}</div></div>`;

    const card = document.createElement("div");
    card.className = "catalog-card";
    card.innerHTML = `
      <div class="catalog-head">
        <span class="pill">${brandLabel}</span>
      </div>
      <div class="catalog-title">${item.mtName}</div>
      <div class="catalog-meta">
        <span class="catalog-label">${dict.catalog_lt_label}</span>
        <div class="lt-list">${ltHtml}</div>
      </div>
      <div class="catalog-foot">
        <div class="catalog-optionals">${optionalsText}</div>
        <button class="button slim ghost catalog-apply" data-brand="${item.brand}" data-mt-key="${item.id}">${dict.catalog_apply}</button>
      </div>
    `;
    catalogList.appendChild(card);
  });
};

export const goToStep = (step) => {
  appState.step = Math.max(1, Math.min(6, step));
  if (stepDots) {
    Array.from(stepDots.children).forEach((dot, idx) => {
      dot.classList.toggle("active", idx < appState.step);
      dot.setAttribute("aria-current", idx === appState.step - 1 ? "step" : "false");
    });
  }
  document.querySelectorAll(".step").forEach((el) => {
    const visible = Number(el.dataset.step) === appState.step;
    el.style.display = visible ? "block" : "none";
  });
};

export const resetSelections = () => {
  appState.selections = {
    brand: null,
    mtKey: null,
    ltPressure: null,
    ltChoice: null,
    optionals: new Set(),
    discount: 0,
    project: appState.selections.project,
    gascooler: false,
    transport: {
      enabled: false,
      city: "",
      country: "",
      km: 0,
      price: 0,
    },
  };
  if (discountInput) discountInput.value = 0;
  if (gascoolerToggle) gascoolerToggle.checked = false;
  if (transportToggle) transportToggle.checked = false;
  if (transportCityInput) {
    transportCityInput.value = "";
    transportCityInput.disabled = true;
  }
  if (transportInfo) transportInfo.textContent = "";
  goToStep(1);
  renderUserPanels();
  updateSummary();
};

export const applyCatalogSelection = (brand, mtKey) => {
  if (!brand || !mtKey) return;
  appState.selections.brand = brand;
  appState.selections.mtKey = mtKey;
  appState.selections.ltPressure = null;
  appState.selections.ltChoice = null;
  appState.selections.optionals = new Set();
  renderUserPanels();
  updateSummary();
  goToStep(3);
  setCatalogCollapsed(true);
  document.getElementById("funnel")?.scrollIntoView({ behavior: "smooth" });
};

export const updateThemeToggleLabel = (dict = getDictionary()) => {
  if (!themeToggleBtn) return;
  const isDark = appState.ui.theme === "dark";
  const sunIcon = themeToggleBtn.querySelector(".sun-icon");
  const moonIcon = themeToggleBtn.querySelector(".moon-icon");
  
  if (sunIcon && moonIcon) {
    if (isDark) {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    } else {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    }
  }
};

export const setTheme = (theme) => {
  appState.ui.theme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("dark-mode", appState.ui.theme === "dark");
  updateThemeToggleLabel();
  try {
    localStorage.setItem("tago_theme", appState.ui.theme);
  } catch (err) {
    console.warn("Impossibile salvare il tema:", err);
  }
};

export const initTheme = () => {
  let stored = null;
  try {
    stored = localStorage.getItem("tago_theme");
  } catch (err) {
    console.warn("Impossibile leggere il tema:", err);
  }
  setTheme(stored === "dark" ? "dark" : "light");
};

export const setCatalogCollapsed = (collapsed) => {
  appState.ui.catalogCollapsed = Boolean(collapsed);
  if (catalogSection) {
    catalogSection.classList.toggle("collapsed", appState.ui.catalogCollapsed);
  }
  updateCatalogCollapseLabel();
};

export const updateCatalogCollapseLabel = (dict = getDictionary()) => {
  if (!catalogToggleBtn) return;
  const collapsed = appState.ui.catalogCollapsed;
  const label = collapsed ? dict.catalog_expand : dict.catalog_collapse;
  catalogToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  catalogToggleBtn.setAttribute("aria-label", label);
};

export const wireCatalogFilters = () => {
  catalogBrandButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      catalogFilters.brand = btn.dataset.catalogBrand || "all";
      catalogBrandButtons.forEach((button) =>
        button.classList.toggle("active", button === btn)
      );
      renderCatalog();
    });
  });

  catalogOnlyLtToggle?.addEventListener("change", (event) => {
    catalogFilters.onlyLt = event.target.checked;
    renderCatalog();
  });

  catalogList?.addEventListener("click", (event) => {
    const btn = event.target.closest(".catalog-apply");
    if (!btn) return;
    applyCatalogSelection(btn.dataset.brand, btn.dataset.mtKey);
  });

  catalogToggleBtn?.addEventListener("click", () =>
    setCatalogCollapsed(!appState.ui.catalogCollapsed)
  );

  themeToggleBtn?.addEventListener("click", () => {
    setTheme(appState.ui.theme === "dark" ? "light" : "dark");
  });
};

const trevisoCoords = { lat: 45.6669, lon: 12.243 };
const quickCityCoords = {
  treviso: { ...trevisoCoords, country: "IT" },
  milano: { lat: 45.4642, lon: 9.19, country: "IT" },
  roma: { lat: 41.9028, lon: 12.4964, country: "IT" },
  torino: { lat: 45.0703, lon: 7.6869, country: "IT" },
  napoli: { lat: 40.8518, lon: 14.2681, country: "IT" },
  firenze: { lat: 43.7696, lon: 11.2558, country: "IT" },
  venezia: { lat: 45.4408, lon: 12.3155, country: "IT" },
  verona: { lat: 45.4384, lon: 10.9916, country: "IT" },
  bologna: { lat: 44.4949, lon: 11.3426, country: "IT" },
  padova: { lat: 45.4064, lon: 11.8768, country: "IT" },
  genova: { lat: 44.4056, lon: 8.9463, country: "IT" },
  bari: { lat: 41.1171, lon: 16.8719, country: "IT" },
  palermo: { lat: 38.1157, lon: 13.3615, country: "IT" },
  catania: { lat: 37.5079, lon: 15.083, country: "IT" },
  cagliari: { lat: 39.2238, lon: 9.1217, country: "IT" },
  udine: { lat: 46.0711, lon: 13.2346, country: "IT" },
  trieste: { lat: 45.6495, lon: 13.7768, country: "IT" },
  parma: { lat: 44.8015, lon: 10.3279, country: "IT" },
  ancona: { lat: 43.6158, lon: 13.5189, country: "IT" },
  perugia: { lat: 43.1122, lon: 12.3888, country: "IT" },
  paris: { lat: 48.8566, lon: 2.3522, country: "FR" },
  lyon: { lat: 45.764, lon: 4.8357, country: "FR" },
  marseille: { lat: 43.2965, lon: 5.3698, country: "FR" },
  madrid: { lat: 40.4168, lon: -3.7038, country: "ES" },
  barcelona: { lat: 41.3874, lon: 2.1686, country: "ES" },
  valencia: { lat: 39.4699, lon: -0.3763, country: "ES" },
  sevilla: { lat: 37.3891, lon: -5.9845, country: "ES" },
  berlin: { lat: 52.52, lon: 13.405, country: "DE" },
  hamburg: { lat: 53.5511, lon: 9.9937, country: "DE" },
  munich: { lat: 48.1351, lon: 11.582, country: "DE" },
  frankfurt: { lat: 50.1109, lon: 8.6821, country: "DE" },
  vienna: { lat: 48.2082, lon: 16.3738, country: "AT" },
  prague: { lat: 50.0755, lon: 14.4378, country: "CZ" },
  bratislava: { lat: 48.1486, lon: 17.1077, country: "SK" },
  budapest: { lat: 47.4979, lon: 19.0402, country: "HU" },
  warsaw: { lat: 52.2297, lon: 21.0122, country: "PL" },
  krakow: { lat: 50.0647, lon: 19.945, country: "PL" },
  amsterdam: { lat: 52.3676, lon: 4.9041, country: "NL" },
  brussels: { lat: 50.8503, lon: 4.3517, country: "BE" },
  zurich: { lat: 47.3769, lon: 8.5417, country: "CH" },
  geneva: { lat: 46.2044, lon: 6.1432, country: "CH" },
  london: { lat: 51.5074, lon: -0.1278, country: "GB" },
  manchester: { lat: 53.4808, lon: -2.2426, country: "GB" },
  dublin: { lat: 53.3498, lon: -6.2603, country: "IE" },
  lisbon: { lat: 38.7223, lon: -9.1393, country: "PT" },
  porto: { lat: 41.1579, lon: -8.6291, country: "PT" },
};

const europeanIso = new Set([
  "AL",
  "AD",
  "AM",
  "AT",
  "AZ",
  "BY",
  "BE",
  "BA",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "GE",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "KZ",
  "XK",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "MD",
  "MC",
  "ME",
  "NL",
  "MK",
  "NO",
  "PL",
  "PT",
  "RO",
  "RU",
  "SM",
  "RS",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "TR",
  "UA",
  "GB",
  "VA",
  "UZ",
]);

const countryCentroids = {
  IT: { lat: 42.8, lon: 12.5 },
  FR: { lat: 46.2, lon: 2.2 },
  ES: { lat: 40.3, lon: -3.7 },
  PT: { lat: 39.6, lon: -8.0 },
  DE: { lat: 51.0, lon: 10.0 },
  AT: { lat: 47.7, lon: 13.3 },
  BE: { lat: 50.6, lon: 4.6 },
  NL: { lat: 52.2, lon: 5.3 },
  CH: { lat: 46.8, lon: 8.2 },
  GB: { lat: 54.0, lon: -2.5 },
  IE: { lat: 53.2, lon: -7.7 },
  PL: { lat: 52.0, lon: 19.1 },
  CZ: { lat: 49.8, lon: 15.5 },
  SK: { lat: 48.7, lon: 19.5 },
  HU: { lat: 47.1, lon: 19.5 },
  DK: { lat: 56.0, lon: 9.5 },
  SE: { lat: 60.0, lon: 17.0 },
  NO: { lat: 62.0, lon: 10.0 },
  FI: { lat: 64.5, lon: 26.0 },
  GR: { lat: 38.3, lon: 23.7 },
  TR: { lat: 39.0, lon: 35.0 },
};

let cityIndex = new Map();
let cityIndexStatus = "idle"; // idle | loading | ready | missing | error

const normalizeCityKey = (value) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const ensureCityIndex = async () => {
  if (cityIndexStatus === "ready") return;
  if (cityIndexStatus === "loading") return;
  cityIndexStatus = "loading";
  try {
    const res = await fetch("./cities-index.json");
    if (res.status === 404) {
      cityIndexStatus = "missing";
      return;
    }
    if (!res.ok) throw new Error("city dataset not reachable");
    const data = await res.json();
    data.forEach((city) => {
      const key = normalizeCityKey(city.name);
      if (cityIndex.has(key)) return;
      cityIndex.set(key, {
        lat: Number(city.lat),
        lon: Number(city.lon),
        country: (city.country || "").toUpperCase(),
      });
    });
    cityIndexStatus = "ready";
  } catch (err) {
    console.warn("City index load failed:", err.message);
    cityIndexStatus = "error";
  }
};

const haversineKm = (from, to) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const projectToMap = (lat, lon) => {
  // Bounds tuned to the SVG viewBox (lon -25..45, lat 30..72 mapped to 0..100%)
  const latMin = 30;
  const latMax = 72;
  const lonMin = -25;
  const lonMax = 45;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const y = ((latMax - clamp(lat, latMin, latMax)) / (latMax - latMin)) * 100;
  const x = ((clamp(lon, lonMin, lonMax) - lonMin) / (lonMax - lonMin)) * 100;
  return { x, y };
};


const lookupCity = async (key) => {
  const quick = quickCityCoords[key];
  if (quick) return quick;
  await ensureCityIndex();
  if (cityIndexStatus !== "ready") return null;
  return cityIndex.get(key) || null;
};

const buildSuggestionPool = () => {
  const pool = [];
  Object.entries(quickCityCoords).forEach(([name, coords]) => {
    pool.push({ name, ...coords });
  });
  if (cityIndexStatus === "ready") {
    cityIndex.forEach((value, name) => {
      pool.push({ name, ...value });
    });
  }
  return pool;
};

const renderSuggestions = (query) => {
  if (!transportSuggestions) return;
  const q = normalizeCityKey(query);
  if (!q || q.length < 2) {
    transportSuggestions.innerHTML = "";
    transportSuggestions.classList.remove("active");
    return;
  }
  const countryFilter = transportCountrySelect?.value || "";
  const pool = buildSuggestionPool();
  const matches = [];
  for (const item of pool) {
    if (countryFilter && item.country !== countryFilter) continue;
    const key = normalizeCityKey(item.name);
    if (key.startsWith(q)) {
      matches.push(item);
    } else if (key.includes(` ${q}`)) {
      matches.push(item);
    }
    if (matches.length >= 10) break;
  }

  if (!matches.length) {
    transportSuggestions.innerHTML = "";
    transportSuggestions.classList.remove("active");
    return;
  }

  transportSuggestions.innerHTML = matches
    .map(
      (m) =>
        `<button type="button" data-city="${m.name}" data-country="${m.country}">${m.name} (${m.country})</button>`
    )
    .join("");
  transportSuggestions.classList.add("active");

  transportSuggestions.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cityName = btn.dataset.city;
      const country = btn.dataset.country;
      if (transportCityInput) transportCityInput.value = cityName;
      if (transportCountrySelect && countryFilter === "") {
        transportCountrySelect.value = country;
      }
      transportSuggestions.innerHTML = "";
      transportSuggestions.classList.remove("active");
      updateTransport({ cityOverride: cityName });
    });
  });
};

const updateTransport = async (opts = {}) => {
  const enabled = transportToggle?.checked;
  appState.selections.transport.enabled = Boolean(enabled);
  const cityRaw = (opts.cityOverride ?? transportCityInput?.value ?? "").trim();
  const key = normalizeCityKey(cityRaw);
  const countryFilter = transportCountrySelect?.value || "";
  const dict = getDictionary();
  if (transportInfo && enabled && cityIndexStatus === "loading") {
    transportInfo.textContent = dict.step6_info_loading || "Carico database città...";
  }
  const coords = enabled ? await lookupCity(key) : null;
  let km = 0;
  const countryMatches = countryFilter ? coords?.country === countryFilter : true;
  if (enabled && coords && countryMatches) {
    km = haversineKm(trevisoCoords, coords);
  }
  const isEuropean = coords ? europeanIso.has(coords.country) : false;
  const price = enabled && coords && countryMatches && isEuropean ? km * 1 : 0;
  appState.selections.transport.city = cityRaw;
  appState.selections.transport.country = countryFilter;
  appState.selections.transport.km = km;
  appState.selections.transport.price = price;
  if (transportCityInput) {
    transportCityInput.disabled = !enabled;
  }
  if (transportInfo) {
    if (!enabled) {
      transportInfo.textContent = "";
    } else if (!cityRaw) {
      transportInfo.textContent = "";
    } else if (cityIndexStatus === "missing") {
      transportInfo.textContent = dict.step6_info_dataset_missing || "Dataset città mancante.";
    } else if (cityIndexStatus === "error") {
      transportInfo.textContent = dict.step6_info_unknown || "Città non trovata.";
    } else if (!coords || (countryFilter && coords?.country !== countryFilter)) {
      transportInfo.textContent = dict.step6_info_unknown || "Città non trovata.";
    } else if (!isEuropean) {
      transportInfo.textContent = dict.step6_info_extra || "Richiedi quotazione al team Enex.";
    } else {
      const msgTemplate = dict.step6_info_result || "Distanza stimata: {km} km - Costo stimato: € {price}";
      transportInfo.textContent = msgTemplate
        .replace("{km}", km)
        .replace("{price}", price.toFixed(0));
    }
  }
  const dotCoords =
    coords && countryMatches
      ? coords
      : countryFilter && countryCentroids[countryFilter]
      ? countryCentroids[countryFilter]
      : null;
  updateSummary();
};

export const wireTransportControls = () => {
  gascoolerToggle?.addEventListener("change", (e) => {
    appState.selections.gascooler = e.target.checked;
    updateSummary();
  });

  transportToggle?.addEventListener("change", () => {
    updateTransport();
    if (transportCityInput) transportCityInput.disabled = !transportToggle.checked;
    if (transportCountrySelect) transportCountrySelect.disabled = !transportToggle.checked;
  });
  transportCityInput?.addEventListener("input", (e) => {
    renderSuggestions(e.target.value);
    updateTransport();
  });
  // Preload dataset after first user intent to use transport
  transportToggle?.addEventListener("change", () => {
    if (transportToggle.checked) ensureCityIndex();
  });
  transportCountrySelect?.addEventListener("change", () => updateTransport());

  transportResetBtn?.addEventListener("click", () => {
    if (transportToggle) transportToggle.checked = false;
    if (transportCityInput) {
      transportCityInput.value = "";
      transportCityInput.disabled = true;
    }
    if (transportCountrySelect) transportCountrySelect.value = "";
    appState.selections.transport = {
      enabled: false,
      city: "",
      country: "",
      km: 0,
      price: 0,
    };
    if (transportInfo) transportInfo.textContent = "";
    if (transportSuggestions) {
      transportSuggestions.innerHTML = "";
      transportSuggestions.classList.remove("active");
    }
    updateSummary();
  });
};
