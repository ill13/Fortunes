// /js/classes/GridSystem.js

class GridSystem {
  static getGridDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    return Math.abs(loc1.x - loc2.x) + Math.abs(loc1.y - loc2.y); // Manhattan distance
  }
}