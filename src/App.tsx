import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DojoDataProvider } from "@/contexts/DojoDataContext";
import { SyncStatusBar } from "@/components/layout/SyncStatusBar";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import PracticeSession from "./pages/PracticeSession";
import Evaluation from "./pages/Evaluation";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Frameworks from "./pages/Frameworks";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DojoDataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice/session" element={<PracticeSession />} />
            <Route path="/practice/evaluate" element={<Evaluation />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:slug" element={<CompanyDetail />} />
            <Route path="/frameworks" element={<Frameworks />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SyncStatusBar />
        </BrowserRouter>
      </DojoDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
