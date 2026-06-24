const STORAGE_KEY = "indkoeb_items_v2";
const SETTINGS_KEY = "indkoeb_settings_v3";
const HISTORY_KEY = "indkoeb_history_v1";

const categories = [
  "Frugt & grønt",
  "Brød",
  "Mejeri",
  "Kød/fisk",
  "Frost",
  "Kolonial/tørvarer",
  "Drikkevarer",
  "Personlig pleje",
  "Rengøring",
  "Husstand",
  "Andet"
];

const stores = [
  {
    id: "rema1000",
    name: "Rema1000",
    logo: "logo-rema1000.png"
  },
  {
    id: "netto",
    name: "Netto",
    logo: "logo-netto.png"
  },
  {
    id: "spar",
    name: "Spar",
    logo: "logo-spar.png"
  },
  {
    id: "365",
    name: "365",
    logo: "logo-365.png"
  }
];

const categoryKeywords = {
  "Frugt & grønt": [
    "banan", "bananer", "æble", "æbler", "pære", "pærer", "tomat", "tomater",
    "agurk", "agurker", "løg", "kartoffel", "kartofler", "gulerod", "gulerødder",
    "salat", "peberfrugt", "avocado", "citron", "lime", "appelsin", "vindruer",
    "jordbær", "blåbær", "champignon", "broccoli", "blomkål", "porre"
  ],
  "Brød": [
    "rugbrød", "franskbrød", "boller", "bolle", "toast", "brød", "flutes",
    "pitabrød", "knækbrød", "baguette"
  ],
  "Mejeri": [
    "mælk", "letmælk", "sødmælk", "minimælk", "yoghurt", "skyr", "smør",
    "ost", "fløde", "creme fraiche", "æg", "kærgården", "mozzarella",
    "parmesan", "hytteost"
  ],
  "Kød/fisk": [
    "kylling", "oksekød", "hakkekød", "svinekød", "fisk", "laks", "bacon",
    "pålæg", "skinke", "spegepølse", "koteletter", "medister", "rejer",
    "tun", "leverpostej"
  ],
  "Frost": [
    "frost", "pommes", "frysepizza", "pizza", "frostgrønt", "is", "ærter",
    "frosne", "nuggets"
  ],
  "Kolonial/tørvarer": [
    "pasta", "ris", "havregryn", "mel", "sukker", "kaffe", "te", "dåsetomat",
    "tomatpure", "olie", "eddike", "salt", "peber", "krydderi", "krydderier",
    "cornflakes", "müsli", "nutella", "syltetøj", "honning", "ketchup",
    "remoulade", "mayonnaise", "makrel", "tortilla", "chips", "slik",
    "chokolade", "kiks"
  ],
  "Drikkevarer": [
    "sodavand", "cola", "fanta", "sprite", "juice", "øl", "vand", "danskvand",
    "saft", "vin", "energidrik"
  ],
  "Personlig pleje": [
    "shampoo", "balsam", "tandpasta", "tandbørste", "deodorant", "sæbe",
    "bodywash", "barberskum", "creme", "håndsæbe"
  ],
  "Rengøring": [
    "opvaskemiddel", "vaskemiddel", "opvasketabs", "rengøring", "wc-rens",
    "afkalker", "skuresvamp", "klude", "rengøringsmiddel"
  ],
  "Husstand": [
    "toiletpapir", "køkkenrulle", "affaldsposer", "batterier", "bagepapir",
    "sølvpapir", "madpapir", "fryseposer", "plastposer", "servietter",
    "fyrfadslys"
  ]
};

let items = [];
let settings = {
  selectedStore: ""
};

let editingItemId = null;
let lastDeletedItem = null;
let toastTimer = null;

const storeStartScreen = document.getElementById("storeStartScreen");
const appShell = document.getElementById("appShell");
const selectedStoreLogo = document.getElementById("selectedStoreLogo");
const selectedStoreName = document.getElementById("selectedStoreName");

const addItemForm = document.getElementById("addItemForm");
const itemInput = document.getElementById("itemInput");
const changeStoreButton = document.getElementById("changeStoreButton");
const itemsLeftCount = document.getElementById("itemsLeftCount");
const activeItemsArea = document.getElementById("activeItemsArea");
const checkedItemsSection = document.getElementById("checkedItemsSection");
const checkedItemsArea = document.getElementById("checkedItemsArea");
const clearCheckedButton = document.getElementById("clearCheckedButton");
const emptyState = document.getElementById("emptyState");

