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

## 소개

> **"Vibe"**(분위기) + **"Resonance"**(공명) — 음악으로 나를 표현하고 타인의 취향을 탐험하는 소셜 뮤직 큐레이션 플랫폼입니다.

- 🤝 알고리즘의 장르적 유사성이 아니라 **사람과 사람의 관계**(팔로우·좋아요)로 음악을 추천합니다.
- 🔗 "링크 공유"로 끝나던 추천을 한 화면에서 이어지는 **[추천 → 재생 → 반응]** 흐름으로 만듭니다.
- 🎶 YouTube·iTunes 등 **플랫폼이 달라도** 누구나 같은 화면에서 바로 재생할 수 있습니다.

### 주요 기능

- 곡을 검색해 이미지·글과 함께 추천 게시글로 공유
- 팔로우한 사람의 글·최신 글·인기 글을 섞은 홈 피드
- 좋아요, 댓글, 팔로우, 알림
- YouTube 영상과 iTunes 30초 미리듣기를 하나의 플레이어에서 재생, 재생 목록과 플레이리스트
- PWA (홈 화면 설치, 오프라인 안내 페이지)

> 팀 프로젝트가 끝난 뒤 1인으로 리뉴얼하고 있습니다. 현재 운영 중인 서비스는 없으며, 서비스 이름과 방향을 다시 정하는 중입니다.

## 실행 화면

![실행 화면](https://github.com/user-attachments/assets/114e24eb-cf65-4788-997f-eab61f38008b)

## 기술 스택

| 영역            | 스택                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**    | ![Next JS](https://img.shields.io/badge/NextJS-black?style=flat-square&logo=next.js&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white) ![Zustand](https://img.shields.io/badge/zustand-453F39?style=flat-square) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square)                                               |
| **Backend**     | ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=flat-square&logo=nestjs&logoColor=white) ![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=flat-square&logo=mysql&logoColor=white) ![TypeORM](https://img.shields.io/badge/TypeORM-FE0803.svg?style=flat-square&logo=typeorm&logoColor=white) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=flat-square&logo=redis&logoColor=white)              |
| **Common**      | ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat-square&logo=typescript&logoColor=white) ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=flat-square&logo=jest&logoColor=white)                                                                                                                                                                                                                        |
| **Environment** | ![Turborepo](https://img.shields.io/badge/turborepo-%23EF4444.svg?style=flat-square&logo=turborepo&logoColor=white) ![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=flat-square&logo=pnpm&logoColor=f69220) ![GitHook](<https://img.shields.io/badge/Husky_(Git_Hook)-F05032.svg?style=flat-square&logo=git&logoColor=white>) ![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=flat-square&logo=eslint&logoColor=white) |
| **DevOps**      | ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat-square&logo=docker&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=flat-square&logo=githubactions&logoColor=white)                                                                                                                                                                                                  |

## 로컬 실행

### 요구 사항

- Node.js 20.9 이상 (Next.js 16 요구 사항, CI는 Node.js 22 사용)
- pnpm 9 (`corepack enable`로 활성화)
- Docker (MySQL·Redis 실행용)

### 설치

```bash
corepack enable
pnpm install
```

### 환경 변수

```bash
cp apps/api/example.env apps/api/.env
cp apps/web/sample.env apps/web/.env
```

- 루트 `.env`에 `REDIS_PASSWORD`를 넣습니다. `docker compose`가 이 값으로 Redis를 띄우므로 `apps/api/.env`의 `REDIS_PASSWORD`와 같은 값이어야 합니다.
- Google OAuth, YouTube Data API, NCP 오브젝트 스토리지 키는 각 예시 파일의 주석을 보고 채웁니다. NCP 키가 없으면 게시글 커버 이미지 업로드가 실패합니다.

### 실행

```bash
docker compose up -d   # MySQL(호스트 포트 3307), Redis(6379)
pnpm dto               # FE/BE 공통 DTO 패키지 빌드 (DTO를 바꾸면 다시 실행)
pnpm dev               # web: http://localhost:3000, api: http://localhost:3002/api
```

### 그 외 명령어

```bash
pnpm lint          # lint
pnpm check-types   # 타입 검사
pnpm test          # 테스트
pnpm build         # 빌드
pnpm format        # prettier 포맷
```

## 프로젝트 배경

이 저장소는 네이버 부스트캠프 웹·모바일 10기 팀 프로젝트 [web17-Busy](https://github.com/boostcampwm2025/web17-Busy)에서 출발했습니다. 팀 프로젝트는 [김승호](https://github.com/seunghok22), [김예빈](https://github.com/yebinGold), [문예찬](https://github.com/myc0603), [장재혁](https://github.com/Jae-Hyuk-Jang)이 함께 만들었고, 팀 활동이 끝난 뒤 장재혁이 이 저장소에서 리뉴얼을 이어가고 있습니다.

팀 프로젝트 당시의 [서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/%EC%84%9C%EB%B9%84%EC%8A%A4-%EA%B8%B0%ED%9A%8D%EC%84%9C)와 [배포/인프라 설계](https://github.com/boostcampwm2025/web17-Busy/wiki/%EB%B0%B0%ED%8F%AC---%EC%9D%B8%ED%94%84%EB%9D%BC)는 web17-Busy 위키에서 볼 수 있습니다.
