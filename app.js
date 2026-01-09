import { appState } from "./state.js";
import { applyTranslations } from "./i18n.js";
import {
  goToStep,
  initTheme,
  renderCatalog,
  renderUserPanels,
  resetSelections,
  setCatalogCollapsed,
  updateCatalogCollapseLabel,
  updateProjectFlow,
  updateSummary,
  updateThemeToggleLabel,
  wireCatalogFilters,
  wireTransportControls,
} from "./ui.js";
import {
  exportJson,
  initAdminEvents,
  loadPricingMatrix,
  renderAdminTables,
  saveAdminChanges,
} from "./admin.js";
import { setupPrintButton } from "./print.js";

const projectNameInput = document.getElementById("projectName");
const requestDateInput = document.getElementById("requestDate");
const projectOwnerInput = document.getElementById("projectOwner");
const projectLanguageInput = document.getElementById("projectLanguage");
const i18nNodes = document.querySelectorAll("[data-i18n]");
const adminPanel = document.getElementById("adminPanel");
const discountInput = document.getElementById("discountInput");

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

  document.getElementById("adminToggle")?.addEventListener("click", () => {
    adminPanel?.classList.toggle("hidden");
  });

  document.getElementById("nextBtn")?.addEventListener("click", () =>
    goToStep(appState.step + 1)
  );

  document.getElementById("prevBtn")?.addEventListener("click", () =>
    goToStep(appState.step - 1)
  );

  document.getElementById("resetBtn")?.addEventListener("click", resetSelections);

  document.getElementById("savePrices")?.addEventListener("click", saveAdminChanges);
  document.getElementById("exportBtn")?.addEventListener("click", exportJson);
  
  setupPrintButton();
};

const bootstrap = () => {
  initTheme();
  setCatalogCollapsed(appState.ui.catalogCollapsed);
  wireCatalogFilters();
  wireTransportControls();
  initAdminEvents();
  initProjectInputs();
  applyTranslations(i18nNodes, updateThemeToggleLabel, updateCatalogCollapseLabel);
  renderUserPanels();
  renderAdminTables();
  updateSummary();
  renderCatalog();
  updateProjectFlow();
  goToStep(1);
  loadPricingMatrix();
  initNavControls();
};

bootstrap();
