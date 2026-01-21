import { getPrintDescriptions as getTagoDescriptions } from "./print-descriptions-tago.js";
import { getPrintDescriptions as getMbsDescriptions } from "./print-descriptions-mbs.js";
import { getPrintDescriptions as getMcbDescriptions } from "./print-descriptions-mcb.js";

const salesConditionsByLanguage = {
  ITA: [
    {
      title: "Condizioni di vendita",
      className: "print-sales-conditions",
      pageBreakBefore: true,
      items: [
        "Condizioni di consegna: Partenza stabilimento (EX-WORKS)",
        "Condizioni di pagamento: Da concordare all'ordine",
        "ORGALIMES2012 per condizioni supplementari speciali vedere https://www.enex.it/sales-terms-and-conditions/",
        "Validita dell'offerta: 30 giorni",
      ],
      note: "Cordiali saluti,",
    },
  ],
};

const getSalesConditions = (lang) => {
  if (salesConditionsByLanguage[lang]) {
    return salesConditionsByLanguage[lang];
  }
  if (salesConditionsByLanguage.ITA) {
    return salesConditionsByLanguage.ITA;
  }
  return [];
};

export const getPrintDescriptions = (machineType, lang) => {
  let baseSections = [];
  switch (machineType) {
    case "TAGO":
      baseSections = getTagoDescriptions(lang);
      break;
    case "MBS":
      baseSections = getMbsDescriptions(lang);
      break;
    case "MCB":
      baseSections = getMcbDescriptions(lang);
      break;
    default:
      baseSections = [];
  }
  return baseSections.concat(getSalesConditions(lang));
};
