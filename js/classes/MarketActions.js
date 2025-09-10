class MarketActions {
  constructor(gameState, marketLogic) {
    this.gameState = gameState;
    this.marketLogic = marketLogic;
  }

  executeTrade(itemId, type) {
    const location = this.gameState.getLocation();
    if (!location || !location.template) return;

    const price = this.marketLogic.getPrice(itemId, location.template);

    if (type === 'buy') {
      if (this.gameState.gold < price) {
        // Not enough gold — maybe show toast later
        return;
      }
      this.gameState.updateGold(-price);
      this.gameState.inventory[itemId] = (this.gameState.inventory[itemId] || 0) + 1;
      this.gameState.updateStock(itemId, -1); // 👈 DECREMENT STOCK BY 1
      console.log("buy")



    } else if (type === 'sell') {
      if (!(this.gameState.inventory[itemId] > 0)) return;
      this.gameState.updateGold(price);
      this.gameState.inventory[itemId]--;
      if (this.gameState.inventory[itemId] === 0) {
        delete this.gameState.inventory[itemId];
      }
      this.gameState.updateStock(itemId, 1); // 👈 INCREMENT STOCK BY 1
      console.log("sell")
    }
    
  }

  changeQuantity(itemId, type, delta) {
    // Stub for cart system — MVP ignores carts
    console.log(`[STUB] Cart adjust: ${itemId} ${delta}`);
  }


  
  quickBuyAll(itemId) {
    const location = this.gameState.getLocationTemplate();
    const price = this.marketLogic.getPrice(itemId, location);
    const stock = this.gameState.getCurrentStock(itemId);
    const canAfford = Math.floor(this.gameState.gold / price);

    const amount = Math.min(stock, canAfford);
    if (amount <= 0) {
      alert(amount === 0 ? "📦 Sold out!" : "🪙 Not enough gold for even one!");
      return;
    }

    this.gameState.updateGold(-price * amount);
    this.gameState.updateInventory(itemId, amount);
    this.gameState.updateStock(itemId, -amount);
    window.renderTradeUI();
  }

  quickSellAll(itemId) {
    const location = this.gameState.getLocationTemplate();
    const price = this.marketLogic.getPrice(itemId, location);
    const owned = this.gameState.getOwned(itemId);

    if (owned <= 0) {
      alert("🎒 You don’t own this item!");
      return;
    }

    this.gameState.updateGold(price * owned);
    this.gameState.updateInventory(itemId, -owned);
    this.gameState.updateStock(itemId, owned);
    window.renderTradeUI();
  }
}