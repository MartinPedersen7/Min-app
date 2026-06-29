import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCndCIttUzhl1xedUgs4vdDx8Lvf5SOEU0",
  authDomain: "indkoebsseddel-bb06d.firebaseapp.com",
  projectId: "indkoebsseddel-bb06d",
  storageBucket: "indkoebsseddel-bb06d.firebasestorage.app",
  messagingSenderId: "89280355254",
  appId: "1:89280355254:web:3d68ccdc42921667c3ff17"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const HOUSEHOLD_ID = "martin-faelles-indkoeb";

const householdRef = doc(db, "households", HOUSEHOLD_ID);
const itemsCollectionRef = collection(db, "households", HOUSEHOLD_ID, "items");

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
let selectedStoreId = "";
let editingItemId = null;
let lastDeletedItem = null;
let toastTimer = null;
let showCheckedItems = false;

const storeStartScreen = document.getElementById("storeStartScreen");
const appShell = document.getElementById("appShell");
const selectedStoreLogo = document.getElementById("selectedStoreLogo");
const selectedStoreName = document.getElementById("selectedStoreName");

const addItemForm = document.getElementById("addItemForm");
const itemInput = document.getElementById("itemInput");
const changeStoreButton = document.getElementById("changeStoreButton");
const toggleCheckedButton = document.getElementById("toggleCheckedButton");
const newListButton = document.getElementById("newListButton");
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
const closeToastButton = document.getElementById("closeToastButton");

window.addEventListener("load", initApp);

function initApp() {
  populateEditCategories();
  registerEvents();
  applyStoreView();
  renderApp();
  startFirestoreSync();
  registerServiceWorker();
}

function registerEvents() {
  document.querySelectorAll(".store-card").forEach(function(button) {
    button.addEventListener("click", function() {
      selectStore(button.dataset.store);
    });
  });

  changeStoreButton.addEventListener("click", async function() {
    const hasItems = items.length > 0;

    if (hasItems) {
      const confirmed = confirm("Vil du skifte butik for denne fælles indkøbsseddel? Varerne bliver på listen.");

      if (!confirmed) {
        return;
      }
    }

    await updateHouseholdStore("");
  });

  toggleCheckedButton.addEventListener("click", function() {
    showCheckedItems = !showCheckedItems;
    renderApp();
  });

  newListButton.addEventListener("click", startNewList);

  addItemForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    await addItemsFromInput();
  });

  clearCheckedButton.addEventListener("click", clearCheckedItems);

  closeDialogButton.addEventListener("click", function() {
    editDialog.close();
  });

  editForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    await saveEditedItem();
  });

  deleteFromDialogButton.addEventListener("click", async function() {
    if (editingItemId) {
      await deleteItem(editingItemId);
      editDialog.close();
    }
  });

  undoButton.addEventListener("click", undoDelete);

  closeToastButton.addEventListener("click", function() {
    lastDeletedItem = null;
    hideToast();
  });
}

function startFirestoreSync() {
  onSnapshot(
    householdRef,
    function(snapshot) {
      if (snapshot.exists()) {
        const data = snapshot.data();
        selectedStoreId = data.selectedStore || "";
      } else {
        selectedStoreId = "";
      }

      applyStoreView();
    },
    function(error) {
      console.error("Fejl ved household sync:", error);
    }
  );

  const itemsQuery = query(itemsCollectionRef, orderBy("sortOrder", "asc"));

  onSnapshot(
    itemsQuery,
    function(snapshot) {
      items = snapshot.docs.map(function(documentSnapshot) {
        return {
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        };
      });

      renderApp();
    },
    function(error) {
      console.error("Fejl ved item sync:", error);
    }
  );
}

