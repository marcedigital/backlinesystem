import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Add custom rules for CSS-in-JS and Tailwind
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Disable warnings for CSS props in JSX
      "react/no-unknown-property": ["error", { 
        ignore: ["css", "tw", "className", "style"] 
      }],
    },
  },
  
  // Add specific rules for CSS files
  {
    files: ["**/*.css"],
    languageOptions: {
      parser: {
        ecmaVersion: 2022,
      },
    },
    // This tells ESLint not to process CSS files with standard JS rules
    rules: {
      // Turn off rules that would trigger on @apply and other Tailwind directives
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;