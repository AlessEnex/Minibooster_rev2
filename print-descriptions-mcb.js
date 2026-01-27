export const printDescriptionsByLanguage = {
  ITA: [
    {
      title: "QUADRO ELETTRICO",
      requiresElectricalPanel: true,
      items: [],
    },
  ],
};

export const getPrintDescriptions = (lang) => {
  // Normalizza DE/CH -> DE
  const normalizedLang = lang === "DE/CH" ? "DE" : lang;
  
  if (printDescriptionsByLanguage[normalizedLang]) {
    return printDescriptionsByLanguage[normalizedLang];
  }
  if (printDescriptionsByLanguage.ITA) {
    return printDescriptionsByLanguage.ITA;
  }
  return [];
};
