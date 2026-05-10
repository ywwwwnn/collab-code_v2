// ================================================================
// 파일명  : LoginPage.jsx
// 위치    : src/pages/LoginPage.jsx
// 역할    : 로그인 / 회원가입 화면
//
// [쉬운 설명]
// 서비스에 처음 들어오면 보이는 화면
// 로그인과 회원가입을 탭으로 나누어서 구성
// 회원가입은 @ks.ac.kr 경성대학교 이메일 인증이 필요하게 설계함.
// 이메일 회원가입은 3단계로 구성됨
// ================================================================

// React: UI를 만드는 라이브러리
// useState: 화면에 변화를 주는 상태값을 관리하는 훅
import React, { useState } from 'react'

// useNavigate: 다른 페이지로 이동하는 훅
// 예) navigate('/') → 대시보드로 이동
import { useNavigate } from 'react-router-dom'

// axios: 서버에 HTTP 요청을 보내는 라이브러리
// 예) axios.post('/api/auth/login', { studentId, password })
import axios from 'axios'

// ── 스타일 객체 ──────────────────────────────────────────────────
// React에서 CSS 스타일을 JavaScript 객체로 작성하는 방식
// 이렇게 하면 컴포넌트와 스타일이 한 파일에 있어서 관리가 편함
const s = {
  // 전체 페이지 레이아웃: 중앙 정렬, 전체 높이
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', position:'relative', overflow:'hidden' },
  // 배경 격자무늬 패턴
  grid: { position:'absolute', inset:0, backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize:'48px 48px', opacity:0.6 },
  // 배경 보라색 글로우 효과
  glow: { position:'absolute', width:600, height:600, background:'radial-gradient(circle,rgba(108,92,231,0.08) 0%,transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' },
  // 로그인 카드 박스
  card: { position:'relative', zIndex:1, width:460, background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:20, padding:'48px', boxShadow:'0 4px 32px rgba(0,0,0,0.08)', animation:'fadeIn 0.4s ease' },
  // 로고 영역
  logo: { display:'flex', alignItems:'center', gap:12, marginBottom:36 },
  logoMark: { width:40, height:40, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-code)', fontWeight:700, fontSize:16, color:'#fff' },
  logoText: { fontFamily:'var(--font-code)', fontWeight:700, fontSize:18, color:'var(--text-primary)', letterSpacing:'-0.5px' },
  logoSub: { fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-code)', marginTop:2 },
  // 제목/부제
  heading: { fontSize:24, fontWeight:700, marginBottom:6, letterSpacing:'-0.5px', color:'var(--text-primary)' },
  subtext: { color:'var(--text-secondary)', fontSize:14, marginBottom:28, lineHeight:1.6 },
  // 탭 (로그인/회원가입 전환)
  tabs: { display:'flex', background:'var(--bg-elevated)', borderRadius:10, padding:4, marginBottom:28, border:'1px solid var(--border)' },
  // a = active(활성화 여부), 활성화 탭은 흰 배경 + 보라색 텍스트
  tab: (a) => ({ flex:1, padding:'9px 0', borderRadius:7, border:'none', background:a?'#fff':'transparent', color:a?'var(--accent)':'var(--text-muted)', fontWeight:a?700:400, fontSize:13, transition:'all 0.15s', boxShadow:a?'0 1px 4px rgba(0,0,0,0.08)':'none', cursor:'pointer', fontFamily:'var(--font-ui)' }),
  // 입력 필드 묶음
  field: { marginBottom:18 },
  label: { display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:8, letterSpacing:'0.4px', textTransform:'uppercase' },
  // 에러 메시지 박스 (빨간색)
  error: { background:'rgba(231,76,60,0.07)', border:'1px solid rgba(231,76,60,0.25)', borderRadius:10, padding:'12px 16px', color:'var(--red)', fontSize:13, marginBottom:18 },
  // 성공 메시지 박스 (초록색)
  success: { background:'rgba(0,184,148,0.07)', border:'1px solid rgba(0,184,148,0.3)', borderRadius:10, padding:'12px 16px', color:'var(--green)', fontSize:13, marginBottom:18 },
  // 제출 버튼 (전체 너비)
  submitBtn: { width:'100%', padding:'13px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', transition:'background 0.15s', marginTop:8, fontFamily:'var(--font-ui)' },
  // 코드 입력 + 발송 버튼이 나란히 있는 행
  codeRow: { display:'flex', gap:8 },
  sendBtn: { padding:'11px 16px', background:'var(--bg-elevated)', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, fontWeight:600, color:'var(--accent)', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'var(--font-ui)', flexShrink:0 },
  // 이메일 인증 완료 뱃지
  verifiedBadge: { display:'inline-flex', alignItems:'center', gap:4, background:'rgba(0,184,148,0.1)', border:'1px solid rgba(0,184,148,0.3)', borderRadius:6, padding:'4px 10px', fontSize:12, color:'var(--green)', fontWeight:600, marginTop:6 },
  footer: { marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)', textAlign:'center', color:'var(--text-muted)', fontSize:12, lineHeight:1.6 },
}

