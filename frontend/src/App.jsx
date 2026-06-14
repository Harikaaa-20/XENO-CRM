import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, PieChart, Activity, Settings, 
  Send, Sparkles, FolderKanban, MessageSquare, Plus, Menu, X
} from 'lucide-react';

import ChatPage from './pages/ChatPage';
import CustomersPage from './pages/CustomersPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BrandHealthPage from './pages/BrandHealthPage';
import OverviewPage from './pages/OverviewPage';
import SettingsPage from './pages/SettingsPage';

// Temporary HeartPulse mock for Brand Health until we fix imports
const HeartPulse = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    <path d="M12 13h2l2 4 4-8 2 4h2"/>
  </svg>
);

function SidebarNav({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const navItems = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: FolderKanban },
    { path: '/brand-health', label: 'Brand Health', icon: HeartPulse },
  ];

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/ai-assistant?q=${encodeURIComponent(query)}`);
      setQuery('');
      onClose();
    }
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    onClose();
  };

  return (
    <div className={`flex-shrink-0 bg-sidebar border-r border-border-subtle flex flex-col h-full z-30 transition-all duration-300
      fixed inset-y-0 left-0 lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      w-[240px]`}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-brand text-white font-bold text-[12px]">X</div>
            <span className="font-semibold text-[14px] tracking-wide text-text-primary">XENO CRM</span>
          </div>
          {/* Close button visible only on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-[6px] text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <select 
          onClick={() => alert("Brand selection is controlled by user access roles. For this demo, only 'Brew & Co' is accessible.")}
          className="appearance-none text-[12px] font-medium text-text-primary bg-elevated px-3 py-2 pr-8 rounded-[6px] border border-border-subtle shadow-inset cursor-pointer outline-none w-full"
        >
          <option>Brew &amp; Co</option>
          <option>Xeno Retail (Locked)</option>
          <option>Apparel Corp (Locked)</option>
          <option>Fit &amp; Active (Locked)</option>
        </select>
      </div>

      {/* Main Nav */}
      <div className="px-3 flex-1 flex flex-col gap-0.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 mt-4">Main Menu</div>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                isActive 
                  ? 'bg-elevated text-text-primary' 
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand' : 'text-text-muted'}`} />
              {item.label}
            </Link>
          );
        })}

        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 mt-6">Intelligence</div>
        <Link 
          to="/ai-assistant"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
            location.pathname.startsWith('/ai-assistant') 
              ? 'bg-elevated text-text-primary border border-border-subtle shadow-inset' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <Sparkles className={`w-4 h-4 flex-shrink-0 ${location.pathname.startsWith('/ai-assistant') ? 'text-brand' : 'text-text-muted'}`} />
          AI Assistant
        </Link>
        
        <div className="mt-auto pb-4">
          <Link 
            to="/settings"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium text-text-muted hover:text-text-secondary hover:bg-surface transition-colors"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>
        </div>
      </div>

      {/* Bottom AI Input */}
      <div className="p-4 border-t border-border-subtle bg-sidebar relative">
        <div className="text-[11px] font-semibold text-text-primary mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          AI Assistant
        </div>
        <p className="text-[10px] text-text-muted mb-3 leading-relaxed">Ask anything about your customers...</p>
        <form onSubmit={handleAiSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Find regular customers..."
            className="w-full bg-surface border border-border-subtle rounded-[8px] py-2 pl-3 pr-8 text-[12px] text-text-primary focus:outline-none focus:border-border-default shadow-inset transition-colors"
          />
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            disabled={!query.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base text-text-primary font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0 min-w-0">
        {/* Mobile Top Bar with hamburger */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-sidebar shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-[6px] text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-brand text-white font-bold text-[11px]">X</div>
            <span className="font-semibold text-[13px] tracking-wide text-text-primary">XENO CRM</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Placeholder for Segments / Settings
const ComingSoonPage = ({ title }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8">
    <div className="w-16 h-16 bg-elevated rounded-[16px] flex items-center justify-center border border-border-subtle shadow-inset mb-4">
      <Sparkles className="w-8 h-8 text-text-muted" />
    </div>
    <h2 className="text-[18px] font-semibold text-text-primary mb-2">{title}</h2>
    <p className="text-[13px] text-text-muted text-center max-w-sm">This page is under construction. Please check out Customers, Analytics, or the AI Assistant.</p>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/overview" element={<MainLayout><OverviewPage /></MainLayout>} />
        <Route path="/customers" element={<MainLayout><CustomersPage /></MainLayout>} />
        <Route path="/campaigns" element={<MainLayout><CampaignsPage /></MainLayout>} />
        <Route path="/campaigns/:id" element={<MainLayout><CampaignDetailPage /></MainLayout>} />
        <Route path="/brand-health" element={<MainLayout><BrandHealthPage /></MainLayout>} />
        <Route path="/ai-assistant" element={<MainLayout><ChatPage /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Router>
  );
}
