// /js/classes/ParchmentOverlay.js

class ParchmentOverlay {
  constructor(mapGrid, locations, containerEl, fantasyData) {
    // ← ADD fantasyData HERE
    this.mapGrid = mapGrid;
    this.locations = locations;
    this.containerEl = containerEl;
    this.fantasyData = fantasyData; // ← STORE IT
    this.render();
  }

  render() {
    const { width, height } = this.getMapDimensions();
    this.containerEl.innerHTML = "";

    this.containerEl.style.width = `${width * 32}px`;
    this.containerEl.style.height = `${height * 32}px`;

    // Draw terrain — NOW using this.fantasyData, not window.gameState
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrainKey = this.mapGrid[y][x];
        const terrain = this.fantasyData.elevation[terrainKey]; // ✅ SAFE
        const color = terrain.colors[0];

        const tile = document.createElement("div");
        tile.style.position = "absolute";
        tile.style.left = `${x * 32}px`;
        tile.style.top = `${y * 32}px`;
        tile.style.width = "32px";
        tile.style.height = "32px";
        tile.style.backgroundColor = color;
        this.containerEl.appendChild(tile);
      }
    }

    // Draw locations
    this.locations.forEach((loc, index) => {
      const overlay = document.createElement("div");
      overlay.className = "location-overlay";
      overlay.textContent = loc.emoji;

      // ✅ Perfect centering
      overlay.style.left = `${loc.x * 32 + 16}px`;
      overlay.style.top = `${loc.y * 32 + 12}px`;
      overlay.style.transform = "translate(-50%, -50%)";

      // ✅ Cozy depth + interactivity
      overlay.style.textShadow = "1px 1px 2px rgba(0,0,0,0.2)";
      overlay.style.zIndex = "10";
      overlay.style.pointerEvents = "auto";

      overlay.addEventListener("click", () => {
        window.switchToTrade(index);
      });

      this.containerEl.appendChild(overlay);
    });
  }

  getMapDimensions() {
    return {
      width: this.mapGrid[0].length,
      height: this.mapGrid.length,
    };
  }
}
