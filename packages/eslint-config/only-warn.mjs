import onlyWarn from "eslint-plugin-only-warn";

/**
 * eslint-plugin-only-warn은 모듈을 import하는 순간 전역으로 모든 error를
 * warning으로 강등시키는 monkey-patch를 건다. base.mjs에서 분리해 별도
 * 파일로 둔 이유는, apps/api처럼 error를 실제 커밋 차단에 쓰는 워크스페이스가
 * base.mjs만 import했을 때 이 부작용에 영향받지 않도록 하기 위함이다.
 * onlyWarn을 원하는 소비자(next.js, react-internal.js)만 이 파일을 명시적으로
 * import해서 opt-in한다.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const onlyWarnConfig = [
  {
    plugins: {
      onlyWarn,
    },
  },
];
