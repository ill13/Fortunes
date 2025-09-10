class QuestLogic {
  static generateQuest(gameState, currentLocationIndex, baseSeed, currentDay) {
    Math.seedrandom(`${baseSeed}-${currentDay}`);
    const locations = gameState.locations;
    const items = gameState.fantasyData.items;
    const currentLocation = locations[currentLocationIndex];
    if (!currentLocation || Math.random() > 0.4) return null;
    const availableLocations = locations.filter(loc => loc.id !== currentLocation.id);
    if (availableLocations.length === 0) return null;
    const targetLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    const targetItems = items.filter(item => gameState.getInventoryCount(item.id) > 0);
    if (targetItems.length === 0) return null;
    const targetItem = targetItems[Math.floor(Math.random() * targetItems.length)];
    const requiredAmount = 1 + Math.floor(Math.random() * 3);
    const rewardPerItem = Math.round(targetItem.basePrice * (1.2 + Math.random() * 0.5));
    return {
      type: "delivery",
      from: currentLocation.id,
      to: targetLocation.id,
      toIndex: locations.findIndex(loc => loc.id === targetLocation.id), // 🆕 for UI
      itemId: targetItem.id,
      itemName: targetItem.name,
      itemEmoji: targetItem.emoji,
      required: requiredAmount,
      reward: rewardPerItem * requiredAmount,
      delivered: 0
    };
  }

  static checkQuestDelivery(gameState) {
    const quest = gameState.currentQuest;
    if (!quest || !quest.toIndex || gameState.currentLocationIndex !== quest.toIndex) return false;
    const owned = gameState.getInventoryCount(quest.itemId);
    if (owned <= 0) return false;
    const deliverable = Math.min(owned, quest.required - (quest.delivered || 0));
    if (deliverable <= 0) return false;
    gameState.updateQuestDelivered(deliverable);
    gameState.removeFromInventory(quest.itemId, deliverable);
    return true;
  }

  static deliverQuest(gameState) {
    const quest = gameState.currentQuest;
    if (!quest || gameState.currentLocationIndex !== quest.toIndex) return;
    const remaining = quest.required - (quest.delivered || 0);
    if (remaining <= 0) {
      gameState.updateGold(quest.reward);
      gameState.completeQuest();
      return true;
    }
    return false;
  }

  static updateNewsUI(gameState) {
    return gameState.currentQuest && gameState.currentLocationIndex === gameState.currentQuest.toIndex;
  }
}