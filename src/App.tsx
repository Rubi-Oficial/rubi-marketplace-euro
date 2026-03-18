import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

// Public
import LandingPage from "@/pages/public/LandingPage";
// Auth
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
// Client
import ClientDashboard from "@/pages/dashboard/client/ClientDashboard";
import ClientFavorites from "@/pages/dashboard/client/ClientFavorites";
import ClientSettings from "@/pages/dashboard/client/ClientSettings";
// Escort
import EscortDashboard from "@/pages/dashboard/escort/EscortDashboard";
import EscortListing from "@/pages/dashboard/escort/EscortListing";
import EscortPhotos from "@/pages/dashboard/escort/EscortPhotos";
import EscortSubscription from "@/pages/dashboard/escort/EscortSubscription";
import EscortSettings from "@/pages/dashboard/escort/EscortSettings";
// Admin
import AdminDashboard from "@/pages/dashboard/admin/AdminDashboard";
import AdminModeration from "@/pages/dashboard/admin/AdminModeration";
import AdminUsers from "@/pages/dashboard/admin/AdminUsers";
import AdminAnalytics from "@/pages/dashboard/admin/AdminAnalytics";
import AdminAffiliates from "@/pages/dashboard/admin/AdminAffiliates";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Client Dashboard */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <DashboardLayout role="client" />
                </ProtectedRoute>
              }
            >
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/favorites" element={<ClientFavorites />} />
              <Route path="/client/settings" element={<ClientSettings />} />
            </Route>

            {/* Escort Dashboard */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["escort"]}>
                  <DashboardLayout role="escort" />
                </ProtectedRoute>
              }
            >
              <Route path="/escort" element={<EscortDashboard />} />
              <Route path="/escort/listing" element={<EscortListing />} />
              <Route path="/escort/photos" element={<EscortPhotos />} />
              <Route path="/escort/subscription" element={<EscortSubscription />} />
              <Route path="/escort/settings" element={<EscortSettings />} />
            </Route>

            {/* Admin Dashboard */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout role="admin" />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/affiliates" element={<AdminAffiliates />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
