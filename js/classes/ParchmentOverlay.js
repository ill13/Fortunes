// /js/classes/ParchmentOverlay.js

// Simple stubbed noise — later replace with simplex-noise.js
function pseudoNoise(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

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
  this.containerEl.innerHTML = '';
  this.containerEl.style.position = 'relative';

  // Set container size
  this.containerEl.style.width = `${width * 32}px`;
  this.containerEl.style.height = `${height * 32}px`;

  // ✅ Draw terrain base
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const terrainKey = this.mapGrid[y][x];
      const terrain = this.fantasyData.elevation[terrainKey];
      const color = terrain.colors[0];

      const tile = document.createElement('div');
      tile.style.position = 'absolute';
      tile.style.left = `${x * 32}px`;
      tile.style.top = `${y * 32}px`;
      tile.style.width = '32px';
      tile.style.height = '32px';
      tile.style.backgroundColor = color;
      this.containerEl.appendChild(tile);
    }
  }

  // ✅ Add parchment overlay (noise wash)
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundImage = `
    radial-gradient(circle at 30% 30%, rgba(240, 230, 200, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(220, 200, 170, 0.3) 0%, transparent 50%)
  `;
  overlay.style.mixBlendMode = 'multiply';
  overlay.style.pointerEvents = 'none';
  this.containerEl.appendChild(overlay);

  // ✅ Add subtle noise layer (canvas)
  const canvas = document.createElement('canvas');
  canvas.width = width * 32;
  canvas.height = height * 32;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.mixBlendMode = 'overlay';
  canvas.style.opacity = '0.15';
  canvas.style.pointerEvents = 'none';

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  const seed = parseInt(gameState.mapSeed) || 0;

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % canvas.width;
    const y = Math.floor((i / 4) / canvas.width);
    const noise = pseudoNoise(x * 0.05, y * 0.05, seed);
    const value = Math.floor(noise * 50); // subtle variation

    data[i] = value + 200;     // r
    data[i + 1] = value + 190; // g
    data[i + 2] = value + 160; // b
    data[i + 3] = 255;         // a
  }

  ctx.putImageData(imageData, 0, 0);
  this.containerEl.appendChild(canvas);

  // ✅ Draw locations
  this.locations.forEach((loc, index) => {
    const overlay = document.createElement('div');
    overlay.className = 'location-overlay';
    overlay.textContent = loc.emoji;
    
    overlay.style.left = `${loc.x * 32 + 16}px`;
    overlay.style.top = `${loc.y * 32 + 12}px`;
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.textShadow = '1px 1px 2px rgba(0,0,0,0.2)';
    overlay.style.zIndex = '10';
    overlay.style.pointerEvents = 'auto';

    overlay.addEventListener('click', () => {
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
