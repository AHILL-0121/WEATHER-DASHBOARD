import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  // Formatting is Prettier's job; turn off ESLint rules that conflict with it
  prettier,
  {
    rules: {
      // The OpenWeather condition icon is a small remote PNG; next/image adds nothing here
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'next-env.d.ts']),
]);
