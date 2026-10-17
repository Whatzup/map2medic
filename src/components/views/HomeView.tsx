import React, { useState, useMemo } from 'react';
import { useCareX } from '../../context/CareXContext';
import { ServiceCategory, ServiceItem } from '../../types/carex';
import { 
  HeartPulse, 
  Search, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Star, 
  MapPin, 
  PhoneCall, 
  Sparkles, 
  Activity, 
  Stethoscope, 
  Calendar, 
  FileText,
  BadgeCheck,
  Zap,
  Users
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { 
    services, 
    providers, 
    startBookingWithService, 
    setActiveTab,
    openAuthModal 
  } = useCareX();

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: ServiceCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Services', icon: '🩺' },
    { id: 'basic_nursing', label: 'Basic Nursing Care', icon: '🩹' },
    { id: 'clinical_procedures', label: 'Clinical Procedures', icon: '💉' },
    { id: 'post_hospital_recovery', label: 'Post-OP Recovery', icon: '❤️' },
    { id: 'elderly_care', label: 'Elderly Care', icon: '👴' },
    { id: 'rehab_support', label: 'Rehab Support', icon: '⚡' },
    { id: 'diagnostic_assistance', label: 'Diagnostics & Labs', icon: '🧪' },
    { id: 'emergency_support', label: 'Emergency Support', icon: '🚨' },
    { id: 'add_on_services', label: 'Add-on Services', icon: '📦' }
  ];

  const filteredServices = useMemo(() => {
    return services.filter(srv => {
      const matchCat = selectedCategory === 'all' || srv.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        srv.name.toLowerCase().includes(query) || 
        srv.description.toLowerCase().includes(query) ||
        srv.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-800 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>Map2Medic Certified Home Healthcare Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
                Hospital-Grade Care, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-100">
                  Right in Your Living Room
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
                Connect on-demand with licensed nurses, physicians, physiotherapists, and phlebotomists. 
                Transparent pricing, background-checked specialists, and sterile home visits.
              </p>

              {/* Fast Search input */}
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl max-w-xl">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-inner">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search wound dressing, doctor visit, blood test, ECG..."
                    className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Board-Certified Specialists</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Sterile Protocols & PPE Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Avg. Arrival in 25 Mins</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Highlight Card & Live Activity */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-teal-300 font-bold">Fast Dispatch</span>
                    <h3 className="text-xl font-bold font-heading text-white">Need Urgent Home Care?</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => {
                      const wound = services.find(s => s.id === 'srv-dressing-wound-care');
                      if (wound) startBookingWithService(wound);
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-102 group"
                  >
                    <span className="text-2xl mb-1 block">🩹</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300">Wound & IV Care</h4>
                    <p className="text-[10px] text-teal-200 mt-0.5">from ₹199/visit</p>
                  </div>

                  <div 
                    onClick={() => {
                      const gp = services.find(s => s.id === 'srv-doctor-escalation');
                      if (gp) startBookingWithService(gp);
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-102 group"
                  >
                    <span className="text-2xl mb-1 block">👨‍⚕️</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300">Doctor Support</h4>
                    <p className="text-[10px] text-teal-200 mt-0.5">from ₹499/consult</p>
                  </div>

                  <div 
                    onClick={() => {
                      const physio = services.find(s => s.id === 'srv-physiotherapy-assistance');
                      if (physio) startBookingWithService(physio);
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-102 group"
                  >
                    <span className="text-2xl mb-1 block">⚡</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300">Physiotherapy</h4>
                    <p className="text-[10px] text-teal-200 mt-0.5">from ₹499/session</p>
                  </div>

                  <div 
                    onClick={() => {
                      const lab = services.find(s => s.id === 'srv-sample-collection');
                      if (lab) startBookingWithService(lab);
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-102 group"
                  >
                    <span className="text-2xl mb-1 block">🧪</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300">Home Lab Tests</h4>
                    <p className="text-[10px] text-teal-200 mt-0.5">from ₹49/sample</p>
                  </div>
                </div>

                {/* Nearby map quick CTA */}
                <div 
                  onClick={() => setActiveTab('nearby')}
                  className="p-3.5 rounded-2xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-400/40 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500 text-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">See 14 Available Providers</p>
                      <p className="text-[10px] text-teal-200">Interactive radar map & ETAs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Counter Bar */}
      <section className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 font-heading">18,500+</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Home Visits Completed</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 font-heading">4.94 / 5.0</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Patient Satisfaction Score</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 font-heading">100%</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Verified Medical Credentials</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 font-heading">&lt; 25 mins</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Average On-Demand Arrival</p>
          </div>
        </div>
      </section>

      {/* Services Catalog Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Transparent Healthcare Pricing</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-slate-900">Healthcare Services Catalog</h2>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              All procedures include certified practitioner visits, sterile kits, and digital medical summary. No hidden fees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Showing {filteredServices.length} services</span>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedCategory === cat.id
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-slate-50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            return (
              <div
                key={service.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                      {service.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                        {service.serviceType}
                      </span>
                      {service.popular && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                          ★ Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Duration and details */}
                  <div className="flex items-center gap-3 my-4 text-xs text-slate-500 border-y border-slate-100 py-2.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{service.duration}</span>
                    </div>
                    {service.requiresPrescription && (
                      <div className="flex items-center gap-1 text-amber-700 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Prescription required</span>
                      </div>
                    )}
                  </div>

                  {/* Included features list */}
                  <div className="space-y-1.5 mb-6">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">What&apos;s Included:</p>
                    {service.includes.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900 font-heading">
                        ₹{service.price}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {service.baseAmountLabel}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">Insurance reimbursable</span>
                  </div>

                  <button
                    onClick={() => startBookingWithService(service)}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/20 group-hover:scale-105"
                  >
                    <span>Book Visit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching healthcare services found</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for other terms like &quot;wound&quot;, &quot;doctor&quot;, or &quot;ECG&quot;</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Featured Verified Specialists Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">Medical Credentialing</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading mt-1">
                Verified Medical Practitioners on Duty
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Every provider undergoes background clearance, state medical board validation, and strict clinical skill assessment.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('nearby')}
              className="px-5 py-2.5 bg-white text-teal-900 rounded-xl text-xs font-bold hover:bg-teal-50 transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <span>Explore Provider Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {providers.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center">
              <Stethoscope className="w-8 h-8 text-teal-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No Registered Healthcare Providers Nearby Yet</p>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                Sign up as a care provider to join the Map2Medic healthcare network and receive dispatch requests.
              </p>
              <button
                onClick={() => openAuthModal('provider', 'signup')}
                className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Register as Care Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {providers.slice(0, 3).map((prov) => (
                <div
                  key={prov.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <img
                      src={prov.avatar}
                      alt={prov.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-teal-300/40"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1">
                        {prov.name}
                        <BadgeCheck className="w-3.5 h-3.5 text-teal-300" />
                      </h4>
                      <p className="text-xs text-teal-200 font-medium">{prov.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                        <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                          <Star className="w-3 h-3 fill-amber-300" /> {prov.rating}
                        </span>
                        <span>•</span>
                        <span>{prov.experienceYears} yrs exp</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 italic mb-4">
                    &quot;{prov.bio}&quot;
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
                    <span className="text-teal-200 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {prov.distanceKm} km away ({prov.etaMinutes}m ETA)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Available Now
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Seamless Experience</span>
          <h2 className="text-3xl font-bold font-heading text-slate-900 mt-1">How Map2Medic Works</h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Professional in-home clinical care arranged in three quick steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-lg mx-auto mb-4 font-heading">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Select Your Medical Service</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose from wound care, doctor consultations, physical therapy, or diagnostic blood tests with fixed rates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-lg mx-auto mb-4 font-heading">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Specialist Dispatched to Door</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A background-checked, licensed healthcare professional arrives with hospital-grade sterile kits and PPE.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-lg mx-auto mb-4 font-heading">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Digital Report & Prescriptions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive your vital signs chart, clinical treatment notes, and digital prescriptions in your patient portal instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Assistance Footer Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Life-Threatening Emergency?</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                For severe chest pain, stroke symptoms, or severe trauma, call 911 or visit the nearest ER immediately.
              </p>
            </div>
          </div>
          <a
            href="tel:911"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Emergency 911
          </a>
        </div>
      </section>
    </div>
  );
};
