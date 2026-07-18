import path from 'node:path';

/**
 * ESLint 9 flat config는 CWD 기준으로 가장 가까운 eslint.config.*를 찾는 게 아니라,
 * CWD에서 시작해 "위쪽으로만" 탐색한다. lint-staged/husky는 저장소 루트에서
 * `eslint --fix`를 실행하므로, 그냥 `eslint --fix <path>`를 쓰면 파일이 어느
 * 워크스페이스에 있든 항상 루트 eslint.config.mjs(base.mjs)만 적용되고 각
 * 워크스페이스 자체 설정(apps/web의 CAMEL_CASE 예외, apps/api의 naming-convention
 * 상속 등)은 무시된다. pnpm -C로 해당 워크스페이스 디렉터리에서 실행해야
 * 워크스페이스 자체 eslint.config를 올바르게 탄다.
 */
function eslintInWorkspace(workspaceDir, extraArgs = '') {
  return (files) => {
    const relativeFiles = files.map((f) => path.relative(workspaceDir, f));
    return `pnpm -C ${workspaceDir} exec eslint --fix ${extraArgs} ${relativeFiles.map((f) => JSON.stringify(f)).join(' ')}`;
  };
}

export default {
  '**/*.{json,css,md}': ['prettier --write'],
  '**/*.{js,jsx,ts,tsx,mjs}': ['prettier --write'],

  'apps/api/**/*.{js,ts}': eslintInWorkspace('apps/api'),
  // apps/web은 #9에서 경고 0건까지 정리 완료 — 회귀 방지를 위해 --max-warnings 0으로 강제
  'apps/web/**/*.{js,jsx,ts,tsx,mjs}': eslintInWorkspace('apps/web', '--max-warnings 0'),
  'packages/ui/**/*.{js,jsx,ts,tsx}': eslintInWorkspace('packages/ui'),
  'packages/dto/**/*.ts': eslintInWorkspace('packages/dto'),

  // 위 워크스페이스에 속하지 않는 루트/공용 설정 파일들(예: packages/eslint-config/*.mjs,
  // 루트 eslint.config.mjs 자신)은 루트 설정 그대로 적용하는 게 맞으므로 워크스페이스 이동 없이 실행
  '{*.{js,mjs},packages/eslint-config/**/*.{js,mjs},packages/typescript-config/**/*.js}': ['eslint --fix'],
};
