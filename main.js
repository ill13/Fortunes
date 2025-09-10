// main.js — Cozy Trading Sim
// Refactored into logical sections

// =============================================================================
// GLOBAL STATE
// =============================================================================
let gameState;
let marketLogic;
let marketActions;

// =============================================================================
// APPLICATION BOOTSTRAP
// =============================================================================
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🌿 Cozy Trading Sim — Booting up...");

  await initializeGame();
  wireEventListeners();
  switchToMap();

  console.log("✅ Phase 1 Ready — Scenes loaded, stubs in place.");
});

async function initializeGame() {
  // Load data
  const [fantasyData, rulesData] = await Promise.all([
    fetch("js/data/fantasy.json").then((r) => r.json()),
    fetch("js/data/game_rules.json")
      .then((r) => r.json())
      .catch(() => ({})),
  ]);

  // Initialize systems
  gameState = new GameState(fantasyData);
  marketLogic = new MarketLogic(fantasyData.items);
  marketActions = new MarketActions(gameState, marketLogic);
}

function wireEventListeners() {
  document.getElementById("backToMapBtn").addEventListener("click", () => {
    switchToMap();
  });

  document.getElementById("generateMapBtn").addEventListener("click", () => {
    generateNewMap();
  });

  document.getElementById("newMapBtn").addEventListener("click", () => {
    resetGameAndGenerateMap();
  });
}

// =============================================================================
// SCENE MANAGEMENT
// =============================================================================
function switchToMap() {
  document.getElementById("mapScene").classList.add("active");
  document.getElementById("tradeScene").classList.remove("active");
  document.getElementById("locationName").textContent = "The Map";

  gameState.day += 1;
  checkSeasonEnd();
  renderMapUI();
}





function switchToTrade(locationIndex) {
  gameState.setLocation(locationIndex);
  document.getElementById("mapScene").classList.remove("active");
  document.getElementById("tradeScene").classList.add("active");
  const location = gameState.getLocation();
  // ✅ UPDATE: Use #locationName instead of #tradeLocationHeader
  document.getElementById("locationName").textContent = location.name;
  updateTravelTime(location);

  // 🆕 AUTO-CHECK FOR QUEST DELIVERY
  if (QuestLogic.checkQuestDelivery(gameState)) {
    renderTradeUI();
    renderMapUI();
  } else {
    renderTradeUI();
  }
}








function checkSeasonEnd() {
  if (gameState.day > 7) {
    alert("🍂 Season has ended! Time to rest... and begin anew.");
    gameState.reset();
    document.getElementById("mapGrid").innerHTML = "";
    document.getElementById("mapName").textContent = "🗺️ A New Season Begins";
  }
}

function updateTravelTime(location) {
  let travelTime = 1; // default
  if (gameState.lastLocation) {
    travelTime = GridSystem.getGridDistance(gameState.lastLocation, location);
  }
  gameState.lastLocation = { x: location.x, y: location.y };
  document.getElementById("travelTime").textContent = `🚶 Travel Time: ${travelTime} day${travelTime !== 1 ? "s" : ""}`;
}

// =============================================================================
// MAP GENERATION & MANAGEMENT
// =============================================================================
function generateNewMap() {
  const SEED = Date.now().toString().slice(-5);
  const WIDTH = 10,
    HEIGHT = 8;
  // Generate terrain
  const wfc = new WaveFunctionCollapse(WIDTH, HEIGHT, gameState.fantasyData.elevation, SEED);
  wfc.collapse();
  const terrainMap = wfc.getFinalMap();
  // Place locations
  const placedLocations = placeLocations(terrainMap, gameState.fantasyData);
  // Assign array index to each location for easy reference
  placedLocations.forEach((loc, index) => {
    loc._arrayIndex = index;
  });
  // Update game state
  gameState.ingestWFCMap(placedLocations, SEED);

  // 🆕 GENERATE THE FIRST QUEST
  // We generate it for location index 0 (The Commons) on Day 1.
  const firstQuest = QuestLogic.generateQuest(gameState, 0, gameState.mapSeed, 1);
  gameState.setQuest(firstQuest);

  // Render map
  // Clear previous canvases (optional, but safe)
  document.querySelectorAll("#mapGrid > canvas").forEach((c) => c.remove());
  // Create and render painterly map
  const overlay = new ParchmentOverlay(WIDTH, HEIGHT, gameState.fantasyData.themeName || "default", SEED);
  overlay.initFromTheme(gameState.fantasyData);
  overlay.setMapData(terrainMap);
  const canvas = overlay.createCanvas();
  document.getElementById("mapGrid").appendChild(canvas);
  overlay.render();
  renderLocationsOnMap(placedLocations); // 👈 DOM markers on top
  // Update UI
  document.getElementById("mapName").textContent = `🗺️ ${gameState.mapName} | Seed: ${SEED}`;
  renderMapUI();
  console.log("✅ New map generated with", placedLocations.length, "locations");
}




