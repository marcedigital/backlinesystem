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
  
  // Instead of trying to lint CSS files, just ignore them
  {
    ignores: ["**/*.css"]
  },
];

export default eslintConfig;