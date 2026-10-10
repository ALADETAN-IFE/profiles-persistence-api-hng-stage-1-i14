// ============================================================
// REPOGUARD — MANUAL REVIEW REQUIRED: eslint.config.js
// Scanned: 2026-10-10T05:18:03.991Z
// The following findings could NOT be automatically patched:
//   [CRITICAL] js-obfuscated-hex: JavaScript hex/unicode escape obfuscation sequence
//   [MEDIUM] high-entropy-secret: High-entropy string detected — possible hardcoded credential or API key
// ============================================================

// ============================================================
// REPOGUARD — MANUAL REVIEW REQUIRED: eslint.config.js
// Scanned: 2026-10-10T05:17:23.078Z
// The following findings could NOT be automatically patched:
//   [MEDIUM] high-entropy-secret: High-entropy string detected — possible hardcoded credential or API key
// ============================================================

// REMOVED BY REPOGUARD: obfuscated malware alias
("@typescript-eslint/parser");
// REMOVED BY REPOGUARD: obfuscated malware alias
("@typescript-eslint/eslint-plugin");

module.exports = [
  // Files/paths to ignore (replaces .eslintignore usage in flat config)
  {
    ignores: ["node_modules/**", "dist/**"],
  },

  // TypeScript rules for source files
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Disallow explicit `any`
      "@typescript-eslint/no-explicit-any": "error",

      // You can add or tune more TypeScript rules here
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
