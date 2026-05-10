// ================================================================
// 파일명  : EditorPage.jsx
// 위치    : src/pages/EditorPage.jsx
// 역할    : 실시간 코드 에디터 화면 (프로젝트 핵심 페이지)
// ================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import { useSocket } from '../hooks/useSocket.js'

const LANG_MAP = {
  javascript: 'javascript', python: 'python', java: 'java', c: 'c',
  cpp: 'cpp', typescript: 'typescript', go: 'go', rust: 'rust'
}

const USER_COLORS = ['#7c6af7','#3ddc84','#f5a623','#4ea8de','#ff5f5f','#e879f9']

// 언어별 기본 코드
const DEFAULT_CODE = {
  javascript: '// 코드를 입력하세요\n',
  python: '# 코드를 입력하세요\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // 코드를 입력하세요\n    }\n}',
  c: '#include <stdio.h>\n\nint main() {\n    // 코드를 입력하세요\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // 코드를 입력하세요\n    return 0;\n}',
  typescript: '// 코드를 입력하세요\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // 코드를 입력하세요\n}',
  rust: 'fn main() {\n    // 코드를 입력하세요\n}',
}

const s = {
  page: { display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg-base)' },
  topbar: { height:50, flexShrink:0, background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, padding:'0 16px' },
  backBtn: { background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:18, padding:'0 4px', fontFamily:'var(--font-ui)' },
  divider: { width:1, height:20, background:'var(--border)' },
  sessionTitle: { fontWeight:700, fontSize:14 },
  spacer: { flex:1 },
  avatarRow: { display:'flex', marginRight:8 },
  avatar: (c) => ({ width:28, height:28, borderRadius:'50%', background:c+'33', border:`2px solid ${c}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:c, marginLeft:-6 }),
  permBadge: (can) => ({ fontSize:11, padding:'3px 10px', borderRadius:6, background:can?'rgba(0,184,148,0.1)':'rgba(231,76,60,0.1)', color:can?'var(--green)':'var(--red)', fontWeight:600, border:`1px solid ${can?'rgba(0,184,148,0.3)':'rgba(231,76,60,0.3)'}` }),
  body: { flex:1, display:'flex', overflow:'hidden' },
  editorWrap: { flex:1, position:'relative', overflow:'hidden' },
  statusBar: { position:'absolute', top:10, right:10, zIndex:10, display:'flex', alignItems:'center', gap:6, background:'var(--bg-surface)', borderRadius:6, border:'1px solid var(--border)', padding:'4px 10px', fontSize:11, color:'var(--text-secondary)' },
  statusDot: (c) => ({ width:7, height:7, borderRadius:'50%', background:c?'var(--green)':'var(--red)', animation:c?'pulse 2s infinite':'none' }),
  permDeniedBar: { position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', background:'rgba(231,76,60,0.9)', color:'#fff', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:600, zIndex:20, animation:'fadeIn 0.2s ease' },
  sidebar: { width:340, flexShrink:0, background:'var(--bg-surface)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column' },
  tabs: { display:'flex', borderBottom:'1px solid var(--border)' },
  tab: (a) => ({ flex:1, padding:'11px 0', border:'none', background:'transparent', borderBottom:a?'2px solid var(--accent)':'2px solid transparent', color:a?'var(--text-primary)':'var(--text-secondary)', fontWeight:a?600:400, fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)' }),
  panel: { flex:1, overflow:'auto', padding:12 },
  commentCard: { background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:12, marginBottom:8, animation:'fadeIn 0.2s ease' },
  commentHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  commentAuthor: { fontSize:12, fontWeight:600 },
  commentLine: { fontSize:10, color:'var(--accent)', fontFamily:'var(--font-code)' },
  commentBody: { fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 },
  commentTime: { fontSize:10, color:'var(--text-muted)', marginTop:6 },
  inputArea: { borderTop:'1px solid var(--border)', padding:12 },
  lineRow: { display:'flex', gap:6, marginBottom:8, alignItems:'center' },
  lineLabel: { fontSize:11, color:'var(--text-secondary)', whiteSpace:'nowrap' },
  lineInput: { width:60, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-primary)', fontSize:12, padding:'5px 8px', outline:'none', fontFamily:'var(--font-code)' },
  textarea: { width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-primary)', fontSize:12, padding:'8px 10px', outline:'none', resize:'none', fontFamily:'var(--font-ui)', lineHeight:1.5 },
  mentionDropdown: { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:8, marginBottom:6, overflow:'hidden' },
  mentionItem: { padding:'8px 12px', fontSize:12, cursor:'pointer', display:'flex', gap:8, alignItems:'center', borderBottom:'1px solid var(--border)' },
  submitBtn: { width:'100%', marginTop:8, padding:'9px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-ui)' },
  permPanel: { padding:12 },
  permTitle: { fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text-primary)' },
  permRow: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' },
  permName: { fontSize:13, fontWeight:600 },
  permId: { fontSize:11, color:'var(--text-muted)' },
  toggle: (on) => ({ width:44, height:24, borderRadius:12, background:on?'var(--accent)':'var(--border-mid)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }),
  toggleThumb: (on) => ({ position:'absolute', top:2, left:on?20:2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }),
  snipPanel: { flex:1, overflow:'auto', padding:12 },
  snipCard: { background:'var(--bg-elevated)', borderRadius:8, padding:14 },
  snipField: { marginBottom:12 },
  snipLabel: { display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:6 },
  tagWrap: { display:'flex', gap:6, flexWrap:'wrap', marginTop:6 },
  tagPill: { display:'inline-flex', alignItems:'center', gap:4, background:'var(--accent-dim)', color:'var(--accent)', borderRadius:4, padding:'2px 8px', fontSize:11, fontFamily:'var(--font-code)' },
  emptyState: { textAlign:'center', color:'var(--text-muted)', padding:'40px 20px', fontSize:13 },
}

export default function EditorPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { emit, on } = useSocket(roomId)

  const [session, setSession] = useState(null)
  const [code, setCode] = useState('// 코드를 입력하세요\n')
  const [comments, setComments] = useState([])
  const [participants, setParticipants] = useState([])
  const [connected, setConnected] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [permDenied, setPermDenied] = useState(false)
  const [sideTab, setSideTab] = useState('comments')
  const [members, setMembers] = useState([])
  const [output, setOutput] = useState('')
  const [runLoading, setRunLoading] = useState(false)
  const [commentForm, setCommentForm] = useState({ lineNumber:'', content:'' })
  const [mentionUsers, setMentionUsers] = useState([])
  const [showMention, setShowMention] = useState(false)
  const [snippetForm, setSnippetForm] = useState({ title:'', tags:[], tagInput:'' })

  const isRemoteChange = useRef(false)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ── 초기 데이터 로드 ────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get(`/api/sessions/${roomId}`, { headers }),
      axios.get(`/api/sessions/${roomId}/comments`, { headers }),
      axios.get(`/api/permissions/${roomId}`, { headers }),
    ]).then(([sRes, cRes, pRes]) => {
      setSession(sRes.data)
      setCode(sRes.data.code || DEFAULT_CODE[sRes.data.language] || '// 코드를 입력하세요\n')
      setComments(cRes.data)
      setCanEdit(pRes.data.canEdit)
      setIsOwner(pRes.data.isOwner)
      if (pRes.data.isOwner) fetchMembers()
    }).catch(() => navigate('/'))
  }, [roomId])

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`/api/permissions/${roomId}/members`, { headers })
      setMembers(res.data)
    } catch (e) {}
  }

  // ── 소켓 이벤트 수신 ────────────────────────────────────────
  useEffect(() => {
    const offs = [
      on('connect', () => setConnected(true)),
      on('disconnect', () => setConnected(false)),
      on('code-update', ({ code: c }) => {
        isRemoteChange.current = true
        setCode(c)
      }),
      on('participants-update', list => setParticipants(list)),
      on('new-comment', c => setComments(p => [c, ...p])),
      on('permission-denied', () => {
        setPermDenied(true)
        setTimeout(() => setPermDenied(false), 3000)
      }),
    ]
    return () => offs.forEach(f => f?.())
  }, [on])

  // ── 코드 변경 핸들러 ────────────────────────────────────────
  const handleCodeChange = useCallback(val => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false
      return
    }
    setCode(val)
    emit('code-change', { roomId, code: val })
  }, [emit, roomId])

  // ── @멘션 자동완성 ──────────────────────────────────────────
  const handleCommentChange = async (e) => {
    const val = e.target.value
    setCommentForm(f => ({ ...f, content: val }))
    const match = val.match(/@(\S*)$/)
    if (match && match[1].length >= 1) {
      const keyword = match[1].toLowerCase()
      const filtered = participants.filter(p =>
          p.name?.toLowerCase().includes(keyword) ||
          (p.studentId || p.student_id)?.includes(keyword)
      )
      setMentionUsers(filtered.slice(0, 5))
      setShowMention(filtered.length > 0)
    } else {
      setShowMention(false)
    }
  }

  const insertMention = (name) => {
    const val = commentForm.content.replace(/@(\S*)$/, `@${name} `)
    setCommentForm(f => ({ ...f, content: val }))
    setShowMention(false)
  }

  // ── 댓글 등록 ───────────────────────────────────────────────
  const submitComment = async () => {
    if (!commentForm.content.trim()) return
    try {
      const { data } = await axios.post(
          `/api/sessions/${roomId}/comments`,
          { lineNumber: parseInt(commentForm.lineNumber) || null, content: commentForm.content },
          { headers }
      )
      emit('comment', { roomId, comment: data })
      setComments(p => [data, ...p])
      setCommentForm({ lineNumber:'', content:'' })
    } catch (e) {}
  }

  // ── 권한 토글 ───────────────────────────────────────────────
  const togglePermission = async (memberId, currentCanEdit) => {
    try {
      await axios.patch(`/api/permissions/${roomId}`, { targetUserId: memberId, canEdit: !currentCanEdit }, { headers })
      setMembers(m => m.map(x => x.id === memberId ? { ...x, can_edit: !currentCanEdit } : x))
    } catch (e) {}
  }

  // ── 스니펫 저장 ─────────────────────────────────────────────
  const saveSnippet = async () => {
    if (!snippetForm.title.trim()) return
    try {
      await axios.post('/api/snippets', {
        title: snippetForm.title, code,
        language: session?.language || 'javascript',
        tags: snippetForm.tags,
      }, { headers })
      alert('스니펫 저장 완료!')
      setSnippetForm({ title:'', tags:[], tagInput:'' })
    } catch (e) {}
  }

  // ── 코드 실행 (Glot.io → 백엔드 경유) ──────────────────────
  const runCode = async () => {
    setRunLoading(true)
    setOutput('')
    setSideTab('output')
    try {
      let sourceCode = code
      // Java는 클래스명을 Main으로 자동 변환
      if (session?.language === 'java') {
        const match = code.match(/public\s+class\s+(\w+)/)
        if (match && match[1] !== 'Main') {
          sourceCode = code.replace(`public class ${match[1]}`, 'public class Main')
        }
      }
      const res = await axios.post('/api/execute', {
        code: sourceCode,
        language: session?.language || 'javascript',
      }, { headers })
      setOutput(res.data.output || '결과 없음')
    } catch (e) {
      setOutput('실행 실패. 백엔드 서버를 확인하세요.')
    } finally {
      setRunLoading(false)
    }
  }

  // ── 기타 함수 ───────────────────────────────────────────────
  const addTag = e => {
    if (e.key === 'Enter' && snippetForm.tagInput.trim()) {
      setSnippetForm(f => ({ ...f, tags:[...f.tags, f.tagInput.trim()], tagInput:'' }))
    }
  }
  const removeTag = t => setSnippetForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))
  const formatTime = iso => new Date(iso).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })

  // ── JSX 렌더링 ──────────────────────────────────────────────
  return (
      <div style={s.page}>

        {/* 상단 바 */}
        <div style={s.topbar}>
          <button style={s.backBtn} onClick={() => navigate('/')}>←</button>
          <div style={s.divider} />
          <span style={s.sessionTitle}>{session?.title || '로딩 중...'}</span>
          {session && <span className="tag tag-lang">{session.language}</span>}
          <span style={s.permBadge(canEdit)}>
          {isOwner ? '게시자' : canEdit ? '편집 가능' : '읽기 전용'}
        </span>
          <div style={s.spacer} />
          <div style={s.avatarRow}>
            {participants.slice(0, 5).map((p, i) => (
                <div key={p.userId} style={{ ...s.avatar(USER_COLORS[i % USER_COLORS.length]), zIndex: participants.length - i }}>
                  {p.name?.slice(0,1) || '?'}
                </div>
            ))}
          </div>
          <button
              className="btn btn-ghost"
              style={{ fontSize:12, color: runLoading ? 'var(--text-muted)' : 'var(--green)' }}
              onClick={runCode}
              disabled={runLoading}
          >
            {runLoading ? '실행 중...' : '▶ 실행'}
          </button>
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => setSideTab('snippet')}>
            스니펫 저장
          </button>
        </div>

        {/* 본문 */}
        <div style={s.body}>

          {/* 에디터 */}
          <div style={s.editorWrap}>
            <div style={s.statusBar}>
              <div style={s.statusDot(connected)} />
              {connected ? '연결됨' : '연결 중...'}
            </div>
            {permDenied && (
                <div style={s.permDeniedBar}>편집 권한이 없습니다. 관리자에게 요청하세요.</div>
            )}
            <Editor
                height="100%"
                language={LANG_MAP[session?.language] || 'javascript'}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                  fontLigatures: true, lineHeight: 22, padding: { top: 16 },
                  minimap: { enabled: false }, scrollBeyondLastLine: false,
                  readOnly: !canEdit, cursorBlinking: 'smooth',
                  smoothScrolling: true, wordWrap: 'on',
                }}
            />
          </div>

          {/* 사이드바 */}
          <div style={s.sidebar}>
            <div style={s.tabs}>
              <button style={s.tab(sideTab==='comments')} onClick={() => setSideTab('comments')}>
                댓글 {comments.length > 0 && `(${comments.length})`}
              </button>
              {isOwner && (
                  <button style={s.tab(sideTab==='permissions')} onClick={() => setSideTab('permissions')}>
                    권한 관리
                  </button>
              )}
              <button style={s.tab(sideTab==='snippet')} onClick={() => setSideTab('snippet')}>저장</button>
              <button style={s.tab(sideTab==='output')} onClick={() => setSideTab('output')}>실행 결과</button>
            </div>

            {/* 댓글 탭 */}
            {sideTab === 'comments' && (
                <>
                  <div style={s.panel}>
                    {comments.length === 0
                        ? <div style={s.emptyState}>아직 댓글이 없어요<br />첫 번째 리뷰를 남겨보세요</div>
                        : comments.map(c => (
                            <div key={c.id} style={s.commentCard}>
                              <div style={s.commentHeader}>
                                <span style={s.commentAuthor}>{c.author?.name || '익명'}</span>
                                {c.lineNumber && <span style={s.commentLine}>Line {c.lineNumber}</span>}
                              </div>
                              <div style={s.commentBody}>{c.content}</div>
                              <div style={s.commentTime}>{formatTime(c.createdAt)}</div>
                            </div>
                        ))
                    }
                  </div>
                  <div style={s.inputArea}>
                    <div style={s.lineRow}>
                      <span style={s.lineLabel}>줄 번호</span>
                      <input type="number" style={s.lineInput} placeholder="선택" value={commentForm.lineNumber} onChange={e => setCommentForm(f => ({ ...f, lineNumber: e.target.value }))} min={1} />
                    </div>
                    {showMention && (
                        <div style={s.mentionDropdown}>
                          {mentionUsers.map(u => (
                              <div key={u.id || u.userId} style={s.mentionItem} onClick={() => insertMention(u.name)}>
                                <span style={{ fontWeight:600 }}>{u.name}</span>
                                <span style={{ color:'var(--text-muted)' }}>{u.student_id || u.studentId}</span>
                              </div>
                          ))}
                        </div>
                    )}
                    <textarea
                        style={s.textarea} rows={3}
                        placeholder="댓글 입력... (@이름으로 언급 가능)"
                        value={commentForm.content}
                        onChange={handleCommentChange}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        onKeyDown={e => e.key === 'Enter' && e.metaKey && submitComment()}
                    />
                    <button style={s.submitBtn} onClick={submitComment}>댓글 등록</button>
                  </div>
                </>
            )}

            {/* 권한 관리 탭 */}
            {sideTab === 'permissions' && isOwner && (
                <div style={s.permPanel}>
                  <div style={s.permTitle}>참여자 편집 권한 관리</div>
                  {members.length === 0
                      ? <div style={s.emptyState}>다른 참여자가 없어요</div>
                      : members.map(m => (
                          <div key={m.id} style={s.permRow}>
                            <div>
                              <div style={s.permName}>{m.name}</div>
                              <div style={s.permId}>{m.student_id}</div>
                            </div>
                            <button style={s.toggle(m.can_edit)} onClick={() => togglePermission(m.id, m.can_edit)}>
                              <div style={s.toggleThumb(m.can_edit)} />
                            </button>
                          </div>
                      ))
                  }
                </div>
            )}

            {/* 스니펫 저장 탭 */}
            {sideTab === 'snippet' && (
                <div style={s.snipPanel}>
                  <div style={s.snipCard}>
                    <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>현재 에디터 코드를 저장합니다</p>
                    <div style={s.snipField}>
                      <label style={s.snipLabel}>제목</label>
                      <input className="input" placeholder="퀵소트 구현체" value={snippetForm.title} onChange={e => setSnippetForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div style={s.snipField}>
                      <label style={s.snipLabel}>태그 (Enter로 추가)</label>
                      <input className="input" placeholder="알고리즘, 정렬..." value={snippetForm.tagInput} onChange={e => setSnippetForm(f => ({ ...f, tagInput: e.target.value }))} onKeyDown={addTag} />
                      {snippetForm.tags.length > 0 && (
                          <div style={s.tagWrap}>
                            {snippetForm.tags.map(t => (
                                <span key={t} style={s.tagPill}>
                          {t}<span style={{ cursor:'pointer', marginLeft:2 }} onClick={() => removeTag(t)}>×</span>
                        </span>
                            ))}
                          </div>
                      )}
                    </div>
                    <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={saveSnippet}>
                      저장소에 저장
                    </button>
                  </div>
                </div>
            )}

            {/* 실행 결과 탭 */}
            {sideTab === 'output' && (
                <div style={{ flex:1, overflow:'auto', padding:12 }}>
                  <button
                      className="btn btn-primary"
                      style={{ width:'100%', justifyContent:'center', marginBottom:12 }}
                      onClick={runCode}
                      disabled={runLoading}
                  >
                    {runLoading ? '실행 중...' : '▶ 코드 실행'}
                  </button>
                  <pre style={{
                    background:'#1E1E1E', color:'#D4D4D4', padding:16, borderRadius:8,
                    fontFamily:'var(--font-code)', fontSize:13, lineHeight:1.6,
                    minHeight:200, whiteSpace:'pre-wrap', wordBreak:'break-all', margin:0,
                  }}>
                {output || '▶ 실행 버튼을 눌러보세요'}
              </pre>
                </div>
            )}

          </div>
        </div>
      </div>
  )
}
