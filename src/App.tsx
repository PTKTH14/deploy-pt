import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { checkSupabaseConnection } from "@/integrations/supabase/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import HomeVisits from "./pages/HomeVisits";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import NewAppointmentForm from "./components/AppointmentForm";
import ProtectedRoute from "./components/ProtectedRoute";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, UserCog, Calendar, Home, FileText, LogOut, CalendarClock } from "lucide-react";
import React, { useState, useEffect } from "react";
import ShiftScheduler from './pages/ShiftScheduler';
import { USE_SIMULATION_MODE } from '@/utils/enhancedShiftScheduler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const links = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard /> },
  { label: "Patients", href: "/patients", icon: <UserCog /> },
  { label: "Appointments", href: "/appointments", icon: <Calendar /> },
  { label: "Home Visits", href: "/home-visits", icon: <Home /> },
  { label: "Reports", href: "/reports", icon: <FileText /> },
  { label: "จัดตารางเวร", href: "/shift-scheduler", icon: <CalendarClock /> },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => {
    // TODO: ใส่ logic logout จริง เช่น clear token, redirect
    // ตัวอย่าง: localStorage.clear(); navigate("/login");
    navigate("/login");
  };
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar>
        <SidebarBody>
          <div className="flex flex-1 flex-col">
            {links.map((link) => (
              <SidebarLink
                key={link.href}
                link={link}
                className={
                  location.pathname === link.href
                    ? "rounded bg-primary text-primary-foreground"
                    : "text-sidebar-foreground"
                }
              />
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="flex items-center justify-start gap-2 rounded text-sidebar-foreground hover:bg-destructive hover:text-white w-full"
            onClick={handleLogout}
          >
            <LogOut />
            <span>Logout</span>
          </Button>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

const App = () => {
  const [count, setCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // ถ้าฟังก์ชันนี้ไม่ error แสดงว่าเชื่อมต่อสำเร็จ
        await checkSupabaseConnection();
        setConnectionStatus(true);
        setConnectionError(false);
      } catch (error) {
        setConnectionStatus(false);
        setConnectionError(true);
        console.error('Connection check failed:', error);
      }
    };

    checkConnection();
  }, []);

  // Show connection error if we've confirmed there's a problem
  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้</h1>
          <p className="mb-4">ระบบไม่สามารถเชื่อมต่อกับฐานข้อมูล Supabase ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ</p>
          <Button 
            className="w-full" 
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    );
  }

  // Show loading while checking connection
  if (connectionStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
              <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/patients"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Patients />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/appointments"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <NewAppointmentForm />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/home-visits"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <HomeVisits />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
              <Route
                path="/shift-scheduler"
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <ShiftScheduler />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;