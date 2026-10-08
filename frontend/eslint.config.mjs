import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Formatting is Prettier's job; turn off ESLint rules that conflict with it
  prettier,
  {
    rules: {
      // The OpenWeather condition icon is a small remote PNG; next/image adds nothing here
      '@next/next/no-img-element': 'off',
      // Motion policy (DESIGN.md): no frame loops. test/motionPolicy.test.ts checks the CSS side
      'no-restricted-globals': [
        'error',
        { name: 'requestAnimationFrame', message: 'No frame loops: see the motion policy in DESIGN.md.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'requestAnimationFrame',
          message: 'No frame loops: see the motion policy in DESIGN.md.',
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'next-env.d.ts']),
]);
