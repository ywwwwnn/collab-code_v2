// ================================================================
// 파일명  : SnippetsPage.jsx
// 위치    : src/pages/SnippetsPage.jsx
// 역할    : 저장된 코드 스니펫 검색/조회 화면
//
// [쉬운 설명]
// 에디터에서 저장한 코드들을 모아서 볼 수 있는 "코드 저장소" 화면이에요.
// 언어 필터, 검색어 입력, 코드 미리보기, 코드 복사 기능이 있어요.
// ================================================================

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout.jsx'

const user = JSON.parse(localStorage.getItem('user') || '{}')

// 언어 필터 목록 ('전체'는 필터 없음)
const LANGS = ['전체', 'javascript', 'python', 'java', 'typescript', 'c', 'cpp', 'go', 'rust']

const s = {
  page: { padding:32, maxWidth:1100, margin:'0 auto' },
  header: { marginBottom:28 },
  title: { fontSize:26, fontWeight:700, letterSpacing:'-0.5px', marginBottom:6 },
  subtitle: { color:'var(--text-secondary)', fontSize:14 },
  controls: { display:'flex', gap:10, marginBottom:24, alignItems:'center' },
  searchWrap: { flex:1, position:'relative' },
  searchIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:14 },
  searchInput: { paddingLeft:34 },  // 아이콘 공간 확보
  // 언어 필터 바 (가로 스크롤 가능)
  langBar: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  langBtn: (active) => ({ padding:'5px 12px', borderRadius:6, border:`1px solid ${active?'var(--accent)':'var(--border)'}`, background:active?'var(--accent-dim)':'var(--bg-elevated)', color:active?'var(--accent)':'var(--text-secondary)', fontSize:12, fontFamily:'var(--font-code)', cursor:'pointer', fontWeight:active?700:400, transition:'all 0.12s' }),
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14 },
  card: { background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'border-color 0.15s, transform 0.15s', animation:'fadeIn 0.3s ease' },
  cardTop: { padding:'16px 16px 12px' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 },
  cardTitle: { fontSize:14, fontWeight:600, lineHeight:1.3 },
  cardAuthor: { fontSize:11, color:'var(--text-muted)', marginTop:4 },
  // 코드 미리보기: 어두운 배경의 모노스페이스 텍스트
  codePreview: { background:'var(--bg-base)', borderTop:'1px solid var(--border)', padding:'10px 16px', fontFamily:'var(--font-code)', fontSize:11, color:'var(--text-secondary)', lineHeight:1.6, maxHeight:100, overflow:'hidden', whiteSpace:'pre' },
  cardFooter: { padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' },
  // 스니펫 상세 모달
  modal: { position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
  modalBox: { background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:16, width:'100%', maxWidth:720, maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'fadeIn 0.2s ease' },
  modalHeader: { padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  modalTitle: { fontSize:18, fontWeight:700 },
  closeBtn: { background:'transparent', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-secondary)', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:18 },
  modalMeta: { padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:10, flexWrap:'wrap' },
  // 코드 블록: 스크롤 가능한 어두운 배경
  codeBlock: { flex:1, overflow:'auto', background:'var(--bg-base)', margin:0, padding:'20px 24px', fontFamily:'var(--font-code)', fontSize:13, color:'var(--text-primary)', lineHeight:1.7, whiteSpace:'pre' },
  modalFooter: { padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  emptyState: { gridColumn:'1/-1', textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' },
}

export default function SnippetsPage() {
  // 스니펫 목록
  const [snippets, setSnippets] = useState([])
  // 검색어
  const [search, setSearch] = useState('')
  // 선택된 언어 필터 ('전체' = 필터 없음)
  const [lang, setLang] = useState('전체')
  // 클릭한 스니펫 (모달에 표시): null이면 모달 닫힘
  const [selected, setSelected] = useState(null)
  // 복사 완료 여부 (버튼 텍스트 변경용)
  const [copied, setCopied] = useState(false)
  // 데이터 로딩 중 여부
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  // 스니펫 삭제 버튼
  const deleteSnippet = async (e, snippetId) => {
    e.stopPropagation()
    if (!window.confirm('스니펫을 삭제할까요?')) return
    try {
      await axios.delete(`/api/snippets/${snippetId}`, { headers })
      setSnippets(prev => prev.filter(s => s.id !== snippetId))
      if (selected?.id === snippetId) setSelected(null)
    } catch (e) {
      alert('삭제 실패. 본인 스니펫만 삭제할 수 있습니다.')
    }
  }

  // search 또는 lang이 바뀔 때마다 API 호출
  useEffect(() => {
    setLoading(true)

    // 쿼리 파라미터 구성
    const params = {}
    if (lang !== '전체') params.language = lang  // 언어 필터
    if (search) params.search = search            // 검색어

    // 디바운스: 타이핑 멈춘 후 300ms 뒤에 API 호출
    // 타이핑 중에 매번 호출하면 서버 부하가 심함
    const timer = setTimeout(() => {
      axios.get('/api/snippets', { headers, params })
        .then(r => setSnippets(r.data))
        .catch(() => setSnippets([]))
        .finally(() => setLoading(false))
    }, 300)

    // 클린업: 다음 useEffect 실행 전에 이전 타이머 취소
    // 빠르게 타이핑 중이면 타이머가 계속 리셋되어 API 호출 횟수 줄임
    return () => clearTimeout(timer)

  }, [search, lang])  // 이 두 값이 바뀔 때마다 실행

  // 코드 클립보드 복사
  const copyCode = async () => {
    if (!selected) return

    // navigator.clipboard.writeText: 브라우저 클립보드에 텍스트 복사
    // HTTPS 또는 localhost에서만 동작
    await navigator.clipboard.writeText(selected.code)

    setCopied(true)
    // 2초 후 버튼 텍스트 원복
    setTimeout(() => setCopied(false), 2000)
  }

  // 날짜 포맷: "2024년 3월 25일" 형태
  const formatDate = iso => new Date(iso).toLocaleDateString('ko-KR', {
    year:'numeric', month:'short', day:'numeric'
  })

  return (
    <Layout>
      <div style={s.page}>

        <div style={s.header}>
          <h1 style={s.title}>스니펫 저장소</h1>
          <p style={s.subtitle}>학과 구성원이 공유한 코드 스니펫 모음</p>
        </div>

        {/* 검색 입력창 */}
        <div style={s.controls}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>⌕</span>  {/* 검색 아이콘 */}
            <input
              className="input"
              style={s.searchInput}
              placeholder="제목, 태그, 코드 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* 언어 필터 버튼들 */}
        <div style={s.langBar}>
          {LANGS.map(l => (
            <button
              key={l}
              style={s.langBtn(lang === l)}          // 선택된 언어 강조
              onClick={() => setLang(l)}              // 클릭 시 필터 변경
            >
              {l}
            </button>
          ))}
        </div>

        {/* 로딩 중 표시 */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>
            불러오는 중...
          </div>
        ) : (
          <div style={s.grid}>
            {snippets.length === 0 ? (
              // 결과 없을 때
              <div style={s.emptyState}>
                <div style={{ fontSize:32, marginBottom:12 }}>◈</div>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:6, color:'var(--text-secondary)' }}>
                  스니펫이 없어요
                </div>
                <div style={{ fontSize:13 }}>에디터에서 코드를 저장하면 여기에 나타납니다</div>
              </div>
            ) : snippets.map(snippet => (
              <div
                key={snippet.id}
                style={s.card}
                onClick={() => setSelected(snippet)}  // 클릭 시 모달 열기
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={s.cardTop}>
                  <div style={s.cardHeader}>
                    <div>
                      <div style={s.cardTitle}>{snippet.title}</div>
                      <div style={s.cardAuthor}>by {snippet.author?.name || '익명'} · {formatDate(snippet.createdAt)}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span className="tag tag-lang">{snippet.language}</span>
                      {/* 본인 스니펫만 삭제 버튼 표시 */}
                      {snippet.author_id === user?.id && (
                          <button
                              style={{ background:'transparent', border:'none', color:'var(--red)', cursor:'pointer', fontSize:16, padding:'2px 6px', fontFamily:'var(--font-ui)' }}
                              onClick={(e) => deleteSnippet(e, snippet.id)}
                          >
                            ×
                          </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* 코드 첫 200자 미리보기 */}
                <div style={s.codePreview}>{snippet.code?.slice(0, 200)}</div>
                {/* 태그들 (있을 때만 표시) */}
                {snippet.tags?.length > 0 && (
                  <div style={s.cardFooter}>
                    {snippet.tags.map(t => <span key={t} className="tag tag-label">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 스니펫 상세 모달 */}
      {/* selected가 null이 아닐 때만 렌더링 */}
      {selected && (
        // 배경 클릭 시 모달 닫기
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={s.modalBox}>

            {/* 모달 헤더 */}
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>{selected.title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                  by {selected.author?.name || '익명'} · {formatDate(selected.createdAt)}
                </div>
              </div>
              {/* × 버튼: 모달 닫기 */}
              <button style={s.closeBtn} onClick={() => setSelected(null)}>×</button>
            </div>

            {/* 언어 + 태그 */}
            <div style={s.modalMeta}>
              <span className="tag tag-lang">{selected.language}</span>
              {selected.tags?.map(t => <span key={t} className="tag tag-label">{t}</span>)}
            </div>

            {/* 전체 코드 (스크롤 가능) */}
            {/* pre 태그: 공백과 줄바꿈을 그대로 표시 */}
            <pre style={s.codeBlock}>{selected.code}</pre>

            {/* 모달 하단 */}
            <div style={s.modalFooter}>
              {/* 총 줄 수 */}
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                {selected.code?.split('\n').length}줄
              </span>
              {/* 복사 버튼: 복사 후 2초간 "복사됨!" 표시 */}
              <button className="btn btn-primary" onClick={copyCode}>
                {copied ? '복사됨!' : '코드 복사'}
              </button>
            </div>

          </div>
        </div>
      )}
    </Layout>
  )
}
