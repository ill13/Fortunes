class MapRenderer {
  constructor(mapContainerId) {
    this.mapContainer = document.getElementById(mapContainerId);
    if (!this.mapContainer) {
      console.error(`MapRenderer: Container with ID "${mapContainerId}" not found.`);
      // 👇 Don't just log — bail out. Nothing to render without a container.
      return;
    }

    // Initialize state
    this.canvas = null;
    this.ctx = null;
    this.tileSize = 24;
    this.terrainMap = null;
    this.locations = null;
    this.fantasyData = null;
    this.locationMarkers = [];
    this.resizeTimeout = null;

    // Bind methods
    this.handleResize = this.handleResize.bind(this);

    // Set up resize listeners
    window.addEventListener("resize", this.handleResize);

    // 👇 Set up ResizeObserver ONLY if mapContainer exists
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.mapContainer);
  }

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.terrainMap && this.locations && this.fantasyData) {
        this.renderTerrainMap(this.terrainMap, this.fantasyData);
        this.renderLocations(this.locations);
      }
    }, 150); // Feels instant, prevents spam
  }

  renderTerrainMap(terrainMap, fantasyData) {
    const height = terrainMap.length;
    const width = terrainMap[0].length;

    // Get the container's available space
    const containerWidth = this.mapContainer.clientWidth;
    const containerHeight = this.mapContainer.clientHeight;

    // Calculate the maximum tile size that fits both dimensions
    const maxTileSizeWidth = containerWidth / width;
    const maxTileSizeHeight = containerHeight / height;
    let calculatedTileSize = Math.floor(Math.min(maxTileSizeWidth, maxTileSizeHeight));

    // Ensure a minimum readable size (e.g., 16px)
    calculatedTileSize = Math.max(calculatedTileSize, 16);

    // Use the calculated size
    this.tileSize = calculatedTileSize;

    // Clear any existing canvas
    if (this.canvas) {
      this.canvas.remove();
    }

    // Create a new canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = width * this.tileSize;
    this.canvas.height = height * this.tileSize;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.bottom = "0";
    this.canvas.style.left = "0";
    this.canvas.style.right = "0";
    this.canvas.style.margin = "auto"; // 👈 THIS IS THE KEY
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

    // 👇 STORE DATA FOR RE-RENDERING
    this.terrainMap = terrainMap;
    this.fantasyData = fantasyData;
  }

  renderLocations00(locations) {
    // Clear previous location markers
    this.locationMarkers.forEach((marker) => marker.remove());
    this.locationMarkers = [];

    // 👇 STORE LOCATIONS FOR RE-RENDERING
    this.locations = locations;

    locations.forEach((location, index) => {
      const marker = document.createElement("div");
      marker.className = "location-marker";

      // Position relative to the canvas origin (0,0)
      const offset = this.getCanvasOffset();
      marker.style.left = `${offset.x + location.x * this.tileSize}px`;
      marker.style.top = `${offset.y + location.y * this.tileSize}px`;
      marker.style.position = "absolute";
      marker.style.zIndex = "10";
      marker.style.width = `${this.tileSize}px`;
      marker.style.height = `${this.tileSize}px`;
      marker.style.display = "flex";
      marker.style.alignItems = "center";
      marker.style.justifyContent = "center";
      marker.style.fontSize = `${this.tileSize * 0.8}px`;
      marker.style.pointerEvents = "auto";
      marker.style.cursor = "pointer";
      marker.textContent = location.emoji || "📍";
      marker.title = location.name;

      // Make it clickable
      marker.addEventListener("click", () => {
        if (window.switchToTrade) {
          window.switchToTrade(index);
        } else {
          console.error("MapRenderer: switchToTrade is not available globally.");
        }
      });

      // 👇 APPEND MARKER TO mapContainer, NOT canvas
      // This ensures it's in the correct stacking context and will be visible.
      this.mapContainer.appendChild(marker);
    });
  }













renderLocations(locations) {
  // Clear previous location markers
  this.locationMarkers.forEach((marker) => marker.remove());
  this.locationMarkers = [];

  // 👇 STORE LOCATIONS FOR RE-RENDERING
  this.locations = locations;

  // 🆕 🆕 🆕 DEFER RENDERING UNTIL NEXT ANIMATION FRAME
  // This ensures the canvas (rendered by renderTerrainMap) is fully laid out in the DOM.
  requestAnimationFrame(() => {
    locations.forEach((location, index) => {
      const marker = document.createElement("div");
      marker.className = "location-marker";
      // 🆕 NOW we can safely get the offset because the canvas has been rendered
      const offset = this.getCanvasOffset();
      marker.style.left = `${offset.x + location.x * this.tileSize}px`;
      marker.style.top = `${offset.y + location.y * this.tileSize}px`;
      marker.style.position = "absolute";
      marker.style.zIndex = "10";
      marker.style.width = `${this.tileSize}px`;
      marker.style.height = `${this.tileSize}px`;
      marker.style.display = "flex";
      marker.style.alignItems = "center";
      marker.style.justifyContent = "center";
      marker.style.fontSize = `${this.tileSize * 0.8}px`;
      marker.style.pointerEvents = "auto";
      marker.style.cursor = "pointer";
      marker.textContent = location.emoji || "📍";
      marker.title = location.name;

      // Make it clickable
      marker.addEventListener("click", () => {
        if (window.switchToTrade) {
          window.switchToTrade(index);
        } else {
          console.error("MapRenderer: switchToTrade is not available globally.");
        }
      });

      // 👇 APPEND MARKER TO mapContainer
      this.mapContainer.appendChild(marker);
      // 👇 TRACK THE MARKER
      this.locationMarkers.push(marker);
    });
  });
}


























  // Inside MapRenderer class
  getCanvasOffset() {
    if (!this.canvas) return { x: 0, y: 0 };
    const containerRect = this.mapContainer.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    return {
      x: canvasRect.left - containerRect.left + window.scrollX,
      y: canvasRect.top - containerRect.top + window.scrollY,
    };
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);

    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.mapContainer);
      this.resizeObserver.disconnect();
      this.resizeObserver = null; // 🧹 clean reference
    }

    // Optional: Remove canvas and markers from DOM
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }

    this.locationMarkers.forEach((marker) => marker.remove());
    this.locationMarkers = [];
  }

  reset() {
    // Remove the canvas if it exists
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
    // Remove all tracked markers
    this.locationMarkers.forEach((marker) => {
      if (marker.parentNode) {
        // Check if it's still in the DOM
        marker.remove();
      }
    });
    this.locationMarkers = [];
    // 👇👇👇 RESET ALL DATA REFERENCES 👇👇👇
    this.terrainMap = null;
    this.locations = null;
    this.fantasyData = null;
    // Optional: Reset tile size to default
    this.tileSize = 24;
    console.log("MapRenderer: Reset complete. Internal state cleared.");
  }
}
