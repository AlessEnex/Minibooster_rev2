const clone = (value) => JSON.parse(JSON.stringify(value));

export const appState = {
  step: 1,
  selections: {
    machineType: null,
    brand: null,
    mtKey: null,
    ltPressure: null,
    ltChoice: null,
    optionals: new Set(),
    gascooler: false,
    discount: 0,
    transport: {
      enabled: false,
      city: "",
      country: "",
      km: 0,
      price: 0,
    },
    project: {
      name: "",
      date: "",
      owner: "",
      language: "ITA",
    },
  },
  ui: {
    theme: "light",
    catalogCollapsed: true,
  },
};

export const machineTypes = [
  { id: "TAGO", name: "TAGO", prefix: "T" },
  { id: "MBS", name: "MBS SWISSLINE", prefix: "MBS" },
  { id: "MCB", name: "MICROBOOSTER", prefix: "MCB" },
];

export const isProjectComplete = () => {
  const { name, date, owner } = appState.selections.project;
  return Boolean(name?.trim() && date?.trim() && owner?.trim());
};

export const getFilteredConfigs = () => {
  const configs = getConfigs();
  if (!appState.selections.machineType) return configs;
  const machineType = machineTypes.find((m) => m.id === appState.selections.machineType);
  if (!machineType) return configs;
  return configs.filter((cfg) => cfg.code?.startsWith(machineType.prefix));
};

export const catalogFilters = { brand: "all", onlyLt: false };

export const defaultConfigs = [
  {
    code: "T2_10_0",
    mt: {
      dorin: { name: "MT CD0 36-2,4H+CD0 36-2,4H", price: 31931 },
      bitzer: { name: "MT 2MTE-5Z+2MTE-5Z", price: 34485.48 },
    },
    lt36: {
      dorin: null,
      bitzer: null,
    },
    lt60: {
      dorin: null,
      bitzer: null,
    },
  },
  {
    code: "T2_15_0",
    mt: {
      dorin: { name: "MT CD0 38-3,0H+CD4 55-4,7M", price: 32125 },
      bitzer: { name: "MT 2MTE-5Z+2KTE-7Z", price: 34695 },
    },
    lt36: { dorin: null, bitzer: null },
    lt60: { dorin: null, bitzer: null },
  },
  {
    code: "T2_10_3",
    mt: {
      dorin: { name: "MT CD0 36-2,4H+CD0 36-2,4H", price: 36187 },
      bitzer: { name: "MT 2MTE-5Z+2MTE-5Z", price: 39081.96 },
    },
    lt36: {
      dorin: { name: "CD0 18-1,5M", price: 2200 },
      bitzer: { name: "2NSL-05Z", price: 2354 },
    },
    lt60: {
      dorin: { name: "CD0 18-1,5M", price: 3250 },
      bitzer: { name: "CD0 18-1,5M", price: 3477.5 },
    },
  },
  {
    code: "T2_15_3",
    mt: {
      dorin: { name: "MT CD0 38-3,0H+CD4 55-4,7M", price: 36381 },
      bitzer: { name: "MT 2MTE-5Z+2KTE-7Z", price: 39291.48 },
    },
    lt36: {
      dorin: { name: "CD0 18-1,5M", price: 2400 },
      bitzer: { name: "2NSL-05Z", price: 2568 },
    },
    lt60: {
      dorin: { name: "CD0 18-1,5M", price: 3450 },
      bitzer: { name: "CD0 18-1,5M", price: 3691.5 },
    },
  },
  {
    code: "T2_20_3",
    mt: {
      dorin: { name: "MT CD4 75-4,7H+CD4 75-4,7H", price: 38801 },
      bitzer: { name: "MT 4PTE-10Z+4MTE-10Z", price: 41905.08 },
    },
    lt36: {
      dorin: { name: "CD0 18-1,5M", price: 850 },
      bitzer: { name: "2NSL-05Z", price: 909.5 },
    },
    lt60: {
      dorin: { name: "CD0 18-1,5M", price: 1900 },
      bitzer: { name: "CD0 18-1,5M", price: 2033 },
    },
  },
];

export const defaultOptionals = [
  { id: "carel", name: "Carel", price: 1860, category: "onboard" },
  { id: "danfoss_782", name: "Danfoss 782", price: 2800, category: "onboard" },
  { id: "heat_recovery", name: "Heat Recovery", price: 700, category: "onboard" },
  { id: "ducting", name: "Ducting", price: 2200, category: "onboard" },
  { id: "cladding_indoor", name: "Cladding indoor", price: 2300, category: "onboard" },
  { id: "cladding_outdoor", name: "Cladding outdoor", price: 400, category: "onboard" },
  { id: "muffler_sp", name: "Muffler spare parts", price: 1410, category: "spare" },
  { id: "ccmt_sp", name: "CCMT spare parts", price: 1200, category: "spare" },
  { id: "gascooler_spare", name: "3W gascooler Spare", price: 1150, category: "spare" },
  { id: "diff_mt", name: "Differential MT", price: 1600, category: "spare" },
  { id: "diff_mt_lt", name: "Differentials MT/LT", price: 1640, category: "spare" },
  { id: "mx_coil", name: "MX coil", price: 650, category: "spare" },
  { id: "carton_572a", name: "572A en carton", price: 1100, category: "spare" },
  { id: "carton_300t", name: "300T en carton", price: 1850, category: "spare" },
  { id: "carton_782a", name: "782A en carton", price: 1850, category: "spare" },
];

