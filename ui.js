import {
  appState,
  catalogFilters,
  formatDate,
  formatPrice,
  getOptionals,
  getOptionalsForConfig,
  getSelectedConfig,
  groupMtByName,
  machineTypes,
  isProjectComplete,
  getFilteredConfigs,
  getExtraCosts,
  getConfigs,
} from "./state.js";
import { getDictionary, translateOptionName } from "./i18n.js";
import {
  buildSummaryData,
  getCablingExtraPrice,
  getCablingStandardPrice,
  isCablingChoiceMissing,
  isCablingExtraInvalid,
  getTagoProbesRule,
  parseCablingMeters,
} from "./summary.js";
import pricingExtras from "./pricing-extras.json" with { type: "json" };

const machineTypeOptions = document.getElementById("machineTypeOptions");
const machineTypeSelector = document.getElementById("machineTypeSelector");
const machineTypeSelected = document.getElementById("machineTypeSelected");
const funnelSection = document.getElementById("funnel");
const summaryPanel = document.querySelector(".summary-panel");
const brandOptions = document.getElementById("brandOptions");
const codeOptions = document.getElementById("codeOptions");
const ltOptions = document.getElementById("ltOptions");
const electricalPanelOptions = document.getElementById("electricalPanelOptions");
const electricalPanelChoiceHint = document.getElementById("electricalPanelChoiceHint");
const controlOptions = document.getElementById("controlOptions");
const optionalOptions = document.getElementById("optionalOptions");
const probesChoiceHint = document.getElementById("probesChoiceHint");
const oilOptionGroup = document.getElementById("oilOptionGroup");
const oilOptionCard = document.getElementById("oilOptionCard");
const oilKgWrap = document.getElementById("oilKgWrap");
const oilKgInput = document.getElementById("oilKgInput");
const oilKgHint = document.getElementById("oilKgHint");
const oilPriceValue = document.getElementById("oilPriceValue");
const cablingOptions = document.getElementById("cablingOptions");
const cablingChoiceHint = document.getElementById("cablingChoiceHint");
const cablingExtraWrap = document.getElementById("cablingExtraWrap");
const cablingExtraMetersInput = document.getElementById("cablingExtraMeters");
const cablingExtraHint = document.getElementById("cablingExtraHint");
const summaryList = document.getElementById("summaryList");
const projectMetaView = document.getElementById("projectMetaView");
const printSummaryList = document.getElementById("printSummaryList");
const printTotal = document.getElementById("printTotal");
const printProjectMeta = document.getElementById("printProjectMeta");
const totalPriceEl = document.getElementById("totalPrice");
const discountInput = document.getElementById("discountInput");
const gascoolerToggle = document.getElementById("gascoolerToggle");
const gascoolerFields = document.getElementById("gascoolerFields");
const gascoolerPriceInput = document.getElementById("gascoolerPrice");
const gascoolerCustom1Desc = document.getElementById("gascoolerCustom1Desc");
const gascoolerCustom1Price = document.getElementById("gascoolerCustom1Price");
const gascoolerCustom2Desc = document.getElementById("gascoolerCustom2Desc");
const gascoolerCustom2Price = document.getElementById("gascoolerCustom2Price");
const gascoolerCustom3Desc = document.getElementById("gascoolerCustom3Desc");
const gascoolerCustom3Price = document.getElementById("gascoolerCustom3Price");
const transportToggle = document.getElementById("transportToggle");
const transportCountrySelect = document.getElementById("transportCountry");
const transportCityInput = document.getElementById("transportCity");
const transportInfo = document.getElementById("transportInfo");
const transportResetBtn = document.getElementById("transportReset");
const transportSuggestions = document.getElementById("transportSuggestions");
const stepDots = document.getElementById("stepDots");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const catalogList = document.getElementById("catalogList");
const catalogEmpty = document.getElementById("catalogEmpty");
const catalogOnlyLtToggle = document.getElementById("catalogOnlyLt");
const catalogBrandButtons = document.querySelectorAll("[data-catalog-brand]");
const catalogSection = document.getElementById("catalog");
const catalogToggleBtn = document.getElementById("catalogToggle");
const machineTypeToggleBtn = document.getElementById("machineTypeToggle");
const themeToggleBtn = document.getElementById("themeToggle");

const electricalPanelDependentIds = [
  "electrical_panel",
  "diff_mt",
  "diff_mt_lt",
  "mx_coil",
  "danfoss_572a",
  "danfoss_782",
  "carel",
  "wurm",
  "wurm_customer",
];
const controlsCustomerId = "controls_customer_supplied";
const probesOptionIds = [
  "probes_danfoss_mt",
  "probes_danfoss_mtlt",
  "probes_wurm_mt",
  "probes_wurm_mtlt",
  "probes_generic_mt",
  "probes_generic_mtlt",
  "probes_customer_supplied",
  "probes_included",
];

function getTransportPrice(km) {
  const tiers = pricingExtras.transportPricing || [];
  for (const tier of tiers) {
    if (km <= tier.maxKm) {
      return tier.price;
    }
  }
  return tiers.length > 0 ? tiers[tiers.length - 1].price : 0;
}

const hideElectricalPanelChoiceHint = () => {
  if (electricalPanelChoiceHint) {
    electricalPanelChoiceHint.style.display = 'none';
  }
};

const showElectricalPanelChoiceHint = () => {
  if (electricalPanelChoiceHint) {
    electricalPanelChoiceHint.style.display = 'block';
  }
};