function resetGameAndGenerateMap() {
  gameState.reset();
  document.getElementById("mapGrid").innerHTML = "";
  generateNewMap();
  document.getElementById("newsFeed").textContent = "📰 A new journey begins...";
}

function placeLocations(wfcMap, fantasyData) {
  const height = wfcMap.length;
  const width = wfcMap[0].length;
  const locations = [];
  const usedPositions = new Set();

  const availableLocations = [...fantasyData.tradeNodes];
  Math.seedrandom(gameState.mapSeed);
  availableLocations.sort(() => Math.random() - 0.5);

  const maxLocations = Math.min(8, Math.floor((width + height) / 4));

  for (const template of availableLocations) {
    if (locations.length >= maxLocations) break;

    const validPosition = findValidPosition(wfcMap, template, usedPositions, width, height);
    if (validPosition) {
      locations.push({
        ...template,
        x: validPosition.x,
        y: validPosition.y,
      });
      usedPositions.add(`${validPosition.x},${validPosition.y}`);
    }
  }

  return locations;
}







function renderLocationsOnMap(locations) {
  const mapGrid = document.getElementById('mapGrid');
  
  // Clear previous location markers (optional — if you want to avoid duplicates)
  document.querySelectorAll('.location-marker').forEach(el => el.remove());

  locations.forEach(location => {
    const marker = document.createElement('div');
    marker.className = 'location-marker';
    marker.style.left = `${location.x * 48 + 24 - 12}px`; // center horizontally
    marker.style.top = `${location.y * 48 + 24 - 12}px`;   // center vertically
    marker.style.position = 'absolute';
    marker.style.zIndex = '10';
    marker.style.width = '24px';
    marker.style.height = '24px';
    marker.style.display = 'flex';
    marker.style.alignItems = 'center';
    marker.style.justifyContent = 'center';
    marker.style.fontSize = '20px';
    marker.style.pointerEvents = 'auto'; // so you can click them!
    marker.style.cursor = 'pointer';
    marker.textContent = location.emoji || '📍';

    // Optional: tooltip
    marker.title = location.name;

    // Make it clickable
    marker.addEventListener('click', () => {
  switchToTrade(location._arrayIndex); // 👈 pass the actual array index
});

    mapGrid.appendChild(marker);
  });
}


// 🆕 REPLACE showRandomNews()
function updateNewsPanel() {
  const content = document.getElementById('newsPanelContent');
  content.innerHTML = '';
  const news = [...gameState.fantasyData.genericNews];
  // Add Quest if active
  if (gameState.currentQuest) {
    const quest = gameState.currentQuest;
    const targetLoc = gameState.locations[quest.toIndex];
    const questEl = document.createElement('div');
    questEl.className = 'quest-item';
    questEl.innerHTML = `
      📋 <strong>${quest.itemName}</strong> x${quest.required} for ${targetLoc.name}
      <br><small>→ Reward: 🪙 ${quest.reward}</small>
    `;
    questEl.addEventListener('click', () => {
      switchToTrade(quest.toIndex);
    });
    content.appendChild(questEl);
    news.push(`✨ New quest available! Deliver ${quest.itemName} to ${targetLoc.name}.`);
  }
  // Add 1-2 random news
  const randomNews = news.sort(() => 0.5 - Math.random()).slice(0, 2);
  randomNews.forEach(text => {
    const item = document.createElement('div');
    item.className = 'news-item';
    item.textContent = text;
    content.appendChild(item);
  });
}

