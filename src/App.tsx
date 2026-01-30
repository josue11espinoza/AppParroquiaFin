import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import Parishioners from "./pages/Parishioners";
import Sacraments from "./pages/Sacraments";
import Priests from "./pages/Priests";
import Schedules from "./pages/Schedules";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/parishioners" element={<ProtectedRoute><Parishioners /></ProtectedRoute>} />
            <Route path="/sacraments" element={<ProtectedRoute><Sacraments /></ProtectedRoute>} />
            <Route path="/priests" element={<ProtectedRoute><Priests /></ProtectedRoute>} />
            <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
