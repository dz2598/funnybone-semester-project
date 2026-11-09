import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const config = [
  ...nextCoreWebVitals,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".sst/**",
      "node_modules/**",
      "public/**",
      ".env",
      "package-lock.json",
      "pnpm-lock.yaml",
      "postcss.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "src/types/supabase.ts",
    ],
  },
  {
    rules: {
      "eol-last": "error",
      // Keep long lines visible during development without failing every CI run.
      "max-len": ["warn", { code: 100 }],
      // These components intentionally hydrate browser state after mounting.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": ["warn"],
    },
  },
];

export default config;
