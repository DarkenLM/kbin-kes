/**
 * @typedef {Object} Paths
 * @property {string} root The working directory for the build.
 * @property {string} distDir The solution build output directory path.
 * @property {string} srcDir The solution source directory path.
 */

/**
 * @typedef {Object} BuildOptions
 * @property {Paths} paths The file paths used for consistency.
 * @property {boolean} debug Whenever the build is running in debug mode.
 * @property {boolean} dev Whenever the build is running in development mode.
 * @property {boolean} force Whenever the build is running in forceful mode.
 */

/**
 * @typedef {Object} BuildStats
 * @property {boolean} dist
 * @property {boolean} src
 */