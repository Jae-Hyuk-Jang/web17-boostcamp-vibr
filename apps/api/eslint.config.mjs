// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { config as baseConfig } from '@repo/eslint-config/base';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  // 저장소 공용 규칙(파일명/폴더명 kebab-case, naming-convention 등) 상속.
  // base.mjs는 onlyWarn을 포함하지 않으므로(only-warn.mjs로 분리됨) apps/api는
  // error를 실제 커밋 차단에 쓰는 기존 방침을 그대로 유지함
  ...baseConfig,
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        // base.mjs가 naming-convention용으로 켠 project: true와 충돌하므로 명시적으로 해제
        project: false,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
);
