// ================================================================
// 파일명  : useSocket.js
// 위치    : src/hooks/useSocket.js
// 역할    : Socket.io 연결 로직을 감싸는 커스텀 훅
//
// [쉬운 설명]
// 소켓 연결을 시작하고, 방에 입장하고, 이벤트를 보내고 받는
// 복잡한 로직을 이 파일 하나로 관리
// EditorPage에서 useSocket(roomId) 한 줄이면 실시간 통신 준비 상태
// ================================================================

// useEffect: 마운트/언마운트 시 실행 (소켓 연결/해제)
// useRef: 리렌더링 없이 값 보관 (소켓 객체 저장용)
// useCallback: 함수 메모이제이션 (불필요한 함수 재생성 방지)
import { useEffect, useRef, useCallback } from 'react'

// socket.io-client: 브라우저에서 Socket.io 서버에 연결하는 클라이언트 라이브러리
import { io } from 'socket.io-client'

// useSocket 커스텀 훅
// roomId = 입장할 룸의 ID (세션 ID)
export function useSocket(roomId) {

  // socketRef: 소켓 객체를 저장하는 ref 상자
  // useRef(null): 초기값 null, 리렌더링 없이 값 유지
  // socketRef.current: 실제 소켓 객체에 접근
  const socketRef = useRef(null)

  // useEffect: 컴포넌트가 화면에 나타났을 때(마운트) 실행
  useEffect(() => {

    // localStorage에서 로그인 시 저장한 JWT 토큰 꺼냄
    const token = localStorage.getItem('token')

    // Socket.io 서버에 연결
    // 첫 번째 인자: 서버 주소
    // 두 번째 인자: 연결 옵션
      const socket = io('http://localhost:3000', {
      auth: { token },               // 연결 시 JWT 토큰 전달 (서버에서 인증에 사용)
      transports: ['websocket'],     // WebSocket만 사용 (polling 방식 비활성화로 더 빠름)
    })

    // 연결 성공 이벤트: 연결이 완료되면 roomId 방에 입장
    socket.on('connect', () => {
      // roomId가 있을 때만 입장 (에디터 페이지에서만 roomId가 전달됨)
      if (roomId) socket.emit('join-room', roomId)
    })

    // 만들어진 소켓을 ref에 저장
    // socketRef.current에 저장해야 다른 곳에서 socketRef.current.emit() 가능
    socketRef.current = socket

    // 클린업 함수: 컴포넌트가 사라질 때(언마운트) 실행
    // return () => { ... } = useEffect의 클린업
    return () => {
      if (roomId) socket.emit('leave-room', roomId)  // 방 퇴장 알림
      socket.disconnect()  // 소켓 연결 해제 (이거 없으면 연결이 계속 남아있음!)
    }

  }, [roomId])  // roomId가 바뀔 때마다 소켓 재연결

  // emit 함수: 서버에 이벤트(메시지) 보내기
  // useCallback으로 감싸서 컴포넌트 리렌더링 시 함수 재생성 방지
  const emit = useCallback((event, data) => {
    // ?. = optional chaining: 소켓이 아직 연결 안 됐으면 에러 없이 무시
    socketRef.current?.emit(event, data)
  }, [])  // 빈 배열: 한 번만 생성

  // on 함수: 서버에서 오는 이벤트 수신 등록
  // 반환값: 이 핸들러를 제거하는 함수 (메모리 누수 방지용)
  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler)  // 이벤트 핸들러 등록
    // 이 함수를 호출하면 핸들러 제거
    // EditorPage의 useEffect 클린업에서 호출됨
    return () => socketRef.current?.off(event, handler)
  }, [])

  // 외부에서 쓸 수 있게 emit, on, socket ref 반환
  return { emit, on, socket: socketRef }
}
