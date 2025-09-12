class MapManager {
  constructor(gameState, fantasyData) {
    this.gameState = gameState;
    this.fantasyData = fantasyData;
    // Initialize map dimensions and seed
    this.width = 20;
    this.height = 15;
    this.seed = "";
    // State for locations and paths
    this.locations = [];
    this.locationPaths = {};
    this.terrainMap = []; // We'll store the generated map here
  }

  generateNewMap(mapRenderer) {
    // Set a new seed for this generation
    this.seed = Date.now().toString().slice(-5);
    console.log(`MapManager: Generating new map with seed ${this.seed}`);

    // 🚧 PHASE 2: Generate location layout FIRST
    const { locations, locationGrid } = this.generateLocationLayout(this.width, this.height, this.fantasyData, this.seed);
    // Assign array index to each location for easy reference
    locations.forEach((loc, index) => {
      loc._arrayIndex = index;
    });
    this.locations = locations; // Store on the instance

    // Pick the central location
    const centralLocation = this.pickCentralLocation(locations, this.width, this.height);
    console.log("🗺️ Central Location:", centralLocation.name); // For debugging

    // 🚧 PHASE 3: Generate roads using A*
    // Create a set of obstacle tiles (all placed locations) for A*
    const locationObstacles = new Set();
    locations.forEach((loc) => locationObstacles.add(`${loc.x},${loc.y}`));

    // Initialize a set to store all road tiles
    const roadTiles = new Set(); // Will store strings like "x,y"

    // For each location (except the central one), find a path from the central hub
    for (const targetLocation of locations) {
      if (targetLocation === centralLocation) continue; // Skip the central location itself

      // ✅ FIX: Temporarily remove START and END points from obstacles for this path
      const startKey = `${centralLocation.x},${centralLocation.y}`;
      const endKey = `${targetLocation.x},${targetLocation.y}`;
      // Remove start and end from a COPY of the obstacle set
      const pathObstacles = new Set(locationObstacles);
      pathObstacles.delete(startKey);
      pathObstacles.delete(endKey);

      const path = GridSystem.findPath(
  { x: centralLocation.x, y: centralLocation.y }, // Start
  { x: targetLocation.x, y: targetLocation.y }, // End
  pathObstacles, // Obstacles (without start/end)
  this.width, // 👈 Add this
  this.height // 👈 Add this
);

      // If a path is found, add all its points to the roadTiles set
      if (path) {
        path.forEach((point) => {
          roadTiles.add(`${point.x},${point.y}`);
        });
      } else {
        console.warn(`⚠️ No path found from ${centralLocation.name} to ${targetLocation.name}`);
      }
    }

    // Log the roads for debugging
    console.log("🛣️ Generated Roads - Tile Count:", roadTiles.size);

    // 🚧 PHASE 4: Create fixed locations for WFC
    // This tells the WFC: "These tiles MUST be 'road'"
    const fixedLocations = [];
    // Add the trade locations themselves (force them to be 'road')
    locations.forEach((loc) => {
      fixedLocations.push({ x: loc.x, y: loc.y, terrainType: "road" });
    });
    // Add the road tiles (also force them to be 'road')
    roadTiles.forEach((tileKey) => {
      const [x, y] = tileKey.split(",").map(Number);
      fixedLocations.push({ x, y, terrainType: "road" });
    });

    // Log for debugging
    console.log("🧱 Fixed Locations for WFC:", fixedLocations.length);

    // 🚧 PHASE 4: Generate terrain WITH constraints
    const wfc = new WaveFunctionCollapse(this.width, this.height, this.fantasyData.elevation, this.seed, { fixedLocations });
    wfc.collapse();
    this.terrainMap = wfc.getFinalMap(); // Store on the instance
    console.log("🗺️ Generated Terrain Map:", this.terrainMap);

    // 🚧 PHASE 5: Pre-calculate travel cost between EVERY pair of locations
    this.locationPaths = {}; // Reset and populate
    for (let i = 0; i < locations.length; i++) {
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          this.locationPaths[this.gameState._getPathKey(i, j)] = 0; // Cost to same location is 0
          continue;
        }
        // Create a clean obstacle set for this specific path (excluding start and end)
        const startKey = `${locations[i].x},${locations[i].y}`;
        const endKey = `${locations[j].x},${locations[j].y}`;
        const pathObstacles = new Set(locationObstacles);
        pathObstacles.delete(startKey);
        pathObstacles.delete(endKey);
        // Find the path
        // Find the path
const path = GridSystem.findPath(
  { x: locations[i].x, y: locations[i].y },
  { x: locations[j].x, y: locations[j].y },
  pathObstacles,
  this.width, // 👈 Add this
  this.height // 👈 Add this
);
        // Store the path length (number of tiles/edges). If no path, use a high number.
        // Path length - 1 because the path array includes both start and end points.
        this.locationPaths[this.gameState._getPathKey(i, j)] = path ? path.length - 1 : 999;
      }
    }

    // Log for debugging
    console.log("🧭 Pre-calculated Paths:", Object.keys(this.locationPaths).length);

    // Update game state — this sets gameState.mapSeed and gameState.mapName
    this.gameState.ingestWFCMap(locations, this.seed, this.locationPaths);

    // 🆕 GENERATE THE FIRST QUEST
    // ✅ FIXED: Use local SEED here, NOT gameState.mapSeed
    const firstQuest = QuestLogic.generateQuest(this.gameState, 0, this.seed, 1);
    this.gameState.setQuest(firstQuest);

    // Update UI
    document.getElementById("mapName").textContent = `${this.gameState.mapName} | Seed: ${this.seed}`;
    renderMapUI();
    document.getElementById("generateMapBtn").style.display = "none";
    document.getElementById("newMapBtn").style.display = "none";

    // The MapManager's job is done. It has generated the data.
    // Let the caller (main.js) handle the rendering.
    console.log("✅ New map generated with", locations.length, "locations");

  }

  // --- MAP LAYOUT GENERATION ---
  /**
   * Generates the initial layout of location markers on an empty grid.
   * Ignores terrain rules for placement for MVP, focusing on spatial distribution.
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {Object} fantasyData - Game data
   * @param {string} seed - Random seed
   * @returns {Object} - { locations: Array, locationGrid: 2D Array }
   */
  generateLocationLayout(width, height, fantasyData, seed) {
    Math.seedrandom(seed);
    const locationGrid = Array.from({ length: height }, () => Array(width).fill(null));
    const locations = [];
    const availableLocations = [...fantasyData.tradeNodes];
    availableLocations.sort(() => Math.random() - 0.5);
    const maxLocations = Math.min(8, Math.floor((width + height) / 4));
    for (const template of availableLocations) {
      if (locations.length >= maxLocations) break;
      const validPosition = this.findValidLocationForLayout(locationGrid, template, width, height);
      if (validPosition) {
        const newLocation = { ...template, x: validPosition.x, y: validPosition.y };
        locations.push(newLocation);
        locationGrid[validPosition.y][validPosition.x] = newLocation; // Mark the tile as occupied
      }
    }
    return { locations, locationGrid };
  }

  /**
   * Finds a valid position for a location on the layout grid.
   * For MVP, only checks for collision with other locations and enforces a minimum distance.
   * @param {Array} locationGrid - 2D grid tracking placed locations
   * @param {Object} template - Location template
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @returns {Object|null} - {x, y} or null
   */
  findValidLocationForLayout(locationGrid, template, width, height) {
    const candidates = [];
    // Define a minimum distance (in tiles) from other locations
    const MIN_DISTANCE = 3;
    for (let y = 1; y < height - 1; y++) {
      // Avoid very edges for better pathfinding
      for (let x = 1; x < width - 1; x++) {
        if (locationGrid[y][x] !== null) continue; // Skip if tile is occupied
        // Check minimum distance from all other placed locations
        let tooClose = false;
        outerLoop: for (let dy = -MIN_DISTANCE; dy <= MIN_DISTANCE; dy++) {
          for (let dx = -MIN_DISTANCE; dx <= MIN_DISTANCE; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (locationGrid[ny][nx] !== null) {
                tooClose = true;
                break outerLoop; // Break out of both loops
              }
            }
          }
        }
        if (!tooClose) {
          candidates.push({ x, y });
        }
      }
    }
    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
  }

  /**
   * Picks the location closest to the geometric center of the map.
   * @param {Array} locations - Array of location objects
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @returns {Object} - The central location object
   */
  pickCentralLocation(locations, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    let centralLocation = locations[0];
    let minDistance = Infinity;
    for (const loc of locations) {
      // Use Manhattan distance for simplicity
      const distance = Math.abs(loc.x - centerX) + Math.abs(loc.y - centerY);
      if (distance < minDistance) {
        minDistance = distance;
        centralLocation = loc;
      }
    }
    return centralLocation;
  }
}
