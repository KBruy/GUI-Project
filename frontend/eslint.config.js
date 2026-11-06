import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // @pxlkit importuj tylko przez Icon.tsx — bezpośrednie użycie rozjeżdża spójność ikon
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@pxlkit/*'], message: 'Import @pxlkit only through @/shared/components/ui/Icon' }],
      }],
    },
  },
  // Icon.tsx to jedyne miejsce, gdzie @pxlkit jest dozwolone
  {
    files: ['src/shared/components/ui/Icon/Icon.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
)
