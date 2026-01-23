import { appState, loadExtraCosts } from "./state.js";
import { applyTranslations } from "./i18n.js";
import {
  goToStep,
  initTheme,
  renderCatalog,
  renderUserPanels,
  resetSelections,
  setCatalogCollapsed,
  setMachineTypeSelectorCollapsed,
  updateCatalogCollapseLabel,
  updateProjectFlow,
  updateSummary,
  updateThemeToggleLabel,
  wireCatalogFilters,
  wireOilControls,
  wireTransportControls,
} from "./ui.js";
import {
  exportJson,
  initAdminEvents,
  loadPricingMatrix,
  renderAdminTables,
  saveAdminChanges,
} from "./admin.js";
import { renderPrintPreview, setupPrintButton } from "./print.js";

const projectNameInput = document.getElementById("projectName");
const requestDateInput = document.getElementById("requestDate");
const projectOwnerInput = document.getElementById("projectOwner");
const projectLanguageInput = document.getElementById("projectLanguage");
const offerNumberInput = document.getElementById("offerNumber");
const revisionNumberInput = document.getElementById("revisionNumber");
const clientNameInput = document.getElementById("clientName");
const requestedByInput = document.getElementById("requestedBy");
const i18nNodes = document.querySelectorAll("[data-i18n]");
const adminPanel = document.getElementById("adminPanel");
const discountInput = document.getElementById("discountInput");
const printPreviewBtn = document.getElementById("printPreviewBtn");
const printPreviewExitBtn = document.getElementById("printPreviewExitBtn");
const printPreviewToolbar = document.getElementById("printPreviewToolbar");
let printPreviewEnabled = new URLSearchParams(window.location.search).has("printPreview");
let previewFrame = null;
let previewListenersBound = false;

const initProjectInputs = () => {
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  if (!appState.selections.project.date) {
    appState.selections.project.date = isoToday;
  }
  if (projectNameInput) projectNameInput.value = appState.selections.project.name;
  if (requestDateInput) requestDateInput.value = appState.selections.project.date;
  if (projectOwnerInput) projectOwnerInput.value = appState.selections.project.owner;
  if (projectLanguageInput) projectLanguageInput.value = appState.selections.project.language;
  if (offerNumberInput) offerNumberInput.value = appState.selections.project.offerNumber;
  if (revisionNumberInput) revisionNumberInput.value = appState.selections.project.revision;
  if (clientNameInput) clientNameInput.value = appState.selections.project.client;
  if (requestedByInput) requestedByInput.value = appState.selections.project.requestedBy;

  const assign = (field, value) => {
    appState.selections.project[field] = value;
    updateSummary();
    renderCatalog();
    updateProjectFlow();
    applyTranslations(i18nNodes, updateThemeToggleLabel, updateCatalogCollapseLabel);
  };

  projectNameInput?.addEventListener("input", (e) => assign("name", e.target.value));
  requestDateInput?.addEventListener("change", (e) => assign("date", e.target.value));
  projectOwnerInput?.addEventListener("input", (e) => assign("owner", e.target.value));
  projectLanguageInput?.addEventListener("change", (e) => assign("language", e.target.value));
  offerNumberInput?.addEventListener("input", (e) => assign("offerNumber", e.target.value));
  revisionNumberInput?.addEventListener("input", (e) => assign("revision", e.target.value));
  clientNameInput?.addEventListener("input", (e) => assign("client", e.target.value));
  requestedByInput?.addEventListener("input", (e) => assign("requestedBy", e.target.value));

  const setDiscount = (value) => {
    const parsed = Number(value);
    const safeValue = Number.isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    appState.selections.discount = safeValue;
    if (discountInput) discountInput.value = safeValue;
    updateSummary();
  };
  if (discountInput) {
    discountInput.value = appState.selections.discount || 0;
    discountInput.addEventListener("input", (e) => setDiscount(e.target.value));
    discountInput.addEventListener("change", (e) => setDiscount(e.target.value));
  }
};

