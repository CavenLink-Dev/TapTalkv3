const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Treat SVGs as bundled assets. TapTalk renders them at runtime via
// `react-native-svg`'s SvgUri after resolving the local asset URI with
// `expo-asset`; no transformer is needed.
if (!config.resolver.assetExts.includes('svg')) {
  config.resolver.assetExts.push('svg');
}
if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}

module.exports = config;
