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
  // Initialize core systems
  gameState = new GameState(fantasyData);
  marketLogic = new MarketLogic(fantasyData.items);
  marketActions = new MarketActions(gameState, marketLogic);
   // 🆕 DESTROY OLD RENDERER IF IT EXISTS
  if (window.mapRenderer && typeof window.mapRenderer.destroy === 'function') {
    window.mapRenderer.destroy();
  }
  // 🆕 CREATE MAP MANAGER
  const mapManager = new MapManager(gameState, fantasyData);
  window.mapManager = mapManager; // Make it globally accessible for event listeners
  // 🆕 CREATE MAP RENDERER
  const mapRenderer = new MapRenderer("mapGrid");
  window.mapRenderer = mapRenderer; // Make it globally accessible for event listeners
  // 🆕 GENERATE THE FIRST MAP USING THE NEW SYSTEMS
  mapManager.generateNewMap(); // 👈 Removed the renderer argument

  // ✅ NEW: AFTER GENERATION, RENDER THE MAP
  // The map data is now in gameState and mapManager. Use the renderer to draw it.
  if (window.mapRenderer && gameState.locations.length > 0) {
    window.mapRenderer.renderTerrainMap(mapManager.terrainMap, fantasyData);
    window.mapRenderer.renderLocations(gameState.locations);
  }
}

function wireEventListeners() {
  // 🆕 Wire the map icon
  document.getElementById("backToMapIcon").addEventListener("click", () => {
    switchToMap();
  });
  // Wire the generate map button
  document.getElementById("generateMapBtn").addEventListener("click", () => {
    // ✅ Reset renderer first
    if (window.mapRenderer) {
      window.mapRenderer.reset();
    }
    // Clear container
    document.getElementById("mapGrid").innerHTML = "";

    window.mapManager.generateNewMap();

    if (window.mapRenderer && gameState.locations.length > 0) {
      window.mapRenderer.renderTerrainMap(window.mapManager.terrainMap, gameState.fantasyData);
      window.mapRenderer.renderLocations(gameState.locations);
    }
  });
  // Wire the new map button
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
  document.getElementById("backToMapIcon").style.display = "block";
  gameState.currentLocationIndex = null;
  document.getElementById("locationName").textContent = "The Map";
  document.getElementById("locationIcon").textContent = "🗺️";
  if (gameState.hasVisitedLocation) {
    gameState.day += 1;
  }
  gameState.hasVisitedLocation = false;
  checkSeasonEnd();

  // ✅ Reset renderer state when switching to map
  if (window.mapRenderer) {
    window.mapRenderer.reset(); // This clears the DOM and internal data references
    // 🆕 🆕 🆕 CRITICAL FIX: IMMEDIATELY RE-RENDER THE MAP AFTER RESET
    // We have the data in gameState and window.mapManager, so use it.
    if (gameState.locations.length > 0 && window.mapManager && window.mapManager.terrainMap) {
      window.mapRenderer.renderTerrainMap(window.mapManager.terrainMap, gameState.fantasyData);
      window.mapRenderer.renderLocations(gameState.locations);
    }
  }

  renderMapUI();
}

























function switchToTrade(locationIndex) {
  gameState.setLocation(locationIndex);
  gameState.hasVisitedLocation = true; // 👈 PLAYER HAS VISITED A LOCATION
  document.getElementById("mapScene").classList.remove("active");
  document.getElementById("tradeScene").classList.add("active");

  const location = gameState.getLocation();

  document.getElementById("locationIcon").style.display = "block";

  // ✅ Set location name to current location
  document.getElementById("locationName").textContent = location.name;
  // 🆕 UPDATE: Set the emoji for the location icon
  document.getElementById("locationIcon").textContent = location.emoji || "📍";

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
  let travelTime = 1; // default fallback
  if (gameState.lastLocationIndex !== undefined && gameState.currentLocationIndex !== null) {
    // Get the pre-calculated tile distance
    const pathKey = gameState._getPathKey(gameState.lastLocationIndex, gameState.currentLocationIndex);
    const tileDistance = gameState.locationPaths[pathKey] || 999;

    // ✅ Each tile takes 1/4 of a day to travel
    travelTime = Math.ceil(tileDistance * 0.25);
  }

  // Update the last location index for the next move
  gameState.lastLocationIndex = gameState.currentLocationIndex;

  // Update the UI
  document.getElementById("travelTime").textContent = `🚶 Travel Time: ${travelTime} day${travelTime !== 1 ? "s" : ""}`;
}

