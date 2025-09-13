class MarketLogic {
  constructor(items) {
    this.items = items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }

  getPrice(itemId, locationTemplate) {
    const item = this.items[itemId];
    if (!item || !locationTemplate) return 0;

    const multiplier = locationTemplate.multipliers[item.category] || 1.0;
    return Math.round(item.basePrice * multiplier);
  }

  getDealQuality(price, basePrice) {
    const ratio = price / basePrice;
    if (ratio <= 0.85) {
      return { label: "Rare Bargain!", class: "good" };
    } else if (ratio <= 1.15) {
      return { label: "Fair Deal", class: "fair" };
    } else {
      return { label: "Steep Price", class: "poor" };
    }
  }

  getDealQualityLabel(quality) {
    return (
      {
        good: "🔥 Good Deal",
        fair: "💸 Fair Price",
        bad: "🚫 Overpriced",
      }[quality] || "💸 Fair Price"
    );
  }

  getAveragePrice(itemId, tradeNodes) {
    if (!tradeNodes || tradeNodes.length === 0) return 0;
    const allPrices = tradeNodes.map((node) => {
      return this.getPrice(itemId, node); // 👈 Uses `this` to call the class's own method
    });
    const sum = allPrices.reduce((a, b) => a + b, 0);
    return Math.round(sum / allPrices.length);
  }

  // Simple quest generator — optional delivery quest
  generateQuest(locationTemplate, ownedItems) {
    // Only if player owns something
    const ownedIds = Object.keys(ownedItems).filter((id) => ownedItems[id] > 0);
    if (ownedIds.length === 0) return null;

    // 30% chance to offer quest
    if (Math.random() > 0.3) return null;

    const targetItem = ownedIds[Math.floor(Math.random() * ownedIds.length)];
    const reward = Math.floor(this.items[targetItem].basePrice * 1.5);

    return {
      type: "delivery",
      itemId: targetItem,
      itemName: this.items[targetItem].name,
      itemEmoji: this.items[targetItem].emoji,
      reward: reward,
      flavor: `“Deliver ${this.items[targetItem].name} to me — I’ll pay ${reward} gold!”`,
    };
  }
}
