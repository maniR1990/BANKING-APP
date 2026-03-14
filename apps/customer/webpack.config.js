const { composePlugins, withNx } = require('@nx/webpack');

// Nx 22+ expects this specific structure
module.exports = composePlugins(
  withNx({
    target: 'node', // This is what the error was complaining about!
  }),
  (config) => {
    // You can modify the webpack config here if needed
    return config;
  },
);