function resetGameAndGenerateMap() {
  gameState.reset();

  // ✅ NEW: Tell the renderer to clean up its state BEFORE we nuke the container
  if (window.mapRenderer) {
    window.mapRenderer.reset();
  }

  // ✅ NOW it's safe to clear the container
  document.getElementById("mapGrid").innerHTML = "";

  window.mapManager.generateNewMap();

  if (window.mapRenderer && gameState.locations.length > 0) {
    window.mapRenderer.renderTerrainMap(window.mapManager.terrainMap, gameState.fantasyData);
    window.mapRenderer.renderLocations(gameState.locations);
  }

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

/**
 * Renders a simple colored grid based on the terrainMap.
 * Uses the base color from the fantasy.json elevation data.
 * @param {Array} terrainMap - 2D array of terrain type strings
 * @param {Object} fantasyData - Game data containing elevation rules
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 */
function renderSimpleTerrainMap(terrainMap, fantasyData, width, height) {
  const mapGrid = document.getElementById("mapGrid");
  const tileSize = 24; // Fixed tile size for simplicity

  // Clear any existing canvas
  const existingCanvas = mapGrid.querySelector("canvas");
  if (existingCanvas) {
    existingCanvas.remove();
  }

  // Create a new canvas
  const canvas = document.createElement("canvas");
  canvas.width = width * tileSize;
  canvas.height = height * tileSize;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "0";

  const ctx = canvas.getContext("2d");

  // Get base colors from fantasyData
  const elevation = fantasyData.elevation;

  // Draw each tile
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const terrainType = terrainMap[y][x];
      const color = elevation[terrainType]?.colors?.[0] || "#cccccc"; // Fallback to gray

      ctx.fillStyle = color;
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

      // Optional: Draw a subtle grid line
      ctx.strokeStyle = "#ffffff44";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  mapGrid.appendChild(canvas);
}

// 🆕 REPLACE showRandomNews()
function updateNewsPanel() {
  const content = document.getElementById("newsPanelContent");
  content.innerHTML = "";
  const news = [...gameState.fantasyData.genericNews];
  // Add Quest if active
  if (gameState.currentQuest) {
    const quest = gameState.currentQuest;
    const targetLoc = gameState.locations[quest.toIndex];
    const questEl = document.createElement("div");
    questEl.className = "quest-item";
    questEl.innerHTML = `
      📋 <strong>${quest.itemName}</strong> x${quest.required} for ${targetLoc.name}
      <br><small>→ Reward: 🪙 ${quest.reward}</small>
    `;
    questEl.addEventListener("click", () => {
      switchToTrade(quest.toIndex);
    });
    content.appendChild(questEl);
    news.push(`✨ New quest available! Deliver ${quest.itemName} to ${targetLoc.name}.`);
  }
  // Add 1-2 random news
  const randomNews = news.sort(() => 0.5 - Math.random()).slice(0, 2);
  randomNews.forEach((text) => {
    const item = document.createElement("div");
    item.className = "news-item";
    item.textContent = text;
    content.appendChild(item);
  });
}

// 🆕 NEW FUNCTION
function updateInventoryPanel() {
  const content = document.getElementById("inventoryPanelContent");
  content.innerHTML = "";
  const items = gameState.fantasyData.items;
  const inventory = gameState.inventory;
  let hasItems = false;
  items.forEach((item) => {
    const count = inventory[item.id] || 0;
    if (count > 0) {
      hasItems = true;
      const itemEl = document.createElement("div");
      itemEl.className = "inventory-item";
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
  const bannerContainer = document.getElementById("questBanner");
  bannerContainer.style.display = "none";
  if (QuestLogic.updateNewsUI(gameState)) {
    const quest = gameState.currentQuest;
    const item = gameState.fantasyData.items.find((i) => i.id === quest.itemId);
    const delivered = quest.delivered || 0;
    const remaining = quest.required - delivered;
    bannerContainer.style.display = "block";
    bannerContainer.innerHTML = `
  <strong>📋 ACTIVE QUEST: Deliver ${item.name} to ${gameState.locations[quest.toIndex].name}</strong><br>
  Progress: ${delivered}/${quest.required} ${delivered >= quest.required ? '✅' : ''} | Reward: 🪙 ${quest.reward} | 2 days remaining<br>
  💡 Market Tip: ${item.name} selling 15% higher at Mountain Pass
`;
  }

  // 🆕 Add Market Insight
  const insightEl = document.getElementById("marketInsight");
  const items = gameState.fantasyData.items;
  const avgRatio =
    items.reduce((sum, item) => {
      const price = marketLogic.getPrice(item.id, location.template);
      return sum + price / item.basePrice;
    }, 0) / items.length;
  const insightText = avgRatio <= 0.95 ? "🌟 Great prices here! (10% below average)" : avgRatio <= 1.05 ? "🙂 Fair market today." : "⚠️ Overpriced — try elsewhere";
  insightEl.textContent = insightText;

  // Render Items — ✅ STRUCTURE MATCHES OLD VERSION
  const itemsToRender = gameState.fantasyData.items;
  itemsToRender.forEach((item) => {
    const price = marketLogic.getPrice(item.id, location.template);
    const owned = gameState.inventory[item.id] || 0;
    const stock = gameState.getCurrentStock(item.id); // 👈 USE PRE-CALCULATED STOCK
    const dealQuality = getDealQuality(price, item.basePrice);

    // 🆕 Calculate Average Price and Profit/Loss Indicator
const avgPrice = getAveragePrice(item.id);
const isProfit = price < avgPrice; // Buying here is a profit if price is BELOW average
const avgCostClass = isProfit ? 'profit' : 'loss';
const avgCostText = avgPrice > 0 ? `<span class="avg-cost ${avgCostClass}">(AVG 🪙 ${avgPrice})</span>` : '';

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
  ${item.name} <span class="item-price">🪙 ${price} ${avgCostText}</span>
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
          <button class="btn btn-buy action-button buy" data-item="${item.id}">BUY 1</button>
          <button class="quantity-btn" data-action="increase" data-item="${item.id}">+</button>
        </div>
        <button class="btn btn-buy action-button quick-buy-all" data-item="${item.id}">Buy All (${stock})</button>
      </div>
      <div class="sell-controls">
        <div class="quantity-action-row">
          <button class="quantity-btn" data-action="decrease" data-item="${item.id}" style="background: var(--color-ruby); color: white;">−</button>
          <button class="btn btn-sell action-button sell" data-item="${item.id}">SELL 1</button>
          <button class="quantity-btn" data-action="increase" data-item="${item.id}" style="background: var(--color-ruby); color: white;">+</button>
        </div>
        <button class="btn btn-sell action-button quick-sell-all" data-item="${item.id}">Sell All (${owned})</button>
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
  // ✅ Update the location name in the new header
  const locationNameElement = document.getElementById("locationName");
  if (gameState.currentLocationIndex !== null) {
    const location = gameState.getLocation();
    if (location) {
      locationNameElement.textContent = location.name;
    }
  } else {
    locationNameElement.textContent = "The Map";
  }
  // 👇 ADD THIS LINE - DO NOT FOLLOW THE COMMENT
  document.getElementById("inventoryCount").textContent = `${gameState.getTotalInventoryCount()}/15`;
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
  document.querySelectorAll(".location-marker").forEach((marker) => {
    if (marker.textContent === currentLocation.emoji) {
      marker.style.background = "rgba(255, 255, 200, 0.6)";
      marker.style.border = "2px solid gold";
      marker.style.transform = "scale(1.3)";
    } else {
      marker.style.background = "rgba(255, 255, 255, 0.3)";
      marker.style.border = "2px solid rgba(255, 255, 255, 0.6)";
      marker.style.transform = "scale(1)";
    }
  });

  // Keep the ring for extra emphasis
  const ring = document.createElement("div");
  ring.className = "current-location-ring";
  ring.style.left = `${currentLocation.x * 48 + 24}px`; // center of tile
  ring.style.top = `${currentLocation.y * 48 + 24}px`;
  ring.style.position = "absolute";
  ring.style.zIndex = "5"; // under markers but over map
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
      const quantity = parseInt(e.target.dataset.quantity) || 1;
      for (let i = 0; i < quantity; i++) {
        marketActions.executeTrade(itemId, "buy");
      }
      renderTradeUI();
    });
  });

  document.querySelectorAll(".btn-sell").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const quantity = parseInt(e.target.dataset.quantity) || 1;
      for (let i = 0; i < quantity; i++) {
        marketActions.executeTrade(itemId, "sell");
      }
      renderTradeUI();
    });
  });
}

