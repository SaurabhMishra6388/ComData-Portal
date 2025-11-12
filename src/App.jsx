import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

// Page Imports
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
// import AddDeliverable from "./pages/AddDeliverable"; 

const queryClient = new QueryClient();

// Helper to determine user role (either 'admin' or 'client')
const useUserRole = () => {
  const { user, isLoading } = useAuth();
  // Checks if user.role is 'admin' or 'Admin'
  const userRole = user ? (user.role === 'admin' || user.role === 'Admin' ? 'admin' : 'client') : 'client';
  return { userRole, isLoading };
};

// --- WRAPPER COMPONENT FOR PROFILE ---
const ProfileRoute = () => {
  const { userRole, isLoading } = useUserRole();
  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return <Layout><div>Loading user role...</div></Layout>;
  }

  return (
    <Layout>
      {/* Pass the dynamic isAdmin prop */}
      <Profile isAdmin={isAdmin} /> 
    </Layout>
  );
};
// ------------------------------------------

// --- WRAPPER COMPONENT FOR PROJECTS ---
const ProjectsRoute = () => {
  const { userRole, isLoading } = useUserRole();
  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return <Layout><div>Loading user role...</div></Layout>;
  }

  return (
    <Layout>
      {/* Pass the dynamic isAdmin prop */}
      <Projects isAdmin={isAdmin} /> 
    </Layout>
  );
};
// ------------------------------------------

// Wrapper component to pass role prop to Renewals
const RenewalsRoute = () => {
  const { userRole, isLoading } = useUserRole();
  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return <Layout><div>Loading user role...</div></Layout>; 
  }

  return (
    <Layout>
      {/* Renewals component expects an isAdmin prop */}
      <Renewals isAdmin={isAdmin} /> 
    </Layout>
  );
};

// Wrapper component to pass role prop to Deliverables
const DeliverablesRoute = () => {
  const { userRole, isLoading } = useUserRole();

  if (isLoading) {
    return <Layout><div>Loading user role...</div></Layout>;
  }

  return (
    <Layout>
      {/* Deliverables component expects a userRole prop */}
      <Deliverables userRole={userRole} />
    </Layout>
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/auth" element={<Auth />} />

            {/* --- Protected Routes --- */}
            
            {/* Dashboard (Root) */}
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

            {/* Profile Route (USES WRAPPER) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileRoute />
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

            {/* Projects Route (USES WRAPPER) */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsRoute />
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

            {/* Deliverables Routes (Uses wrapper for role-based access) */}
            <Route
              path="/deliverables"
              element={
                <ProtectedRoute>
                  <DeliverablesRoute />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/deliverables/add"
              element={
                <ProtectedRoute>
                  <Layout>
                    {/* Replace with your actual AddDeliverable component */}
                    <div>Add Deliverable Page</div>
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

            {/* Payments Route */}
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

            {/* Billing Route */}
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

            {/* Renewals Route (Uses wrapper for role-based access) */}
            <Route
              path="/renewals"
              element={
                <ProtectedRoute>
                  <RenewalsRoute />
                </ProtectedRoute>
              }
            />

            {/* Support Route */}
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

            {/* Catch-all Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;