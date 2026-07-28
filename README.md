<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=venom&height=200&text=VIBR&fontSize=70&color=gradient&animation=twinkling" />
</p>

<p align="center">
  <b>VIBE + RESONANCE</b><br/>
  <sub>알고리즘의 편향에서 벗어난 <b>사람(Human) 기반</b> 소셜 뮤직 큐레이션 플랫폼</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/사람%20기반%20큐레이션-8A2BE2?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/시각적%20피드-4C6EF5?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/음악%20아이덴티티-2DE2E6?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/전역%20플레이어-3CD1A3?style=for-the-badge&labelColor=0B0B10" />
</p>

---

## 🎧 사람 중심의 음악 취향 공유 공간, VIBR

> **"Vibe"**(분위기) + **"Resonance"**(공명) — 음악으로 나를 표현하고 타인의 취향을 탐험하는 소셜 뮤직 큐레이션 플랫폼입니다.

- 🤝 알고리즘의 장르적 유사성이 아니라 **사람과 사람의 관계**(팔로우·좋아요)로 음악을 추천합니다.
- 🔗 "링크 공유"로 끝나던 추천을 한 화면에서 이어지는 **[추천 → 재생 → 반응]** 흐름으로 만듭니다.
- 🎶 Spotify·YouTube·iTunes 등 **플랫폼이 달라도** 누구나 같은 화면에서 바로 재생할 수 있습니다.

자세한 내용은 [서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/%EC%84%9C%EB%B9%84%EC%8A%A4-%EA%B8%B0%ED%9A%8D%EC%84%9C)를 참고해주세요.

---

## 서비스 실제 사용 화면