function wireQuickTradeButtons() {
  document.querySelectorAll(".quick-buy-all").forEach((btn) => {
    // 👈 UPDATED SELECTOR
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      marketActions.quickBuyAll(itemId);
      renderTradeUI();
    });
  });
  document.querySelectorAll(".quick-sell-all").forEach((btn) => {
    // 👈 UPDATED SELECTOR
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      marketActions.quickSellAll(itemId);
      renderTradeUI();
    });
  });
}

function wireQuantityButtons() {
  document.querySelectorAll(".quantity-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.item;
      const action = e.target.dataset.action;
      const delta = action === "increase" ? 1 : -1;

      const row = e.target.closest(".item-row");
      const actionButton = row.querySelector(".action-button");
      const currentText = actionButton.textContent;
      const match = currentText.match(/(BUY|SELL) (\d+)/);

      if (match) {
        let currentQty = parseInt(match[2], 10);
        const newQty = Math.max(1, currentQty + delta); // Min 1

        // 👇 ADD STOCK/INVENTORY VALIDATION
        const location = gameState.getLocation();
        const isBuying = match[1] === "BUY";
        let maxAllowed;

        if (isBuying) {
          const price = marketLogic.getPrice(itemId, location.template);
          const canAfford = Math.floor(gameState.gold / price);
          const inStock = gameState.getCurrentStock(itemId);
          maxAllowed = Math.min(canAfford, inStock);
        } else {
          maxAllowed = gameState.getInventoryCount(itemId);
        }

        // Enforce the limit
        const finalQty = Math.min(newQty, maxAllowed);

        // Only update if the quantity actually changes and is valid
        if (finalQty !== currentQty && finalQty >= 1) {
          actionButton.textContent = `${match[1]} ${finalQty}`;
          actionButton.dataset.quantity = finalQty;
        }
        // If maxAllowed is 0, you could disable the button or show a tooltip, but for MVP, capping at 1 is fine.
      }
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

// 🆕 Helper function to calculate average price across all locations
function getAveragePrice(itemId) {
    if (!gameState || !gameState.fantasyData || !gameState.fantasyData.tradeNodes) return 0;
    const allPrices = gameState.fantasyData.tradeNodes.map(node => {
        return marketLogic.getPrice(itemId, node);
    });
    const sum = allPrices.reduce((a, b) => a + b, 0);
    return Math.round(sum / allPrices.length);
}

function getDealDescription(itemId, currentLocationId) {
  if (Math.random() > 0.3) return "";
  const otherLocations = gameState.fantasyData.tradeNodes.filter((loc) => loc.id !== currentLocationId);
  if (otherLocations.length === 0) return "";
  const target = otherLocations[Math.floor(Math.random() * otherLocations.length)];
  const itemName = gameState.fantasyData.items.find((i) => i.id === itemId)?.name || "this item";
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
