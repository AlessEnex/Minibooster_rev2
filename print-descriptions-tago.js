export const printDescriptionsByLanguage = {
  ITA: [
    {
      title: "CARATTERISTICHE GENERALI",
      items: [
        "Serbatoio di liquido: 50 litri",
        "Controllo dell'alta pressione con valvola elettronica",
        "Controllo della pressione nel serbatoio liquido con valvola elettronica",
        "Scambiatore rigenerativo tra linea HP e flash gas",
        "Serbatoio di aspirazione / serbatoio d'olio",
        "Barriera al vapore sul serbatoio del liquido e isolamento a freddo Armaflex applicato da personale specializzato",
        "Indicatore di livello minimo del liquido con allarme e spie sul serbatoio liquido",
        "Doppie valvole di sicurezza installate con valvola di inversione sul serbatoio del liquido",
        "Tutte le tubazioni INOX",
      ],
    },
    {
      title: "QUADRO ELETTRICO",
      requiresElectricalPanel: true,
      items: [
        "Alimentazione 3x 400V / 50 Hz / 3Ph + N + PE",
        "Regime di neutro TNS (senza interruttori differenziali) e Icc max 10 kA *",
        "*Ogni modifica del regime di neutro o dell'Icc sarà soggetta a revisione del prezzo",
        "Presa di corrente 10A - 230/1/50 Hz",
        "Illuminazione interna",
        "Uso di componenti di marche di prima qualità",
        "Etichettatura di ogni cavo e componente sulla centrale e all'interno del quadro elettrico per consentire un'identificazione agevole e rapida in caso di eventuale guasto",
        "Componenti installati su un solo livello e correttamente distanziati per facilitare ogni tipo di intervento",
      ],
    },
    {
      title: "TELAIO E ACCESSORI",
      items: [
        "Telaio verniciato RAL 9001",
        "Set di pressostati secondo le prescrizioni della norma EN378",
        "Valvole di sicurezza per la protezione del sistema conformemente alla norma EN 378",
        "Manometri HP / MP / LP",
      ],
      note: "La centrale è marcata CE cat. IV. Mod PED B + D",
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
  if (printDescriptionsByLanguage.FR) {
    return printDescriptionsByLanguage.FR;
  }
  return [];
};
