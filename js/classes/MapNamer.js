// /js/classes/MapNamer.js

class MapNamer {
  constructor() {
    this.prefixes = ["Whispering", "Silent", "Crimson", "Glass", "Ancient", "Dappled", "Misty", "Wandering", "Forgotten", "Bramble"];
    this.suffixes = ["Woods", "Rivers", "Peaks", "Glades", "Marsh", "Hollow", "Sanctum", "Ruins", "Crossroads", "Cove"];
  }

  generate(seed) {
    Math.seedrandom(seed.toString()); // reseed for name consistency
    const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
    const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
    return `${prefix} ${suffix}`;
  }
}