// 🆕 NEW FUNCTION
function updateInventoryPanel() {
  const content = document.getElementById('inventoryPanelContent');
  content.innerHTML = '';
  const items = gameState.fantasyData.items;
  const inventory = gameState.inventory;
  let hasItems = false;
  items.forEach(item => {
    const count = inventory[item.id] || 0;
    if (count > 0) {
      hasItems = true;
      const itemEl = document.createElement('div');
      itemEl.className = 'inventory-item';
      itemEl.innerHTML = `
        <span class="inventory-item-icon">${item.emoji}</span>
        <span>${item.name}: ${count}</span>
      `;
      content.appendChild(itemEl);
    }
  });
  if (!hasItems) {
    content.innerHTML = '<div class="news-item">Your pack is light. Go buy something!</div>';
  }
}
























function findValidPosition(wfcMap, template, usedPositions, width, height) {
  const candidates = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const posKey = `${x},${y}`;
      if (usedPositions.has(posKey)) continue;

      if (isValidLocationPlacement(wfcMap, template, x, y, width, height)) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

function isValidLocationPlacement(wfcMap, template, x, y, width, height) {
  const terrainHere = wfcMap[y][x];
  const rules = template.placement;
  if (!rules) return false;

  // Check "on" rule
  if (!rules.on.includes(terrainHere)) return false;

  // Check "adjacent" rule
  if (rules.adjacent && rules.adjacent.length > 0) {
    const hasAdjacent = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ].some(([dx, dy]) => {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
      return rules.adjacent.includes(wfcMap[ny][nx]);
    });
    if (!hasAdjacent) return false;
  }

  return true;
}

// =============================================================================
// UI RENDERING
// =============================================================================
// 🆕 UPDATE renderMapUI
function renderMapUI() {
  updateGlobalCounters();
  updateNewsPanel(); // 👈 Updated
  updateInventoryPanel(); // 👈 New
  highlightCurrentLocation();
}









