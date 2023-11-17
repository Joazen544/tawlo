module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base', 'airbnb-typescript/base'],
  //   overrides: [
  //     {
  //       env: {
  //         node: true,
  //       },
  //       files: [".eslintrc.{js,cjs}"],
  //       parserOptions: {
  //         sourceType: "script",
  //       },
  //     },
  //   ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'no-underscore-dangle': 'off',
    'no-console': 'off',
    'object-curly-newline': 'off',
    'func-names': 'off',
  },
  //excluded: ['.eslintrc.js'],
};
