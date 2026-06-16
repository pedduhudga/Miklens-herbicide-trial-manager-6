import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ScanQrCode, FlaskConical,
  ListChecks, FileBox, ShoppingBag, Sparkles, BarChartBig,
  MapPin, Search, Database, Settings, Users, LogOut, Calculator, Bell,
  TrendingDown, ShieldAlert, Flame, Compass, ChevronDown,
  Leaf, Shield, Bug, Beaker, Sprout, Grid3x3
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { CATEGORIES, getCategoryConfig, hasAccess } from '../utils/categoryConfig.js';

const ICON_MAP = {
  Leaf, Shield, Bug, Beaker, Sprout,
};

const ACCENT_CLASSES = {
  emerald: {
    header: 'bg-emerald-600',
    activeBg: 'bg-emerald-100 text-emerald-800',
    hoverBg: 'hover:bg-emerald-50 hover:text-emerald-700',
    iconBg: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-600',
  },
  indigo: {
    header: 'bg-indigo-600',
    activeBg: 'bg-indigo-100 text-indigo-800',
    hoverBg: 'hover:bg-indigo-50 hover:text-indigo-700',
    iconBg: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-600',
  },
  red: {
    header: 'bg-red-600',
    activeBg: 'bg-red-100 text-red-800',
    hoverBg: 'hover:bg-red-50 hover:text-red-700',
    iconBg: 'text-red-600',
    badge: 'bg-red-100 text-red-600',
  },
  amber: {
    header: 'bg-amber-600',
    activeBg: 'bg-amber-100 text-amber-800',
    hoverBg: 'hover:bg-amber-50 hover:text-amber-700',
    iconBg: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-600',
  },
  teal: {
    header: 'bg-teal-600',
    activeBg: 'bg-teal-100 text-teal-800',
    hoverBg: 'hover:bg-teal-50 hover:text-teal-700',
    iconBg: 'text-teal-600',
    badge: 'bg-teal-100 text-teal-600',
  },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isViewer, logout } = useAuth();
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const firebaseEnabled = !!state.settings?.firebaseEnabled;
  const activeCategory = state.activeCategory || 'herbicide';
  const catConfig = getCategoryConfig(activeCategory);
  const accent = ACCENT_CLASSES[catConfig.color.accent] || ACCENT_CLASSES.emerald;
  const CatIcon = ICON_MAP[catConfig.icon] || FlaskConical;

  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const handleCategorySwitch = (catId) => {
    dispatch({ type: 'SET_CATEGORY', payload: catId });
    setCatDropdownOpen(false);
    navigate('/');
  };

  const navItems = [
    { to: "/", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { to: "/categories", icon: <Grid3x3 className="w-5 h-5" />, label: "All Categories" },
    { to: "/large-scale-trials", icon: <Compass className="w-5 h-5" />, label: "Large Field Trials" },
    { to: "/projects", icon: <FolderKanban className="w-5 h-5" />, label: "Projects (RCBD)" },
    { to: "/scanner", icon: <ScanQrCode className="w-5 h-5" />, label: "Plot Scanner" },
    { to: "/formulations", icon: <FlaskConical className="w-5 h-5" />, label: "Formulations" },
    { to: "/trials", icon: <ListChecks className="w-5 h-5" />, label: "Trials" },
    { to: "/reports", icon: <FileBox className="w-5 h-5" />, label: "Reports & Cards" },
    { to: "/organisations", icon: <FolderKanban className="w-5 h-5" />, label: "Organisations" },
    { to: "/ingredients", icon: <ShoppingBag className="w-5 h-5" />, label: "Ingredient Costs" },
    { to: "/ai-assistant", icon: <Sparkles className="w-5 h-5" />, label: "AI Assistant" },
    { to: "/analytics", icon: <BarChartBig className="w-5 h-5" />, label: "Analytics" },
    { to: "/statistics", icon: <Calculator className="w-5 h-5" />, label: "Statistics" },
    { to: "/dose-response", icon: <TrendingDown className="w-5 h-5" />, label: "Dose-Response (ED50)" },
    // Resistance Tracker — only for herbicide
    ...(activeCategory === 'herbicide' ? [
      { to: "/resistance", icon: <ShieldAlert className="w-5 h-5" />, label: "Resistance Tracker" },
    ] : []),
    { to: "/alerts", icon: <Bell className="w-5 h-5" />, label: "Smart Alerts" },
    { to: "/map", icon: <MapPin className="w-5 h-5" />, label: "Field Map" },
    { to: "/search", icon: <Search className="w-5 h-5" />, label: "Smart Search" },
  ];

  const bottomItems = [
    { to: "/data", icon: <Database className="w-5 h-5" />, label: "Data Management" },
    { to: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (isViewer) {
      return ['/trials', '/projects', '/categories'].includes(item.to);
    }
    if (user?.tabPermissions && user.tabPermissions[item.label] === false) {
      return false;
    }
    return true;
  });

  const filteredBottomItems = bottomItems.filter(item => {
    if (isViewer) {
      return false;
    }
    if (user?.tabPermissions && user.tabPermissions[item.label] === false) {
      return false;
    }
    return true;
  });

  const sidebarClass = `sidebar bg-white/70 backdrop-blur-md w-64 flex-shrink-0 border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClass}>
        {/* Category-themed header */}
        <div className="px-5 py-4 border-b border-white/50">
          <div className="flex justify-between items-center mb-2">
            <h2 className={`font-bold text-lg ${accent.iconBg} flex items-center gap-2 tracking-tight`}>
              <CatIcon className="h-5 w-5" />
              {catConfig.name} Trials
            </h2>
          </div>

          {/* Category Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full`} style={{ background: catConfig.color.hex }} />
                <span>{catConfig.name}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {catDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {Object.values(CATEGORIES)
                  .filter(cat => hasAccess(user, cat.id, 'read'))
                  .map(cat => {
                    const Icon = ICON_MAP[cat.icon] || FlaskConical;
                    const canAccess = hasAccess(user, cat.id, 'read');
                    const isActive = cat.id === activeCategory;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => canAccess && handleCategorySwitch(cat.id)}
                        disabled={!canAccess}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs transition
                          ${isActive ? 'bg-slate-100 font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}
                          ${!canAccess ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: cat.color.hexLight }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: cat.color.hex }} />
                        </div>
                        <span>{cat.name}</span>
                        {isActive && <span className="ml-auto text-[9px] font-bold uppercase text-slate-400">Active</span>}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-grow overflow-y-auto p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 768 && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? `${accent.activeBg} shadow-sm`
                    : `text-slate-600 ${accent.hoverBg} hover:translate-x-1`
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-8 border-t border-slate-200/50">
            {filteredBottomItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 768 && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? `${accent.activeBg} shadow-sm`
                      : `text-slate-600 ${accent.hoverBg} hover:translate-x-1`
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}

            {isAdmin && (
              <div className="border-t border-slate-200/50 mt-4 pt-4 space-y-1">
                <NavLink
                  to="/users"
                  onClick={() => window.innerWidth < 768 && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? `${accent.activeBg} shadow-sm`
                        : `text-slate-600 ${accent.hoverBg} hover:translate-x-1`
                    }`
                  }
                >
                  <Users className="w-5 h-5" />
                  <span>User Management</span>
                </NavLink>
                <NavLink
                  to="/migration"
                  onClick={() => window.innerWidth < 768 && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-100 text-orange-800 shadow-sm'
                        : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700 hover:translate-x-1'
                    }`
                  }
                >
                  <Flame className="w-5 h-5" />
                  <span className="flex items-center gap-1.5">
                    Firebase Migration
                    {firebaseEnabled && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">ON</span>}
                  </span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {user && (
          <div className="mt-auto p-4 border-t border-slate-200/50 bg-white/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase" style={{ background: catConfig.color.hexLight, color: catConfig.color.hex }}>
                {user.username?.[0] || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-800 truncate">{user.username}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{user.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