async function updateHouseholdStore(storeId) {
  try {
    await setDoc(
      householdRef,
      {
        selectedStore: storeId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Kunne ikke opdatere butik:", error);
    alert("Butikken kunne ikke gemmes. Tjek internetforbindelsen og Firebase.");
  }
}

async function selectStore(storeId) {
  await updateHouseholdStore(storeId);
  window.scrollTo({ top: 0, behavior: "auto" });

  setTimeout(function() {
    itemInput.focus();
  }, 150);
}

function applyStoreView() {
  const selectedStore = getSelectedStore();

  if (!selectedStore) {
    appShell.classList.add("hidden");
    storeStartScreen.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  storeStartScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  selectedStoreLogo.src = selectedStore.logo;
  selectedStoreLogo.alt = selectedStore.name + " logo";
  selectedStoreName.textContent = selectedStore.name;

  window.scrollTo({ top: 0, behavior: "auto" });
}

function getSelectedStore() {
  return stores.find(function(store) {
    return store.id === selectedStoreId;
  });
}

async function addItemsFromInput() {
  const rawValue = itemInput.value.trim();

  if (!rawValue) {
    itemInput.focus();
    return;
  }

  const rawItems = splitInputIntoItems(rawValue);

  if (rawItems.length === 0) {
    itemInput.focus();
    return;
  }

  try {
    await Promise.all(
      rawItems.map(function(rawItem, index) {
        return addSingleItem(rawItem, index);
      })
    );

    itemInput.value = "";
    itemInput.focus();
  } catch (error) {
    console.error("Kunne ikke tilføje varer:", error);
    alert("En eller flere varer kunne ikke tilføjes. Tjek internetforbindelsen.");
  }
}

function splitInputIntoItems(input) {
  return input
    .split(/[\n,;]+/)
    .map(function(value) {
      return value.trim();
    })
    .filter(function(value) {
      return value.length > 0;
    });
}

async function addSingleItem(rawValue, index) {
  const parsed = parseItemInput(rawValue);
  const newItemRef = doc(itemsCollectionRef);

  const item = {
    name: parsed.name,
    normalizedName: normalizeText(parsed.name),
    quantity: parsed.quantity,
    unit: parsed.unit,
    note: "",
    category: detectCategory(parsed.name),
    checked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "Martin",
    checkedBy: "",
    sortOrder: Date.now() + index
  };

  await setDoc(newItemRef, item);

  saveToHistory({
    id: newItemRef.id,
    ...item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
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

  const hasNoActiveItems = activeItems.length === 0;
  emptyState.classList.toggle("hidden", !hasNoActiveItems);

  toggleCheckedButton.textContent = showCheckedItems
    ? `Skjul købte (${checkedItems.length})`
    : `Vis købte (${checkedItems.length})`;

  toggleCheckedButton.classList.toggle("active", showCheckedItems);
  toggleCheckedButton.disabled = checkedItems.length === 0;
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

  const shouldShowCheckedSection = showCheckedItems && checkedItems.length > 0;
  checkedItemsSection.classList.toggle("hidden", !shouldShowCheckedSection);

  if (!shouldShowCheckedSection) {
    return;
  }

  const sorted = [...checkedItems].sort(function(a, b) {
    return getTimeValue(b.updatedAt) - getTimeValue(a.updatedAt);
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
        <p class="item-title">${escapeHtml(item.name || "")}</p>
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
      element.addEventListener("click", async function(event) {
        event.stopPropagation();

        const action = element.dataset.action;

        if (action === "toggle") {
          await toggleItem(id);
        }

        if (action === "edit") {
          openEditDialog(id);
        }

        if (action === "delete") {
          await deleteItem(id);
        }
      });
    });
  });
}

async function toggleItem(id) {
  const item = items.find(item => item.id === id);

  if (!item) {
    return;
  }

  const itemRef = doc(itemsCollectionRef, id);

  try {
    await updateDoc(itemRef, {
      checked: !item.checked,
      updatedAt: serverTimestamp(),
      checkedBy: !item.checked ? "Martin" : ""
    });
  } catch (error) {
    console.error("Kunne ikke krydse vare af:", error);
    alert("Varen kunne ikke opdateres.");
  }
}

function openEditDialog(id) {
  const item = items.find(item => item.id === id);

  if (!item) {
    return;
  }

  editingItemId = id;

  editName.value = item.name || "";
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

async function saveEditedItem() {
  const item = items.find(item => item.id === editingItemId);

  if (!item) {
    return;
  }

  const name = editName.value.trim();

  if (!name) {
    editName.focus();
    return;
  }

  const updatedItem = {
    name,
    normalizedName: normalizeText(name),
    quantity: editQuantity.value.trim(),
    unit: editUnit.value.trim(),
    category: editCategory.value,
    note: editNote.value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    const itemRef = doc(itemsCollectionRef, editingItemId);
    await updateDoc(itemRef, updatedItem);

    saveToHistory({
      id: editingItemId,
      ...item,
      ...updatedItem,
      updatedAt: new Date().toISOString()
    });

    editingItemId = null;
    editDialog.close();
  } catch (error) {
    console.error("Kunne ikke gemme vare:", error);
    alert("Varen kunne ikke gemmes.");
  }
}

async function deleteItem(id) {
  const index = items.findIndex(item => item.id === id);

  if (index === -1) {
    return;
  }

  lastDeletedItem = {
    item: items[index],
    index
  };

  try {
    const itemRef = doc(itemsCollectionRef, id);
    await deleteDoc(itemRef);
    showToast("Vare slettet");
  } catch (error) {
    console.error("Kunne ikke slette vare:", error);
    alert("Varen kunne ikke slettes.");
  }
}

async function undoDelete() {
  if (!lastDeletedItem) {
    hideToast();
    return;
  }

  const itemToRestore = { ...lastDeletedItem.item };
  const id = itemToRestore.id;
  delete itemToRestore.id;

  try {
    const itemRef = doc(itemsCollectionRef, id);
    await setDoc(itemRef, {
      ...itemToRestore,
      updatedAt: serverTimestamp()
    });

    lastDeletedItem = null;
    hideToast();
  } catch (error) {
    console.error("Kunne ikke fortryde sletning:", error);
    alert("Kunne ikke fortryde sletning.");
  }
}

async function clearCheckedItems() {
  const checkedItems = items.filter(item => item.checked);
  const checkedCount = checkedItems.length;

  if (checkedCount === 0) {
    return;
  }

  const confirmed = confirm(`Vil du slette ${checkedCount} købte vare${checkedCount === 1 ? "" : "r"} permanent?`);

  if (!confirmed) {
    return;
  }

  lastDeletedItem = null;
  hideToast();

  try {
    await Promise.all(
      checkedItems.map(function(item) {
        return deleteDoc(doc(itemsCollectionRef, item.id));
      })
    );

    showCheckedItems = false;
    renderApp();
  } catch (error) {
    console.error("Kunne ikke rydde købte varer:", error);
    alert("De købte varer kunne ikke ryddes.");
  }
}

async function startNewList() {
  const totalCount = items.length;

  if (totalCount === 0) {
    return;
  }

  const confirmed = confirm(`Vil du starte en ny liste og slette alle ${totalCount} vare${totalCount === 1 ? "" : "r"}?`);

  if (!confirmed) {
    return;
  }

  lastDeletedItem = null;
  hideToast();

  try {
    await Promise.all(
      items.map(function(item) {
        return deleteDoc(doc(itemsCollectionRef, item.id));
      })
    );

    showCheckedItems = false;
    renderApp();
  } catch (error) {
    console.error("Kunne ikke starte ny liste:", error);
    alert("Listen kunne ikke ryddes.");
  }
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
    lastDeletedItem = null;
    hideToast();
  }, 4000);
}

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.add("hidden");
}

function createId() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "item-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function normalizeText(value) {
  return String(value)
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

function getTimeValue(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value === "string") {
    return Date.parse(value) || 0;
  }

  if (typeof value === "number") {
    return value;
  }

  return 0;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}