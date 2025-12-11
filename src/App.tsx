import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/common/AuthProvider";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import NoAccess from "./pages/NoAccess";

// Lazy load heavy pages for better initial bundle size
const Dashboard = lazy(() => import("./pages/dashboard"));
const Skills = lazy(() => import("./pages/skills"));
const Approvals = lazy(() => import("./pages/approvals"));
const SkillExplorer = lazy(() => import("./pages/skill-explorer"));
const Projects = lazy(() => import("./pages/projects"));
const Reports = lazy(() => import("./pages/reports"));
const Admin = lazy(() => import("./pages/admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));

const queryClient = new QueryClient();

// Suspense fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ImpersonationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/no-access" element={<NoAccess />} />
              <Route path="/*" element={
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
                      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
                      <Route path="/skill-explorer" element={<ProtectedRoute><SkillExplorer /></ProtectedRoute>} />
                      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                      
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              } />
            </Routes>
          </BrowserRouter>
        </ImpersonationProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