function renderTradeUI() {
  const grid = document.getElementById("itemGrid");
  grid.innerHTML = "";
  const location = gameState.getLocation();
  if (!location || !location.template) {
    grid.innerHTML = `<div class="item-slot">No location loaded</div>`;
    return;
  }

  // 🆕 Add Quest Banner
  const bannerContainer = document.getElementById('questBanner');
  bannerContainer.style.display = 'none';
  if (QuestLogic.updateNewsUI(gameState)) {
    const quest = gameState.currentQuest;
    const item = gameState.fantasyData.items.find(i => i.id === quest.itemId);
    const delivered = quest.delivered || 0;
    const remaining = quest.required - delivered;
    bannerContainer.style.display = 'block';
    bannerContainer.innerHTML = `
      <strong>📋 Deliver ${item.name} to ${gameState.locations[quest.toIndex].name}</strong><br>
      You have ${delivered}, need ${quest.required}<br>
      Reward: 🪙 ${quest.reward}
    `;
  }

  // 🆕 Add Market Insight
  const insightEl = document.getElementById('marketInsight');
  const items = gameState.fantasyData.items;
  const avgRatio = items.reduce((sum, item) => {
    const price = marketLogic.getPrice(item.id, location.template);
    return sum + (price / item.basePrice);
  }, 0) / items.length;
  const insightText = avgRatio <= 0.95 ? "🌟 Great prices here! (10% below average)" :
                     avgRatio <= 1.05 ? "🙂 Fair market today." :
                     "⚠️ Overpriced — try elsewhere";
  insightEl.textContent = insightText;

  // Render Items — ✅ STRUCTURE MATCHES OLD VERSION
  const itemsToRender = gameState.fantasyData.items;
  itemsToRender.forEach((item) => {
    const price = marketLogic.getPrice(item.id, location.template);
    const owned = gameState.inventory[item.id] || 0;
    const stock = 5 + Math.floor(Math.random() * 6);
    const dealQuality = getDealQuality(price, item.basePrice);

    const slot = document.createElement("div");
    slot.className = "item-row";
    if (dealQuality.class === "good") slot.classList.add("good-deal");
    if (dealQuality.class === "poor") slot.classList.add("bad-deal");
    if (stock === 0) slot.classList.add("no-stock");

    slot.dataset.itemId = item.id;
    slot.innerHTML = `
      <div class="item-visual">
        <div class="item-icon">${item.emoji}</div>
        <div class="deal-indicator ${dealQuality.class === "good" ? "deal-great" : dealQuality.class === "fair" ? "deal-fair" : "deal-poor"}">
          ${dealQuality.label.split(" ")[0]}
        </div>
      </div>
      <div class="item-info">
        <div class="item-header">
          ${item.name} <span class="item-price">🪙 ${price}</span>
        </div>
        <div class="item-meta">
          Available: ${stock} | You own: <span class="owned-count">${owned}</span>
          ${gameState.currentQuest && gameState.currentQuest.itemId === item.id ? "<br>Perfect for your quest!" : ""}
          ${stock <= 2 && stock > 0 ? "<br>Limited stock - act fast!" : ""}
          ${dealQuality.class === "poor" ? "<br>Overpriced here - try elsewhere" : ""}
          ${dealQuality.class === "good" ? "<br>Excellent value!" : ""}
          ${dealQuality.class === "fair" ? "<br>Standard market price" : ""}
        </div>
      </div>
      <div class="buy-controls">
        <div class="quantity-action-row">
          <button class="quantity-btn" data-action="decrease" data-item="${item.id}">−</button>
          <button class="btn btn-buy action-button" data-item="${item.id}">BUY 1</button>
          <button class="quantity-btn" data-action="increase" data-item="${item.id}">+</button>
        </div>
        <button class="btn btn-buy action-button" data-item="${item.id}">Buy All (${stock})</button>
      </div>
      <div class="sell-controls">
        <div class="quantity-action-row">
          <button class="quantity-btn" data-action="decrease" data-item="${item.id}" style="background: var(--color-ruby); color: white;">−</button>
          <button class="btn btn-sell action-button" data-item="${item.id}">SELL 1</button>
          <button class="quantity-btn" data-action="increase" data-item="${item.id}" style="background: var(--color-ruby); color: white;">+</button>
        </div>
        <button class="btn btn-sell action-button" data-item="${item.id}">Sell All (${owned})</button>
      </div>
    `;
    grid.appendChild(slot);
  });

  wireTradeButtons();
  updateGlobalCounters();
}















function createItemSlot(item, price, stock, owned, dealQuality, questHint) {
  const slot = document.createElement("div");
  slot.className = "item-slot";
  slot.dataset.itemId = item.id;

  slot.innerHTML = `
    <div class="item-emoji">${item.emoji}</div>
    <div class="item-name">${item.name}</div>
    <div class="item-price">🪙 ${price} <span class="deal-badge ${dealQuality.class}">${dealQuality.label}</span></div>
    <div class="item-stock">📦 Stock: ${stock}</div>
    <div class="item-owned">🎒 Yours: ${owned}</div>
    ${questHint ? `<div class="quest-hint">📜 ${questHint}</div>` : ""}
    <div class="item-controls">
      <button class="btn-quantity" data-action="decrease" data-item="${item.id}">−</button>
      <button class="btn-buy" data-item="${item.id}">Buy 1</button>
      <button class="btn-sell" data-item="${item.id}">Sell 1</button>
      <button class="btn-quantity" data-action="increase" data-item="${item.id}">+</button>
      <br>
      <button class="btn-quick-buy" data-item="${item.id}">Buy All</button>
      <button class="btn-quick-sell" data-item="${item.id}">Sell All</button>
    </div>
  `;

  return slot;
}

function updateGlobalCounters() {
  document.getElementById("goldCounter").textContent = gameState.gold;
  document.getElementById("dayCounter").textContent = gameState.day;
  // Inventory count is now handled by updateInventoryPanel(), not a global header.
}

function showRandomNews() {
  const news = gameState.fantasyData.genericNews;
  const randomNews = news[Math.floor(Math.random() * news.length)];
  document.getElementById("newsFeed").textContent = randomNews;
}

