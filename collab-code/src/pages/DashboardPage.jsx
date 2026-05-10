// ================================================================
// 파일명  : DashboardPage.jsx
// 위치    : src/pages/DashboardPage.jsx
// 역할    : 로그인 후 첫 화면 - 코드 리뷰 세션 목록 및 생성
//
// [쉬운 설명]
// 로그인하면 가장 먼저 보이는 화면
// 기존 코드 리뷰 세션들을 카드로 보여주고,
// 새 세션을 만드는 모달 창을 제공
// ================================================================

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout.jsx'  // 사이드바 레이아웃 컴포넌트

// 지원하는 프로그래밍 언어 목록
const LANGS = ['javascript', 'python', 'java', 'c', 'cpp', 'typescript', 'go', 'rust']

// 스타일 객체
const s = {
  page: { padding:'40px', maxWidth:1020, margin:'0 auto' },
  header: { marginBottom:36 },
  title: { fontSize:28, fontWeight:700, letterSpacing:'-0.5px', marginBottom:8, color:'var(--text-primary)' },
  subtitle: { color:'var(--text-secondary)', fontSize:15, lineHeight:1.6 },
  topRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  sectionTitle: { fontSize:16, fontWeight:700, color:'var(--text-primary)' },
  // 반응형 그리드: 최소 290px 칸들이 자동으로 채워짐
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:16, marginBottom:40 },
  sessionCard: { background:'var(--bg-surface)',position: 'relative', border:'1.5px solid var(--border)', borderRadius:14, padding:'22px 24px', cursor:'pointer', transition:'border-color 0.15s, box-shadow 0.15s', animation:'fadeIn 0.3s ease', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  sessionLang: { marginBottom:12 },
  sessionTitle: { fontSize:15, fontWeight:700, marginBottom:8, color:'var(--text-primary)' },
  sessionMeta: { color:'var(--text-muted)', fontSize:12, display:'flex', gap:12, alignItems:'center' },
  dot: { width:7, height:7, borderRadius:'50%', background:'var(--green)', display:'inline-block' },
  // 빈 상태: 세션이 없을 때 표시
  emptyState: { gridColumn:'1/-1', textAlign:'center', padding:'80px 20px', color:'var(--text-muted)', border:'2px dashed var(--border)', borderRadius:16, background:'var(--bg-surface)' },
  emptyIcon: { fontSize:40, marginBottom:14 },
  // 모달: 배경을 반투명하게 + 중앙에 박스
  modal: { position:'fixed', inset:0, zIndex:100, background:'rgba(26,26,46,0.4)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center' },
  modalBox: { background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:18, padding:'36px', width:440, animation:'fadeIn 0.2s ease', boxShadow:'0 8px 40px rgba(0,0,0,0.12)' },
  modalTitle: { fontSize:20, fontWeight:700, marginBottom:24, color:'var(--text-primary)' },
  field: { marginBottom:20 },
  label: { display:'block', fontSize:12, fontWeight:700, letterSpacing:'0.4px', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:8 },
  // 4열 언어 선택 그리드
  langGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 },
  // sel = selected (선택됨 여부에 따라 스타일 다름)
  langBtn: (sel) => ({ padding:'9px 4px', borderRadius:8, border:`1.5px solid ${sel?'var(--accent)':'var(--border)'}`, background:sel?'var(--accent-dim)':'#fff', color:sel?'var(--accent)':'var(--text-secondary)', fontSize:11, fontFamily:'var(--font-code)', cursor:'pointer', fontWeight:sel?700:400, transition:'all 0.12s' }),
  modalBtns: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:28 },
  // 통계 카드 3개 (전체 세션 수 등)
  stats: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginBottom:36 },
  statCard: { background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  statNum: { fontSize:32, fontWeight:700, fontFamily:'var(--font-code)', color:'var(--accent)' },
  statLabel: { fontSize:13, color:'var(--text-muted)', marginTop:4 },
  // 스니펫 삭제 버튼
  deleteBtn: {
    position: 'absolute', top: 12, right: 12,
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    fontSize: 16, padding: '2px 6px', borderRadius: 4,
    fontFamily: 'var(--font-ui)',
  },
}

