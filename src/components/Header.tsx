import React, { useState } from 'react';
import { useCareX, NavigationTab } from '../context/CareXContext';
import { UserRole } from '../types/carex';
import { Map2MedicLogo } from './Map2MedicLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  HeartPulse, 
  User, 
  Stethoscope, 
  ShieldCheck, 
  PhoneCall, 
  ChevronDown,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Bell
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    setActiveTab, 
    activeTab,
    bookings,
    activeRole, 
    openAuthModal,
    isLoggedIn,
    logout,
    patientUser
  } = useCareX();

  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  const activeBookingsCount = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;

  const patientTabs: { label: string; tab: NavigationTab; badge?: number }[] = [
    { label: 'Services', tab: 'home' },
    { label: 'Book Visit', tab: 'booking' },
    { label: 'Nearby Map', tab: 'nearby' },
    { label: 'My Care', tab: 'patient-portal', badge: activeBookingsCount > 0 ? activeBookingsCount : undefined },
  ];

  const providerTabs: { label: string; tab: NavigationTab; badge?: number }[] = [
    { label: 'Provider Hub', tab: 'provider-portal' },
    { label: 'Services', tab: 'home' },
    { label: 'Nearby Map', tab: 'nearby' },
  ];

  const adminTabs: { label: string; tab: NavigationTab; badge?: number }[] = [
    { label: 'Admin Review', tab: 'admin-portal' },
    { label: 'Services', tab: 'home' },
    { label: 'All Screens', tab: 'all-screens' },
  ];

  const navTabs = activeRole === 'patient' 
    ? patientTabs 
    : activeRole === 'provider' 
      ? providerTabs 
      : adminTabs;

  const roleLabels: Record<UserRole, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
    patient: {
      title: 'Patient',
      subtitle: patientUser.name || 'Patient Member',
      icon: <User className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    provider: {
      title: 'Care Specialist',
      subtitle: 'Provider Portal',
      icon: <Stethoscope className="w-4 h-4 text-teal-600" />,
      color: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    admin: {
      title: 'Medical Board',
      subtitle: 'Admin Review',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  };

  const handleSelectRoleAuth = (role: UserRole, mode: 'login' | 'signup' = 'login') => {
    setAuthDropdownOpen(false);
    openAuthModal(role, mode);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro emergency alert bar */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white text-[11px] py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">
              Map2Medic Live Dispatch Network active: Average home arrival <strong className="text-emerald-300">22 mins</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:18002273963" className="flex items-center gap-1.5 text-teal-200 hover:text-white transition-colors">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold">24/7 Clinical Triage: 1-800-MAP2MEDIC</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Clicking takes back to Map2Medic Health home page */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Map2MedicLogo size="md" />
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 self-center">
              Health
            </span>
          </div>

          {/* Centered Navigation Tabs - Only shown if logged in */}
          {isLoggedIn && (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 border border-slate-200/50 p-1 rounded-2xl">
              {navTabs.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-xs border border-teal-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`flex items-center justify-center min-w-4.5 h-4.5 text-[9px] font-extrabold rounded-full px-1.5 ${
                        isActive ? 'bg-white text-teal-800' : 'bg-rose-500 text-white animate-pulse'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Header Actions: Visible Login/Signup or Log Out based on session */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />
            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell Button */}
                <button
                  onClick={() => setActiveTab(activeRole === 'patient' ? 'patient-portal' : activeRole === 'provider' ? 'provider-portal' : 'admin-portal')}
                  className="p-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-xl transition-all border border-slate-200/80 relative cursor-pointer"
                  title="View Dispatch Notifications & Alerts"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                </button>

                {/* Current Active Role Pill */}
                <div 
                  onClick={() => setActiveTab(activeRole === 'patient' ? 'patient-portal' : activeRole === 'provider' ? 'provider-portal' : 'admin-portal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer hover:opacity-90 transition-all ${roleLabels[activeRole].color}`}
                  title="Click to view current portal"
                >
                  {roleLabels[activeRole].icon}
                  <span>
                    {activeRole === 'patient' ? patientUser.name : (activeRole === 'provider' ? 'Provider Portal' : 'Admin Board')}
                  </span>
                </div>

                {/* Log Out Button */}
                <button
                  onClick={logout}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-xl transition-all border border-slate-200/80 flex items-center gap-1.5 active:scale-98 shadow-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              /* VISIBLE LOGIN / SIGNUP BUTTON WITH 3 OPTIONS */
              <div className="relative">
                <button
                  onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all hover:shadow-lg active:scale-98 cursor-pointer"
                  aria-expanded={authDropdownOpen}
                >
                  <LogIn className="w-4 h-4 text-teal-200" />
                  <span>Log In / Sign Up</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-teal-200 transition-transform duration-200 ${authDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* DROPDOWN MENU WITH 3 OPTIONS: PATIENT, CARE PROVIDER, ADMIN */}
                {authDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setAuthDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                            Select Account Role
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-teal-600" /> Log In &amp; Sign Up
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Choose whether to log in or create a new account
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {/* Option 1: Patient Card with Log In & Sign Up buttons */}
                        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">1. Patient</h4>
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  Families
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Book and track on-demand home visits</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
                            <button
                              onClick={() => handleSelectRoleAuth('patient', 'login')}
                              className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <LogIn className="w-3 h-3" />
                              Log In
                            </button>
                            <button
                              onClick={() => handleSelectRoleAuth('patient', 'signup')}
                              className="flex-1 py-1.5 px-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              Sign Up
                            </button>
                          </div>
                        </div>

                        {/* Option 2: Care Provider Card with Log In & Sign Up buttons */}
                        <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50/70 transition-all">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">2. Care Provider</h4>
                                <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded">
                                  Clinicians &amp; RNs
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Accept visits, manage schedule &amp; earnings</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-teal-100">
                            <button
                              onClick={() => handleSelectRoleAuth('provider', 'login')}
                              className="flex-1 py-1.5 px-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <LogIn className="w-3 h-3" />
                              Log In
                            </button>
                            <button
                              onClick={() => handleSelectRoleAuth('provider', 'signup')}
                              className="flex-1 py-1.5 px-2 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              Sign Up / Apply
                            </button>
                          </div>
                        </div>

                        {/* Option 3: Admin Card with Log In & Sign Up buttons */}
                        <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50/70 transition-all">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">3. Admin</h4>
                                <span className="text-[9px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded">
                                  Medical Board
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Audit licenses &amp; verify service pricing</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-purple-100">
                            <button
                              onClick={() => handleSelectRoleAuth('admin', 'login')}
                              className="flex-1 py-1.5 px-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <LogIn className="w-3 h-3" />
                              Log In
                            </button>
                            <button
                              onClick={() => handleSelectRoleAuth('admin', 'signup')}
                              className="flex-1 py-1.5 px-2 bg-white border border-purple-300 hover:bg-purple-50 text-purple-800 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              Sign Up
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Active profile badge in footer */}
                      <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-1 font-semibold">
                        <span>Currently active: <strong className="text-slate-800">{roleLabels[activeRole].title}</strong></span>
                        <button
                          onClick={() => {
                            setAuthDropdownOpen(false);
                            setActiveTab(activeRole === 'patient' ? 'patient-portal' : activeRole === 'provider' ? 'provider-portal' : 'admin-portal');
                          }}
                          className="text-teal-700 font-bold hover:underline cursor-pointer"
                        >
                          Go to Portal →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
