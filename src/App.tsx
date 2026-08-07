import { Route, Routes } from 'react-router-dom'
import SplashScreen from './pages/Splash/SplashScreen'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardLayout from './layouts/DashboardLayout'
import HomePage from './pages/Dashboard/HomePage'
import SearchPage from './pages/Dashboard/SearchPage'
import NewOrderPage from './pages/Dashboard/NewOrderPage'
import ProfilePage from './pages/Dashboard/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="new-order" element={<NewOrderPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
