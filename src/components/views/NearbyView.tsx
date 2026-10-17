import React, { useState, useMemo } from 'react';
import { useCareX } from '../../context/CareXContext';
import { HealthcareProvider } from '../../types/carex';
import { 
  MapPin, 
  Search, 
  Star, 
  Navigation, 
  Clock, 
  Phone, 
  ShieldCheck, 
  BadgeCheck, 
  Calendar, 
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';

export const NearbyView: React.FC = () => {
  const { providers, startBookingWithService, services, showToast } = useCareX();

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderForModal, setSelectedProviderForModal] = useState<HealthcareProvider | null>(null);

  const specialties = [
    { id: 'all', label: 'All Specialties' },
    { id: 'nurse', label: 'Registered Nurses (RN)' },
    { id: 'doctor', label: 'Physicians (MD)' },
    { id: 'physio', label: 'Physiotherapists' },
    { id: 'lab', label: 'Phlebotomy / Lab Techs' }
  ];

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      // Specialty check
      let matchesSpec = true;
      if (selectedSpecialty === 'nurse') matchesSpec = p.title.toLowerCase().includes('nurse');
      else if (selectedSpecialty === 'doctor') matchesSpec = p.title.toLowerCase().includes('physician') || p.title.toLowerCase().includes('md');
      else if (selectedSpecialty === 'physio') matchesSpec = p.title.toLowerCase().includes('physio');
      else if (selectedSpecialty === 'lab') matchesSpec = p.title.toLowerCase().includes('lab') || p.title.toLowerCase().includes('phleb');

      // Distance check
      const matchesDist = p.distanceKm <= maxDistance;

      // Available check
      const matchesAvail = !onlyAvailable || p.isAvailable;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        p.name.toLowerCase().includes(q) || 
        p.title.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q);

      return matchesSpec && matchesDist && matchesAvail && matchesQuery;
    });
  }, [providers, selectedSpecialty, maxDistance, onlyAvailable, searchQuery]);

  const handleBookProvider = (prov: HealthcareProvider) => {
    // Pick the most relevant service for this provider
    let matchedSrv = services[0];
    if (prov.title.includes('Physician')) {
      matchedSrv = services.find(s => s.category === 'doctor') || services[0];
    } else if (prov.title.includes('Physio')) {
      matchedSrv = services.find(s => s.category === 'physiotherapy') || services[0];
    } else if (prov.title.includes('Lab') || prov.title.includes('Phleb')) {
      matchedSrv = services.find(s => s.category === 'diagnostics') || services[0];
    } else {
      matchedSrv = services.find(s => s.category === 'nursing') || services[0];
    }

    startBookingWithService(matchedSrv);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Live Geographic Healthcare Dispatch
              </span>
            </div>
            <h1 className="text-3xl font-bold font-heading text-slate-900">
              Nearby Medical Providers & Clinics
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
              Locate certified healthcare professionals currently on duty within your district. 
              Real-time response times, distance calculations, and immediate dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 shadow-xs">
              <Navigation className="w-4 h-4 text-teal-600" />
              <span>Current Location: <strong className="text-slate-900">Springfield Metro (Radius: {maxDistance}km)</strong></span>
            </div>
          </div>
        </div>

        {/* Interactive Radar Map Preview Simulation */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl border border-slate-800 h-80 sm:h-96">
          {/* Stylized Map Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
          
          {/* Concentric radar rings centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full border border-teal-500/20 animate-ping opacity-30" />
            <div className="w-96 h-96 rounded-full border border-teal-500/20" />
            <div className="w-[500px] h-[500px] rounded-full border border-teal-500/10" />
          </div>

          {/* User Location Center Pin */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-emerald-400 border-4 border-white shadow-lg shadow-emerald-400/50 animate-bounce" />
              <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                You Are Here
              </span>
            </div>
          </div>

          {/* Simulated Active Provider Radar Pins */}
          {providers.map((p, idx) => {
            // Calculate pseudo coordinates offset from center
            const angles = [45, 130, 220, 310, 85];
            const angle = angles[idx % angles.length];
            const dist = 60 + (p.distanceKm * 28);
            const x = Math.cos((angle * Math.PI) / 180) * dist;
            const y = Math.sin((angle * Math.PI) / 180) * dist;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProviderForModal(p)}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className="absolute inset-0 m-auto w-max h-max flex flex-col items-center cursor-pointer group z-20 transition-transform hover:scale-110"
              >
                <div className="relative">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal-400 shadow-lg group-hover:border-emerald-300"
                  />
                  {p.isAvailable ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                  )}
                </div>
                <div className="bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-teal-500/30 text-[10px] font-bold text-white shadow-md mt-1 whitespace-nowrap group-hover:bg-teal-700">
                  {p.name.split(',')[0]} • {p.etaMinutes}m
                </div>
              </div>
            );
          })}

          {/* Top Overlaid Map Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{filteredProviders.length} active practitioners in {maxDistance}km radius</span>
            </div>

            <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300 hidden sm:flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Avg arrival time: <strong>18 - 25 minutes</strong></span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by provider name, specialty..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          {/* Specialty filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {specialties.map(spec => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSpecialty === spec.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec.label}
              </button>
            ))}
          </div>

          {/* Distance and Availability slider */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Max:</span>
              <input
                type="range"
                min={2}
                max={20}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-20 accent-teal-600 cursor-pointer"
              />
              <span className="font-bold text-slate-800 w-8">{maxDistance}km</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Online Only</span>
            </label>
          </div>
        </div>

        {/* Providers Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map(prov => (
            <div
              key={prov.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={prov.avatar}
                      alt={prov.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                    {prov.isAvailable ? (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Online" />
                    ) : (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white" title="Offline" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{prov.name}</h3>
                      <BadgeCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    </div>
                    <p className="text-xs text-teal-700 font-semibold">{prov.title}</p>
                    
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {prov.rating}
                      </span>
                      <span>({prov.reviewCount} reviews)</span>
                      <span>•</span>
                      <span>{prov.completedVisits} visits</span>
                    </div>
                  </div>
                </div>

                {/* Location and ETA */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate max-w-[130px]">{prov.currentLocationName}</span>
                  </div>
                  <span className="font-bold text-teal-800">
                    {prov.distanceKm} km ({prov.etaMinutes}m ETA)
                  </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {prov.badges.map((b, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {prov.bio}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block leading-tight">Rate</span>
                  <span className="text-sm font-bold text-slate-900 font-heading">
                    ₹{prov.hourlyRate}/hr
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProviderForModal(prov)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                    title="View Verified Credentials & Documents"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleBookProvider(prov)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Visit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No medical providers match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try expanding the distance radius or deselecting &quot;Online Only&quot;.</p>
            <button
              onClick={() => { setMaxDistance(20); setSelectedSpecialty('all'); setOnlyAvailable(false); }}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>

      {/* Provider Details & Credentials Modal */}
      {selectedProviderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl">
            <div className="bg-teal-800 p-6 text-white relative">
              <button
                onClick={() => setSelectedProviderForModal(null)}
                className="absolute top-4 right-4 p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-teal-700"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <img
                  src={selectedProviderForModal.avatar}
                  alt={selectedProviderForModal.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-300"
                />
                <div>
                  <h3 className="text-lg font-bold font-heading">{selectedProviderForModal.name}</h3>
                  <p className="text-xs text-teal-200">{selectedProviderForModal.title}</p>
                  <p className="text-[11px] text-teal-300 mt-1">
                    ★ {selectedProviderForModal.rating} • {selectedProviderForModal.experienceYears} Years Experience
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Practitioner Biography
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedProviderForModal.bio}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Verified Medical Credentials & Licensure
                </h4>
                <div className="space-y-2">
                  {selectedProviderForModal.documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{doc.docType}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{doc.fileName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        doc.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <a
                  href={`tel:${selectedProviderForModal.phone}`}
                  className="flex-1 py-2.5 border border-teal-600 text-teal-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-teal-50"
                >
                  <Phone className="w-4 h-4" />
                  Call Clinic Desk
                </a>
                <button
                  onClick={() => {
                    const p = selectedProviderForModal;
                    setSelectedProviderForModal(null);
                    handleBookProvider(p);
                  }}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
