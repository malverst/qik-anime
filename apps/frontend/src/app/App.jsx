import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from '@fsd/widgets/header'
import { AuthModal } from '@fsd/features/auth'
import Toast from '@fsd/shared/ui/Toast.jsx'
import { Footer } from '@fsd/widgets/footer'
import Home from '@fsd/pages/Home'
import Catalog from '@fsd/pages/Catalog'
import AnimeDetail from '@fsd/pages/AnimeDetail'
import Watch from '@fsd/pages/Watch'
import Schedule from '@fsd/pages/Schedule'
import SearchPage from '@fsd/pages/SearchPage'
import Library from '@fsd/pages/Library'
import Settings from '@fsd/pages/Settings'
import Profile from '@fsd/pages/Profile'
import Friends from '@fsd/pages/Friends'
import Ratings from '@fsd/pages/Ratings'
import NotFound from '@fsd/pages/NotFound'

// Lazy: hls.js + socket.io only loaded when navigating to rooms/chats
const Chats = lazy(() => import('@fsd/pages/Chats'))
const Rooms = lazy(() => import('@fsd/pages/Rooms'))
const RoomWatch = lazy(() => import('@fsd/pages/RoomWatch'))
const Admin = lazy(() => import('@fsd/pages/Admin'))
const Quiz = lazy(() => import('@fsd/pages/Quiz'))
const Issues = lazy(() => import('@fsd/pages/Issues'))

function LazyFallback() {
  return <div className="container page"><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>Загрузка…</div></div>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    // On POP (back/forward), let the page handle its own scroll restoration.
    // On PUSH/REPLACE (new navigation), scroll to top.
    if (navType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navType])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/chats" element={<Suspense fallback={<LazyFallback />}><Chats /></Suspense>} />
          <Route path="/rooms" element={<Suspense fallback={<LazyFallback />}><Rooms /></Suspense>} />
          <Route path="/rooms/:id" element={<Suspense fallback={<LazyFallback />}><RoomWatch /></Suspense>} />
          <Route path="/u/:id" element={<Profile />} />
          <Route path="/anime/:url" element={<AnimeDetail />} />
          <Route path="/anime/:url/watch" element={<Watch />} />
          <Route path="/admin" element={<Suspense fallback={<LazyFallback />}><Admin /></Suspense>} />
          <Route path="/quiz" element={<Suspense fallback={<LazyFallback />}><Quiz /></Suspense>} />
          <Route path="/issues" element={<Suspense fallback={<LazyFallback />}><Issues /></Suspense>} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <AuthModal />
      <Toast />
      <Footer />
    </>
  )
}
