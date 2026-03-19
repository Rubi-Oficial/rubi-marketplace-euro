import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import AuthRedirectHandler from "@/components/shared/AuthRedirectHandler";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

// Public
import LandingPage from "@/pages/public/LandingPage";
import CityPage from "@/pages/public/CityPage";
import CategoryPage from "@/pages/public/CategoryPage";
import SearchPage from "@/pages/public/SearchPage";
import ProfilePage from "@/pages/public/ProfilePage";
import PlansPage from "@/pages/public/PlansPage";
import AboutPage from "@/pages/public/AboutPage";
import ContactPage from "@/pages/public/ContactPage";
import BlogPage from "@/pages/public/BlogPage";
import TermsPage from "@/pages/public/TermsPage";
import PrivacyPage from "@/pages/public/PrivacyPage";
import CookiesPage from "@/pages/public/CookiesPage";

// Auth
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Client
import ClientDashboard from "@/pages/dashboard/client/ClientDashboard";
import ClientAffiliates from "@/pages/dashboard/client/ClientAffiliates";
import ClientSettings from "@/pages/dashboard/client/ClientSettings";

// Escort
import EscortDashboard from "@/pages/dashboard/escort/EscortDashboard";
import EscortProfile from "@/pages/dashboard/escort/EscortProfile";
import EscortOnboarding from "@/pages/dashboard/escort/EscortOnboarding";
import EscortPhotos from "@/pages/dashboard/escort/EscortPhotos";
import EscortSubscription from "@/pages/dashboard/escort/EscortSubscription";
import EscortMetrics from "@/pages/dashboard/escort/EscortMetrics";
import EscortAffiliates from "@/pages/dashboard/escort/EscortAffiliates";
import EscortSettings from "@/pages/dashboard/escort/EscortSettings";

// Admin
import AdminDashboard from "@/pages/dashboard/admin/AdminDashboard";
import AdminUsers from "@/pages/dashboard/admin/AdminUsers";
import AdminPendingProfiles from "@/pages/dashboard/admin/AdminPendingProfiles";
import AdminPlans from "@/pages/dashboard/admin/AdminPlans";
import AdminPayments from "@/pages/dashboard/admin/AdminPayments";
import AdminAffiliates from "@/pages/dashboard/admin/AdminAffiliates";
import AdminReports from "@/pages/dashboard/admin/AdminReports";
import AdminSettings from "@/pages/dashboard/admin/AdminSettings";
import AdminContactMessages from "@/pages/dashboard/admin/AdminContactMessages";
import AdminProfileDetail from "@/pages/dashboard/admin/AdminProfileDetail";

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
            {/* Post-OAuth redirect handler */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<><AuthRedirectHandler /><LandingPage /></>} />
              <Route path="/cidade/:slug" element={<CityPage />} />
              <Route path="/categoria/:slug" element={<CategoryPage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/perfil/:slug" element={<ProfilePage />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/contato" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />

            {/* Client Dashboard */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <DashboardLayout role="client" />
                </ProtectedRoute>
              }
            >
              <Route path="/cliente" element={<ClientDashboard />} />
              <Route path="/cliente/afiliados" element={<ClientAffiliates />} />
              <Route path="/cliente/configuracoes" element={<ClientSettings />} />
            </Route>

            {/* Escort Dashboard */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["professional"]}>
                  <DashboardLayout role="escort" />
                </ProtectedRoute>
              }
            >
              <Route path="/app" element={<EscortDashboard />} />
              <Route path="/app/onboarding" element={<EscortOnboarding />} />
              <Route path="/app/perfil" element={<EscortProfile />} />
              <Route path="/app/fotos" element={<EscortPhotos />} />
              <Route path="/app/plano" element={<EscortSubscription />} />
              <Route path="/app/metricas" element={<EscortMetrics />} />
              <Route path="/app/afiliados" element={<EscortAffiliates />} />
              <Route path="/app/configuracoes" element={<EscortSettings />} />
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
              <Route path="/admin/perfis" element={<AdminUsers />} />
              <Route path="/admin/perfis/pendentes" element={<AdminPendingProfiles />} />
              <Route path="/admin/perfis/:id" element={<AdminProfileDetail />} />
              <Route path="/admin/mensagens" element={<AdminContactMessages />} />
              <Route path="/admin/planos" element={<AdminPlans />} />
              <Route path="/admin/pagamentos" element={<AdminPayments />} />
              <Route path="/admin/afiliados" element={<AdminAffiliates />} />
              <Route path="/admin/relatorios" element={<AdminReports />} />
              <Route path="/admin/configuracoes" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
