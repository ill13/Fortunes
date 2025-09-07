// /js/classes/WaveFunctionCollapse.js

class WaveFunctionCollapse {
  constructor(width, height, terrainRules, seed) {
    this.width = width;
    this.height = height;
    this.terrainRules = terrainRules; // from fantasy.json elevation
    this.seed = seed;
    Math.seedrandom(seed); // seeded randomness

    // Initialize grid: each cell is a set of possible terrain types
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 
        Object.keys(terrainRules)
      )
    );

    this.entropyGrid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => Object.keys(terrainRules).length)
    );
  }

  collapse() {
    // Simple: pick lowest entropy cell (random tiebreak), collapse it
    while (this.hasUncollapsed()) {
      const cell = this.getLowestEntropyCell();
      if (!cell) break;

      const [x, y] = cell;
      const options = this.grid[y][x];
      const chosen = options[Math.floor(Math.random() * options.length)];
      this.setCell(x, y, chosen);
      this.propagate(x, y);
    }
  }

  hasUncollapsed() {
    return this.grid.some(row => 
      row.some(cell => Array.isArray(cell) && cell.length > 1)
    );
  }

  getLowestEntropyCell() {
    let minEntropy = Infinity;
    let candidates = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const entropy = this.entropyGrid[y][x];
        if (entropy > 1 && entropy < minEntropy) {
          minEntropy = entropy;
          candidates = [[x, y]];
        } else if (entropy === minEntropy) {
          candidates.push([x, y]);
        }
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  setCell(x, y, terrainType) {
    this.grid[y][x] = terrainType;
    this.entropyGrid[y][x] = 1;
  }

  propagate(x, y) {
    const terrainType = this.grid[y][x];
    const allowedNeighbors = this.terrainRules[terrainType].adjacent;

    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // 4-directional
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

      const neighborCell = this.grid[ny][nx];
      if (!Array.isArray(neighborCell)) continue; // already collapsed

      // Filter neighbor options to only those allowed adjacent to current terrain
      const newOptions = neighborCell.filter(option => 
        allowedNeighbors.includes(option)
      );

      if (newOptions.length === 0) {
        // Fallback: allow any if constraint breaks (MVP safety)
        this.grid[ny][nx] = Object.keys(this.terrainRules)[0];
        this.entropyGrid[ny][nx] = 1;
      } else if (newOptions.length !== neighborCell.length) {
        this.grid[ny][nx] = newOptions;
        this.entropyGrid[ny][nx] = newOptions.length;
      }
    }
  }

  getFinalMap() {
    return this.grid.map(row => row.map(cell => 
      typeof cell === 'string' ? cell : cell[0] // fallback if any remain
    ));
  }
}