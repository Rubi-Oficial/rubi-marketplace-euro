import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import AuthRedirectHandler from "@/components/shared/AuthRedirectHandler";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import { usePageTracking } from "@/hooks/usePageTracking";

// Lazy-loaded route components
const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const CityPage = lazy(() => import("@/pages/public/CityPage"));
const CategoryPage = lazy(() => import("@/pages/public/CategoryPage"));
const SearchPage = lazy(() => import("@/pages/public/SearchPage"));
const ProfilePage = lazy(() => import("@/pages/public/ProfilePage"));
const PlansPage = lazy(() => import("@/pages/public/PlansPage"));
const AboutPage = lazy(() => import("@/pages/public/AboutPage"));
const ContactPage = lazy(() => import("@/pages/public/ContactPage"));
const BlogPage = lazy(() => import("@/pages/public/BlogPage"));
const TermsPage = lazy(() => import("@/pages/public/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/public/PrivacyPage"));
const CookiesPage = lazy(() => import("@/pages/public/CookiesPage"));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));

const ClientDashboard = lazy(() => import("@/pages/dashboard/client/ClientDashboard"));
const ClientAffiliates = lazy(() => import("@/pages/dashboard/client/ClientAffiliates"));
const ClientSettings = lazy(() => import("@/pages/dashboard/client/ClientSettings"));
const ClientFavorites = lazy(() => import("@/pages/dashboard/client/ClientFavorites"));

const EscortDashboard = lazy(() => import("@/pages/dashboard/escort/EscortDashboard"));
const EscortProfile = lazy(() => import("@/pages/dashboard/escort/EscortProfile"));
const EscortOnboarding = lazy(() => import("@/pages/dashboard/escort/EscortOnboarding"));
const EscortPhotos = lazy(() => import("@/pages/dashboard/escort/EscortPhotos"));
const EscortSubscription = lazy(() => import("@/pages/dashboard/escort/EscortSubscription"));
const EscortMetrics = lazy(() => import("@/pages/dashboard/escort/EscortMetrics"));
const EscortAffiliates = lazy(() => import("@/pages/dashboard/escort/EscortAffiliates"));
const EscortPreview = lazy(() => import("@/pages/dashboard/escort/EscortPreview"));
const EscortSettings = lazy(() => import("@/pages/dashboard/escort/EscortSettings"));

const AdminDashboard = lazy(() => import("@/pages/dashboard/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/dashboard/admin/AdminUsers"));
const AdminPendingProfiles = lazy(() => import("@/pages/dashboard/admin/AdminPendingProfiles"));
const AdminPlans = lazy(() => import("@/pages/dashboard/admin/AdminPlans"));
const AdminPayments = lazy(() => import("@/pages/dashboard/admin/AdminPayments"));
const AdminAffiliates = lazy(() => import("@/pages/dashboard/admin/AdminAffiliates"));
const AdminReports = lazy(() => import("@/pages/dashboard/admin/AdminReports"));
const AdminSettings = lazy(() => import("@/pages/dashboard/admin/AdminSettings"));
const AdminContactMessages = lazy(() => import("@/pages/dashboard/admin/AdminContactMessages"));
const AdminProfileDetail = lazy(() => import("@/pages/dashboard/admin/AdminProfileDetail"));
const AdminUserManagement = lazy(() => import("@/pages/dashboard/admin/AdminUserManagement"));

const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function PageTracker() {
  const { user } = useAuth();
  usePageTracking(user?.id);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/cliente/favoritos" element={<ClientFavorites />} />
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
              <Route path="/app/preview" element={<EscortPreview />} />
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
              <Route path="/admin/usuarios" element={<AdminUserManagement />} />
              <Route path="/admin/relatorios" element={<AdminReports />} />
              <Route path="/admin/configuracoes" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
