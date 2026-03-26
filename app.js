let collections = [];
let entries = [];

const state = {
  search: "",
  category: "",
  collection: "",
  selectedEntryId: null
};

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const collectionFilter = document.getElementById("collectionFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const startHereGrid = document.getElementById("startHereGrid");
const collectionsGrid = document.getElementById("collectionsGrid");
const resultsContainer = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");

const drawerBackdrop = document.getElementById("drawerBackdrop");
const detailDrawer = document.getElementById("detailDrawer");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const drawerTitle = document.getElementById("drawerTitle");
const drawerDescription = document.getElementById("drawerDescription");
const drawerOpenViewBtn = document.getElementById("drawerOpenViewBtn");
const drawerOpenSourceBtn = document.getElementById("drawerOpenSourceBtn");
const drawerWhyRelevant = document.getElementById("drawerWhyRelevant");
const drawerMeta = document.getElementById("drawerMeta");
const drawerTags = document.getElementById("drawerTags");
const drawerCollections = document.getElementById("drawerCollections");
const qeUrl = document.getElementById("qeUrl");
const qeTitle = document.getElementById("qeTitle");
const qeCategory = document.getElementById("qeCategory");
const qeDescription = document.getElementById("qeDescription");
const qeTags = document.getElementById("qeTags");
const qeEntryType = document.getElementById("qeEntryType");
const qeOwner = document.getElementById("qeOwner");
const qePriority = document.getElementById("qePriority");
const qeCollections = document.getElementById("qeCollections");
const qeWhyRelevant = document.getElementById("qeWhyRelevant");
const qeGenerateBtn = document.getElementById("qeGenerateBtn");
const qeCopyBtn = document.getElementById("qeCopyBtn");
const qeResetBtn = document.getElementById("qeResetBtn");
const qeOutput = document.getElementById("qeOutput");
const qeStatus = document.getElementById("qeStatus");

async function init() {
  const response = await fetch("data.json");
  const data = await response.json();

  collections = data.collections || [];
  entries = data.entries || [];

  populateFilters();
  renderCollections();
  renderStartHere();
  renderResults();
  bindEvents();
}

function bindEvents() {
  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderResults();
  });

  categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderResults();
  });

  collectionFilter.addEventListener("change", (event) => {
    state.collection = event.target.value;
    renderCollections();
    renderResults();
  });

  clearFiltersBtn.addEventListener("click", () => {
    state.search = "";
    state.category = "";
    state.collection = "";

    searchInput.value = "";
    categoryFilter.value = "";
    collectionFilter.value = "";

    renderCollections();
    renderResults();
    closeDrawer();
  });

  closeDrawerBtn.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  if (qeGenerateBtn) {
    qeGenerateBtn.addEventListener("click", handleQuickEntryGenerate);
  }

  if (qeCopyBtn) {
    qeCopyBtn.addEventListener("click", handleQuickEntryCopy);
  }

  if (qeResetBtn) {
    qeResetBtn.addEventListener("click", handleQuickEntryReset);
  }

  if (qeUrl) {
    qeUrl.addEventListener("blur", autoFillFromUrl);
  }
}

