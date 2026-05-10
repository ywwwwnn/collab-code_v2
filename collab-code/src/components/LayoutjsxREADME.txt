================================================================
 파일명  : Layout.jsx
 위치    : src/components/Layout.jsx
 만든 이유: 대시보드/스니펫 페이지 공통 사이드바 레이아웃
================================================================

[ Layout.jsx ]

대시보드(/)와 스니펫(/snippets) 페이지는 같은 사이드바 레이아웃을 공유
해당 레이아웃을 각 페이지마다 반복해서 작성하면 코드 중복이 생기고,
추후에 사이드바를 수정할 경우 전체 페이지를 다 고쳐야하는 상황 발생
그래서 레이아웃을 별도 컴포넌트로 분리했어요.
사용할 때는: <Layout>{내용}</Layout>



[ 핵심 용어 설명 ]

▶ children
   - React에서 컴포넌트 안에 넣은 내용
   - <Layout><DashboardPage /></Layout> 에서
     Layout 입장에서는 DashboardPage가 children
   - {children}을 원하는 위치에 렌더링

▶ setInterval / clearInterval
   - setInterval(함수, 밀리초): 일정 간격으로 함수 반복 실행
   - clearInterval(id): 반복 실행 중단
   - 알림을 30초마다 자동 갱신하기 위해 사용
   - clearInterval은 컴포넌트 언마운트 시 반드시 호출 (메모리 누수 방지)

▶ document.addEventListener
   - 문서 전체에 이벤트 리스너 등록
   - 알림 드롭다운 외부 클릭 시 닫기 위해 사용
   - mousedown: 마우스 버튼을 누르는 순간 발생

▶ contains
   - notifRef.current.contains(e.target)
   - "e.target(클릭한 요소)이 notifRef 안에 있는가?" 확인
   - 알림 영역 밖을 클릭하면 false → 드롭다운 닫기

▶ JSON.parse
   - JSON.parse(localStorage.getItem('user'))
   - localStorage에 저장된 문자열을 다시 객체로 변환
   - JSON.stringify의 반대 동작

▶ 삼항 연산자
   - 조건 ? 참일때값 : 거짓일때값
   - user.name?.slice(0,1) || '?' 
   - 이름이 있으면 첫 글자, 없으면 '?' 표시 (아바타용)

================================================================
