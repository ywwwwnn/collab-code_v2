================================================================
 파일명  : LoginPage.jsx
 위치    : src/pages/LoginPage.jsx
 만든 이유: 로그인 및 회원가입 화면 처리
================================================================

[ LoginPage.jsx ]

사용자가 서비스에 처음 접근하면 보이는 화면
로그인 탭과 회원가입 탭이 하나의 카드로 구성

회원가입은 이메일 인증 3단계로 나뉨:
1단계 (form)  → 이메일 입력 + "코드 발송" 버튼
2단계 (code)  → 6자리 코드 입력 + "확인" 버튼
3단계 (done)  → 인증 완료 + 나머지 정보 입력 + 가입하기



[ 핵심 용어 설명 ]

▶ JSX
   - JavaScript + XML 혼합 문법
   - React에서 HTML처럼 UI를 작성하는 방식
   - <div>, <button> 등을 JS 코드 안에 직접 쓸 수 있음

▶ useState
   - React 상태 관리 훅
   - const [값, 값변경함수] = useState(초기값)
   - 값이 바뀌면 컴포넌트가 다시 그려짐 (리렌더링)

▶ axios
   - HTTP 요청을 보내는 라이브러리
   - axios.post(URL, 데이터) → 서버에 POST 요청
   - 응답이 오면 .then() 또는 await로 받음
   - 에러는 .catch() 또는 try/catch로 처리

▶ useNavigate
   - React Router의 페이지 이동 훅
   - navigate('/') → 대시보드로 이동
   - navigate('/login') → 로그인 페이지로 이동

▶ localStorage
   - 브라우저에 데이터를 영구 저장하는 공간
   - localStorage.setItem(key, value) → 저장
   - localStorage.getItem(key) → 조회
   - localStorage.clear() → 전체 삭제
   - 브라우저를 닫아도 남아있음

▶ e.preventDefault()
   - 폼(form)의 기본 동작(페이지 새로고침)을 막음
   - submit 이벤트 시 반드시 필요

▶ 구조분해할당 (Destructuring)
   - const { email } = req.body
   - 객체에서 특정 속성만 꺼내는 문법
   - const email = req.body.email 과 동일

================================================================
