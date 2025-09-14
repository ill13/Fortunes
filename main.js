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
  if (window.mapRenderer && typeof window.mapRenderer.destroy === "function") {
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
  //const questHint = QuestLogic.getQuestHint(gameState, item.id, location.id);
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
  document.getElementById("tradeScene").classList.remove("active");
  document.getElementById("mapScene").classList.add("active");

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

  document.getElementById("tradeScene").classList.add("active");
  document.getElementById("mapScene").classList.remove("active");

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

// 🆕 REPLACES showRandomNews()
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

// =============================================================================
// UI RENDERING
// =============================================================================
// 🆕 UPDATE renderMapUI
function renderMapUI() {
  updateGlobalCounters();
  updateNewsPanel(); // 👈 Updated
  updateInventoryPanel(); // 👈 New
  if (window.mapRenderer) {
    window.mapRenderer.highlightCurrentLocation(gameState);
  }
}


function renderTradeUI() {
  const container = document.querySelector(".trade-grid");
  if (!container) {
    console.error("renderTradeUI: .trade-grid container not found.");
    return;
  }
  container.innerHTML = ""; // Clear any existing content

  const location = gameState.getLocation();
  if (!location || !location.template) {
    container.innerHTML = `<div class="item-slot">No location loaded</div>`;
    return;
  }

      // ✅ FIXED: Use CLASS selectors for consistency
    const bannerContainer = document.querySelector('.quest-banner');
    if (bannerContainer) {
        bannerContainer.style.display = "none";
        if (QuestLogic.updateNewsUI(gameState)) {
            const quest = gameState.currentQuest;
            const item = gameState.fantasyData.items.find((i) => i.id === quest.itemId);
            const delivered = quest.delivered || 0;
            const remaining = quest.required - delivered;
            bannerContainer.style.display = "block";
            bannerContainer.innerHTML = `
<strong>📋 ACTIVE QUEST: Deliver ${item.name} to ${gameState.locations[quest.toIndex].name}</strong><br>
Progress: ${delivered}/${quest.required} ${delivered >= quest.required ? "✅" : ""} | Reward: 🪙 ${quest.reward} | 2 days remaining
`;
        }
    } else {
        console.warn("Quest banner element (.quest-banner) not found in DOM.");
    }

    // ✅ FIXED: Use CLASS selectors for consistency
    const insightEl = document.querySelector('.market-insight');
    if (insightEl) {
        const items = gameState.fantasyData.items;
        const avgRatio =
            items.reduce((sum, item) => {
                const price = marketLogic.getPrice(item.id, location.template);
                return sum + price / item.basePrice;
            }, 0) / items.length;
        const insightText = avgRatio <= 0.95 ? "🌟 Great prices here! (10% below average)" : avgRatio <= 1.05 ? "🙂 Fair market today." : "⚠️ Overpriced — try elsewhere";
        insightEl.textContent = insightText;
    } else {
        console.warn("Market insight element (.market-insight) not found in DOM.");
    }
  // Render Items — ✅ NEW MOBILE STRUCTURE
  const itemsToRender = gameState.fantasyData.items;
  itemsToRender.forEach((item) => {
    const price = marketLogic.getPrice(item.id, location.template);
    const owned = gameState.getInventoryCount(item.id); // 👈 Use the new method
    const stock = gameState.getCurrentStock(item.id);
    const basePrice = item.basePrice;

    // 🆕 Get the coin value (1, 2, or 3)
    const coinValue = marketLogic.getCoinValue(price, basePrice);

    // Create the card element
    const card = document.createElement("div");
    card.className = "trade-card";
    card.dataset.itemId = item.id; // 👈 Crucial for button handlers

    // Apply dynamic classes
    if (gameState.currentQuest && gameState.currentQuest.itemId === item.id) {
      card.classList.add("quest-item");
    }
    if (stock === 0) {
      card.classList.add("no-stock");
    }

    // Build the card's inner HTML
    card.innerHTML = `
            <div class="card-header">
                <div class="item-info">
                    <div class="item-emoji">${item.emoji}</div>
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <div class="item-subtitle">
                            ${stock === 0 ? "Out of stock" : coinValue === 1 ? "Great price for buying" : coinValue === 3 ? "Overpriced here" : "Standard market price"}<br>
                            Available: ${stock}
                            ${gameState.currentQuest && gameState.currentQuest.itemId === item.id ? "<br>✨ NEEDED FOR QUEST!" : ""}
                        </div>
                    </div>
                </div>
                <div class="price-section">
                    <div class="item-price">${price} 🪙</div>
                    <div class="deal-indicator deal-${coinValue === 1 ? "great" : coinValue === 2 ? "fair" : "poor"}">
                        ${"🪙".repeat(coinValue)}
                    </div>
                </div>
            </div>
            <div class="action-row">
                <button class="action-btn btn-buy ${getBuyButtonClass(coinValue)}" ${canBuy(item.id, price, stock) ? "" : "disabled"}>BUY</button>
                <div class="owned-display">Own: ${owned}</div>
                <button class="action-btn btn-sell ${getSellButtonClass(coinValue)}" ${canSell(owned) ? "" : "disabled"}>SELL</button>
            </div>
        `;

    container.appendChild(card);
  });

  // Wire up the new, simple buttons
  wireTradeButtons();

  // Keep existing global UI updates
  updateGlobalCounters();

  // Log for confirmation
  console.log("✅ Phase 2 Complete: Dynamic mobile UI rendered with coin logic.");
}

// 🆕 Helper function: Determines the CSS class for the BUY button
function getBuyButtonClass(coinValue) {
  if (coinValue === 1) return "hot-buy"; // Great deal to buy
  if (coinValue === 3) return "cold-buy"; // Poor deal to buy
  return ""; // Fair deal, use default style
}

// 🆕 Helper function: Determines the CSS class for the SELL button
function getSellButtonClass(coinValue) {
  if (coinValue === 3) return "hot-sell"; // Great deal to sell (because it's expensive)
  if (coinValue === 1) return "cold-sell"; // Poor deal to sell (because it's cheap)
  return ""; // Fair deal, use default style
}

// 🆕 Helper function: Checks if the player can buy an item
function canBuy(itemId, price, stock) {
  return stock > 0 && gameState.gold >= price;
}

// 🆕 Helper function: Checks if the player can sell an item
function canSell(owned) {
  return owned > 0;
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

// =============================================================================
// TRADING SYSTEM
// =============================================================================
function wireTradeButton_00() {
  wireBasicTradeButtons();
  wireQuickTradeButtons();
  wireQuantityButtons();
}

function wireTradeButtons() {
  // Wire BUY buttons
  document.querySelectorAll(".btn-buy").forEach((btn) => {
    // Remove any existing listeners to prevent duplicates
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", (e) => {
      if (!newBtn.disabled) {
        const itemId = e.target.closest(".trade-card").dataset.itemId;
        marketActions.executeTrade(itemId, "buy");
        renderTradeUI(); // Re-render to update counts and button states
      }
    });
  });

  // Wire SELL buttons
  document.querySelectorAll(".btn-sell").forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", (e) => {
      if (!newBtn.disabled) {
        const itemId = e.target.closest(".trade-card").dataset.itemId;
        marketActions.executeTrade(itemId, "sell");
        renderTradeUI();
      }
    });
  });
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
