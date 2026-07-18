import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,

  // Next App Router reserved filenames must be lowercase (layout.tsx, page.tsx, etc.)
  {
    files: ['app/**/{layout,page,loading,error,not-found,template,default}.tsx'],
    rules: {
      'check-file/filename-naming-convention': 'off',
    },
  },

  // src/의 .ts 파일(훅/스토어/api/mappers/utils 등)은 export되는 심볼명과 맞춘
  // camelCase 파일명이 실제 컨벤션이라 kebab-case 대신 CAMEL_CASE로 검사
  {
    files: ['src/**/*.ts'],
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.ts': 'CAMEL_CASE' }, { ignoreMiddleExtensions: true }],
    },
  },

  // CLAUDE.md에 문서화된 컴포넌트 합성 폴더 패턴(components/{domain}/{ComponentName}/*,
  // components/player/nowPlaying/ 같은 camelCase 폴더 포함)은 folder-naming-convention 검사에서 제외
  {
    files: ['src/components/*/*[A-Z]*/**/*.{ts,tsx}'],
    rules: {
      'check-file/folder-naming-convention': 'off',
    },
  },

  // app/ 라우트 그룹 (home), 동적 세그먼트 [id] 등 Next.js 예약 폴더 문법은 검사 대상에서 제외
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'check-file/folder-naming-convention': 'off',
    },
  },
];
