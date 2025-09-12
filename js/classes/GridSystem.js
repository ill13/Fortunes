// /js/classes/GridSystem.js

class GridSystem {
  // Existing method for simple distance (kept for potential legacy use or debugging)
  static getGridDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    return Math.abs(loc1.x - loc2.x) + Math.abs(loc1.y - loc2.y); // Manhattan distance
  }

  // New A* Pathfinding
  static findPath(start, end, obstacles = new Set(), width = 20, height = 15) {
    // obstacles is a Set of strings like "x,y"
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    gScore[`${start.x},${start.y}`] = 0;
    fScore[`${start.x},${start.y}`] = heuristic(start, end);

    openSet.push(start);

    while (openSet.length > 0) {
      // Find node in openSet with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        const node = openSet[i];
        const key = `${node.x},${node.y}`;
        if (fScore[key] < fScore[`${current.x},${current.y}`]) {
          current = node;
          currentIndex = i;
        }
      }

      if (current.x === end.x && current.y === end.y) {
        // Reconstruct path
        const path = [];
        let currentKey = `${current.x},${current.y}`;
        while (cameFrom[currentKey]) {
          path.push({ x: parseInt(currentKey.split(',')[0]), y: parseInt(currentKey.split(',')[1]) });
          currentKey = cameFrom[currentKey];
        }
        path.push(start);
        return path.reverse();
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      // Get neighbors (4-directional)
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 }
      ].filter(neighbor => {
        // Check bounds (Use dynamic size later, for now hardcode 15x12 / 20 / 15)
       // if (neighbor.x < 0 || neighbor.x >= 20 || neighbor.y < 0 || neighbor.y >= 15) return false;
        // Check bounds using dynamic map dimensions
if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) return false;
        // Check if it's an obstacle (e.g., another location)
        if (obstacles.has(`${neighbor.x},${neighbor.y}`)) return false;
        // Check if in closed set
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) return false;
        return true;
      });

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;

        if (!gScore[neighborKey] || tentativeGScore < gScore[neighborKey]) {
          cameFrom[neighborKey] = `${current.x},${current.y}`;
          gScore[neighborKey] = tentativeGScore;
          fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor, end);

          if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return null; // No path found
  }
}

//export default GridSystem; // 👈 Add this if you plan to use ES6 modules later, otherwise it's fine without.