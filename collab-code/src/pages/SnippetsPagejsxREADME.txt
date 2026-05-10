================================================================
 파일명  : SnippetsPage.jsx
 위치    : src/pages/SnippetsPage.jsx
 만든 이유: 저장된 코드 스니펫 검색/조회 화면
================================================================

[ SnippetsPage.jsx ]

에디터에서 저장한 코드 스니펫들을 모아서 볼 수 있는 "코드 저장소" 화면
언어 필터, 검색, 코드 미리보기, 복사 기능을 제공



[ 핵심 용어 설명 ]

▶ 디바운스 (Debounce)
   - 검색어를 입력할 때마다 API를 호출하면 서버 부하가 심함
   - 디바운스: 마지막 입력 후 일정 시간(300ms)이 지나야 API 호출
   - setTimeout + clearTimeout 조합으로 구현
   - 타이핑 중: 이전 타이머 취소 → 새 타이머 시작
   - 타이핑 멈춤 300ms 후: 실제 API 호출

▶ useEffect의 클린업으로 타이머 취소
   - return () => clearTimeout(timer)
   - 새 검색어 입력 시 이전 타이머 취소 (300ms 리셋)
   - search 또는 lang 바뀔 때마다 useEffect 재실행

▶ navigator.clipboard.writeText
   - 클립보드에 텍스트를 복사하는 브라우저 API
   - await navigator.clipboard.writeText(text)
   - HTTPS 또는 localhost에서만 동작

▶ 모달 열기/닫기
   - selected state: null이면 모달 닫힘, 스니펫 객체면 모달 열림
   - setSelected(snippet) → 모달 열기
   - setSelected(null) → 모달 닫기
   - 배경 클릭 시: e.target === e.currentTarget 체크로 배경 클릭 감지

================================================================
