import { getPrintDescriptions as getTagoDescriptions } from "./print-descriptions-tago.js";
import { getPrintDescriptions as getMbsDescriptions } from "./print-descriptions-mbs.js";
import { getPrintDescriptions as getMcbDescriptions } from "./print-descriptions-mcb.js";

const salesConditionsByLanguage = {
  ITA: [
    {
      title: "Condizioni di vendita",
      className: "print-sales-conditions",
      items: [
        "Condizioni di consegna: Partenza stabilimento (EX-WORKS)",
        "Condizioni di pagamento: Da concordare all'ordine",
        "ORGALIMES2012 per condizioni supplementari speciali vedere https://www.enex.it/sales-terms-and-conditions/",
        "Validita dell'offerta: 30 giorni",
      ],
      note: "Cordiali saluti,",
    },
  ],
  EN: [
    {
      title: "Sales Conditions",
      className: "print-sales-conditions",
      items: [
        "Delivery terms: Ex-works",
        "Payment terms: To be agreed upon order",
        "ORGALIMES2012 for special supplementary conditions see https://www.enex.it/sales-terms-and-conditions/",
        "Offer validity: 30 days",
      ],
      note: "Best regards,",
    },
  ],
  FR: [
    {
      title: "Conditions de vente",
      className: "print-sales-conditions",
      items: [
        "Conditions de livraison: Départ usine (EX-WORKS)",
        "Conditions de paiement: À convenir à la commande",
        "ORGALIMES2012 pour conditions supplémentaires spéciales voir https://www.enex.it/sales-terms-and-conditions/",
        "Validité de l'offre: 30 jours",
      ],
      note: "Cordialement,",
    },
  ],
  "DE/CH": [
    {
      title: "Verkaufsbedingungen",
      className: "print-sales-conditions",
      items: [
        "Lieferbedingungen: Ab Werk (EX-WORKS)",
        "Zahlungsbedingungen: Bei Bestellung zu vereinbaren",
        "ORGALIMES2012 für spezielle Zusatzbedingungen siehe https://www.enex.it/sales-terms-and-conditions/",
        "Gültigkeit des Angebots: 30 Tage",
      ],
      note: "Mit freundlichen Grüßen,",
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