let configs = clone(defaultConfigs);
let optionals = clone(defaultOptionals);
const pricingMatrix = { configs, optionals };

export const getConfigs = () => configs;
export const getOptionals = () => optionals;
export const getPricingMatrix = () => pricingMatrix;

export const setConfigs = (next) => {
  configs = next;
  pricingMatrix.configs = configs;
};

export const setOptionals = (next) => {
  optionals = next;
  pricingMatrix.optionals = optionals;
};

export const resetDataToDefaults = () => {
  configs = clone(defaultConfigs);
  optionals = clone(defaultOptionals);
  pricingMatrix.configs = configs;
  pricingMatrix.optionals = optionals;
};

export const buildConfigsFromRecords = (records) => {
  const map = new Map();
  records.forEach((r) => {
    if (!r.code) return;
    if (!map.has(r.code)) {
      map.set(r.code, {
        code: r.code,
        mt: { dorin: null, bitzer: null },
        lt36: { dorin: null, bitzer: null },
        lt60: { dorin: null, bitzer: null },
      });
    }
    const cfg = map.get(r.code);
    if (r.mt_dorin_name || r.mt_dorin_price !== null) {
      cfg.mt.dorin = { name: r.mt_dorin_name || "", price: r.mt_dorin_price ?? null };
    }
    if (r.mt_bitzer_name || r.mt_bitzer_price !== null) {
      cfg.mt.bitzer = { name: r.mt_bitzer_name || "", price: r.mt_bitzer_price ?? null };
    }
    if (r.lt_dorin_36_name || r.lt_dorin_36_price !== null) {
      cfg.lt36.dorin = { name: r.lt_dorin_36_name || "", price: r.lt_dorin_36_price ?? null };
    }
    if (r.lt_bitzer_36_name || r.lt_bitzer_36_price !== null) {
      cfg.lt36.bitzer = { name: r.lt_bitzer_36_name || "", price: r.lt_bitzer_36_price ?? null };
    }
    if (r.lt_dorin_60_name || r.lt_dorin_60_price !== null) {
      cfg.lt60.dorin = { name: r.lt_dorin_60_name || "", price: r.lt_dorin_60_price ?? null };
    }
    if (r.lt_bitzer_60_name || r.lt_bitzer_60_price !== null) {
      cfg.lt60.bitzer = { name: r.lt_bitzer_60_name || "", price: r.lt_bitzer_60_price ?? null };
    }
  });
  return Array.from(map.values());
};

export const buildOptionalsFromRecords = (records) => {
  const optionalFields = [
    { field: "carel", id: "carel", name: "Carel", category: "onboard" },
    { field: "danfoss_782", id: "danfoss_782", name: "Danfoss 782", category: "onboard" },
    { field: "heat_recovery", id: "heat_recovery", name: "Heat Recovery", category: "onboard" },
    { field: "ducting", id: "ducting", name: "Ducting", category: "onboard" },
    { field: "cladding_indoor", id: "cladding_indoor", name: "Cladding indoor", category: "onboard" },
    { field: "cladding_outdoor", id: "cladding_outdoor", name: "Cladding outdoor", category: "onboard" },
    { field: "muffler_sp", id: "muffler_sp", name: "Muffler spare parts", category: "spare" },
    { field: "ccmt_sp", id: "ccmt_sp", name: "CCMT spare parts", category: "spare" },
    { field: "gascooler_spare", id: "gascooler_spare", name: "3W gascooler Spare", category: "spare" },
    { field: "diff_mt", id: "diff_mt", name: "Differential MT", category: "spare" },
    { field: "diff_mt_lt", id: "diff_mt_lt", name: "Differentials MT/LT", category: "spare" },
    { field: "mx_coil", id: "mx_coil", name: "MX coil", category: "spare" },
    { field: "carton_572a", id: "carton_572a", name: "572A en carton", category: "spare" },
    { field: "carton_300t", id: "carton_300t", name: "300T en carton", category: "spare" },
    { field: "carton_782a", id: "carton_782a", name: "782A en carton", category: "spare" },
  ];

  const priceMap = new Map();
  
  optionalFields.forEach((opt) => {
    const prices = records
      .map((r) => r[opt.field])
      .filter((p) => p !== null && p !== undefined && !Number.isNaN(p));
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      priceMap.set(opt.id, Math.round(avgPrice));
    }
  });

  return optionalFields.map((opt) => ({
    id: opt.id,
    name: opt.name,
    price: priceMap.get(opt.id) ?? (getOptionals().find((o) => o.id === opt.id)?.price ?? 0),
    category: opt.category,
  }));
};