// LoginPage 컴포넌트
// default export: 이 파일을 import할 때 기본으로 가져오는 것
export default function LoginPage() {

  // mode: 현재 탭 ('login' 또는 'register')
  const [mode, setMode] = useState('login')

  // form: 입력 폼의 모든 값을 하나의 객체로 관리
  const [form, setForm] = useState({ studentId:'', name:'', password:'', email:'', code:'' })

  // step: 회원가입 단계
  // 'form'  → 이메일 입력 단계
  // 'code'  → 코드 입력 단계 (발송 후)
  // 'done'  → 인증 완료 단계
  const [step, setStep] = useState('form')

  // loading: API 요청 중인지 여부 (버튼 비활성화 + 텍스트 변경에 사용)
  const [loading, setLoading] = useState(false)

  // error: 에러 메시지 (빨간 박스에 표시)
  const [error, setError] = useState('')

  // success: 성공 메시지 (초록 박스에 표시)
  const [success, setSuccess] = useState('')

  // useNavigate: 페이지 이동 함수 (뒤로가기 없이 이동)
  const navigate = useNavigate()

  // 폼 필드 변경 핸들러 생성 함수
  // k = 필드 이름 (예: 'email', 'password')
  // e = 이벤트 객체 (e.target.value = 입력된 값)
  // 스프레드 연산자 ...f: 기존 form 값을 유지하면서 k 필드만 새 값으로 교체
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // 이메일 인증 코드 발송
  const sendCode = async () => {
    if (!form.email) return setError('이메일을 입력하세요')
    setError(''); setLoading(true)

    try {
      // 서버에 코드 발송 요청
      // /api/auth/send-code → vite proxy가 http://localhost:3000/api/auth/send-code 로 전달
      await axios.post('/api/auth/send-code', { email: form.email })

      // 성공 시 다음 단계로
      setStep('code')
      setSuccess('인증 코드를 발송했습니다. 이메일을 확인해주세요.')

    } catch (e) {
      // e.response?.data?.error = 서버가 보낸 에러 메시지
      // ?: optional chaining: response가 없어도 에러 없이 undefined 반환
      setError(e.response?.data?.error || '발송 실패')
    } finally {
      // finally: 성공이든 실패든 반드시 실행
      setLoading(false)
    }
  }

  // 인증 코드 검증
  const verifyCode = async () => {
    if (!form.code) return setError('코드를 입력하세요')
    setError(''); setLoading(true)

    try {
      await axios.post('/api/auth/verify-code', { email: form.email, code: form.code })
      setStep('done')        // 인증 완료 단계로
      setSuccess('이메일 인증이 완료되었습니다!')
    } catch (e) {
      setError(e.response?.data?.error || '인증 실패')
    } finally {
      setLoading(false)
    }
  }

  // 폼 제출 (로그인 또는 회원가입)
  // e = 폼 submit 이벤트 객체
  const submit = async e => {
    e.preventDefault()  // 폼 기본 동작(페이지 새로고침) 막기
    setError(''); setLoading(true)

    try {
      if (mode === 'login') {
        // 로그인 API 호출
        const { data } = await axios.post('/api/auth/login', {
          studentId: form.studentId,
          password: form.password
        })
        // 서버에서 받은 JWT 토큰을 브라우저 localStorage에 저장
        // 이후 모든 API 요청 헤더에 이 토큰을 붙여서 보냄
        localStorage.setItem('token', data.token)
        // 유저 정보도 저장 (사이드바 이름 표시 등에 사용)
        // JSON.stringify: 객체를 문자열로 변환 (localStorage는 문자열만 저장 가능)
        localStorage.setItem('user', JSON.stringify(data.user))
        // 대시보드로 이동
        navigate('/')

      } else {
        // 이메일 인증이 완료된 상태인지 확인
        if (step !== 'done') return setError('이메일 인증을 완료해주세요')

        // 회원가입 API 호출
        const { data } = await axios.post('/api/auth/register', form)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/')
      }

    } catch (e) {
      setError(e.response?.data?.error || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // ── JSX 반환: 실제 화면을 그리는 부분 ───────────────────────────
  return (
    <div style={s.page}>
      {/* 배경 효과들 (시각적 장식) */}
      <div style={s.grid} />
      <div style={s.glow} />

      {/* 로그인 카드 */}
      <div style={s.card}>

        {/* 로고 */}
        <div style={s.logo}>
          <div style={s.logoMark}>{'{}'}</div>
          <div>
            <div style={s.logoText}>CodeCollab</div>
            <div style={s.logoSub}>경성대학교 전용 코드 리뷰 플랫폼</div>
          </div>
        </div>

        {/* 제목 */}
        <h1 style={s.heading}>{mode === 'login' ? '로그인' : '회원가입'}</h1>
        <p style={s.subtext}>{mode === 'login' ? '학번과 비밀번호를 입력하세요' : '@ks.ac.kr 이메일 인증 후 가입 가능합니다'}</p>

        {/* 탭: 로그인 / 회원가입 전환 */}
        <div style={s.tabs}>
          {/* 탭 클릭 시 mode 변경 + 에러/성공 메시지 초기화 */}
          <button style={s.tab(mode==='login')} onClick={() => { setMode('login'); setError(''); setSuccess(''); setStep('form') }}>로그인</button>
          <button style={s.tab(mode==='register')} onClick={() => { setMode('register'); setError(''); setSuccess(''); setStep('form') }}>회원가입</button>
        </div>

        {/* 폼 */}
        <form onSubmit={submit}>
          {/* 에러 메시지: error가 있을 때만 표시 */}
          {error && <div style={s.error}>{error}</div>}
          {/* 성공 메시지: success가 있을 때만 표시 */}
          {success && <div style={s.success}>{success}</div>}

          {/* 회원가입 전용 필드들 */}
          {mode === 'register' && (
            <>
              {/* 이메일 입력 + 코드 발송 버튼 */}
              <div style={s.field}>
                <label style={s.label}>경성대 이메일</label>
                <div style={s.codeRow}>
                  {/* step이 'form'이 아니면 이메일 수정 불가 (disabled) */}
                  <input className="input" placeholder="학번@ks.ac.kr" value={form.email} onChange={set('email')} disabled={step !== 'form'} />
                  {/* step이 'form'일 때만 발송 버튼 표시 */}
                  {step === 'form' && <button type="button" style={s.sendBtn} onClick={sendCode} disabled={loading}>코드 발송</button>}
                </div>
                {/* 인증 완료 뱃지: step이 'done'일 때만 표시 */}
                {step === 'done' && <div style={s.verifiedBadge}>✓ 인증 완료</div>}
              </div>

              {/* 코드 입력 단계: step이 'code'일 때만 표시 */}
              {step === 'code' && (
                <div style={s.field}>
                  <label style={s.label}>인증 코드 (6자리)</label>
                  <div style={s.codeRow}>
                    <input className="input" placeholder="123456" value={form.code} onChange={set('code')} maxLength={6} />
                    <button type="button" style={s.sendBtn} onClick={verifyCode} disabled={loading}>확인</button>
                  </div>
                </div>
              )}

              {/* 이름 입력 */}
              <div style={s.field}>
                <label style={s.label}>이름</label>
                <input className="input" placeholder="홍길동" value={form.name} onChange={set('name')} required />
              </div>
            </>
          )}

          {/* 공통 필드: 학번 */}
          <div style={s.field}>
            <label style={s.label}>학번</label>
            <input className="input" placeholder="20231234" value={form.studentId} onChange={set('studentId')} required />
          </div>

          {/* 공통 필드: 비밀번호 */}
          <div style={s.field}>
            <label style={s.label}>비밀번호</label>
            {/* type="password": 입력값이 점으로 가려짐 */}
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>

          {/* 제출 버튼: loading 중이면 비활성화 + 텍스트 변경 */}
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        <div style={s.footer}>경성대학교 컴퓨터공학과 전용 · @ks.ac.kr 이메일 필수</div>
      </div>
    </div>
  )
}
