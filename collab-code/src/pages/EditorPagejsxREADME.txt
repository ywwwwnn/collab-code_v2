================================================================
 파일명  : EditorPage.jsx
 위치    : src/pages/EditorPage.jsx
 만든 이유: 실시간 코드 에디터 화면 (프로젝트 핵심 페이지)
================================================================

[ EditorPage.jsx ]

이 프로젝트의 가장 핵심 기능인 "실시간 코드 리뷰"를 담당
Monaco 에디터 + Socket.io 실시간 동기화 + 권한 관리 +
댓글(@멘션) + 스니펫 저장이 모두 이 하나의 파일에 있음



[ 핵심 용어 설명 ]

▶ Monaco Editor
   - VS Code에서 사용하는 코드 에디터 엔진
   - @monaco-editor/react 패키지로 React에 통합
   - 언어별 문법 강조, 자동완성 등 VS Code와 동일한 기능 제공
   - readOnly: true 옵션으로 읽기 전용 모드 설정 가능

▶ useParams
   - React Router 훅: URL의 동적 파라미터를 꺼내는 함수
   - /editor/abc123 에서 roomId = 'abc123'
   - const { roomId } = useParams()

▶ Promise.all
   - 여러 개의 비동기 작업을 동시에 실행하고 모두 완료될 때까지 기다림
   - 순차 실행보다 훨씬 빠름
   - Promise.all([작업1, 작업2, 작업3]) → 3개 동시 실행

▶ useRef (isRemoteChange)
   - 원격에서 온 코드 변경인지 표시하는 플래그
   - 이게 없으면 무한 루프 발생:
     A 입력 → 서버 → B 화면 업데이트 → B의 onChange 발동 → 서버 → A 업데이트...
   - isRemoteChange.current = true로 표시하면
     handleCodeChange에서 재전송하지 않고 무시함

▶ 정규식 (/@(\S*)$/)
   - 문자열에서 특정 패턴을 찾는 표현식
   - @ = @ 문자 그대로
   - \S* = 공백이 아닌 문자 0개 이상
   - $ = 문자열 끝
   - 사용 목적: 댓글 입력 중 커서 위치 바로 앞의 @단어 찾기

▶ readOnly: !canEdit
   - Monaco 에디터 옵션
   - canEdit이 false면 !canEdit = true → readOnly 모드
   - 권한 없는 사람은 에디터가 잠김 (입력 불가)

▶ useCallback
   - 함수를 메모이제이션해서 불필요한 재생성 방지
   - 에디터 onChange에 매번 새 함수가 전달되면 에디터가 깜빡임
   - useCallback으로 감싸면 의존성이 안 바뀌는 한 같은 함수 유지



[ 코드 흐름 ]

[페이지 로드 시]
1. useParams로 URL에서 roomId 추출
2. useSocket(roomId)로 소켓 연결 + 룸 입장
3. Promise.all로 세션 정보, 댓글, 내 권한을 동시 조회
4. 결과를 각 state에 저장

[코드 입력 시]
1. Monaco onChange 이벤트 발생
2. isRemoteChange.current가 true면 무시 (원격 변경이었음)
3. 로컬 state 업데이트 (setCode)
4. 소켓으로 code-change 이벤트 emit

[다른 사람 코드 변경 수신 시]
1. 소켓 code-update 이벤트 수신
2. isRemoteChange.current = true 설정
3. setCode로 에디터 내용 업데이트
4. (handleCodeChange에서 isRemoteChange를 보고 재전송 안 함)

[댓글 입력 시 @입력]
1. handleCommentChange 호출
2. 정규식으로 현재 @단어 감지
3. 참여자 목록 필터링해서 드롭다운 표시
4. 드롭다운에서 선택하면 @이름 자동 삽입

================================================================
