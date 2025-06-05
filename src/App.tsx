
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NewDashboard from "./pages/NewDashboard";
import PatientList from "./pages/PatientList";
import AppointmentManagement from "./pages/AppointmentManagement";
import Appointments from "./pages/Appointments";
import HomeVisits from "./pages/HomeVisits";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import NewAppointmentForm from "./components/AppointmentForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <NewDashboard />
              </ProtectedRoute>
            } />
            <Route path="/patient-list" element={
              <ProtectedRoute>
                <PatientList />
              </ProtectedRoute>
            } />
            <Route path="/appointment-management" element={
              <ProtectedRoute>
                <AppointmentManagement />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } />
            <Route path="/appointments/new" element={
              <ProtectedRoute>
                <NewAppointmentForm />
              </ProtectedRoute>
            } />
            <Route path="/home-visits" element={
              <ProtectedRoute>
                <HomeVisits />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
