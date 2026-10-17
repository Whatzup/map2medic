import React, { useState } from 'react';
import { useCareX } from '../../context/CareXContext';
import { NavigationTab } from '../../context/CareXContext';
import { UserRole } from '../../types/carex';
import { 
  Layers, 
  Monitor, 
  Tablet, 
  Smartphone, 
  ArrowRight, 
  HeartPulse, 
  Calendar, 
  MapPin, 
  User, 
  Stethoscope, 
  ShieldCheck, 
  Lock,
  ExternalLink
} from 'lucide-react';

export const AllScreensView: React.FC = () => {
  const { setActiveTab, setActiveRole, openAuthModal } = useCareX();

  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const screens: {
    id: string;
    title: string;
    role: UserRole;
    tab: NavigationTab;
    icon: any;
    color: string;
    description: string;
    keyFeatures: string[];
    isModal?: boolean;
  }[] = [
    {
      id: 'screen-home',
      title: 'Map2Medic Home & Service Directory',
      role: 'patient',
      tab: 'home',
      icon: HeartPulse,
      color: 'from-teal-600 to-emerald-600',
      description: 'Public catalog of healthcare procedures, pricing per visit, board-verified doctor/nurse spotlights, and emergency helpline.',
      keyFeatures: ['Search & category filtering', 'Transparent pricing', 'Verified provider badges', '24/7 Triage hotline']
    },
    {
      id: 'screen-booking',
      title: 'Healthcare Visit Booking Wizard',
      role: 'patient',
      tab: 'booking',
      icon: Calendar,
      color: 'from-teal-700 to-teal-900',
      description: '4-step interactive booking flow: Service selection, clinical symptom notes & allergy checks, address/slot, and insurance/card checkout.',
      keyFeatures: ['Visit add-ons (sterile kit, express 1h)', 'Allergy safety alert', 'Provider auto-match', 'Real-time booking ID']
    },
    {
      id: 'screen-nearby',
      title: 'Nearby Providers & Live Radar Map',
      role: 'patient',
      tab: 'nearby',
      icon: MapPin,
      color: 'from-emerald-600 to-teal-800',
      description: 'Geographic locator showing certified practitioners on duty within 2-20km, distance calculations, arrival ETAs, and verified credentials.',
      keyFeatures: ['Radar map simulation', 'Distance & arrival ETA', 'Specialty filters (RN, MD, PT, Lab)', 'Direct call / booking']
    },
    {
      id: 'screen-patient',
      title: 'Patient Portal & Vitals Log',
      role: 'patient',
      tab: 'patient-portal',
      icon: User,
      color: 'from-blue-600 to-indigo-700',
      description: 'Patient personal dashboard with live visit stage progression bar (En Route -> Arrived -> Completed), vitals history, and PDF receipts.',
      keyFeatures: ['Visual progress tracker', 'Blood pressure & pulse chart', 'Family member profiles', 'Downloadable invoices']
    },
    {
      id: 'screen-provider',
      title: 'Care Specialist Dispatch Hub',
      role: 'provider',
      tab: 'provider-portal',
      icon: Stethoscope,
      color: 'from-teal-600 to-cyan-700',
      description: 'Healthcare provider workstation: Online/Offline status switch, active job lifecycle updater, vitals recording modal, and earnings ledger.',
      keyFeatures: ['Online/Offline toggle', 'En Route / Arrived / Completed status', 'Vitals entry (BP, Pulse, SpO2)', 'Payout transfer request']
    },
    {
      id: 'screen-admin',
      title: 'Admin Review & Pricing Governance',
      role: 'admin',
      tab: 'admin-portal',
      icon: ShieldCheck,
      color: 'from-purple-600 to-indigo-800',
      description: 'Administrative governance portal: Board review of uploaded medical licenses & IDs, dynamic catalog pricing editor, and dispatch monitor.',
      keyFeatures: ['Credential approval / rejection', 'Live price & billing unit editor', 'Add new procedures', 'Platform-wide GMV metrics']
    },
    {
      id: 'screen-auth',
      title: 'Phone & Email OTP Authentication',
      role: 'patient',
      tab: 'home',
      isModal: true,
      icon: Lock,
      color: 'from-slate-700 to-slate-900',
      description: 'Secure multi-role authentication modal supporting 4-digit SMS OTP verification, and instant 1-click test profiles.',
      keyFeatures: ['Simulated 4-digit SMS OTP', 'Role selection (Patient, Provider, Admin)', 'Auto-fill test code', 'Persistent session']
    }
  ];

  const handleLaunchScreen = (screen: typeof screens[0]) => {
    setActiveRole(screen.role);
    if (screen.isModal) {
      openAuthModal(screen.role);
    } else {
      setActiveTab(screen.tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Full-Stack Healthcare Application Matrix
              </span>
            </div>
            <h1 className="text-3xl font-bold font-heading text-slate-900">
              Map2Medic Screen Showcase & Architecture
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
              Map2Medic features dedicated interfaces for patients, medical practitioners, and governance boards. 
              Click any portal card below to launch and test its full functionality.
            </p>
          </div>

          {/* Device Frame Switcher */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setDeviceFrame('desktop')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                deviceFrame === 'desktop' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                deviceFrame === 'tablet' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDeviceFrame('mobile')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                deviceFrame === 'mobile' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobile (375px)</span>
            </button>
          </div>
        </div>

        {/* Screen Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map(screen => {
            const Icon = screen.icon;

            return (
              <div
                key={screen.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card top banner */}
                  <div className={`p-6 bg-gradient-to-r ${screen.color} text-white relative`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/20 text-white/90">
                      {screen.role.toUpperCase()} PORTAL
                    </span>
                    <h3 className="text-lg font-bold font-heading text-white mt-1.5">
                      {screen.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {screen.description}
                    </p>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Core Capabilities
                      </span>
                      <div className="space-y-1.5">
                        {screen.keyFeatures.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleLaunchScreen(screen)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group-hover:bg-teal-700"
                  >
                    <span>Launch & Test Screen</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsive Device Frame Information Bar */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Adaptive Responsive Viewport</h4>
              <p className="text-[11px] text-slate-500">
                Map2Medic is fully optimized for desktop workstations, clinician tablets, and mobile patient devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveRole('patient'); setActiveTab('home'); }}
              className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors"
            >
              Start as Patient
            </button>
            <button
              onClick={() => { setActiveRole('provider'); setActiveTab('provider-portal'); }}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Start as Provider
            </button>
            <button
              onClick={() => { setActiveRole('admin'); setActiveTab('admin-portal'); }}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Start as Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
