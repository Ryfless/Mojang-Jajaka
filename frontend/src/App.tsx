import { Route, Routes } from 'react-router-dom'
import CommitteePage from '@/pages/CommitteePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ParticipantPage from '@/pages/ParticipantPage'
import RegisterPage from '@/pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/daftar" element={<RegisterPage />} />
      <Route path="/peserta" element={<ParticipantPage />} />
      <Route path="/panitia" element={<CommitteePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
