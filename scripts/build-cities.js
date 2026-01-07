#!/usr/bin/env node
/**
 * Converte il dump GeoNames cities1000.txt in un JSON compatto per l'autocomplete.
 * Uso:
 *   node scripts/build-cities.js [input] [output]
 *   env POP_MIN=0 COUNTRY_FILTER=IT,FR node scripts/build-cities.js
 *
 * - POP_MIN: popolazione minima (default 0 per includere tutto)
 * - COUNTRY_FILTER: lista CSV di ISO2 da includere, vuoto = tutti i paesi
 */
const fs = require("fs");
const readline = require("readline");

const inputPath = process.argv[2] || "cities1000.txt";
const outputPath = process.argv[3] || "cities-index.json";
const popMin = Number(process.env.POP_MIN) || 0;
const countryFilter = (process.env.COUNTRY_FILTER || "")
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

if (!fs.existsSync(inputPath)) {
  console.error(`Input non trovato: ${inputPath}`);
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(inputPath),
  crlfDelay: Infinity,
});

const records = [];
rl.on("line", (line) => {
  if (!line || line.startsWith("#")) return;
  const parts = line.split("\t");
  if (parts.length < 15) return;
  const name = parts[1];
  const lat = Number(parts[4]);
  const lon = Number(parts[5]);
  const country = (parts[8] || "").toUpperCase();
  const population = Number(parts[14]) || 0;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return;
  if (population < popMin) return;
  if (countryFilter.length && !countryFilter.includes(country)) return;
  records.push({ name, lat, lon, country, population });
});

rl.on("close", () => {
  fs.writeFileSync(outputPath, JSON.stringify(records));
  console.log(
    `Creato ${outputPath} con ${records.length} città (pop >= ${popMin}${
      countryFilter.length ? `, paesi: ${countryFilter.join(",")}` : ""
    }).`
  );
});
