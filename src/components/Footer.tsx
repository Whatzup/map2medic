import React from 'react';
import { useCareX } from '../context/CareXContext';
import { Map2MedicLogo } from './Map2MedicLogo';
import { HeartPulse, ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setActiveRole, openAuthModal } = useCareX();

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Map2MedicLogo variant="light" size="md" />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              On-demand hospital-grade healthcare at home. Connecting certified medical practitioners, doctors, and clinics directly with patients.
            </p>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA Compliant & Board Certified</span>
            </div>
          </div>

          {/* Quick Services */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Care Services</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-teal-400 transition-colors">
                  Wound Dressing & Sterile Care
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-teal-400 transition-colors">
                  Doctor & Physician Home Visits
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-teal-400 transition-colors">
                  Post-Op Physical Therapy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-teal-400 transition-colors">
                  In-Home Lab Draw & ECG
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-teal-400 transition-colors">
                  Elderly Bedside Care
                </button>
              </li>
            </ul>
          </div>

          {/* Portals & Governance */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">System Portals</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => { setActiveRole('patient'); setActiveTab('patient-portal'); }} className="hover:text-teal-400 transition-colors">
                  Patient Health Records
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveRole('provider'); setActiveTab('provider-portal'); }} className="hover:text-teal-400 transition-colors">
                  Provider On-Call Hub
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveRole('admin'); setActiveTab('admin-portal'); }} className="hover:text-teal-400 transition-colors">
                  Admin Credential Review
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('nearby')} className="hover:text-teal-400 transition-colors">
                  Nearby Provider Radar
                </button>
              </li>
              <li>
                <button onClick={() => openAuthModal()} className="hover:text-teal-400 transition-colors">
                  SMS OTP Login
                </button>
              </li>
            </ul>
          </div>

          {/* Emergency & Support */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">24/7 Clinical Desk</h4>
            <p className="text-xs text-slate-300 font-semibold flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              1-800-MAP2MEDIC (Toll-Free)
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-400" />
              clinical.support@map2medic.health
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              Springfield Metro Medical District
            </p>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Map2Medic Healthcare Technologies. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-md text-slate-500">
            Map2Medic provides licensed out-of-hospital medical assistance. In case of life-threatening emergencies, dial 911 immediately.
          </p>
        </div>
      </div>
    </footer>
  );
};
