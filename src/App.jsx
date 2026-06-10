import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import JobForm from './pages/JobForm'
import MapView from './pages/MapView'
import Documents from './pages/Documents'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/new" element={<JobForm />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/jobs/:id/edit" element={<JobForm />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
