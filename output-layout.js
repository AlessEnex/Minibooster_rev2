import { appState } from "./state.js";
import { formatPrice } from "./ui.js";

/**
 * Genera l'HTML per l'header con loghi e informazioni principali
 * Occupa max 25% della pagina
 */
export const generateOutputHeader = () => {
  const { project, machineType } = appState.selections;
  
  // Mappa tipo macchina a nome visualizzato
  const machineTypeNames = {
    'TAGO': 'TAGO',
    'MBS': 'MINIBOOSTER',
    'MCB': 'MICROBOOSTER'
  };
  
  const modelName = machineTypeNames[machineType] || machineType || '-';
  
  return `
    <div class="output-header">
      <!-- Sezione loghi (6 loghi, altezza fissa, larghezza adattiva) -->
      <div class="output-logos">
        <img src="loghi/Logo_ENEX_2022_Black.png" alt="ENEX" class="output-logo">
        <img src="loghi/ECOVADIS.jpg" alt="ECOVADIS" class="output-logo">
        <img src="loghi/SISCERT1.jpg" alt="SISCERT1" class="output-logo">
        <img src="loghi/SISCERT2.jpg" alt="SISCERT2" class="output-logo">
        <img src="loghi/ACCREDIA.jpg" alt="ACCREDIA" class="output-logo">
        <img src="loghi/IIS.jpg" alt="IIS" class="output-logo">
      </div>
      
      <!-- Informazioni principali in formato compatto -->
      <div class="output-info-grid">
        <div class="output-info-row">
          <span class="output-label">OFFERTA N°:</span>
          <span class="output-value">${project.offerNumber || '-'}</span>
        </div>
        <div class="output-info-row">
          <span class="output-label">REVISIONE:</span>
          <span class="output-value">${project.revision || '-'}</span>
        </div>
        <div class="output-info-row">
          <span class="output-label">CLIENTE:</span>
          <span class="output-value">${project.client || '-'}</span>
        </div>
        <div class="output-info-row">
          <span class="output-label">RICHIESTO DA:</span>
          <span class="output-value">${project.requestedBy || '-'}</span>
        </div>
        <div class="output-info-row">
          <span class="output-label">PROGETTO:</span>
          <span class="output-value">${project.name || '-'}</span>
        </div>
        <div class="output-info-row">
          <span class="output-label">MODELLO SELEZIONATO:</span>
          <span class="output-value">${modelName}</span>
        </div>
      </div>
    </div>
  `;
};

/**
 * Genera l'HTML completo per la stampa
 */
export const generateOutputHTML = (summaryRows, total) => {
  const headerHTML = generateOutputHeader();
  
  const summaryHTML = summaryRows
    .map(([label, name, price]) => `
      <div class="output-summary-row">
        <span class="output-summary-label">${label}: ${name}</span>
        <span class="output-summary-price">${formatPrice(price)}</span>
      </div>
    `)
    .join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Offerta ${appState.selections.project.offerNumber || ''}</title>
      <link rel="stylesheet" href="output-styles.css">
    </head>
    <body>
      ${headerHTML}
      
      <div class="output-content">
        <h2 class="output-section-title">Configurazione</h2>
        ${summaryHTML}
        
        <div class="output-total">
          <span class="output-total-label">TOTALE</span>
          <span class="output-total-value">${formatPrice(total)}</span>
        </div>
      </div>
    </body>
    </html>
  `;
};
