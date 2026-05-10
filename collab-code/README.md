# CodeCollab 프론트엔드

실시간 협업 코드 리뷰 플랫폼 — 프론트엔드

## 구조

```
src/
├── pages/
│   ├── LoginPage.jsx        # 로그인 / 회원가입
│   ├── DashboardPage.jsx    # 세션 목록 + 생성
│   ├── EditorPage.jsx       # 실시간 코드 에디터 + 댓글
│   └── SnippetsPage.jsx     # 스니펫 저장소
├── components/
│   └── Layout.jsx           # 사이드바 레이아웃
├── hooks/
│   └── useSocket.js         # Socket.io 연결 훅
├── styles/
│   └── global.css           # 전역 스타일
└── App.jsx                  # 라우팅
```

## 시작하기

```bash
npm install
npm run dev
# http://localhost:5173 열기
```

백엔드 서버가 localhost:3000 에서 실행 중이어야 합니다.

## 연결되는 백엔드 API

| 엔드포인트 | 설명 |
|---|---|
| POST /api/auth/login | 로그인 |
| POST /api/auth/register | 회원가입 |
| GET /api/sessions | 세션 목록 |
| POST /api/sessions | 세션 생성 |
| GET /api/sessions/:id | 세션 상세 |
| GET /api/sessions/:id/comments | 댓글 목록 |
| POST /api/sessions/:id/comments | 댓글 등록 |
| GET /api/snippets | 스니펫 목록 |
| POST /api/snippets | 스니펫 저장 |

## 사용 기술

- React 18 + React Router
- Monaco Editor (VS Code 에디터)
- Socket.io-client (실시간 동기화)
- Axios (HTTP 요청)
- Vite (빌드 도구)
