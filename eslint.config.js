// Linter: detecta variables sin usar, nombres no definidos y errores comunes. `npx eslint src`
export default [
  {
    files: ['src/**/*.js', 'scripts/**/*.mjs', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'module',
      globals: { matchMedia: 'readonly', Path2D: 'readonly', window: 'readonly', document: 'readonly', performance: 'readonly', requestAnimationFrame: 'readonly', ResizeObserver: 'readonly', EventSource: 'readonly', atob: 'readonly', structuredClone: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', console: 'readonly', process: 'readonly', URL: 'readonly' }
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none' }], 'no-undef': 'error' }
  }
];
