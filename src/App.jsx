import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import ErrorBoundary from './shared/components/ui/ErrorBoundary'
import { registerServiceWorker, usePWA } from './shared/hooks/usePWA'
import OfflineIndicator from './shared/components/ui/OfflineIndicator'
import { PageLoading } from './shared/components/ui/LoadingComponents'
import { addResourceHints } from './shared/utils/performanceOptimizations'

// Lazy load pages for code splitting
const Homepage = lazy(() => import('./app/Homepage'))
const MarkingPage = lazy(() => import('./features/evaluation/MarkingPage'))
const AdminPage = lazy(() => import('./features/administration/AdminPage'))
const ConfigPage = lazy(() => import('./features/configuration/ConfigPage'))
const TestPage = lazy(() => import('./pages/TestPage'))

function App() {
  const { isOnline } = usePWA();

  // Register service worker and apply performance optimizations on app startup
  useEffect(() => {
    registerServiceWorker();
    addResourceHints(); // Add performance-enhancing resource hints
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
          {/* Offline Indicator */}
          <OfflineIndicator isOnline={isOnline} />
          
          <Suspense fallback={<PageLoading message="Loading page..." />}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/marking/:juryId" element={<MarkingPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/test" element={<TestPage />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
