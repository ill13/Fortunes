class GameState {
  constructor(fantasyData) {
    this.fantasyData = fantasyData;
    this.reset();
  }

  reset() {
    this.day = 1;
    this.gold = 100;
    this.inventory = {}; // itemId → count
    this.locations = []; // filled by WFC in Phase 2
    this.currentLocationIndex = null;
    this.mapSeed = null;
    this.mapName = "Unnamed Realm";

    this.locationStock = {}; // locationIndex → { itemId → stock }
  }

  // Initialize stock when entering location
  setLocation(index) {
    this.currentLocationIndex = index;
    this.ensureLocationStock(index);
  }

  getLocation() {
  if (this.currentLocationIndex === null) return null;
  return this.locations[this.currentLocationIndex];
}

  ensureLocationStock(locationIndex) {
    if (!this.locationStock[locationIndex]) {
      // Initialize stock: random 5-15 per item
      const stock = {};
      this.fantasyData.items.forEach((item) => {
        stock[item.id] = Math.floor(Math.random() * 11) + 5; // 5-15
      });
      this.locationStock[locationIndex] = stock;
    }
  }

  // Helper: get current location stock
  getCurrentStock(itemId) {
    if (this.currentLocationIndex === null) return 0;
    return this.locationStock[this.currentLocationIndex]?.[itemId] || 0;
  }

  // Helper: update stock
  updateStock(itemId, delta) {
    if (this.currentLocationIndex === null) return;
    const locStock = this.locationStock[this.currentLocationIndex];
    if (!locStock[itemId]) locStock[itemId] = 0;
    locStock[itemId] += delta;
    if (locStock[itemId] < 0) locStock[itemId] = 0;
  }

  // Helper: update inventory
  updateInventory(itemId, delta) {
    if (!this.inventory[itemId]) this.inventory[itemId] = 0;
    this.inventory[itemId] += delta;
    if (this.inventory[itemId] < 0) this.inventory[itemId] = 0;
  }

  // Helper: get owned count
  getOwned(itemId) {
    return this.inventory[itemId] || 0;
  }

  setLocation(index) {
    this.currentLocationIndex = index;
  }

  getLocationName() {
    if (this.currentLocationIndex === null) return "The Map";
    return this.locations[this.currentLocationIndex]?.name || "Unknown";
  }

  updateGold(amount) {
    this.gold += amount;
  }

  getTotalInventoryCount() {
    return Object.values(this.inventory).reduce((sum, count) => sum + count, 0);
  }



// In GameState class
getLocationTemplate() {
  if (this.currentLocationIndex === null) return null;
  return this.locations[this.currentLocationIndex]?.template || null;
}








// ✅ UPDATED: Uses tradeNodes instead of locationTemplates
  ingestWFCMap(placements, seed) {
    this.locations = placements.map(p => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      x: p.x,
      y: p.y,
      // ✅ Look up from tradeNodes — which now contains ALL trade location data
      template: this.fantasyData.tradeNodes.find(t => t.id === p.id)
    }));
    this.mapSeed = seed;
    this.mapName = new MapNamer().generate(seed);
  }
}