const initNavControls = () => {
  document.getElementById("startBtn")?.addEventListener("click", () => {
    document.getElementById("funnel")?.scrollIntoView({ behavior: "smooth" });
  });

  // Pulsante temporaneo per compilare dati di test
  document.getElementById("fillTestData")?.addEventListener("click", () => {
    if (offerNumberInput) offerNumberInput.value = "2024-042";
    if (revisionNumberInput) revisionNumberInput.value = "Rev. 1";
    if (clientNameInput) clientNameInput.value = "Acme Corporation S.p.A.";
    if (requestedByInput) requestedByInput.value = "Mario Rossi";
    if (projectNameInput) projectNameInput.value = "Revamp impianto refrigerazione centro commerciale";
    if (projectOwnerInput) projectOwnerInput.value = "Giuseppe Verdi";
    
    // Aggiorna lo stato
    appState.selections.project.offerNumber = "2024-042";
    appState.selections.project.revision = "Rev. 1";
    appState.selections.project.client = "Acme Corporation S.p.A.";
    appState.selections.project.requestedBy = "Mario Rossi";
    appState.selections.project.name = "Revamp impianto refrigerazione centro commerciale";
    appState.selections.project.owner = "Giuseppe Verdi";
    
    updateSummary();
    renderCatalog();
    updateProjectFlow();
  });

  document.getElementById("adminToggle")?.addEventListener("click", () => {
    adminPanel?.classList.toggle("hidden");
  });

  document.getElementById("nextBtn")?.addEventListener("click", () => {
    goToStep(appState.step + 1);
    document.getElementById("funnel")?.scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("prevBtn")?.addEventListener("click", () =>
    goToStep(appState.step - 1)
  );

  document.getElementById("resetBtn")?.addEventListener("click", resetSelections);

  document.getElementById("savePrices")?.addEventListener("click", saveAdminChanges);
  document.getElementById("exportBtn")?.addEventListener("click", exportJson);
  
  setupPrintButton();
};

const schedulePrintPreview = () => {
  if (!printPreviewEnabled) return;
  if (previewFrame) cancelAnimationFrame(previewFrame);
  previewFrame = requestAnimationFrame(() => {
    if (!printPreviewEnabled) {
      previewFrame = null;
      return;
    }
    renderPrintPreview();
    previewFrame = null;
  });
};

const bindPrintPreviewListeners = () => {
  if (previewListenersBound) return;
  previewListenersBound = true;
  ["input", "change", "click"].forEach((eventName) => {
    document.addEventListener(eventName, schedulePrintPreview);
  });
  window.addEventListener("resize", schedulePrintPreview);
};

const setPrintPreviewEnabled = (enabled, opts = {}) => {
  const { updateUrl = true } = opts;
  const nextEnabled = Boolean(enabled);
  printPreviewEnabled = nextEnabled;
  document.body.classList.toggle("print-preview", nextEnabled);
  if (printPreviewToolbar) {
    printPreviewToolbar.classList.toggle("hidden", !nextEnabled);
  }
  if (!nextEnabled && previewFrame) {
    cancelAnimationFrame(previewFrame);
    previewFrame = null;
  }
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (nextEnabled) {
      url.searchParams.set("printPreview", "1");
    } else {
      url.searchParams.delete("printPreview");
    }
    history.replaceState(null, "", url);
  }
  schedulePrintPreview();
};

const initPrintPreview = () => {
  bindPrintPreviewListeners();
  printPreviewBtn?.addEventListener("click", () => setPrintPreviewEnabled(!printPreviewEnabled));
  printPreviewExitBtn?.addEventListener("click", () => setPrintPreviewEnabled(false));
  if (printPreviewEnabled) {
    setPrintPreviewEnabled(true, { updateUrl: false });
  }
};

const initFrostCursor = () => {
  const canvas = document.getElementById('frostCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let cracks = [];
  let mouseX = 0;
  let mouseY = 0;

  // Imposta dimensioni canvas
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Classe per una singola crepa
  class Crack {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.branches = [];
      this.maxBranches = Math.floor(Math.random() * 4) + 1; // 1-4 rami (più variabile)
      this.opacity = 1;
      this.birthTime = Date.now();
      this.fadeDelay = 800; // ms prima di iniziare a dissolversi
      this.fadeSpeed = 0.004; // velocità di dissolvenza (più lento)
      this.createBranches();
    }

    createBranches() {
      const baseAngle = Math.random() * Math.PI * 2; // angolo base casuale
      
      for (let i = 0; i < this.maxBranches; i++) {
        const angleSpread = Math.random() * 1.5 + 0.5; // spread variabile
        const angle = baseAngle + (Math.PI * 2 / this.maxBranches) * i + (Math.random() - 0.5) * angleSpread;
        const lengthVariation = Math.random(); // 0-1
        
        this.branches.push({
          angle: angle,
          initialAngle: angle, // mantieni angolo iniziale
          length: 0,
          maxLength: lengthVariation < 0.3 ? Math.random() * 30 + 10 : // 30% corti
                     lengthVariation < 0.7 ? Math.random() * 60 + 30 : // 40% medi
                     Math.random() * 100 + 60, // 30% lunghi
          segments: [{x: this.x, y: this.y}],
          growth: Math.random() * 2.5 + 0.5, // velocità più variabile (0.5-3)
          deviation: Math.random() * 0.15 + 0.05, // deviazione ridotta (0.05-0.2)
          subBranches: []
        });
      }
    }

    updateOpacity(mouseX, mouseY) {
      // La crepa svanisce dal centro verso le estremità
      const age = Date.now() - this.birthTime;

      if (age > this.fadeDelay) {
        // Calcola l'opacità basata sulla distanza dal centro della crepa
        this.fadeProgress = this.fadeProgress || 0;
        this.fadeProgress += this.fadeSpeed;
        
        // Applica opacità ai segmenti in base alla distanza dal centro
        this.branches.forEach(branch => {
          branch.segments.forEach((segment, index) => {
            const distanceFromCenter = Math.sqrt((segment.x - this.x) ** 2 + (segment.y - this.y) ** 2);
            const maxDistance = branch.maxLength;
            const normalizedDistance = distanceFromCenter / Math.max(maxDistance, 1);
            
            // Opacità diminuisce dal centro (0) alle estremità (1)
            // Più il fadeProgress aumenta, più si espande la zona trasparente
            segment.opacity = normalizedDistance > this.fadeProgress ? 1 : Math.max(0, 1 - (this.fadeProgress - normalizedDistance) * 3);
          });
          
          // Stesso per i sub-rami
          branch.subBranches.forEach(subBranch => {
            subBranch.segments.forEach(segment => {
              const distanceFromCenter = Math.sqrt((segment.x - this.x) ** 2 + (segment.y - this.y) ** 2);
              const maxDistance = branch.maxLength + subBranch.maxLength;
              const normalizedDistance = distanceFromCenter / Math.max(maxDistance, 1);
              segment.opacity = normalizedDistance > this.fadeProgress ? 1 : Math.max(0, 1 - (this.fadeProgress - normalizedDistance) * 3);
            });
          });
        });
        
        // L'opacità globale della crepa diminuisce quando tutto è svanito
        if (this.fadeProgress >= 1) {
          this.opacity -= this.fadeSpeed * 0.5;
          this.opacity = Math.max(0, this.opacity);
        }
      }
    }

    update() {
      let allComplete = true;
      
      this.branches.forEach(branch => {
        if (branch.length < branch.maxLength) {
          allComplete = false;
          branch.length += branch.growth;
          
          const lastSegment = branch.segments[branch.segments.length - 1];
          
          // Piccole deviazioni occasionali, ma mantiene la direzione principale
          if (Math.random() < 0.15) { // solo 15% dei segmenti deviano
            const deviation = (Math.random() - 0.5) * branch.deviation;
            branch.angle = branch.initialAngle + deviation;
          } else {
            branch.angle = branch.initialAngle; // mantiene direzione dritta
          }
          
          const newX = lastSegment.x + Math.cos(branch.angle) * branch.growth;
          const newY = lastSegment.y + Math.sin(branch.angle) * branch.growth;
          
          branch.segments.push({x: newX, y: newY});
          
          // Crea sub-rami con probabilità variabile
          const subBranchChance = Math.random();
          if (subBranchChance < 0.05 && branch.subBranches.length < 3) {
            const subAngle = branch.angle + (Math.random() - 0.5) * Math.PI;
            const subLengthType = Math.random();
            branch.subBranches.push({
              angle: subAngle,
              initialAngle: subAngle,
              length: 0,
              maxLength: subLengthType < 0.5 ? Math.random() * 20 + 5 : Math.random() * 40 + 15,
              segments: [{x: newX, y: newY}],
              growth: branch.growth * (Math.random() * 0.5 + 0.3), // 0.3-0.8 della velocità del ramo
              deviation: Math.random() * 0.2 + 0.05
            });
          }
        }
        
        // Aggiorna sub-rami
        branch.subBranches.forEach(subBranch => {
          if (subBranch.length < subBranch.maxLength) {
            allComplete = false;
            subBranch.length += subBranch.growth;
            
            const lastSegment = subBranch.segments[subBranch.segments.length - 1];
            
            // Sub-rami anche loro più dritti
            if (Math.random() < 0.15) {
              const deviation = (Math.random() - 0.5) * subBranch.deviation;
              subBranch.angle = subBranch.initialAngle + deviation;
            } else {
              subBranch.angle = subBranch.initialAngle;
            }
            
            const newX = lastSegment.x + Math.cos(subBranch.angle) * subBranch.growth;
            const newY = lastSegment.y + Math.sin(subBranch.angle) * subBranch.growth;
            
            subBranch.segments.push({x: newX, y: newY});
          }
        });
      });

      return allComplete;
    }

    draw(ctx) {
      if (this.opacity <= 0) return;
      
      const isDark = document.body.classList.contains('dark-mode');
      const baseColor = isDark ? [180, 220, 255] : [100, 150, 200];
      
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      this.branches.forEach(branch => {
        if (branch.segments.length > 1) {
          // Disegna ogni segmento con la sua opacità individuale
          for (let i = 1; i < branch.segments.length; i++) {
            const segment = branch.segments[i];
            const segmentOpacity = segment.opacity !== undefined ? segment.opacity : 1;
            const finalOpacity = 0.4 * this.opacity * segmentOpacity;
            
            if (finalOpacity > 0.01) {
              ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${finalOpacity})`;
              ctx.beginPath();
              ctx.moveTo(branch.segments[i-1].x, branch.segments[i-1].y);
              ctx.lineTo(segment.x, segment.y);
              ctx.stroke();
            }
          }
        }
        
        // Disegna sub-rami con opacità individuale
        branch.subBranches.forEach(subBranch => {
          if (subBranch.segments.length > 1) {
            for (let i = 1; i < subBranch.segments.length; i++) {
              const segment = subBranch.segments[i];
              const segmentOpacity = segment.opacity !== undefined ? segment.opacity : 1;
              const finalOpacity = 0.3 * this.opacity * segmentOpacity;
              
              if (finalOpacity > 0.01) {
                ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${finalOpacity})`;
                ctx.beginPath();
                ctx.moveTo(subBranch.segments[i-1].x, subBranch.segments[i-1].y);
                ctx.lineTo(segment.x, segment.y);
                ctx.stroke();
              }
            }
          }
        });
      });
    }
  }

  // Aggiungi crepe al movimento del mouse
  let isMouseDown = false;
  let currentCrack = null;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Click crea una crepa che si espande
  document.addEventListener('mousedown', (e) => {
    const target = e.target;
    const isOnBackground = target === document.body || 
                          target.classList.contains('app-shell') ||
                          target.classList.contains('layout-with-summary');
    
    if (isOnBackground) {
      isMouseDown = true;
      
      // Crea una nuova crepa espandibile
      class ExpandingCrack extends Crack {
        constructor(x, y) {
          super(x, y);
          this.maxBranches = Math.floor(Math.random() * 3) + 4; // 4-6 rami
          this.isExpanding = true;
          this.branches = [];
          this.createExpandingBranches();
        }
        
        createExpandingBranches() {
          const baseAngle = Math.random() * Math.PI * 2;
          
          for (let i = 0; i < this.maxBranches; i++) {
            const angleSpread = Math.random() * 1.0 + 0.3;
            const angle = baseAngle + (Math.PI * 2 / this.maxBranches) * i + (Math.random() - 0.5) * angleSpread;
            
            this.branches.push({
              angle: angle,
              initialAngle: angle,
              length: 0,
              maxLength: Math.random() * 60 + 40, // lunghezza iniziale
              segments: [{x: this.x, y: this.y}],
              growth: Math.random() * 3 + 1.5,
              deviation: Math.random() * 0.2 + 0.05,
              subBranches: []
            });
          }
        }
        
        expandBranches() {
          // Aumenta la lunghezza massima di tutti i rami
          this.branches.forEach(branch => {
            branch.maxLength += 20; // aumenta di 20px
            
            // Occasionalmente aggiungi nuovi sub-rami
            if (Math.random() < 0.3 && branch.subBranches.length < 3) {
              const lastSegment = branch.segments[branch.segments.length - 1];
              const subAngle = branch.angle + (Math.random() - 0.5) * Math.PI;
              branch.subBranches.push({
                angle: subAngle,
                initialAngle: subAngle,
                length: 0,
                maxLength: Math.random() * 30 + 10,
                segments: [{x: lastSegment.x, y: lastSegment.y}],
                growth: branch.growth * (Math.random() * 0.5 + 0.3),
                deviation: Math.random() * 0.2 + 0.05
              });
            }
            
            // Espandi anche i sub-rami esistenti
            branch.subBranches.forEach(subBranch => {
              subBranch.maxLength += 10;
            });
          });
        }
        
        update() {
          // Se non è in espansione, blocca la crescita impostando length = maxLength
          if (!this.isExpanding) {
            this.branches.forEach(branch => {
              branch.maxLength = branch.length;
              branch.subBranches.forEach(subBranch => {
                subBranch.maxLength = subBranch.length;
              });
            });
          }
          return super.update();
        }
        
        stopExpanding() {
          this.isExpanding = false;
          // Quando si ferma l'espansione, resetta il timer di nascita per far partire il delay di 3 secondi
          this.birthTime = Date.now();
          this.fadeDelay = 3000; // 3 secondi prima di iniziare a svanire
          this.fadeSpeed = 0.004; // velocità di dissolvenza più lenta
        }
      }
      
      currentCrack = new ExpandingCrack(e.clientX, e.clientY);
      cracks.push(currentCrack);
      
      // Limita numero di crepe
      if (cracks.length > 50) {
        cracks.shift();
      }
    }
  });

  document.addEventListener('mouseup', () => {
    isMouseDown = false;
    if (currentCrack) {
      currentCrack.stopExpanding();
      currentCrack = null;
    }
  });

  // Ferma anche se il mouse esce dalla finestra
  document.addEventListener('mouseleave', () => {
    isMouseDown = false;
    if (currentCrack) {
      currentCrack.stopExpanding();
      currentCrack = null;
    }
  });

  // Loop di animazione
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Espandi la crepa corrente se il mouse è premuto
    if (currentCrack && currentCrack.isExpanding) {
      currentCrack.expandBranches();
    }
    
    // Aggiorna e disegna tutte le crepe
    cracks = cracks.filter(crack => {
      crack.update();
      crack.updateOpacity(mouseX, mouseY);
      crack.draw(ctx);
      return crack.opacity > 0; // rimuovi le crepe completamente dissolte
    });

    requestAnimationFrame(animate);
  };

  animate();
};

const bootstrap = () => {
  initTheme();
  setCatalogCollapsed(appState.ui.catalogCollapsed);
  setMachineTypeSelectorCollapsed(appState.ui.machineTypeSelectorCollapsed);
  wireCatalogFilters();
  wireTransportControls();
  wireOilControls();
  initAdminEvents();
  initProjectInputs();
  applyTranslations(i18nNodes, updateThemeToggleLabel, updateCatalogCollapseLabel);
  renderUserPanels();
  renderAdminTables();
  updateSummary();
  renderCatalog();
  updateProjectFlow();
  goToStep(1);
  initFrostCursor();
  loadExtraCosts().then(() => {
    renderUserPanels();
    updateSummary();
    schedulePrintPreview();
  });
  loadPricingMatrix().then(() => {
    schedulePrintPreview();
  });
  initNavControls();
  initPrintPreview();
};

bootstrap();
