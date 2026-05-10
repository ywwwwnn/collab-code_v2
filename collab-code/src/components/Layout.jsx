import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const s = {
  layout: { display:'flex', height:'100vh', overflow:'hidden' },
  sidebar: { width:240, flexShrink:0, background:'var(--bg-surface)', borderRight:'1.5px solid var(--border)', display:'flex', flexDirection:'column', padding:'20px 0', boxShadow:'2px 0 12px rgba(0,0,0,0.04)' },
  logo: { display:'flex', alignItems:'center', gap:12, padding:'0 20px 20px', borderBottom:'1px solid var(--border)', marginBottom:12 },
  logoMark: { width:34, height:34, background:'var(--accent)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-code)', fontWeight:700, fontSize:14, color:'#fff' },
  logoText: { fontFamily:'var(--font-code)', fontWeight:700, fontSize:15, color:'var(--text-primary)', letterSpacing:'-0.3px' },
  section: { padding:'0 12px', marginBottom:6 },
  sectionLabel: { fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--text-muted)', padding:'8px 10px 6px' },
  navItem: (a) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, background:a?'var(--accent-dim)':'transparent', color:a?'var(--accent)':'var(--text-secondary)', fontWeight:a?700:400, fontSize:14, cursor:'pointer', border:'none', width:'100%', textAlign:'left', transition:'all 0.12s', fontFamily:'var(--font-ui)', marginBottom:2 }),
  bottom: { marginTop:'auto', padding:'16px 20px 0', borderTop:'1px solid var(--border)' },
  userRow: { display:'flex', alignItems:'center', gap:12, marginBottom:14 },
  avatar: { width:34, height:34, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--accent)', flexShrink:0 },
  userName: { fontSize:14, fontWeight:600, color:'var(--text-primary)' },
  userSub: { fontSize:12, color:'var(--text-muted)', marginTop:1 },
  btnRow: { display:'flex', gap:8, marginBottom:8 },
  logoutBtn: { flex:1, padding:'8px 0', background:'transparent', border:'1.5px solid var(--border)', borderRadius:8, color:'var(--text-muted)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)', transition:'all 0.12s' },
  withdrawBtn: { flex:1, padding:'8px 0', background:'transparent', border:'1.5px solid rgba(231,76,60,0.3)', borderRadius:8, color:'var(--red)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)', transition:'all 0.12s' },
  main: { flex:1, overflow:'auto', background:'var(--bg-base)' },
  // 알림
  bellWrap: { position:'relative', display:'inline-flex' },
  bellBtn: { background:'transparent', border:'none', cursor:'pointer', fontSize:18, padding:'4px 8px', color:'var(--text-secondary)', position:'relative', fontFamily:'var(--font-ui)' },
  badge: { position:'absolute', top:0, right:2, width:16, height:16, background:'var(--red)', borderRadius:'50%', fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' },
  dropdown: { position:'fixed', bottom:160, left:20, width:300, background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:200, overflow:'hidden' },
  dropHeader: { padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  dropTitle: { fontSize:14, fontWeight:700, color:'var(--text-primary)' },
  readAllBtn: { fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-ui)' },
  notifList: { maxHeight:360, overflow:'auto' },
  notifItem: (read) => ({ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:read?'transparent':'rgba(108,92,231,0.04)', cursor:'pointer', transition:'background 0.12s' }),
  notifMsg: { fontSize:13, color:'var(--text-primary)', lineHeight:1.5 },
  notifTime: { fontSize:11, color:'var(--text-muted)', marginTop:4 },
  notifEmpty: { padding:'32px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13 },
  // 탈퇴 모달
  modalOverlay: { position:'fixed', inset:0, background:'rgba(26,26,46,0.4)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' },
  modalBox: { background:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:16, padding:'32px', width:380, boxShadow:'0 8px 40px rgba(0,0,0,0.12)', animation:'fadeIn 0.2s ease' },
  modalTitle: { fontSize:18, fontWeight:700, marginBottom:8, color:'var(--text-primary)' },
  modalDesc: { fontSize:14, color:'var(--text-secondary)', marginBottom:24, lineHeight:1.6 },
  modalBtns: { display:'flex', gap:10, justifyContent:'flex-end' },
}

const NAV = [
  { path:'/', icon:'⌂', label:'대시보드' },
  { path:'/snippets', icon:'◈', label:'스니펫 저장소' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 30초마다 갱신
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNotifications = async () => {
    try {
      const [nRes, uRes] = await Promise.all([
        axios.get('/api/notifications', { headers }),
        axios.get('/api/notifications/unread-count', { headers }),
      ])
      setNotifications(nRes.data)
      setUnread(uRes.data.count)
    } catch (e) {}
  }

  const readAll = async () => {
    try {
      await axios.patch('/api/notifications/read-all', {}, { headers })
      setNotifications(n => n.map(x => ({ ...x, is_read: true })))
      setUnread(0)
    } catch (e) {}
  }

  const clickNotif = async (notif) => {
    if (!notif.is_read) {
      await axios.patch(`/api/notifications/${notif.id}/read`, {}, { headers })
      setNotifications(n => n.map(x => x.id === notif.id ? { ...x, is_read: true } : x))
      setUnread(u => Math.max(0, u - 1))
    }
    if (notif.link) navigate(notif.link)
    setShowNotif(false)
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const withdraw = async () => {
    try {
      await axios.delete('/api/auth/me', { headers })
      localStorage.clear()
      navigate('/login')
    } catch (e) { alert('탈퇴 처리 중 오류가 발생했습니다') }
  }

  const formatTime = iso => {
    const diff = Date.now() - new Date(iso)
    if (diff < 60000) return '방금 전'
    if (diff < 3600000) return `${Math.floor(diff/60000)}분 전`
    if (diff < 86400000) return `${Math.floor(diff/3600000)}시간 전`
    return new Date(iso).toLocaleDateString('ko-KR')
  }

  return (
      <div style={s.layout}>
        <nav style={s.sidebar}>
          <div style={s.logo}>
            <div style={s.logoMark}>{'{}'}</div>
            <span style={s.logoText}>CodeCollab</span>
          </div>

          <div style={s.section}>
            <div style={s.sectionLabel}>메뉴</div>
            {NAV.map(({ path, icon, label }) => (
                <button key={path} style={s.navItem(location.pathname === path)} onClick={() => navigate(path)}>
                  <span style={{ fontSize:14 }}>{icon}</span>{label}
                </button>
            ))}
          </div>

          <div style={s.bottom}>
            {/* 알림 버튼 */}
            <div style={{ ...s.bellWrap, marginBottom:14 }} ref={notifRef}>
              <button style={s.bellBtn} onClick={() => setShowNotif(v => !v)}>
                🔔 알림
                {unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
              </button>

              {showNotif && (
                  <div style={s.dropdown}>
                    <div style={s.dropHeader}>
                      <span style={s.dropTitle}>알림</span>
                      {unread > 0 && <button style={s.readAllBtn} onClick={readAll}>모두 읽음</button>}
                    </div>
                    <div style={s.notifList}>
                      {notifications.length === 0
                          ? <div style={s.notifEmpty}>알림이 없어요</div>
                          : notifications.map(n => (
                              <div key={n.id} style={s.notifItem(n.is_read)} onClick={() => clickNotif(n)}>
                                <div style={s.notifMsg}>{n.message}</div>
                                <div style={s.notifTime}>{formatTime(n.created_at)}</div>
                              </div>
                          ))
                      }
                    </div>
                  </div>
              )}
            </div>

            <div style={s.userRow}>
              <div style={s.avatar}>{user.name?.slice(0,1) || '?'}</div>
              <div>
                <div style={s.userName}>{user.name || '사용자'}</div>
                <div style={s.userSub}>{user.studentId || ''}</div>
              </div>
            </div>

            <div style={s.btnRow}>
              <button style={s.logoutBtn} onClick={logout}>로그아웃</button>
              <button style={s.withdrawBtn} onClick={() => setShowWithdraw(true)}>회원탈퇴</button>
            </div>
          </div>
        </nav>

        <main style={s.main}>{children}</main>

        {/* 회원탈퇴 확인 모달 */}
        {showWithdraw && (
            <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && setShowWithdraw(false)}>
              <div style={s.modalBox}>
                <div style={s.modalTitle}>정말 탈퇴하시겠어요?</div>
                <div style={s.modalDesc}>
                  탈퇴하면 작성한 세션, 댓글, 스니펫이 모두 삭제되며 복구할 수 없습니다.
                </div>
                <div style={s.modalBtns}>
                  <button className="btn btn-ghost" onClick={() => setShowWithdraw(false)}>취소</button>
                  <button className="btn btn-danger" onClick={withdraw}>탈퇴하기</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}