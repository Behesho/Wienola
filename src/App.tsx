import { Navigate, Route, Routes } from 'react-router-dom'
import SplashScreen from './pages/Splash/SplashScreen'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/Auth/ResetPasswordPage'
import DashboardLayout from './layouts/DashboardLayout'
import HomePage from './pages/Dashboard/HomePage'
import PricesPage from './pages/Dashboard/PricesPage'
import NotificationsPage from './pages/Dashboard/NotificationsPage'
import NewOrderPage from './pages/Dashboard/NewOrderPage'
import OrdersPage from './pages/Dashboard/OrdersPage'
import ProfilePage from './pages/Dashboard/ProfilePage'
import DriverHomePage from './pages/Dashboard/Driver/DriverHomePage'
import MyJobsPage from './pages/Dashboard/Driver/MyJobsPage'
import CompletedPage from './pages/Dashboard/Driver/CompletedPage'
import OrderDetailsPage from './pages/Dashboard/Driver/OrderDetailsPage'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicOnlyRoute from './components/ProtectedRoute/PublicOnlyRoute'
import { useAuth } from './context/useAuth'

function App() {
  const { role } = useAuth()

  return (
    <Routes>
      {/* Public: only /login and /register — and only for signed-out users. */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* The e-mail link arrives with a recovery session, so this page must
          not be behind PublicOnlyRoute. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Everything else requires a valid session. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<SplashScreen />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          {role === 'dienstleister' ? (
            <>
              <Route index element={<DriverHomePage />} />
              <Route path="my-jobs" element={<MyJobsPage />} />
              <Route path="completed" element={<CompletedPage />} />
              <Route path="jobs/:orderId" element={<OrderDetailsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route index element={<HomePage />} />
              <Route path="prices" element={<PricesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="new-order" element={<NewOrderPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Route>

        {/* Any other URL: signed-out users are bounced to /login by the
            guard above; signed-in users land on their dashboard. */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
