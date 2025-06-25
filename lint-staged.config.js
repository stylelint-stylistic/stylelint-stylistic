/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default { "*.js": [`eslint --fix`, `node .githooks/run-staged-tests.js`] }