const resetElectricalPanelChoice = () => {
  appState.selections.electricalPanelChoice = null;
  electricalPanelDependentIds.forEach((id) => appState.selections.optionals.delete(id));
  appState.selections.optionals.delete(controlsCustomerId);
  hideElectricalPanelChoiceHint();
};

const setElectricalPanelChoice = (choice) => {
  appState.selections.electricalPanelChoice = choice;
  if (choice === "electrical_panel") {
    appState.selections.optionals.add("electrical_panel");
    appState.selections.optionals.delete(controlsCustomerId);
  } else {
    electricalPanelDependentIds.forEach((id) => appState.selections.optionals.delete(id));
    appState.selections.optionals.add(controlsCustomerId);
  }
  hideElectricalPanelChoiceHint();
};

const isElectricalPanelChoiceMissing = () =>
  appState.selections.electricalPanelChoice !== "none" &&
  appState.selections.electricalPanelChoice !== "electrical_panel";

const hideProbesChoiceHint = () => {
  probesChoiceHint?.classList.add("hidden");
};

const showProbesChoiceHint = () => {
  probesChoiceHint?.classList.remove("hidden");
};

const resetProbesChoice = () => {
  appState.selections.probesChoice = null;
  hideProbesChoiceHint();
};

const isProbesChoiceMissing = () => {
  if (!appState.selections.machineType) return false;
  const tagoRule = getTagoProbesRule();
  if (appState.selections.machineType === "TAGO") {
    if (!tagoRule.optionId) return false;
    return appState.selections.probesChoice !== tagoRule.optionId;
  }
  const availableProbeIds = getOptionalsForConfig()
    .filter((opt) => opt.category === "probes")
    .map((opt) => opt.id);
  if (!availableProbeIds.length) return false;
  return !availableProbeIds.includes(appState.selections.probesChoice);
};

const hideCablingChoiceHint = () => {
  cablingChoiceHint?.classList.add("hidden");
};

const showCablingChoiceHint = () => {
  cablingChoiceHint?.classList.remove("hidden");
};

const hideCablingExtraHint = () => {
  if (cablingExtraHint) {
    cablingExtraHint.style.display = 'none';
  }
};

const showLockedChoiceTooltip = (optionEl) => {
  if (!optionEl) return;
  const dict = getDictionary();
  const message = dict.tooltip_locked_choice || "La scelta non puo essere rimossa";
  const existing = optionEl.querySelector(".locked-tooltip");
  if (existing) existing.remove();
  const tooltip = document.createElement("div");
  tooltip.className = "locked-tooltip";
  tooltip.textContent = message;
  optionEl.appendChild(tooltip);
  optionEl.classList.add("show-locked-tooltip");
  setTimeout(() => {
    tooltip.remove();
    optionEl.classList.remove("show-locked-tooltip");
  }, 1800);
};

const showCablingExtraHint = () => {
  if (cablingExtraHint) {
    cablingExtraHint.style.display = 'block';
  }
};

const resetCablingChoice = () => {
  appState.selections.cablingChoice = null;
  appState.selections.cablingExtraMeters = 0;
  hideCablingChoiceHint();
  hideCablingExtraHint();
};

const parseOilKg = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
};

const getOilPricePerKg = () => {
  const rate = getExtraCosts().oilPricePerKg;
  return Number.isFinite(rate) ? rate : 0;
};

const hideOilKgHint = () => {
  if (oilKgHint) {
    oilKgHint.style.display = 'none';
  }
};

const showOilKgHint = () => {
  if (oilKgHint) {
    oilKgHint.style.display = 'block';
  }
};

const isOilKgInvalid = () => {
  if (!appState.selections.oilEnabled) return false;
  const kg = parseOilKg(appState.selections.oilKg);
  return !Number.isInteger(kg) || kg <= 0 || kg % 5 !== 0;
};

const updateOilUI = () => {
  if (!oilOptionCard) return;
  const enabled = Boolean(appState.selections.oilEnabled);
  oilOptionCard.classList.toggle("selected", enabled);
  if (oilKgWrap) {
    oilKgWrap.classList.toggle("hidden", !enabled);
  }
  if (!enabled) {
    hideOilKgHint();
    if (oilKgInput) {
      oilKgInput.value = "";
    }
    if (oilPriceValue) {
      oilPriceValue.textContent = formatPrice(0);
    }
    return;
  }

  const kg = parseOilKg(appState.selections.oilKg);
  if (oilKgInput) {
    oilKgInput.value = kg > 0 ? String(kg) : "";
  }
  const valid = kg > 0 && kg % 5 === 0;
  if (!valid) {
    showOilKgHint();
  } else {
    hideOilKgHint();
  }
  const totalPrice = valid ? kg * getOilPricePerKg() : 0;
  if (oilPriceValue) {
    oilPriceValue.textContent = formatPrice(totalPrice);
  }
};

const setCablingChoice = (choice) => {
  appState.selections.cablingChoice = choice;
  if (choice !== "extra") {
    appState.selections.cablingExtraMeters = 0;
  }
  hideCablingChoiceHint();
  hideCablingExtraHint();
};


