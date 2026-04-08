module.exports = {
  extends: ['next/core-web-vitals', '@tanstack/eslint-plugin-query'],
  rules: {
    // React hooks
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // React
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
    
    // Import order
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    
    // Queries
    '@tanstack/query/exhaustive-deps': 'error',
    '@tanstack/query/no-rest-deps': 'warn',
  },
};