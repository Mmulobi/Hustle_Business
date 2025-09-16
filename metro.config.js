const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Android development
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Fix for TurboModule compatibility
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Enable new architecture support
config.resolver.unstable_enablePackageExports = true;

// Fix for getDevServer error on Android
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add CORS headers for Android development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
