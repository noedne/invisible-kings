import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import globals from 'globals';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const compat = new FlatCompat({ baseDirectory: dirname });
const configs = ['eslint.config.mjs', 'webpack.config.mjs'];

export default tseslint.config(
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: true,
        tsconfigRootDir: dirname,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
  },
  {
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  pluginJs.configs.recommended,
  ...compat.extends('airbnb-base'),
  ...compat.extends('plugin:import/typescript'),
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      'class-methods-use-this': 'off',
      '@typescript-eslint/class-methods-use-this': [
        'error',
        {
          ignoreOverrideMethods: true,
        },
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: configs,
        },
      ],
      indent: 'off',
      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: true,
        },
      ],
      'no-alert': 'off',
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
      'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: false,
        },
      ],
      'object-curly-newline': 'off',
      'operator-linebreak': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'error',
    },
  },
  {
    files: configs,
    ...tseslint.configs.disableTypeChecked,
  },
);
