class MapRenderer {
  constructor(mapContainerId) {
    this.mapContainer = document.getElementById(mapContainerId); // e.g., 'mapGrid'
    if (!this.mapContainer) {
      console.error(`MapRenderer: Container with ID "${mapContainerId}" not found.`);
    }
    this.canvas = null;
    this.ctx = null;
    this.tileSize = 24; // Match the size used in the old render function
  }

  renderTerrainMap(terrainMap, fantasyData) {
    const height = terrainMap.length;
    const width = terrainMap[0].length;

    // Create a new canvas
    this.canvas = document.createElement("canvas");
    this.canvas.id ="canvas"
    this.canvas.width = width * this.tileSize;
    this.canvas.height = height * this.tileSize;
    this.canvas.style.position = "absolute";
  //  this.canvas.style.top = "0";
   // this.canvas.style.left = "0";
    this.canvas.style.zIndex = "0";

    this.ctx = this.canvas.getContext("2d");

    // Get base colors from fantasyData
    const elevation = fantasyData.elevation;

    // Draw each tile
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrainType = terrainMap[y][x];
        const color = elevation[terrainType]?.colors?.[0] || "#cccccc"; // Fallback to gray
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        // Optional: Draw a subtle grid line
        this.ctx.strokeStyle = "#ffffff44";
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    // Append the canvas to the container
    this.mapContainer.appendChild(this.canvas);
  }

 

    renderLocations(locations) {
    // Clear previous location markers
    document.querySelectorAll(".location-marker").forEach((el) => el.remove());
    
    locations.forEach((location, index) => { // 👈 Get the index here
      const marker = document.createElement("div");
      marker.className = "location-marker";
      marker.style.left = `${location.x * this.tileSize + this.tileSize / 2 - 12}px`;
      marker.style.top = `${location.y * this.tileSize + this.tileSize / 2 - 12}px`;
      marker.style.position = "absolute";
      marker.style.zIndex = "10";
      marker.style.width = "24px";
      marker.style.height = "24px";
      marker.style.display = "flex";
      marker.style.alignItems = "center";
      marker.style.justifyContent = "center";
      marker.style.fontSize = "20px";
      marker.style.pointerEvents = "auto";
      marker.style.cursor = "pointer";
      marker.textContent = location.emoji || "📍";
      // Optional: tooltip
      marker.title = location.name;
      // Make it clickable
      marker.addEventListener("click", () => {
        if (window.switchToTrade) {
          window.switchToTrade(index); // 👈 Use the forEach index, NOT location._arrayIndex
        } else {
          console.error("MapRenderer: switchToTrade is not available globally.");
        }
      });
      this.mapContainer.appendChild(marker);
    });
  }


}
