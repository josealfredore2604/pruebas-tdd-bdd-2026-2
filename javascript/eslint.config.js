const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["coverage/", "playwright-report/", "test-results/"] },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "error",
      "eqeqeq": "error",
    },
  },
  {
    // Todo el código del servidor y las pruebas usa require/module.exports
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["tests/unit/**", "tests/integration/**"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  {
    // Script que carga el navegador desde public/index.html
    files: ["public/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
];