function highlightCurrentLocation() {
  // Remove existing rings
  document.querySelectorAll(".current-location-ring").forEach((el) => el.remove());

  const currentLocation = gameState.getLocation();
  if (!currentLocation) return;

  // ➕ NEW: Highlight the marker itself
  document.querySelectorAll('.location-marker').forEach(marker => {
    if (marker.textContent === currentLocation.emoji) {
      marker.style.background = 'rgba(255, 255, 200, 0.6)';
      marker.style.border = '2px solid gold';
      marker.style.transform = 'scale(1.3)';
    } else {
      marker.style.background = 'rgba(255, 255, 255, 0.3)';
      marker.style.border = '2px solid rgba(255, 255, 255, 0.6)';
      marker.style.transform = 'scale(1)';
    }
  });

  // Keep the ring for extra emphasis
  const ring = document.createElement("div");
  ring.className = "current-location-ring";
  ring.style.left = `${currentLocation.x * 48 + 24}px`; // center of tile
  ring.style.top = `${currentLocation.y * 48 + 24}px`;
  ring.style.position = 'absolute';
  ring.style.zIndex = '5'; // under markers but over map
  document.getElementById("mapGrid").appendChild(ring);
}

// =============================================================================
// TRADING SYSTEM
// =============================================================================
function wireTradeButtons() {
  wireBasicTradeButtons();
  wireQuickTradeButtons();
  wireQuantityButtons();
}

function wireBasicTradeButtons() {
  document.querySelectorAll(".btn-buy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      marketActions.executeTrade(itemId, "buy");
      renderTradeUI();
    });
  });

  document.querySelectorAll(".btn-sell").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      marketActions.executeTrade(itemId, "sell");
      renderTradeUI();
    });
  });
}

function wireQuickTradeButtons() {
  document.querySelectorAll(".btn-quick-buy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const stock = 5 + Math.floor(Math.random() * 6); // Temporary
      for (let i = 0; i < stock; i++) {
        marketActions.executeTrade(itemId, "buy");
      }
      renderTradeUI();
    });
  });

  document.querySelectorAll(".btn-quick-sell").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const owned = gameState.inventory[itemId] || 0;
      for (let i = 0; i < owned; i++) {
        marketActions.executeTrade(itemId, "sell");
      }
      renderTradeUI();
    });
  });
}

function wireQuantityButtons() {
  document.querySelectorAll(".btn-quantity").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const action = e.target.dataset.action;
      const delta = action === "increase" ? 1 : -1;
      marketActions.changeQuantity(itemId, "cart", delta);
      console.log(`[CART] Adjust ${itemId} by ${delta}`);
    });
  });
}

// =============================================================================
// GAME LOGIC HELPERS
// =============================================================================
function getDealQuality(price, basePrice) {
  const ratio = price / basePrice;

  if (ratio <= 0.85) {
    return { label: "Rare Bargain!", class: "good" };
  } else if (ratio <= 1.15) {
    return { label: "Fair Deal", class: "fair" };
  } else {
    return { label: "Steep Price", class: "poor" };
  }
}


function getDealDescription(itemId, currentLocationId) {
  if (Math.random() > 0.3) return "";
  const otherLocations = gameState.fantasyData.tradeNodes.filter(loc => loc.id !== currentLocationId);
  if (otherLocations.length === 0) return "";
  const target = otherLocations[Math.floor(Math.random() * otherLocations.length)];
  const itemName = gameState.fantasyData.items.find(i => i.id === itemId)?.name || "this item";
  return `Perfect for your quest!`;
}



function getQuestHint(itemId, currentLocationId) {
  // 30% chance to show a quest hint
  if (Math.random() > 0.3) return null;

  const otherLocations = gameState.fantasyData.tradeNodes.filter((loc) => loc.id !== currentLocationId);
  if (otherLocations.length === 0) return null;

  const target = otherLocations[Math.floor(Math.random() * otherLocations.length)];
  const itemName = gameState.fantasyData.items.find((i) => i.id === itemId)?.name || "this item";

  return `${target.name} seeks ${itemName}!`;
}
