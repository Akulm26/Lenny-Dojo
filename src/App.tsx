import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DojoDataProvider } from "@/contexts/DojoDataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SyncStatusBar } from "@/components/layout/SyncStatusBar";
import { SplashScreen } from "@/components/layout/SplashScreen";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import PracticeSession from "./pages/PracticeSession";
import Evaluation from "./pages/Evaluation";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Frameworks from "./pages/Frameworks";
import FrameworkDetail from "./pages/FrameworkDetail";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Check if splash was already shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <DojoDataProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/practice" element={
                    <ProtectedRoute>
                      <Practice />
                    </ProtectedRoute>
                  } />
                  <Route path="/practice/session" element={
                    <ProtectedRoute>
                      <PracticeSession />
                    </ProtectedRoute>
                  } />
                  <Route path="/practice/evaluate" element={
                    <ProtectedRoute>
                      <Evaluation />
                    </ProtectedRoute>
                  } />
                  <Route path="/companies" element={
                    <ProtectedRoute>
                      <Companies />
                    </ProtectedRoute>
                  } />
                  <Route path="/companies/:slug" element={
                    <ProtectedRoute>
                      <CompanyDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/frameworks" element={
                    <ProtectedRoute>
                      <Frameworks />
                    </ProtectedRoute>
                  } />
                  <Route path="/frameworks/:slug" element={
                    <ProtectedRoute>
                      <FrameworkDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <SyncStatusBar />
              </DojoDataProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;

