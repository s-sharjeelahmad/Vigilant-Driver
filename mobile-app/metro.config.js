const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("onnx")) {
  config.resolver.assetExts.push("onnx");
}
// ADD THIS BLOCK
if (!config.resolver.assetExts.includes("data")) {
  config.resolver.assetExts.push("data");
}

module.exports = config;