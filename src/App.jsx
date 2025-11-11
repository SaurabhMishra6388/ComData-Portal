import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Payments from "./pages/Payments";
import Billing from "./pages/Billing";
import Deliverables from "./pages/Deliverables";
import Renewals from "./pages/Renewals";
import Support from "./pages/Support";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import EditProfile from "./pages/EditProfile";
import AddProfile from "./pages/AddProfile";
import AddProjects from "./pages/AddProjects";
import ProjectEdit from "./pages/ProjectEdit";
import DeliverableEdit from "./pages/DeliverableEdit";
import DeliverableView from "./pages/DeliverableView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <Routes>
            {/* --- Public --- */}
            <Route path="/auth" element={<Auth />} />

            {/* --- Protected Routes --- */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit-profile/:projectId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/project-edit/:projectId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectEdit />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddProjects />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/deliverables"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Deliverables />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/deliverables/edit/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DeliverableEdit />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/deliverables/view/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DeliverableView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Payments />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing/:invoiceId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Billing />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/renewals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Renewals />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Support />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