function populateFilters() {
  const categories = [...new Set(entries.map((entry) => entry.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "de")
  );

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  collections.forEach((collection) => {
    const option = document.createElement("option");
    option.value = collection.id;
    option.textContent = collection.title;
    collectionFilter.appendChild(option);
  });
}

function renderStartHere() {
  const startHereEntries = entries
    .filter((entry) => (entry.collections || []).includes("start-here"))
    .sort(sortEntries)
    .slice(0, 4);

  startHereGrid.innerHTML = "";

  startHereEntries.forEach((entry) => {
    startHereGrid.appendChild(createResultCard(entry, true));
  });
}

function renderCollections() {
  collectionsGrid.innerHTML = "";

  collections.forEach((collection) => {
    const count = entries.filter((entry) => (entry.collections || []).includes(collection.id)).length;

    const card = document.createElement("div");
    card.className = "collection-card";
    if (state.collection === collection.id) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <h3>${escapeHtml(collection.title)}</h3>
      <p>${escapeHtml(collection.description || "")}</p>
      <span class="badge">${count} Einträge</span>
    `;

    card.addEventListener("click", () => {
      state.collection = state.collection === collection.id ? "" : collection.id;
      collectionFilter.value = state.collection;
      renderCollections();
      renderResults();
    });

    collectionsGrid.appendChild(card);
  });
}

function renderResults() {
  const filtered = getFilteredEntries().sort(sortEntries);

  resultsContainer.innerHTML = "";
  resultCount.textContent = `${filtered.length} Treffer`;

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach((entry) => {
    resultsContainer.appendChild(createResultCard(entry, false));
  });
}

function getFilteredEntries() {
  return entries.filter((entry) => {
    const haystack = [
      entry.title,
      entry.description,
      ...(entry.tags || []),
      entry.category,
      entry.owner,
      entry.whyRelevant
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !state.search || haystack.includes(state.search);
    const matchesCategory = !state.category || entry.category === state.category;
    const matchesCollection =
      !state.collection || (entry.collections || []).includes(state.collection);

    return matchesSearch && matchesCategory && matchesCollection;
  });
}

function createResultCard(entry, compact = false) {
  const card = document.createElement("article");
  card.className = "result-card";

  const tagsHtml = (entry.tags || [])
    .slice(0, compact ? 2 : 6)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  const targetUrl = entry.viewUrl || entry.url || "#";

  card.innerHTML = `
    <div class="result-card__top">
      <div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.description || "")}</p>
      </div>
    </div>

    <div class="result-card__meta">
      <span class="badge">${escapeHtml(entry.category || "Ohne Kategorie")}</span>
      <span class="badge badge--type">${escapeHtml(entry.entryType || "entry")}</span>
      ${
        entry.priority === "high"
          ? '<span class="badge badge--priority">Priorität hoch</span>'
          : ""
      }
      <span class="badge">${escapeHtml(entry.owner || "Owner unbekannt")}</span>
    </div>

    <div class="tags">${tagsHtml}</div>

    ${
      compact
        ? `
          <div class="card-actions">
            <button class="preview-btn" type="button">Details</button>
            <a class="link-btn" href="${escapeAttribute(targetUrl)}" target="_blank" rel="noopener noreferrer">
              Öffnen
            </a>
          </div>
        `
        : `
          <div class="card-actions">
            <button class="preview-btn" type="button">Preview</button>
            <a class="link-btn" href="${escapeAttribute(targetUrl)}" target="_blank" rel="noopener noreferrer">
              Direkt öffnen
            </a>
          </div>
        `
    }
  `;

  const previewBtn = card.querySelector(".preview-btn");
  previewBtn.addEventListener("click", () => openDrawer(entry.id));

  return card;
}

function openDrawer(entryId) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  state.selectedEntryId = entryId;

  drawerTitle.textContent = entry.title || "Ohne Titel";
  drawerDescription.textContent = entry.description || "Keine Beschreibung vorhanden.";

  const preferredUrl = entry.viewUrl || entry.url || "#";
  drawerOpenViewBtn.href = preferredUrl;
  drawerOpenSourceBtn.href = entry.url || preferredUrl;
  drawerOpenViewBtn.textContent = entry.viewUrl ? "In View App öffnen" : "Dokument öffnen";
  drawerOpenSourceBtn.textContent = entry.viewUrl ? "Original-Link öffnen" : "Alternative Quelle öffnen";

  drawerWhyRelevant.textContent =
    entry.whyRelevant || "Noch kein zusätzlicher Kontext gepflegt.";

  drawerMeta.innerHTML = "";
  [
    { label: "Kategorie", value: entry.category || "Ohne Kategorie" },
    { label: "Typ", value: entry.entryType || "entry" },
    { label: "Quelle", value: entry.source || "unbekannt" },
    { label: "Owner", value: entry.owner || "unbekannt" },
    { label: "Review", value: entry.lastReviewedAt || "-" },
    { label: "Priorität", value: entry.priority || "-" }
  ].forEach((item) => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `${item.label}: ${item.value}`;
    drawerMeta.appendChild(badge);
  });

  drawerTags.innerHTML = "";
  (entry.tags || []).forEach((tag) => {
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = tag;
    drawerTags.appendChild(el);
  });

  drawerCollections.innerHTML = "";
  (entry.collections || []).forEach((collectionId) => {
    const collection = collections.find((item) => item.id === collectionId);
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = collection ? collection.title : collectionId;
    drawerCollections.appendChild(el);
  });

  detailDrawer.classList.add("open");
  detailDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.classList.remove("hidden");
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  state.selectedEntryId = null;
  detailDrawer.classList.remove("open");
  detailDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.classList.add("hidden");
  document.body.classList.remove("drawer-open");
}

function sortEntries(a, b) {
  const priorityScore = (entry) => (entry.priority === "high" ? 0 : 1);
  const byPriority = priorityScore(a) - priorityScore(b);

  if (byPriority !== 0) {
    return byPriority;
  }

  return (a.title || "").localeCompare(b.title || "", "de");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

init().catch((error) => {
  console.error("Fehler beim Laden des Prototyps:", error);
  resultsContainer.innerHTML = `
    <div class="empty-state">
      Daten konnten nicht geladen werden. Starte die Seite über einen lokalen Webserver.
    </div>
  `;
});
function parseDvelopUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== "string") {
    return { valid: false };
  }

  const url = inputUrl.trim();

  let match = url.match(/\/view\/documents\/([0-9a-f-]+)\//i);
  if (match) {
    const documentId = match[1];
    return {
      valid: true,
      documentId,
      viewUrl: buildViewUrl(documentId, url)
    };
  }

  match = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (match) {
    const documentId = match[1];
    return {
      valid: true,
      documentId,
      viewUrl: buildViewUrl(documentId, url)
    };
  }

  return { valid: false };
}

function buildViewUrl(documentId, originalUrl) {
  try {
    const parsed = new URL(originalUrl);
    return `${parsed.origin}/view/documents/${documentId}/`;
  } catch {
    return null;
  }
}

function autoFillFromUrl() {
  if (!qeUrl || !qeStatus) {
    return;
  }

  const parsed = parseDvelopUrl(qeUrl.value);

  if (qeUrl.value.trim() === "") {
    qeStatus.textContent = "";
    return;
  }

  if (parsed.valid) {
    qeStatus.textContent = `documentId erkannt: ${parsed.documentId}`;
  } else {
    qeStatus.textContent = "Keine documentId im Link erkannt.";
  }
}

function handleQuickEntryGenerate() {
  const rawUrl = qeUrl?.value?.trim() || "";
  const parsed = parseDvelopUrl(rawUrl);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  const tags = splitCsv(qeTags?.value || "");
  const collectionIds = splitCsv(qeCollections?.value || "");

  const entry = {
    id: generateEntryId(),
    title: (qeTitle?.value || "").trim(),
    description: (qeDescription?.value || "").trim(),
    category: (qeCategory?.value || "").trim(),
    tags,
    entryType: qeEntryType?.value || "doc",
    source: "DMS",
    url: rawUrl || "",
    viewUrl: parsed.valid ? parsed.viewUrl : "",
    documentId: parsed.valid ? parsed.documentId : "",
    owner: (qeOwner?.value || "").trim(),
    priority: qePriority?.value || "normal",
    collections: collectionIds,
    lastReviewedAt: today,
    whyRelevant: (qeWhyRelevant?.value || "").trim()
  };

  qeOutput.value = JSON.stringify(entry, null, 2);

  if (qeStatus) {
    qeStatus.textContent = parsed.valid
      ? `JSON erzeugt. documentId erkannt: ${parsed.documentId}`
      : "JSON erzeugt. Keine documentId erkannt – Link prüfen.";
  }
}

async function handleQuickEntryCopy() {
  if (!qeOutput || !qeStatus) {
    return;
  }

  const text = qeOutput.value.trim();
  if (!text) {
    qeStatus.textContent = "Es gibt noch keinen erzeugten JSON-Eintrag.";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    qeStatus.textContent = "JSON in die Zwischenablage kopiert.";
  } catch {
    qeOutput.focus();
    qeOutput.select();
    qeStatus.textContent = "Clipboard nicht verfügbar. JSON ist markiert – bitte manuell kopieren.";
  }
}

function handleQuickEntryReset() {
  [
    qeUrl,
    qeTitle,
    qeCategory,
    qeDescription,
    qeTags,
    qeOwner,
    qeCollections,
    qeWhyRelevant,
    qeOutput
  ].forEach((el) => {
    if (el) {
      el.value = "";
    }
  });

  if (qeEntryType) {
    qeEntryType.value = "doc";
  }

  if (qePriority) {
    qePriority.value = "normal";
  }

  if (qeStatus) {
    qeStatus.textContent = "";
  }
}

function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function generateEntryId() {
  if (!entries.length) {
    return "1";
  }

  const numericIds = entries
    .map((entry) => Number(entry.id))
    .filter((id) => Number.isFinite(id));

  if (!numericIds.length) {
    return String(Date.now());
  }

  return String(Math.max(...numericIds) + 1);
}