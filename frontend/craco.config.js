const path = require("path");

console.log("Assets path:", path.resolve(__dirname, "src/assets"));
console.log("UI path:", path.resolve(__dirname, "src/components/ui"));
console.log("Components path:", path.resolve(__dirname, "src/components"));
console.log("Icons path:", path.resolve(__dirname, "src/components/icons"));
console.log("Contexts path:", path.resolve(__dirname, "src/contexts"));

module.exports = {
  webpack: {
    alias: {
      "@assets": path.resolve(__dirname, "src/assets"),
      "@ui": path.resolve(__dirname, "src/components/ui"),
      "@components": path.resolve(__dirname, "src/components"),
      "@icons": path.resolve(__dirname, "src/components/icons"),
      "@contexts": path.resolve(__dirname, "src/contexts"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
};
