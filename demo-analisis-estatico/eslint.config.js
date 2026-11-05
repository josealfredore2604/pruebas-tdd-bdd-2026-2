const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: { ...globals.node, ...globals.jest } },
    rules: {
      "no-unused-vars": "error",
      "eqeqeq": "error",
      "complexity": ["error", 5],
    },
  },
];
