const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite no web carrega um módulo .wasm (wa-sqlite)
config.resolver.assetExts.push('wasm');

module.exports = config;