![ezgif-66f35fbb95e46c12](https://github.com/user-attachments/assets/114e24eb-cf65-4788-997f-eab61f38008b)

---

## 💻 로컬 Setup

### Requirements

- **Node.js >= 18** (권장: LTS)
- **pnpm** (workspace 기준)

### Install

```bash
corepack enable
pnpm -v
pnpm install
```

### Run Database

```bash
docker compose up -d
```

### Run Dev

```bash
pnpm dto # FE/BE 공통 dto 패키지 빌드
pnpm dev # 개발 서버 전체 실행 (web + api)
```

### 그 외 스크립트 명령어

```bash
pnpm lint
pnpm check-types
pnpm build
pnpm format
```

<br>

## 🛠 기술 스택

| 영역               | 스택                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | ![Next JS](https://img.shields.io/badge/NextJS-black?style=flat-square&logo=next.js&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white) ![Zustand](https://img.shields.io/badge/zustand-453F39?style=flat-square)                                                                                                                                                                                                                           |
| **Backend**        | ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=flat-square&logo=nestjs&logoColor=white) ![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=flat-square&logo=mysql&logoColor=white) ![TypeORM](https://img.shields.io/badge/TypeORM-FE0803.svg?style=flat-square&logo=typeorm&logoColor=white) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=flat-square&logo=redis&logoColor=white) ![Neo4J](https://img.shields.io/badge/Neo4j-008CC1?style=flat-square&logo=neo4j&logoColor=white) |
| **Common**         | ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat-square&logo=typescript&logoColor=white) ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=flat-square&logo=jest&logoColor=white)                                                                                                                                                                                                                                                                                                            |
| **Environment**    | ![Turborepo](https://img.shields.io/badge/turborepo-%23EF4444.svg?style=flat-square&logo=turborepo&logoColor=white) ![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=flat-square&logo=pnpm&logoColor=f69220) ![GitHook](<https://img.shields.io/badge/Husky_(Git_Hook)-F05032.svg?style=flat-square&logo=git&logoColor=white>) ![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=flat-square&logo=eslint&logoColor=white)                                                                                     |
| **Infrastructure** | ![Naver Cloud Platform](https://img.shields.io/badge/naver_cloud_platform-%2303C75A.svg?style=flat-square&logo=naver&logoColor=white) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat-square&logo=docker&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=flat-square&logo=githubactions&logoColor=white)                                                                                                                                                |

<br>

## ☁️ 인프라 아키텍처

<img width="2102" height="1572" alt="image" src="https://github.com/user-attachments/assets/8b2769c8-1ce6-4437-a5dd-01e7b3187f14" />


> 위 다이어그램은 원래 설계된 배포 아키텍처를 옮긴 것입니다. **현재는 대상 인프라가 없어** 배포·트리거 워크플로우(`deploy.yml`, `ecsTrigger.yml`)는 수동 실행(`workflow_dispatch`)으로 전환된 상태이며, CI(`ci.yml`)만 push/PR 시 자동 실행됩니다.

자세한 내용은 [배포/인프라 설계서](https://github.com/boostcampwm2025/web17-Busy/wiki/%EB%B0%B0%ED%8F%AC---%EC%9D%B8%ED%94%84%EB%9D%BC)를 참고해주세요.

---

## 기술적 개선

기능을 추가하는 데서 멈추지 않고, 기존 구조의 문제를 다음 순서로 진단하고 개선합니다.

```text
문제 진단 → 요구사항 정리 → 설계 결정 → 구현 → 회귀 검증 → 문서화
```

대표적인 개선 사례만 아래에 요약했습니다.
전체 기록은 [`docs/refactors/`](docs/refactors/)와 연결된 pull request에서 확인할 수 있습니다.

| 문제 | 결정 | 결과 | 근거 |
| --- | --- | --- | --- |
| 화면별 `useState`와 `useEffect` 캐시가 서로 달라지는 문제 | TanStack Query를 서버 상태의 단일 관리 계층으로 도입 | 화면 간 캐시 공유와 명시적 무효화가 가능해짐 | [PR #148](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/pull/148) |
| 게시글 상세 모달이 데이터 조합, 재생, 라우팅, 편집, 로그, 제스처를 모두 담당 | 오케스트레이션 훅과 하위 컴포넌트로 책임 분리 | 핵심 컴포넌트를 329줄에서 69줄로 축소 | [PR #134](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/pull/134) |
| 모달마다 오버레이, 닫기 동작, z-index를 중복 구현 | `ModalShell`과 `ModalCloseButton` 도입 | 공통 동작과 접근 지점을 하나의 계층으로 통일 | [PR #78](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/pull/78) |
| 모달 간 배럴 파일과 의존 관계에서 순환 참조 발생 | 공개 API와 import 경계를 재정리 | 모달 의존 방향을 단순화하고 순환 참조 제거 | [PR #94](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/pull/94) |
| 검색 UI와 상태 처리 로직이 여러 화면에서 반복 | `MusicPickerSearch` 공용 컴포넌트로 통합 | 검색 흐름과 상태 표현을 한 곳에서 관리 | [PR #116](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/pull/116) |
| 좋아요 낙관적 갱신과 롤백 로직이 두 위치에 독립적으로 존재 | `usePostLikeToggle`로 합성 | 반응 상태 변경 규칙을 단일 경로로 통일 | [PR #52](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/pull/52) |

진행 중인 개선 항목은 [backlog 이슈](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues?q=is%3Aissue+is%3Aopen+label%3Abacklog)에서 확인할 수 있습니다.

---

## 🌟 팀원 소개

이 프로젝트의 기반이 된 `web17-Busy`는 부스트캠프 웹/모바일 10기에서 네 명이 함께 개발했습니다.

| 김승호 | 김예빈 | 문예찬 | 장재혁 |
| :---: | :---: | :---: | :---: |
| <img src="https://github.com/seunghok22.png" width="100" alt="김승호"/> | <img src="https://github.com/yebinGold.png" width="100" alt="김예빈"/> | <img src="https://github.com/myc0603.png" width="100" alt="문예찬"/> | <img src="https://github.com/Jae-Hyuk-Jang.png" width="100" alt="장재혁"/> |
| [seunghok22](https://github.com/seunghok22) | [yebinGold](https://github.com/yebinGold) | [myc0603](https://github.com/myc0603) | [Jae-Hyuk-Jang](https://github.com/Jae-Hyuk-Jang) |
