import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RoomPage from './pages/RoomPage'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Sayfa bulunamadı</h1>
        <p className="text-gray-500 mb-6">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <a
          href="/"
          className="btn-primary btn"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
