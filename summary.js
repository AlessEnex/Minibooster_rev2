import { appState, getExtraCosts, getOptionals, groupMtByName } from "./state.js";
import { getDictionary } from "./i18n.js";

export const parseCablingMeters = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
};

export const isCablingChoiceMissing = () =>
  appState.selections.cablingChoice !== "standard" &&
  appState.selections.cablingChoice !== "extra";

export const isCablingExtraInvalid = () => {
  if (appState.selections.cablingChoice !== "extra") return false;
  const meters = parseCablingMeters(appState.selections.cablingExtraMeters);
  return !Number.isInteger(meters) || meters <= 0;
};

export const getCablingStandardPrice = () => {
  const opt = getOptionals().find((o) => o.id === "cabling_standard");
  return opt ? opt.price : null;
};

export const getCablingExtraRate = (machineTypeId = appState.selections.machineType) => {
  const rates = getExtraCosts().cablingExtraPerMeter || {};
  const rate = rates[machineTypeId] ?? 0;
  return Number.isFinite(rate) ? rate : 0;
};

export const getCablingExtraPrice = (basePrice, meters, machineTypeId = appState.selections.machineType) => {
  const extraRate = getCablingExtraRate(machineTypeId);
  if (basePrice === null || basePrice === undefined) return null;
  if (basePrice === -1 || basePrice === -2) {
    return extraRate * meters;
  }
  if (typeof basePrice === "number" && Number.isFinite(basePrice)) {
    return basePrice + extraRate * meters;
  }
  return null;
};

export const buildSummaryData = (dict = getDictionary()) => {
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
    rows.push([
      dict.summary_brand_label || "Brand",
      appState.selections.brand === "dorin" ? "Dorin" : "Bitzer",
      null,
    ]);
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

  if (!isCablingChoiceMissing()) {
    const basePrice = getCablingStandardPrice();
    const meters = parseCablingMeters(appState.selections.cablingExtraMeters);
    const cablingChoice = appState.selections.cablingChoice;
    const cablingName =
      cablingChoice === "extra"
        ? `${dict.step4_cabling_extra || "Cablaggio extra"} (${meters} m)`
        : dict.step4_cabling_standard || "Cablaggio standard";
    const cablingPrice =
      cablingChoice === "extra"
        ? getCablingExtraPrice(basePrice, meters)
        : basePrice;

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

  const oilKgRaw = parseInt(appState.selections.oilKg, 10);
  const oilKg = Number.isNaN(oilKgRaw) ? 0 : Math.max(0, oilKgRaw);
  if (appState.selections.oilEnabled && oilKg > 0 && oilKg % 5 === 0) {
    const oilPricePerKg = getExtraCosts().oilPricePerKg;
    const oilPrice = (Number.isFinite(oilPricePerKg) ? oilPricePerKg : 0) * oilKg;
    const oilLabel = dict.step6_oil_label || "Olio";
    rows.push([dict.summary_optional_label || "Optional", `${oilLabel} (${oilKg} kg)`, oilPrice]);
    total += oilPrice;
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

  return { rows, total };
};