const renderOptionCard = (item, group, multiple, opts = {}) => {
  const option = document.createElement("div");
  option.className = "option";
  const locked = Boolean(opts.locked);
  if (locked) {
    option.classList.add("locked");
    option.setAttribute("aria-disabled", "true");
  }
  const showPrice = item.price !== null && item.price !== undefined;
  option.innerHTML = `
    <div class="title-row">
      <div>
        <strong>${item.name}</strong>
        ${item.subtitle ? `<div class="subtitle">${item.subtitle}</div>` : ""}
      </div>
    </div>
    ${showPrice ? `<p class="price">${formatPrice(item.price)}</p>` : ""}
  `;

  const isSelected = multiple
    ? appState.selections[group].has(item.id)
    : appState.selections[group] === item.id;
  if (isSelected) {
    option.classList.add("selected");
    // Aggiungi classe included solo se selezionato E prezzo -1
    if (item.price === -1) option.classList.add("included");
  }

  option.addEventListener("click", () => {
    if (locked) {
      showLockedChoiceTooltip(option);
      return;
    }
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
        appState.selections.configCode = null;
        appState.selections.optionals = new Set();
        appState.selections.oilEnabled = false;
        appState.selections.oilKg = 0;
        resetElectricalPanelChoice();
        resetProbesChoice();
        resetCablingChoice();
        // Comprimi la sezione tipo macchina
        setMachineTypeSelectorCollapsed(true);
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
        appState.selections.configCode = null;
        appState.selections.optionals = new Set();
        resetElectricalPanelChoice();
        resetCablingChoice();
      }
      if (group === "mtKey") {
        appState.selections.ltPressure = null;
        appState.selections.ltChoice = null;
        appState.selections.configCode = null;
        appState.selections.optionals = new Set();
        resetElectricalPanelChoice();
        resetCablingChoice();
      }
      if (group === "ltChoice") {
        const previousCode = appState.selections.configCode;
        appState.selections.configCode = item.code || null;
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
        if (previousCode && previousCode !== appState.selections.configCode) {
          appState.selections.optionals = new Set();
          resetElectricalPanelChoice();
          resetProbesChoice();
          resetCablingChoice();
        }
      }
      if (group === "electricalPanelChoice") {
        setElectricalPanelChoice(item.id);
      }
      if (group === "probesChoice") {
        hideProbesChoiceHint();
      }
      if (group === "cablingChoice") {
        setCablingChoice(item.id);
        if (item.id === "extra") {
          setTimeout(() => cablingExtraMetersInput?.focus(), 0);
        }
      }
    }
    renderUserPanels();
    updateSummary();
    updateNextButtonState();
    
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
        price: null, // Nascondi il prezzo per la selezione del tipo macchina
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
  
  // Filter brands based on available configurations for selected machine type
  const availableBrands = [
    { id: "dorin", name: "Dorin" },
    { id: "bitzer", name: "Bitzer" },
  ].filter(brand => {
    // Check if this brand has at least one configuration for the selected machine type
    if (!appState.selections.machineType) return true; // Show all if no machine type selected
    
    const machinePrefix = machineTypes.find(m => m.id === appState.selections.machineType)?.prefix;
    if (!machinePrefix) return true;
    
    const configs = getConfigs();
    const relevantConfigs = configs.filter(cfg => cfg.code?.startsWith(machinePrefix));
    
    const hasConfigs = relevantConfigs.some(cfg => {
      const brandData = cfg.mt?.[brand.id];
      // Check if brand data exists and has a valid price (not null and not NA)
      return brandData && 
             brandData.price !== null && 
             brandData.price !== undefined &&
             brandData.name !== 'NA';
    });
    
    return hasConfigs;
  });
  
  availableBrands.forEach((item) =>
    brandOptions.appendChild(
      renderOptionCard(
        {
          id: item.id,
          name: item.name,
          price: null, // Nascondi il prezzo per la selezione della marca
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

  const dict = getDictionary();
  const options = [{
    id: "none",
    name: dict.step3_none_lt || "Nessun LT",
    subtitle: dict.step3_none_lt_subtitle || "Solo MT",
    price: 0,
    pressure: null,
    code: mtSelected.noLtCode || null,
  }];
  const selectedPressure = appState.selections.ltPressure || pressures[0] || null;
  if (selectedPressure === "36") {
    mtSelected.lt36Options.forEach((opt) =>
      options.push({
        id: opt.id,
        name: `${selectedPressure} bar - ${opt.name}`,
        subtitle: "",
        price: opt.price,
        pressure: "36",
        code: opt.code,
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
        code: opt.code,
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

const renderElectricalPanelOptions = () => {
  if (!electricalPanelOptions) return;
  electricalPanelOptions.innerHTML = "";
  if (!appState.selections.configCode) {
    electricalPanelOptions.innerHTML = `<p class="hint">Seleziona la configurazione LT per vedere i prezzi del quadro.</p>`;
    return;
  }

  // Ottieni optionals filtrati in base al machineType selezionato
  const optionals = getOptionalsForConfig(appState.selections.machineType);

  const electricalPanelOpt = optionals.find((o) => o.id === "electrical_panel");
  const isTago = appState.selections.machineType === "TAGO";

  if (isTago && appState.selections.electricalPanelChoice !== "electrical_panel") {
    setElectricalPanelChoice("electrical_panel");
  }

  if (!isTago) {
    const dict = getDictionary();
    const noneCard = renderOptionCard(
      {
        id: "none",
        name: dict.opt_none_panel || "Nessun quadro",
        price: 0,
        badge: dict.badge_choice || "Scelta",
      },
      "electricalPanelChoice",
      false
    );
    electricalPanelOptions.appendChild(noneCard);
  }

  if (electricalPanelOpt && electricalPanelOpt.price !== null && electricalPanelOpt.price !== undefined) {
    const dict = getDictionary();
    const panelCard = renderOptionCard(
      {
        id: "electrical_panel",
        name: translateOptionName("electrical_panel", electricalPanelOpt.name),
        price: electricalPanelOpt.price,
        badge: dict.badge_main || "Main",
      },
      "electricalPanelChoice",
      false,
      { locked: isTago }
    );
    electricalPanelOptions.appendChild(panelCard);
  }

  const hasElectricalPanel = appState.selections.electricalPanelChoice === "electrical_panel";
  if (!hasElectricalPanel) {
    return;
  }

  // Verifica se c'e LT selezionato (diverso da null e "none")
  const hasLT = appState.selections.ltChoice && appState.selections.ltChoice !== "none";

  const dict = getDictionary();
  const groups = [
    { title: dict.opt_components_label || "Componenti quadro", ids: ["diff_mt", "diff_mt_lt", "mx_coil"], exclusiveIds: ["diff_mt", "diff_mt_lt"] },
  ];

  groups.forEach((group) => {
    const container = document.createElement("div");
    container.className = "option-group";
    container.innerHTML = `<h4>${group.title}</h4>`;
    let hasVisibleItems = false;

    group.ids.forEach((id) => {
      // Filtra i differentials basandosi sulla presenza di LT
      if (id === "diff_mt" && hasLT) return; // Salta "Differential MT" se c'e LT
      if (id === "diff_mt_lt" && !hasLT) return; // Salta "Differentials MT/LT" se NON c'e LT

      const opt = optionals.find((o) => o.id === id);
      if (!opt) return; // Non renderizzare se non disponibile per questo machineType
      if (opt.price === null || opt.price === undefined) return; // Non renderizzare se Not Available (NA)

      hasVisibleItems = true;
      const exclusiveIds = group.exclusiveIds?.includes(id) ? group.exclusiveIds : [];
      const optionEl = renderOptionCard(
        {
          id: opt.id,
          name: translateOptionName(opt.id, opt.name),
          price: opt.price,
          badge: opt.category === "onboard" ? "On-board" : "Spare",
        },
        "optionals",
        true,
        { exclusiveIds }
      );
      container.appendChild(optionEl);
    });

    // Aggiungi il gruppo solo se ha elementi visibili
    if (hasVisibleItems) {
      electricalPanelOptions.appendChild(container);
    }
  });
};

let cablingInputBound = false;

const bindCablingExtraInput = () => {
  if (!cablingExtraMetersInput || cablingInputBound) return;
  const handleMetersChange = (event) => {
    const value = parseCablingMeters(event.target.value);
    appState.selections.cablingExtraMeters = value;
    if (value > 0) {
      hideCablingExtraHint();
    }
    
    // Aggiorna il prezzo della card "extra" senza ricreare tutto
    const extraCard = cablingOptions?.querySelector('.option:nth-child(2)');
    if (extraCard) {
      const basePrice = getCablingStandardPrice();
      const meters = parseCablingMeters(appState.selections.cablingExtraMeters);
      const extraPrice = getCablingExtraPrice(basePrice, meters);
      const priceEl = extraCard.querySelector('.price');
      const subtitleEl = extraCard.querySelector('.subtitle');
      
      if (priceEl) {
        priceEl.textContent = formatPrice(extraPrice);
      }
      if (subtitleEl) {
        const dict = getDictionary();
        subtitleEl.textContent = meters > 0 ? `${meters} m` : dict.step4_cabling_extra_placeholder || "Metri extra";
      }
    }
    
    updateSummary();
    updateNextButtonState();
  };
  cablingExtraMetersInput.addEventListener("input", handleMetersChange);
  cablingExtraMetersInput.addEventListener("change", handleMetersChange);
  cablingInputBound = true;
};

const renderCablingOptions = () => {
  if (!cablingOptions) return;
  cablingOptions.innerHTML = "";
  if (!appState.selections.machineType) return;
  if (!appState.selections.configCode) {
    cablingOptions.innerHTML = `<p class="hint">Seleziona la configurazione LT per vedere il cablaggio.</p>`;
    return;
  }

  if (isCablingChoiceMissing()) {
    setCablingChoice("standard");
  }

  const dict = getDictionary();
  const basePrice = getCablingStandardPrice();
  const meters = parseCablingMeters(appState.selections.cablingExtraMeters);
  const extraPrice = getCablingExtraPrice(basePrice, meters);

  const standardCard = renderOptionCard(
    {
      id: "standard",
      name: dict.step4_cabling_standard || "Cablaggio standard",
      price: basePrice,
      badge: "Default",
    },
    "cablingChoice",
    false
  );
  cablingOptions.appendChild(standardCard);

  const extraCard = renderOptionCard(
    {
      id: "extra",
      name: dict.step4_cabling_extra || "Cablaggio extra",
      subtitle: meters > 0 ? `${meters} m` : dict.step4_cabling_extra_placeholder || "Metri extra",
      price: extraPrice,
    },
    "cablingChoice",
    false
  );
  cablingOptions.appendChild(extraCard);

  if (cablingExtraWrap) {
    cablingExtraWrap.classList.toggle(
      "hidden",
      appState.selections.cablingChoice !== "extra"
    );
  }
  if (cablingExtraMetersInput) {
    cablingExtraMetersInput.value = meters > 0 ? String(meters) : "";
    cablingExtraMetersInput.disabled = appState.selections.cablingChoice !== "extra";
  }

  if (appState.selections.cablingChoice === "extra" && isCablingExtraInvalid()) {
    showCablingExtraHint();
  }

  bindCablingExtraInput();
};

const renderControlOptions = () => {
  if (!controlOptions) return;
  controlOptions.innerHTML = "";
  if (!appState.selections.configCode) {
    const message = document.createElement("p");
    message.className = "hint";
    message.textContent = "Seleziona la configurazione LT per vedere i prezzi dei controlli.";
    controlOptions.appendChild(message);
    return;
  }
  
  // Ottieni optionals filtrati in base al machineType selezionato
  const optionals = getOptionalsForConfig(appState.selections.machineType);
  
  const panelChoice = appState.selections.electricalPanelChoice;
  if (panelChoice === "electrical_panel") {
    appState.selections.optionals.delete(controlsCustomerId);
  }
  if (!panelChoice) {
    const message = document.createElement("p");
    message.className = "hint";
    message.textContent = "Seleziona il quadro elettrico nello step precedente per scegliere i controlli.";
    controlOptions.appendChild(message);
    return;
  }
  if (panelChoice !== "electrical_panel") {
    appState.selections.optionals.add(controlsCustomerId);
    const supplied = optionals.find((o) => o.id === controlsCustomerId);
    const card = document.createElement("div");
    card.className = "option selected";
    card.innerHTML = `
      <div class="title-row">
        <div><strong>${supplied?.name || "Controlli forniti dal cliente"}</strong></div>
      </div>
      <p class="price">${formatPrice(supplied?.price ?? 0)}</p>
    `;
    controlOptions.appendChild(card);
    return;
  }
  
  const dict = getDictionary();
  const groups = [
    {
      title: dict.step5_controllers_title || "Controllori",
      ids: ["danfoss_572a", "danfoss_782", "carel", "wurm", "wurm_customer"],
      exclusiveIds: ["danfoss_572a", "danfoss_782", "carel", "wurm", "wurm_customer"],
    },
  ];

  groups.forEach((group) => {
    const container = document.createElement("div");
    container.className = "option-group";
    container.innerHTML = `<h4>${group.title}</h4>`;
    let hasVisibleItems = false;
    
    group.ids.forEach((id) => {
      const opt = optionals.find((o) => o.id === id);
      if (!opt) return; // Non renderizzare se non disponibile per questo machineType
      if (opt.price === null || opt.price === undefined) return; // Non renderizzare se Not Available (NA)
      
      hasVisibleItems = true;
      const exclusiveIds = group.exclusiveIds?.includes(id) ? group.exclusiveIds : [];
      const optionEl = renderOptionCard(
        {
          id: opt.id,
          name: translateOptionName(opt.id, opt.name),
          price: opt.price,
          badge: opt.category === "onboard" ? "On-board" : "Spare",
        },
        "optionals",
        true,
        { exclusiveIds }
      );
      container.appendChild(optionEl);
    });
    
    // Aggiungi il gruppo solo se ha elementi visibili
    if (hasVisibleItems) {
      controlOptions.appendChild(container);
    }
  });
};

const renderElectricalOptions = () => {
  renderElectricalPanelOptions();
  renderCablingOptions();
  renderControlOptions();
  
  // Show/hide hint based on electrical panel choice
  if (isElectricalPanelChoiceMissing()) {
    showElectricalPanelChoiceHint();
  } else {
    hideElectricalPanelChoiceHint();
  }
};

const renderProbesOptions = (optionals) => {
  if (!optionalOptions) return;
  if (!appState.selections.machineType) return;
  const probeOptions = optionals
    .filter((opt) => opt.category === "probes")
    .filter((opt) => opt.price !== null && opt.price !== undefined);
  if (!probeOptions.length) return;

  const container = document.createElement("div");
  container.className = "option-group";
  const dict = getDictionary();
  container.innerHTML = `<h4>${dict.step6_probes_title || "Sonde"}</h4>`;

  const isTago = appState.selections.machineType === "TAGO";
  const hasLT = appState.selections.ltChoice && appState.selections.ltChoice !== "none";
  let optionsToRender = probeOptions;

  if (isTago) {
    const rule = getTagoProbesRule();
    const forced = rule.optionId ? probeOptions.find((opt) => opt.id === rule.optionId) : null;
    if (!forced) {
      appState.selections.probesChoice = null;
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "Seleziona il controllo per definire le sonde.";
      container.appendChild(hint);
      optionalOptions.appendChild(container);
      return;
    }
    if (appState.selections.probesChoice !== forced.id) {
      appState.selections.probesChoice = forced.id;
    }
    optionsToRender = [forced];
  } else {
    if (appState.selections.probesChoice === "probes_included") {
      appState.selections.probesChoice = null;
    }
    optionsToRender = probeOptions.filter((opt) =>
      opt.id === "probes_customer_supplied" || 
      (hasLT ? opt.id.endsWith("_mtlt") : opt.id.endsWith("_mt"))
    );
    if (!optionsToRender.length) {
      optionsToRender = probeOptions;
    }
  }

  if (
    appState.selections.probesChoice &&
    !optionsToRender.some((opt) => opt.id === appState.selections.probesChoice)
  ) {
    appState.selections.probesChoice = null;
  }

    optionsToRender.forEach((opt) => {
      const optionEl = renderOptionCard(
        {
          id: opt.id,
          name: translateOptionName(opt.id, opt.name),
          price: opt.price,
        },
        "probesChoice",
        false,
        { locked: isTago }
      );
      container.appendChild(optionEl);
    });

  if (probesOptionIds.includes(appState.selections.probesChoice)) {
    hideProbesChoiceHint();
  }

  optionalOptions.appendChild(container);
};

const renderOptionalOptions = () => {
  if (!optionalOptions) return;
  optionalOptions.innerHTML = "";
  if (!appState.selections.machineType) return;
  if (!appState.selections.configCode) {
    optionalOptions.innerHTML = `<p class="hint">Seleziona la configurazione LT per vedere gli optional.</p>`;
    return;
  }
  
  // Ottieni optionals filtrati in base al machineType selezionato
  const optionals = getOptionalsForConfig(appState.selections.machineType);

  renderProbesOptions(optionals);
  
  const dict = getDictionary();
  const groups = [
    { title: dict.step6_options_title || "Opzioni", ids: ["heat_recovery", "ducting", "valvole_meccaniche"], exclusiveIds: [] },
    { title: dict.step6_cladding_title || "Carenatura", ids: ["cladding_indoor", "cladding_outdoor"], exclusiveIds: ["cladding_indoor", "cladding_outdoor"] },
    { title: dict.step6_inverter_title || "Inverter", ids: ["inverter_fc280", "inverter_fc103"], exclusiveIds: ["inverter_fc280", "inverter_fc103"] },
    {
      title: dict.step6_accessories_title || "Accessori spare parts",
      ids: ["muffler_sp", "ccmt_sp", "gascooler_spare", "watergate", "carton_572a", "carton_300t", "carton_782a"],
      exclusiveIds: [],
    },
  ];

  groups.forEach((group) => {
    const container = document.createElement("div");
    container.className = "option-group";
    container.innerHTML = `<h4>${group.title}</h4>`;
    let hasVisibleItems = false;
    
    group.ids.forEach((id) => {
      const opt = optionals.find((o) => o.id === id);
      if (!opt) return; // Non renderizzare se non disponibile per questo machineType
      if (opt.price === null || opt.price === undefined) return; // Non renderizzare se Not Available (NA)
      
      hasVisibleItems = true;
      const exclusiveIds = group.exclusiveIds?.includes(id) ? group.exclusiveIds : [];
      const optionEl = renderOptionCard(
        {
          id: opt.id,
          name: translateOptionName(opt.id, opt.name),
          price: opt.price,
          badge: opt.category === "onboard" ? "On-board" : "Spare",
        },
        "optionals",
        true,
        { exclusiveIds }
      );
      container.appendChild(optionEl);
    });
    
    // Aggiungi il gruppo solo se ha elementi visibili
    if (hasVisibleItems) {
      optionalOptions.appendChild(container);
    }
  });

  if (oilOptionGroup) {
    oilOptionGroup.classList.toggle("hidden", !appState.selections.machineType);
  }
  updateOilUI();
};

const renderProjectMeta = () => {
  if (!projectMetaView) return;
  const dict = getDictionary();
  const { name, date, owner, language } = appState.selections.project;
  projectMetaView.innerHTML = `
    <div><strong>${dict.summary_project_label || "Progetto"}:</strong> ${name || "—"}</div>
    <div><strong>${dict.summary_request_date_label || "Data richiesta"}:</strong> ${formatDate(date) || "—"}</div>
    <div><strong>${dict.summary_owner_label || "Owner"}:</strong> ${owner || "—"}</div>
    <div><strong>${dict.summary_language_label || "Lingua"}:</strong> ${language || "—"}</div>
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
  renderElectricalOptions();
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
      // Scroll solo se era nascosto prima E nessun campo ha il focus
      if (wasHidden && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
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
    rows.push([
      dict.summary_lt_label || "LT",
      `${appState.selections.brand === "dorin" ? "Dorin" : "Bitzer"} ${ltSelected.pressure} bar - ${ltSelected.name}`,
      ltSelected.price,
    ]);
    total += ltSelected.price;
  }

  const optItems = getOptionalsForConfig().filter((o) => appState.selections.optionals.has(o.id));
  optItems.forEach((o) => {
    rows.push([dict.summary_optional_label || "Optional", o.name, o.price]);
    // Somma al totale solo se e' un valore numerico reale (esclude null, -1, -2)
    if (o.price !== null && o.price !== undefined && o.price !== -1 && o.price !== -2) {
      total += o.price;
    }
  });

  // Aggiungi "Nessun quadro fornito" se selezionato none
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
    const cablingPrice =
      cablingChoice === "extra" ? getCablingExtraPrice(basePrice, meters) : basePrice;

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

  const oilKg = parseOilKg(appState.selections.oilKg);
  if (appState.selections.oilEnabled && oilKg > 0 && oilKg % 5 === 0) {
    const oilPrice = oilKg * getOilPricePerKg();
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

  // Gascooler sempre alla fine
  if (appState.selections.gascooler) {
    const gascoolerPrice = Number(appState.selections.gascoolerPrice) || 0;
    rows.push([dict.summary_gascooler_label || "Gascooler", dict.step7_label || "Gascooler", gascoolerPrice, true]);
    total += gascoolerPrice;
    
    // Aggiungi voci custom gascooler
    appState.selections.gascoolerCustomItems.forEach((item) => {
      if (item.description && item.description.trim()) {
        const itemPrice = Number(item.price) || 0;
        rows.push([dict.summary_optional_label || "Optional", item.description, itemPrice, true]);
        total += itemPrice;
      }
    });
  }

  // Traccia le righe esistenti per rilevare le nuove aggiunte
  const previousRowKeys = Array.from(summaryList?.querySelectorAll('.summary-row') || []).map(row => row.textContent);
  
  const summaryHtml = rows
    .map(
      ([label, name, price, isGascooler]) => {
        const priceLabel = price === null || price === undefined ? "" : formatPrice(price);
        const rowKey = `${label}: ${name}${priceLabel}`;
        const isNew = !previousRowKeys.includes(rowKey);
        const classes = ['summary-row'];
        if (isNew) classes.push('added');
        if (isGascooler) classes.push('gascooler-row');
        const content = isGascooler 
          ? `<span><strong>${label}: ${name}</strong></span><span><strong>${priceLabel}</strong></span>`
          : `<span>${label}: ${name}</span><span>${priceLabel}</span>`;
        return `<div class="${classes.join(' ')}">${content}</div>`;
      }
    )
    .join("");

  summaryList.innerHTML = summaryHtml;
  
  // Rimuovi la classe 'added' dopo l'animazione
  setTimeout(() => {
    summaryList?.querySelectorAll('.summary-row.added').forEach(row => {
      row.classList.remove('added');
    });
  }, 500);
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
      if (item.category === "cabling") {
        return acc;
      }
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
        ${brandLabel}
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
  const currentStep = appState.step;
  const nextStep = Math.max(1, Math.min(8, step));
  if (currentStep === 4 && nextStep > currentStep) {
    const missingPanel = isElectricalPanelChoiceMissing();
    const missingCabling = isCablingChoiceMissing();
    const invalidCabling = isCablingExtraInvalid();
    if (missingPanel) showElectricalPanelChoiceHint();
    if (missingCabling) showCablingChoiceHint();
    if (invalidCabling) showCablingExtraHint();
    if (missingPanel || missingCabling || invalidCabling) return;
  }
  if (currentStep === 6 && nextStep > currentStep) {
    const missingProbes = isProbesChoiceMissing();
    const invalidOil = isOilKgInvalid();
    if (missingProbes) showProbesChoiceHint();
    if (invalidOil) showOilKgHint();
    if (missingProbes || invalidOil) return;
  }
  appState.step = nextStep;
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
  updateNextButtonState();
};

const canProceedFromCurrentStep = () => {
  const step = appState.step;
  
  if (step === 2) {
    return Boolean(appState.selections.mtKey);
  }

  if (step === 3) {
    return Boolean(appState.selections.ltChoice && appState.selections.configCode);
  }

  if (step === 4) {
    const missingPanel = isElectricalPanelChoiceMissing();
    const missingCabling = isCablingChoiceMissing();
    const invalidCabling = isCablingExtraInvalid();
    return !missingPanel && !missingCabling && !invalidCabling;
  }
  
  if (step === 6) {
    return !isProbesChoiceMissing() && !isOilKgInvalid();
  }
  
  return true;
};

export const updateNextButtonState = () => {
  if (!nextBtn) return;
  const canProceed = canProceedFromCurrentStep();
  const dict = getDictionary();
  nextBtn.disabled = !canProceed;
  if (canProceed) {
    nextBtn.classList.remove("disabled");
  } else {
    nextBtn.classList.add("disabled");
  }
  // Al passo 8 mostra "Anteprima di stampa" invece di "Avanti"
  if (appState.step === 8) {
    nextBtn.textContent = dict.nav_preview || "Anteprima di stampa";
  } else {
    nextBtn.textContent = dict.nav_next || "Avanti";
  }
};

export const resetSelections = () => {
  appState.selections = {
    brand: null,
    mtKey: null,
    ltPressure: null,
    ltChoice: null,
    configCode: null,
    electricalPanelChoice: null,
    probesChoice: null,
    cablingChoice: null,
    cablingExtraMeters: 0,
    oilEnabled: false,
    oilKg: 0,
    optionals: new Set(),
    discount: 0,
    project: appState.selections.project,
    gascooler: false,
    gascoolerPrice: 0,
    gascoolerCustomItems: [
      { description: "", price: 0 },
      { description: "", price: 0 },
      { description: "", price: 0 },
    ],
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
  if (gascoolerFields) gascoolerFields.classList.add("hidden");
  if (gascoolerPriceInput) gascoolerPriceInput.value = "";
  if (gascoolerCustom1Desc) gascoolerCustom1Desc.value = "";
  if (gascoolerCustom1Price) gascoolerCustom1Price.value = "";
  if (gascoolerCustom2Desc) gascoolerCustom2Desc.value = "";
  if (gascoolerCustom2Price) gascoolerCustom2Price.value = "";
  if (gascoolerCustom3Desc) gascoolerCustom3Desc.value = "";
  if (gascoolerCustom3Price) gascoolerCustom3Price.value = "";
  if (transportToggle) transportToggle.checked = false;
  if (transportCityInput) {
    transportCityInput.value = "";
    transportCityInput.disabled = true;
  }
  if (transportInfo) transportInfo.textContent = "";
  hideElectricalPanelChoiceHint();
  hideProbesChoiceHint();
  hideCablingChoiceHint();
  hideCablingExtraHint();
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
  appState.selections.configCode = null;
  appState.selections.electricalPanelChoice = null;
  appState.selections.probesChoice = null;
  appState.selections.cablingChoice = null;
  appState.selections.cablingExtraMeters = 0;
  appState.selections.oilEnabled = false;
  appState.selections.oilKg = 0;
  appState.selections.optionals = new Set();
  hideElectricalPanelChoiceHint();
  hideProbesChoiceHint();
  hideCablingChoiceHint();
  hideCablingExtraHint();
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
  
  // Update 3D viewer theme if available
  if (typeof window.updateViewer3DTheme === 'function') {
    window.updateViewer3DTheme(appState.ui.theme === "dark");
  }
  
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

export const setMachineTypeSelectorCollapsed = (collapsed) => {
  appState.ui.machineTypeSelectorCollapsed = Boolean(collapsed);
  if (machineTypeSelector) {
    machineTypeSelector.classList.toggle("collapsed", appState.ui.machineTypeSelectorCollapsed);
  }
  updateMachineTypeToggleLabel();
  updateMachineTypeSelectedLabel();
};

export const updateMachineTypeSelectedLabel = () => {
  if (!machineTypeSelected) return;
  const selectedType = machineTypes.find(m => m.id === appState.selections.machineType);
  if (selectedType && appState.ui.machineTypeSelectorCollapsed) {
    machineTypeSelected.textContent = selectedType.name;
    machineTypeSelected.classList.remove("hidden");
  } else {
    machineTypeSelected.classList.add("hidden");
  }
};

export const updateMachineTypeToggleLabel = () => {
  if (!machineTypeToggleBtn) return;
  const collapsed = appState.ui.machineTypeSelectorCollapsed;
  machineTypeToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
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

  catalogToggleBtn?.addEventListener("click", () => {
    setCatalogCollapsed(!appState.ui.catalogCollapsed);
  });

  machineTypeToggleBtn?.addEventListener("click", () => {
    setMachineTypeSelectorCollapsed(!appState.ui.machineTypeSelectorCollapsed);
  });

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
    transportInfo.textContent = dict.step8_info_loading || "Carico database città...";
  }
  const coords = enabled ? await lookupCity(key) : null;
  let km = 0;
  const countryMatches = countryFilter ? coords?.country === countryFilter : true;
  if (enabled && coords && countryMatches) {
    km = haversineKm(trevisoCoords, coords);
  }
  const isEuropean = coords ? europeanIso.has(coords.country) : false;
  const price = enabled && coords && countryMatches && isEuropean ? getTransportPrice(km) : 0;
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
      transportInfo.textContent = dict.step8_info_dataset_missing || "Dataset città mancante.";
    } else if (cityIndexStatus === "error") {
      transportInfo.textContent = dict.step8_info_unknown || "Città non trovata.";
    } else if (!coords || (countryFilter && coords?.country !== countryFilter)) {
      transportInfo.textContent = dict.step8_info_unknown || "Città non trovata.";
    } else if (!isEuropean) {
      transportInfo.textContent = dict.step8_info_extra || "Richiedi quotazione al team Enex.";
    } else {
      const msgTemplate = dict.step8_info_result || "Distanza stimata: {km} km - Costo stimato: € {price}";
      const message = msgTemplate
        .replace("{km}", km)
        .replace("{price}", `<strong style="color: #0066cc; font-size: 1.2em;">${price.toFixed(0)}</strong>`);
      transportInfo.innerHTML = message;
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
    if (gascoolerFields) {
      gascoolerFields.classList.toggle("hidden", !e.target.checked);
    }
    updateSummary();
  });

  const updateGascoolerPrice = () => {
    const price = parseFloat(gascoolerPriceInput?.value) || 0;
    appState.selections.gascoolerPrice = price;
    updateSummary();
  };

  const updateGascoolerCustom = (index) => {
    const descInput = [gascoolerCustom1Desc, gascoolerCustom2Desc, gascoolerCustom3Desc][index];
    const priceInput = [gascoolerCustom1Price, gascoolerCustom2Price, gascoolerCustom3Price][index];
    if (descInput && priceInput && appState.selections.gascoolerCustomItems[index]) {
      appState.selections.gascoolerCustomItems[index].description = descInput.value.trim();
      appState.selections.gascoolerCustomItems[index].price = parseFloat(priceInput.value) || 0;
      updateSummary();
    }
  };

  gascoolerPriceInput?.addEventListener("input", updateGascoolerPrice);
  gascoolerPriceInput?.addEventListener("change", updateGascoolerPrice);

  gascoolerCustom1Desc?.addEventListener("input", () => updateGascoolerCustom(0));
  gascoolerCustom1Price?.addEventListener("input", () => updateGascoolerCustom(0));
  gascoolerCustom1Price?.addEventListener("change", () => updateGascoolerCustom(0));

  gascoolerCustom2Desc?.addEventListener("input", () => updateGascoolerCustom(1));
  gascoolerCustom2Price?.addEventListener("input", () => updateGascoolerCustom(1));
  gascoolerCustom2Price?.addEventListener("change", () => updateGascoolerCustom(1));

  gascoolerCustom3Desc?.addEventListener("input", () => updateGascoolerCustom(2));
  gascoolerCustom3Price?.addEventListener("input", () => updateGascoolerCustom(2));
  gascoolerCustom3Price?.addEventListener("change", () => updateGascoolerCustom(2));

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

export const wireOilControls = () => {
  if (!oilOptionCard) return;
  const handleOilToggle = () => {
    appState.selections.oilEnabled = !appState.selections.oilEnabled;
    if (!appState.selections.oilEnabled) {
      appState.selections.oilKg = 0;
    }
    updateOilUI();
    updateSummary();
    updateNextButtonState();
  };

  const handleOilKgChange = (event) => {
    const value = parseOilKg(event.target.value);
    appState.selections.oilKg = value;
    updateOilUI();
    updateSummary();
    updateNextButtonState();
  };

  oilOptionCard.addEventListener("click", handleOilToggle);
  oilKgInput?.addEventListener("input", handleOilKgChange);
  oilKgInput?.addEventListener("change", handleOilKgChange);
};
