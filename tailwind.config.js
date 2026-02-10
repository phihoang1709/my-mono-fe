const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
    join(__dirname, 'libs/shared/ui/src/**/*!(*.stories|*.spec).{ts,tsx,html}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};