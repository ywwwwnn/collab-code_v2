import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App.jsx'
import './styles/global.css'

// 배포 환경에서는 프론트(Vercel)와 백엔드(Render)의 주소가 다르다.
// axios의 기본 주소를 VITE_API_URL로 설정하면,
// 각 파일의 axios.get('/api/...') 요청이 Render 백엔드로 전송된다.
// 로컬 개발 환경에서는 값이 없으면 기존처럼 상대경로('/api/...')를 사용한다.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
