import { Route, Routes } from 'react-router-dom'
import SplashScreen from './pages/Splash/SplashScreen'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardLayout from './layouts/DashboardLayout'
import HomePage from './pages/Dashboard/HomePage'
import SearchPage from './pages/Dashboard/SearchPage'
import NewOrderPage from './pages/Dashboard/NewOrderPage'
import OrdersPage from './pages/Dashboard/OrdersPage'
import ProfilePage from './pages/Dashboard/ProfilePage'
import DriverHomePage from './pages/Dashboard/Driver/DriverHomePage'
import MyJobsPage from './pages/Dashboard/Driver/MyJobsPage'
import CompletedPage from './pages/Dashboard/Driver/CompletedPage'
import OrderDetailsPage from './pages/Dashboard/Driver/OrderDetailsPage'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import { useAuth } from './context/useAuth'

function App() {
  const { role } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {role === 'dienstleister' ? (
          <>
            <Route index element={<DriverHomePage />} />
            <Route path="my-jobs" element={<MyJobsPage />} />
            <Route path="completed" element={<CompletedPage />} />
            <Route path="jobs/:orderId" element={<OrderDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </>
        ) : (
          <>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="new-order" element={<NewOrderPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </>
        )}
      </Route>
    </Routes>
  )
}

export default App