const editDialog = document.getElementById("editDialog");
const editForm = document.getElementById("editForm");
const editName = document.getElementById("editName");
const editQuantity = document.getElementById("editQuantity");
const editUnit = document.getElementById("editUnit");
const editCategory = document.getElementById("editCategory");
const editNote = document.getElementById("editNote");
const closeDialogButton = document.getElementById("closeDialogButton");
const deleteFromDialogButton = document.getElementById("deleteFromDialogButton");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
const undoButton = document.getElementById("undoButton");

window.addEventListener("load", initApp);

function initApp() {
  loadData();
  populateEditCategories();
  applySettings();
  registerEvents();
  renderApp();
  registerServiceWorker();
}

function registerEvents() {
  document.querySelectorAll(".store-card").forEach(function(button) {
    button.addEventListener("click", function() {
      selectStore(button.dataset.store);
    });
  });

  changeStoreButton.addEventListener("click", function() {
    const hasItems = items.length > 0;

    if (hasItems) {
      const confirmed = confirm("Vil du skifte butik for denne indkøbsseddel? Varerne bliver på listen.");

      if (!confirmed) {
        return;
      }
    }

    settings.selectedStore = "";
    saveSettings();
    applySettings();
  });

  addItemForm.addEventListener("submit", function(event) {
    event.preventDefault();
    addItemFromInput();
  });

  clearCheckedButton.addEventListener("click", clearCheckedItems);

  closeDialogButton.addEventListener("click", function() {
    editDialog.close();
  });

  editForm.addEventListener("submit", function(event) {
    event.preventDefault();
    saveEditedItem();
  });

  deleteFromDialogButton.addEventListener("click", function() {
    if (editingItemId) {
      deleteItem(editingItemId);
      editDialog.close();
    }
  });

  undoButton.addEventListener("click", undoDelete);
}