export default function DashboardPage() {
  // 세션 목록 상태
  const [sessions, setSessions] = useState([])
  // 새 세션 만들기 모달 표시 여부
  const [showModal, setShowModal] = useState(false)
  // 새 세션 폼 데이터 (제목 + 언어)
  const [form, setForm] = useState({ title:'', language:'javascript' })
  // API 요청 중 여부 (버튼 비활성화용)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  // JWT 토큰 가져오기
  const token = localStorage.getItem('token')
  // API 요청 공통 헤더: 모든 요청에 토큰을 붙여서 인증 처리
  const headers = { Authorization: `Bearer ${token}` }

  // 컴포넌트 마운트 시 세션 목록 조회
  // [] = 빈 의존성 배열 → 처음 한 번만 실행
  useEffect(() => {
    axios.get('/api/sessions', { headers })
      .then(r => setSessions(r.data))   // 성공 시 state에 저장
      .catch(console.error)             // 실패 시 콘솔에 에러 출력
  }, [])

  // 새 세션 생성 함수
  const createSession = async () => {
    if (!form.title.trim()) return  // 제목 없으면 무시

    setLoading(true)
    try {
      // POST 요청으로 새 세션 생성
      const { data } = await axios.post('/api/sessions', form, { headers })

      // 세션 목록 앞에 새 세션 추가 (서버 재조회 없이 즉시 반영)
      // prev = 이전 배열, [data, ...prev] = 새 것을 앞에 추가
      setSessions(prev => [data, ...prev])

      setShowModal(false)                             // 모달 닫기
      setForm({ title:'', language:'javascript' })    // 폼 초기화
      navigate(`/editor/${data.id}`)                  // 생성된 세션으로 이동

    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // 언어별 색상 (카드에서 언어 태그 색상 표시용)
  const langColor = {
    javascript:'#f5a623', python:'#4ea8de', java:'#ff5f5f',
    typescript:'#4ea8de', c:'#9898a8', cpp:'#9898a8', go:'#3ddc84', rust:'#f5a623'
  }

  // 스니펫 삭제 버튼
  const deleteSession = async (e, sessionId) => {
    e.stopPropagation() // 카드 클릭 이벤트 막기
    if (!window.confirm('세션을 삭제할까요? 댓글도 전부 삭제됩니다.')) return
    try {
      await axios.delete(`/api/sessions/${sessionId}`, { headers })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (e) {
      alert('삭제 실패. 게시자만 삭제할 수 있습니다.')
    }
  }

  return (
    // Layout으로 감싸면 사이드바가 자동으로 붙음
    <Layout>
      <div style={s.page}>

        {/* 페이지 제목 */}
        <div style={s.header}>
          <h1 style={s.title}>대시보드</h1>
          <p style={s.subtitle}>코드 세션을 시작하거나 기존 세션에 참여하세요</p>
        </div>

        {/* 통계 카드 3개 */}
        <div style={s.stats}>
          {[
            { num: sessions.length, label:'전체 세션' },
            { num: sessions.filter(s => s.isActive).length, label:'활성 세션' },
            { num: '∞', label:'스니펫 가능' },
          ].map(({ num, label }) => (
            <div key={label} style={s.statCard}>
              <div style={s.statNum}>{num}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* 섹션 타이틀 + 새 세션 버튼 */}
        <div style={s.topRow}>
          <span style={s.sectionTitle}>코드 세션</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 새 세션</button>
        </div>

        {/* 세션 카드 그리드 */}
        <div style={s.grid}>
          {sessions.length === 0 ? (
            // 세션 없을 때 빈 상태 메시지
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>{'</>'}</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>세션이 없어요</div>
              <div style={{ fontSize:13 }}>새 세션을 만들어 코드 리뷰를 시작하세요</div>
            </div>
          ) : sessions.map(session => (
            <div
              key={session.id}
              style={s.sessionCard}
              onClick={() => navigate(`/editor/${session.id}`)}  // 카드 클릭 시 에디터로 이동
              // 마우스 올리면 테두리/배경 변경 (hover 효과)
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              {/* 언어 태그 */}
              <div style={s.sessionLang}>
                <span className="tag tag-lang" style={{ color: langColor[session.language] || 'var(--accent)' }}>
                  {session.language}
                </span>
              </div>
              {/* 삭제 버튼 - 관리자일 때만 표시 */}
              <button
                  style={s.deleteBtn}
                  onClick={(e) => deleteSession(e, session.id)}
              >
                ×
              </button>
              <div style={s.sessionMeta}>
                {/* 활성 세션이면 초록 점 + '활성' 표시 */}
                {session.isActive && <><span style={s.dot} />활성</>}
                <span>{new Date(session.createdAt).toLocaleDateString('ko-KR')}</span>
                <span>{session.participantCount || 0}명 참여</span>
              </div>
            </div>
          ))}
        </div>

        {/* 새 세션 모달 */}
        {showModal && (
          // 배경 클릭 시 모달 닫기
          // e.target === e.currentTarget: 배경 자체를 클릭했을 때만 (버블링 방지)
          <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={s.modalBox}>
              <div style={s.modalTitle}>새 코드 세션</div>

              {/* 세션 제목 입력 */}
              <div style={s.field}>
                <label style={s.label}>세션 제목</label>
                <input
                  className="input"
                  placeholder="예: 퀵소트 구현 리뷰"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus  // 모달 열리면 자동으로 포커스
                  onKeyDown={e => e.key === 'Enter' && createSession()}  // Enter로 생성
                />
              </div>

              {/* 언어 선택 */}
              <div style={s.field}>
                <label style={s.label}>언어</label>
                <div style={s.langGrid}>
                  {LANGS.map(lang => (
                    <button
                      key={lang}
                      style={s.langBtn(form.language === lang)}  // 선택된 언어 강조
                      onClick={() => setForm(f => ({ ...f, language: lang }))}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* 하단 버튼들 */}
              <div style={s.modalBtns}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>취소</button>
                <button className="btn btn-primary" onClick={createSession} disabled={loading}>
                  {loading ? '생성 중...' : '세션 만들기'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
