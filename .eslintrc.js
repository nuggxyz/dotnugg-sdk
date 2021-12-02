module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: ['prettier'],
    plugins: ['prettier', 'import'],
    rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-unused-vars': 'off',
        // 'no-unused-vars': 'off',
        'import/order': [
            'error',
            {
                'newlines-between': 'always',
                groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
            },
        ],
    },
};