function loadData() {
  const savedItems = localStorage.getItem(STORAGE_KEY);
  const savedSettings = localStorage.getItem(SETTINGS_KEY);

  if (savedItems) {
    try {
      items = JSON.parse(savedItems);
    } catch {
      items = [];
    }
  }

  if (savedSettings) {
    try {
      settings = {
        ...settings,
        ...JSON.parse(savedSettings)
      };
    } catch {
      settings = {
        selectedStore: ""
      };
    }
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
  const selectedStore = getSelectedStore();

  if (!selectedStore) {
    storeStartScreen.classList.remove("hidden");
    appShell.classList.add("hidden");
    return;
  }

  storeStartScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  selectedStoreLogo.src = selectedStore.logo;
  selectedStoreLogo.alt = selectedStore.name + " logo";
  selectedStoreName.textContent = selectedStore.name;
}

function selectStore(storeId) {
  settings.selectedStore = storeId;
  saveSettings();
  applySettings();
  renderApp();

  setTimeout(function() {
    itemInput.focus();
  }, 150);
}

function getSelectedStore() {
  return stores.find(function(store) {
    return store.id === settings.selectedStore;
  });
}

function addItemFromInput() {
  const rawValue = itemInput.value.trim();

  if (!rawValue) {
    itemInput.focus();
    return;
  }

  const parsed = parseItemInput(rawValue);
  const now = new Date().toISOString();

  const item = {
    id: createId(),
    name: parsed.name,
    normalizedName: normalizeText(parsed.name),
    quantity: parsed.quantity,
    unit: parsed.unit,
    note: "",
    category: detectCategory(parsed.name),
    checked: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "Martin",
    checkedBy: "",
    sortOrder: Date.now()
  };

  items.push(item);
  saveItems();
  saveToHistory(item);

  itemInput.value = "";
  itemInput.focus();

  renderApp();
}

function parseItemInput(input) {
  let text = input.trim();
  let quantity = "";
  let unit = "";

  const xAtEnd = text.match(/^(.+?)\s+x\s*(\d+(?:[,.]\d+)?)$/i);
  if (xAtEnd) {
    return {
      name: cleanName(xAtEnd[1]),
      quantity: xAtEnd[2].replace(",", "."),
      unit: "stk"
    };
  }

  const amountAtEnd = text.match(/^(.+?)\s+(\d+(?:[,.]\d+)?)\s*(stk|styk|pk|pakke|pakker|l|liter|kg|g|gram|dl|cl)$/i);
  if (amountAtEnd) {
    return {
      name: cleanName(amountAtEnd[1]),
      quantity: amountAtEnd[2].replace(",", "."),
      unit: normalizeUnit(amountAtEnd[3])
    };
  }

  const amountAtStart = text.match(/^(\d+(?:[,.]\d+)?)\s*(stk|styk|pk|pakke|pakker|l|liter|kg|g|gram|dl|cl)?\s+(.+)$/i);
  if (amountAtStart) {
    quantity = amountAtStart[1].replace(",", ".");
    unit = amountAtStart[2] ? normalizeUnit(amountAtStart[2]) : "";
    text = amountAtStart[3];
  }

  return {
    name: cleanName(text),
    quantity,
    unit
  };
}

function cleanName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeUnit(unit) {
  const value = unit.toLowerCase();

  if (["styk", "stk"].includes(value)) return "stk";
  if (["pakke", "pakker", "pk"].includes(value)) return "pk";
  if (["liter", "l"].includes(value)) return "l";
  if (["gram", "g"].includes(value)) return "g";

  return value;
}

function detectCategory(name) {
  const normalized = normalizeText(name);

  for (const category of categories) {
    const keywords = categoryKeywords[category] || [];

    const match = keywords.some(function(keyword) {
      const normalizedKeyword = normalizeText(keyword);
      return normalized.includes(normalizedKeyword);
    });

    if (match) {
      return category;
    }
  }

  return "Andet";
}

function renderApp() {
  const activeItems = items.filter(item => !item.checked);
  const checkedItems = items.filter(item => item.checked);

  itemsLeftCount.textContent = activeItems.length;

  renderActiveItems(activeItems);
  renderCheckedItems(checkedItems);

  const hasNoItems = items.length === 0;
  emptyState.classList.toggle("hidden", !hasNoItems);
}

function renderActiveItems(activeItems) {
  activeItemsArea.innerHTML = "";

  if (activeItems.length === 0) {
    return;
  }

  const grouped = groupItemsByCategory(activeItems);

  categories.forEach(function(category) {
    const categoryItems = grouped[category] || [];

    if (categoryItems.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "category-section";

    section.innerHTML = `
      <div class="category-header">
        <h2>${category}</h2>
        <span>${categoryItems.length} vare${categoryItems.length === 1 ? "" : "r"}</span>
      </div>

      <div class="item-list">
        ${categoryItems.map(createItemRowHtml).join("")}
      </div>
    `;

    activeItemsArea.appendChild(section);
  });

  bindItemRowEvents(activeItemsArea);
}

function renderCheckedItems(checkedItems) {
  checkedItemsArea.innerHTML = "";

  checkedItemsSection.classList.toggle("hidden", checkedItems.length === 0);

  if (checkedItems.length === 0) {
    return;
  }

  const sorted = checkedItems.sort(function(a, b) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  checkedItemsArea.innerHTML = `
    <section class="category-section">
      <div class="item-list">
        ${sorted.map(createItemRowHtml).join("")}
      </div>
    </section>
  `;

  bindItemRowEvents(checkedItemsArea);
}

function groupItemsByCategory(list) {
  return list.reduce(function(groups, item) {
    const category = item.category || "Andet";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);

    return groups;
  }, {});
}

function createItemRowHtml(item) {
  const meta = createItemMeta(item);

  return `
    <article class="item-row ${item.checked ? "checked" : ""}" data-id="${item.id}">
      <button class="check-button" type="button" data-action="toggle" aria-label="Kryds vare af">
        ${item.checked ? "✓" : ""}
      </button>

      <div class="item-main" data-action="toggle">
        <p class="item-title">${escapeHtml(item.name)}</p>
        ${meta ? `<p class="item-meta">${escapeHtml(meta)}</p>` : ""}
      </div>

      <div class="item-actions">
        <button class="icon-button" type="button" data-action="edit" aria-label="Rediger vare">
          ✎
        </button>

        <button class="icon-button" type="button" data-action="delete" aria-label="Slet vare">
          ×
        </button>
      </div>
    </article>
  `;
}

function createItemMeta(item) {
  const parts = [];

  if (item.quantity) {
    parts.push(item.unit ? `${item.quantity} ${item.unit}` : item.quantity);
  }

  if (item.note) {
    parts.push(item.note);
  }

  return parts.join(" · ");
}

function bindItemRowEvents(container) {
  const rows = container.querySelectorAll(".item-row");

  rows.forEach(function(row) {
    const id = row.dataset.id;

    row.querySelectorAll("[data-action]").forEach(function(element) {
      element.addEventListener("click", function(event) {
        event.stopPropagation();

        const action = element.dataset.action;

        if (action === "toggle") {
          toggleItem(id);
        }

        if (action === "edit") {
          openEditDialog(id);
        }

        if (action === "delete") {
          deleteItem(id);
        }
      });
    });
  });
}

function toggleItem(id) {
  const item = items.find(item => item.id === id);

  if (!item) {
    return;
  }

  item.checked = !item.checked;
  item.updatedAt = new Date().toISOString();
  item.checkedBy = item.checked ? "Martin" : "";

  saveItems();
  renderApp();
}

function openEditDialog(id) {
  const item = items.find(item => item.id === id);

  if (!item) {
    return;
  }

  editingItemId = id;

  editName.value = item.name;
  editQuantity.value = item.quantity || "";
  editUnit.value = item.unit || "";
  editCategory.value = item.category || "Andet";
  editNote.value = item.note || "";

  if (typeof editDialog.showModal === "function") {
    editDialog.showModal();
  } else {
    alert("Din browser understøtter ikke redigeringsvinduet.");
  }
}

function saveEditedItem() {
  const item = items.find(item => item.id === editingItemId);

  if (!item) {
    return;
  }

  const name = editName.value.trim();

  if (!name) {
    editName.focus();
    return;
  }

  item.name = name;
  item.normalizedName = normalizeText(name);
  item.quantity = editQuantity.value.trim();
  item.unit = editUnit.value.trim();
  item.category = editCategory.value;
  item.note = editNote.value.trim();
  item.updatedAt = new Date().toISOString();

  saveItems();
  saveToHistory(item);

  editingItemId = null;
  editDialog.close();
  renderApp();
}

function deleteItem(id) {
  const index = items.findIndex(item => item.id === id);

  if (index === -1) {
    return;
  }

  lastDeletedItem = {
    item: items[index],
    index
  };

  items.splice(index, 1);

  saveItems();
  renderApp();
  showToast("Slettet");
}

function undoDelete() {
  if (!lastDeletedItem) {
    return;
  }

  items.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
  lastDeletedItem = null;

  saveItems();
  renderApp();
  hideToast();
}

function clearCheckedItems() {
  const checkedCount = items.filter(item => item.checked).length;

  if (checkedCount === 0) {
    return;
  }

  const confirmed = confirm(`Vil du rydde ${checkedCount} købte vare${checkedCount === 1 ? "" : "r"}?`);

  if (!confirmed) {
    return;
  }

  items = items.filter(item => !item.checked);
  saveItems();
  renderApp();
}

function populateEditCategories() {
  editCategory.innerHTML = categories.map(function(category) {
    return `<option value="${category}">${category}</option>`;
  }).join("");
}

function saveToHistory(item) {
  let history = [];

  const savedHistory = localStorage.getItem(HISTORY_KEY);

  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
    } catch {
      history = [];
    }
  }

  const existing = history.find(entry => entry.normalizedName === item.normalizedName);

  if (existing) {
    existing.usageCount += 1;
    existing.lastUsedAt = new Date().toISOString();
    existing.defaultCategory = item.category;
    existing.defaultQuantity = item.quantity;
    existing.defaultUnit = item.unit;
  } else {
    history.push({
      id: createId(),
      name: item.name,
      normalizedName: item.normalizedName,
      defaultCategory: item.category,
      defaultQuantity: item.quantity,
      defaultUnit: item.unit,
      usageCount: 1,
      lastUsedAt: new Date().toISOString()
    });
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function showToast(message) {
  toastText.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(function() {
    hideToast();
  }, 5000);
}

function hideToast() {
  toast.classList.add("hidden");
}

function createId() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "item-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}