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
  if (printDescriptionsByLanguage[lang]) {
    return printDescriptionsByLanguage[lang];
  }
  if (printDescriptionsByLanguage.ITA) {
    return printDescriptionsByLanguage.ITA;
  }
  return [];
};