export const groupMtByName = (brand) => {
  const grouped = new Map();
  const filteredConfigs = getFilteredConfigs();
  filteredConfigs.forEach((cfg) => {
    const mt = cfg.mt[brand];
    if (!mt || mt.price === null) return;
    const key = `${brand}:${mt.name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        brand,
        mtName: mt.name,
        mtPrice: mt.price,
        codes: [],
        lt36Options: [],
        lt60Options: [],
      });
    }
    const bucket = grouped.get(key);
    bucket.codes.push(cfg.code);
    const lt36 = cfg.lt36[brand];
    const lt60 = cfg.lt60[brand];
    if (lt36 && lt36.price !== null) {
      bucket.lt36Options.push({
        id: `${cfg.code}-36-${brand}`,
        code: cfg.code,
        name: lt36.name || cfg.code,
        price: lt36.price,
        pressure: "36",
      });
    }
    if (lt60 && lt60.price !== null) {
      bucket.lt60Options.push({
        id: `${cfg.code}-60-${brand}`,
        code: cfg.code,
        name: lt60.name || cfg.code,
        price: lt60.price,
        pressure: "60",
      });
    }
  });
  return Array.from(grouped.values());
};

export const formatPrice = (value) => {
  if (value === null || value === undefined) return "—";
  return (
    "€ " +
    Number(value)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      .replace(".-", "-")
  );
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const cleanNumber = (value) => {
  if (!value) return null;
  const sanitized = value.replace(/[€\s.]/g, "").replace(",", ".");
  const parsed = parseFloat(sanitized);
  return Number.isNaN(parsed) ? null : parsed;
};

export const normalizeTextCell = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") return null;
  return trimmed;
};

export const parseTsvInput = (text) =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split("\t"))
    .filter((row) => row.some((cell) => cell.trim() !== ""));

export const effectiveLength = (cells) => {
  const cloned = cells.slice();
  while (cloned.length && !normalizeTextCell(cloned[cloned.length - 1])) {
    cloned.pop();
  }
  return cloned.length;
};

export const normalizeCellsLength = (cells, target = 28) => {
  const arr = cells.slice(0, target);
  while (arr.length < target) {
    arr.push("");
  }
  return arr;
};

export const mapRowToRecord = (cells) => ({
  code: normalizeTextCell(cells[0]),
  mt_dorin_name: normalizeTextCell(cells[1]),
  mt_dorin_price: cleanNumber(cells[2]),
  mt_bitzer_name: normalizeTextCell(cells[3]),
  mt_bitzer_price: cleanNumber(cells[4]),
  lt_dorin_36_name: normalizeTextCell(cells[5]),
  lt_dorin_36_price: cleanNumber(cells[6]),
  lt_bitzer_36_name: normalizeTextCell(cells[7]),
  lt_bitzer_36_price: cleanNumber(cells[8]),
  lt_dorin_60_name: normalizeTextCell(cells[9]),
  lt_dorin_60_price: cleanNumber(cells[10]),
  lt_bitzer_60_name: normalizeTextCell(cells[11]),
  lt_bitzer_60_price: cleanNumber(cells[12]),
  carel: cleanNumber(cells[13]),
  danfoss_782: cleanNumber(cells[14]),
  heat_recovery: cleanNumber(cells[15]),
  ducting: cleanNumber(cells[16]),
  cladding_indoor: cleanNumber(cells[17]),
  cladding_outdoor: cleanNumber(cells[18]),
  muffler_sp: cleanNumber(cells[19]),
  ccmt_sp: cleanNumber(cells[20]),
  gascooler_spare: cleanNumber(cells[21]),
  diff_mt: cleanNumber(cells[22]),
  diff_mt_lt: cleanNumber(cells[23]),
  mx_coil: cleanNumber(cells[24]),
  carton_572a: cleanNumber(cells[25]),
  carton_300t: cleanNumber(cells[26]),
  carton_782a: cleanNumber(cells[27]),
});

export const matrixHeaders = [
  "Stringamot",
  "Nome MT Dorin",
  "Prezzo MT Dorin",
  "Nome MT Bitzer",
  "Prezzo MT Bitzer",
  "Nome LT Dorin 36bar",
  "Prezzo LT Dorin 36bar",
  "Nome LT Bitzer 36bar",
  "Prezzo LT Bitzer 36bar",
  "Nome LT Dorin 60bar",
  "Prezzo LT Dorin 60bar",
  "Nome LT Bitzer 60bar",
  "Prezzo LT Bitzer 60bar",
  "Carel",
  "Danfoss 782",
  "Heat Recovery",
  "Ducting",
  "Cladding indoor",
  "Cladding outdoor",
  "Muffler spare parts",
  "CCMT spare parts",
  "3W gascooler Spare",
  "Differential MT",
  "Differentials MT/LT",
  "MX coil",
  "572A en carton",
  "300T en carton",
  "782A en carton",
];
