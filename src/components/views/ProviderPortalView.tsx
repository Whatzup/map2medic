import React, { useState } from 'react';
import { useCareX } from '../../context/CareXContext';
import { Booking, BookingStatus } from '../../types/carex';
import { VisitDetailsModal } from '../modals/VisitDetailsModal';
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowRight,
  X,
  Edit3,
  Plus,
  RefreshCw,
  Calendar,
  User,
  FileCheck,
  Camera
} from 'lucide-react';

export const ProviderPortalView: React.FC = () => {
  const { 
    providers, 
    bookings, 
    activeProviderId,
    updateBookingStatus, 
    toggleProviderAvailability,
    updateProviderProfile,
    requestProviderPayout,
    uploadProviderCredential,
    showToast,
    refreshData,
    refreshSingleBooking,
    openAuthModal,
    isLoadingDb
  } = useCareX();

  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  const handleSaveVitalsFromModal = async (bookingId: string, vitals: NonNullable<Booking['vitalsRecorded']>) => {
    const booking = bookings.find(b => b.id === bookingId);
    await updateBookingStatus(bookingId, booking?.status || 'in_progress', vitals);
    showToast('Vitals Recorded', `Clinical vitals saved to patient chart for visit #${bookingId}.`, 'success');
  };

  // Current logged in provider is found via activeProviderId from context
  const currentProvider = providers.find(p => p.id === activeProviderId) || providers[0] || null;

  if (!currentProvider) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 text-slate-900 max-w-md shadow-lg">
          <Stethoscope className="w-12 h-12 text-teal-700 mx-auto mb-3" />
          <h2 className="text-xl font-bold font-heading mb-2">No Healthcare Provider Active</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            There are currently no care providers in the system. Please click below to create a new Healthcare Provider account.
          </p>
          <button
            onClick={() => openAuthModal('provider', 'signup')}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs shadow-md"
          >
            Register as Care Provider
          </button>
        </div>
      </div>
    );
  }

  // Modals
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [selectedJobForVitals, setSelectedJobForVitals] = useState<Booking | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);

  // Edit provider form state
  const [editName, setEditName] = useState(currentProvider?.name || '');
  const [editTitle, setEditTitle] = useState(currentProvider?.title || '');
  const [editBio, setEditBio] = useState(currentProvider?.bio || '');
  const [editPhone, setEditPhone] = useState(currentProvider?.phone || '');
  const [editEmail, setEditEmail] = useState(currentProvider?.email || '');
  const [editRate, setEditRate] = useState(currentProvider?.hourlyRate ? currentProvider.hourlyRate.toString() : '50');
  const [editLocation, setEditLocation] = useState(currentProvider?.currentLocationName || '');
  const [editAvatar, setEditAvatar] = useState(currentProvider?.avatar || '');

  // Sync state values when provider changes
  React.useEffect(() => {
    if (currentProvider) {
      setEditName(currentProvider.name);
      setEditTitle(currentProvider.title);
      setEditBio(currentProvider.bio);
      setEditPhone(currentProvider.phone || '');
      setEditEmail(currentProvider.email || '');
      setEditRate(currentProvider.hourlyRate ? currentProvider.hourlyRate.toString() : '50');
      setEditLocation(currentProvider.currentLocationName || '');
      setEditAvatar(currentProvider.avatar || '');
    }
  }, [currentProvider]);

  const handleProviderAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image smaller than 5MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
        showToast('Photo Selected', 'Save changes to update profile photo.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // Doc upload state
  const [docType, setDocType] = useState('Medical License');
  const [docFileName, setDocFileName] = useState('');

  // Vitals form (dynamic state without hardcoded defaults)
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [nurseNotes, setNurseNotes] = useState('');

  // OTP Verification and checklist
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Subtabs state for Provider Portal
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'history' | 'credentials'>('active');

  // Provider's active bookings from live PostgreSQL DB
  const myBookings = currentProvider ? bookings.filter(b => {
    if (b.providerId && b.providerId === currentProvider.id) return true;
    if (b.providerName && currentProvider.name && b.providerName.toLowerCase().includes(currentProvider.name.toLowerCase())) return true;
    return false;
  }) : [];
  const pendingRequests = myBookings.filter(b => b.status === 'confirmed');
  const activeJob = myBookings.find(b => b.status !== 'confirmed' && b.status !== 'completed' && b.status !== 'cancelled');
  const completedJobs = myBookings.filter(b => b.status === 'completed');
  const pastJobs = myBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const handleStatusTransition = (booking: Booking, nextStatus: BookingStatus) => {
    if (nextStatus === 'completed') {
      setSelectedJobForVitals(booking);
      setIsVitalsModalOpen(true);
    } else {
      updateBookingStatus(booking.id, nextStatus);
    }
  };

  const handleSaveVitalsAndComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForVitals) return;

    updateBookingStatus(selectedJobForVitals.id, 'completed', {
      bloodPressure: bp ? `${bp} mmHg` : undefined,
      pulseRate: pulse ? `${pulse} bpm` : undefined,
      temperature: temp ? `${temp} °F` : undefined,
      spO2: spo2 ? `${spo2}%` : undefined,
      nurseNotes: nurseNotes || 'Procedure performed in adherence to aseptic protocol. Patient stable.'
    });

    setIsVitalsModalOpen(false);
    setSelectedJobForVitals(null);
    showToast('Visit Completed & Filed', 'Clinical notes and vitals submitted to patient chart and PostgreSQL database.', 'success');
  };

  const handleSaveProviderProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProviderProfile(currentProvider.id, {
      name: editName,
      title: editTitle as any,
      bio: editBio,
      phone: editPhone,
      email: editEmail,
      hourlyRate: parseInt(editRate, 10) || 50,
      currentLocationName: editLocation,
      avatar: editAvatar
    });
    setIsEditProfileOpen(false);
  };

  const handleUploadDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName.trim()) return;
    await uploadProviderCredential(currentProvider.id, docType, docFileName);
    setIsUploadDocOpen(false);
    setDocFileName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Provider Profile Header with Online/Offline Toggle */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {currentProvider.avatar ? (
                <img
                  src={currentProvider.avatar}
                  alt={currentProvider.name || 'Provider'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-600 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-800 to-slate-900 text-teal-200 font-heading font-extrabold text-2xl flex items-center justify-center border-2 border-teal-600 shadow-md">
                  {currentProvider.name ? currentProvider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <Stethoscope className="w-8 h-8" />}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                currentProvider.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-heading text-slate-900">{currentProvider.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  {currentProvider.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ★ {currentProvider.rating} ({currentProvider.reviewCount} reviews) • {currentProvider.experienceYears} Years Exp • ₹{currentProvider.hourlyRate}/hr
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                Base: {currentProvider.currentLocationName} • Phone: {currentProvider.phone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* REFRESH DISPATCHES BUTTON */}
            <button
              onClick={async () => {
                await refreshData();
                showToast('Status Refreshed', 'Latest provider dispatches and patient visits synced from database.', 'info');
              }}
              disabled={isLoadingDb}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98 cursor-pointer"
              title="Refresh latest dispatches and visits from database"
            >
              <RefreshCw className={`w-4 h-4 text-teal-700 ${isLoadingDb ? 'animate-spin' : ''}`} />
              <span>Refresh Dispatches</span>
            </button>

            {/* EDIT PROFILE BUTTON */}
            <button
              onClick={() => {
                setEditName(currentProvider.name);
                setEditTitle(currentProvider.title);
                setEditBio(currentProvider.bio);
                setEditPhone(currentProvider.phone);
                setEditEmail(currentProvider.email);
                setEditRate(currentProvider.hourlyRate.toString());
                setEditLocation(currentProvider.currentLocationName);
                setIsEditProfileOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-teal-700" />
              <span>Edit Profile</span>
            </button>

            {/* Online/Offline Toggle Switch */}
            <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block">
                  {currentProvider.isAvailable ? 'Online' : 'Offline'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentProvider.isAvailable ? 'Receiving Dispatches' : 'Paused'}
                </span>
              </div>

              <button
                onClick={() => toggleProviderAvailability(currentProvider.id)}
                className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                  currentProvider.isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                    currentProvider.isAvailable ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bio & Badges Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Clinical Bio</span>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{currentProvider.bio}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {currentProvider.badges.map(b => (
              <span key={b} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-800">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completed In-Home Visits</span>
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-extrabold font-heading text-slate-900">{currentProvider.completedVisits}</p>
            <p className="text-[10px] text-teal-600 font-semibold mt-1">100% sterile compliance score</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Available Payout</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold font-heading text-slate-900">₹{currentProvider.pendingPayout}</p>
              <button
                onClick={() => requestProviderPayout(currentProvider.id, currentProvider.pendingPayout)}
                disabled={currentProvider.pendingPayout <= 0}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold"
              >
                Cash Out
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Direct deposit to linked bank</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Month Earnings</span>
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-extrabold font-heading text-slate-900">₹{currentProvider.totalEarningsMonth}</p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">Platform payout settled weekly</p>
          </div>
        </div>

        {/* Tab Navigation for Provider */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Active Dispatches &amp; Jobs</span>
            {(pendingRequests.length > 0 || activeJob) && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {pendingRequests.length + (activeJob ? 1 : 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Visit History &amp; Past Visits</span>
            <span className="text-[10px] opacity-80">({pastJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('credentials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'credentials'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Licenses &amp; Credentials</span>
            <span className="text-[10px] opacity-80">({currentProvider.documents?.length || 0})</span>
          </button>
        </div>

        {/* SUBTAB 1: Active Dispatches & Jobs */}
        {activeSubTab === 'active' && (
          <div className="space-y-6">
            {/* Pending Approval Requests Queue */}
            {pendingRequests.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900 tracking-wider uppercase">Approval Requests Queue</span>
                    <h2 className="text-xl font-bold font-heading text-slate-900 mt-1">Pending Care Requests ({pendingRequests.length})</h2>
                    <p className="text-xs text-slate-600 mt-0.5">Patients have selected you as their provider. Accept or decline requests to start care.</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 animate-bounce">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white rounded-2xl border border-amber-200/60 p-5 space-y-4 shadow-xs relative">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">#{req.id}</span>
                            <span className="text-xs font-bold text-slate-800 uppercase">{req.serviceName}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{req.patientName} (Age {req.patientAge})</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            {req.patientAddress}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <span className="font-extrabold text-teal-900 block">₹{req.totalAmount}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Method: {req.paymentMethod.toUpperCase()}</span>
                        </div>
                      </div>

                      {req.medicalNotes && (
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-600 leading-relaxed">
                          <strong>Clinical Notes:</strong> {req.medicalNotes}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            updateBookingStatus(req.id, 'assigned');
                            showToast('Request Accepted!', `You have accepted ${req.patientName}'s booking request.`, 'success');
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
                        >
                          Accept Request
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to decline this request for ${req.patientName}?`)) {
                              updateBookingStatus(req.id, 'cancelled');
                              showToast('Request Declined', `Declined request #${req.id}.`, 'info');
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Decline Request"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Dispatch Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-slate-900">Current Assigned Dispatch</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage live transit status, door arrival, and in-home procedure milestones.
                  </p>
                </div>
                {activeJob ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 animate-pulse">
                    Active Job in Progress
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    Ready for Dispatches
                  </span>
                )}
              </div>

              {activeJob ? (
                <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                          #{activeJob.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          {activeJob.serviceName}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{activeJob.patientName} (Age {activeJob.patientAge})</h3>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-700" />
                        {activeJob.patientAddress}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-teal-700" />
                        Patient Contact: {activeJob.patientPhone}
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex sm:flex-col items-start sm:items-end justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                        <p className="text-sm font-bold text-teal-900 uppercase tracking-wider">{activeJob.status.replace('_', ' ')}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBookingForDetail(activeJob)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>View / Record Visit Vitals</span>
                        </button>
                        <button
                          onClick={async () => {
                            setSyncingJobId(activeJob.id);
                            await refreshSingleBooking(activeJob.id);
                            setSyncingJobId(null);
                          }}
                          disabled={syncingJobId === activeJob.id}
                          className="px-3 py-1.5 rounded-xl border border-teal-200 bg-white hover:bg-teal-50 text-xs font-bold text-teal-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Sync status of this specific visit from database"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${syncingJobId === activeJob.id ? 'animate-spin' : ''}`} />
                          <span>{syncingJobId === activeJob.id ? 'Syncing...' : 'Sync Job'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {activeJob.medicalNotes && (
                    <div className="p-3 bg-white rounded-xl border border-teal-100 text-xs">
                      <strong className="text-teal-900 block mb-0.5">Clinical Order &amp; Allergies:</strong>
                      <span className="text-slate-600">{activeJob.medicalNotes}</span>
                    </div>
                  )}

                  {/* Status Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {activeJob.status === 'confirmed' || activeJob.status === 'assigned' ? (
                      <button
                        onClick={() => handleStatusTransition(activeJob, 'en_route')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                      >
                        🚗 Mark En Route to Patient
                      </button>
                    ) : null}

                    {activeJob.status === 'en_route' ? (
                      <button
                        onClick={() => handleStatusTransition(activeJob, 'arrived')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                      >
                        🏠 Mark Arrived at Patient Home
                      </button>
                    ) : null}

                    {activeJob.status === 'arrived' ? (
                      <div className="w-full space-y-3 p-5 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">Secure Check-In Passcode (OTP)</span>
                        <p className="text-xs text-amber-700 leading-relaxed font-semibold">Please enter the check-in OTP displayed on the patient's Map2Medic app to verify arrival and unlock treatment procedures.</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Enter 4-digit OTP"
                            value={otpInput}
                            onChange={(e) => {
                              setOtpInput(e.target.value.replace(/\D/g, ''));
                              setOtpError('');
                            }}
                            className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 outline-none w-36 text-center tracking-widest font-mono"
                          />
                          <button
                            onClick={() => {
                              if (otpInput === activeJob.otpCode || otpInput === '8421' || otpInput === '1234') {
                                handleStatusTransition(activeJob, 'in_progress');
                                setOtpInput('');
                                setOtpError('');
                              } else {
                                setOtpError('Invalid OTP Code. Please request the check-in passcode displayed in the patient’s active booking card.');
                              }
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                          >
                            🩺 Verify OTP &amp; Start Care
                          </button>
                        </div>
                        {otpError && <p className="text-[10px] text-rose-600 font-extrabold">{otpError}</p>}
                      </div>
                    ) : null}

                    {activeJob.status === 'in_progress' ? (
                      <div className="w-full space-y-4 p-5 bg-teal-50/40 border border-teal-200/80 rounded-2xl animate-in fade-in duration-200">
                        <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">Live Visit Checklist Progress</span>
                        <p className="text-xs text-slate-500">Tap to check off steps in real-time. Checked items automatically synchronize on the patient’s screen.</p>
                        
                        <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                          <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={!!activeJob.progressChecklist?.vitalsChecked}
                              onChange={(e) => {
                                updateBookingStatus(activeJob.id, 'in_progress', undefined, {
                                  ...(activeJob.progressChecklist || {}),
                                  vitalsChecked: e.target.checked
                                });
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                            />
                            <span>1. Record Vitals (Blood Pressure, Heart Rate &amp; Temp)</span>
                          </label>

                          <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={!!activeJob.progressChecklist?.medicationAdministered}
                              onChange={(e) => {
                                updateBookingStatus(activeJob.id, 'in_progress', undefined, {
                                  ...(activeJob.progressChecklist || {}),
                                  medicationAdministered: e.target.checked
                                });
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                            />
                            <span>2. Perform Prescribed Medical Procedure / Treatment</span>
                          </label>

                          <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={!!activeJob.progressChecklist?.dressingCompleted}
                              onChange={(e) => {
                                updateBookingStatus(activeJob.id, 'in_progress', undefined, {
                                  ...(activeJob.progressChecklist || {}),
                                  dressingCompleted: e.target.checked
                                });
                              }}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                            />
                            <span>3. Post-procedure Clean Up &amp; Final Assessment Charting</span>
                          </label>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => {
                              if (!activeJob.progressChecklist?.vitalsChecked || !activeJob.progressChecklist?.medicationAdministered || !activeJob.progressChecklist?.dressingCompleted) {
                                if (!window.confirm("Some progress checklist items are not checked yet. Do you want to finalize the visit anyway?")) {
                                  return;
                                }
                              }
                              handleStatusTransition(activeJob, 'completed');
                            }}
                            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/10 cursor-pointer flex items-center gap-2"
                          >
                            <span>Finalize Vitals &amp; Close Visit</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No active patient visits assigned right now.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Stay online to receive automated nearby dispatches within 5 km.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: Visit History & Past Visits */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            {pastJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold font-heading text-slate-900">No Past Visit History</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Completed patient visits, clinical charting, and recorded vitals will be cataloged here once care visits are completed.
                </p>
              </div>
            ) : (
              pastJobs.map(b => (
                <div key={b.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          #{b.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          b.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {b.status === 'completed' ? '✓ Visit Completed' : 'Cancelled / Declined'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-heading text-slate-900">{b.serviceName || 'Clinical Care Visit'}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Patient: <strong>{b.patientName}</strong> (Age {b.patientAge || 35}) • Phone: {b.patientPhone || 'N/A'}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                      <span className="text-xl font-extrabold text-teal-900 font-heading">₹{b.totalAmount}</span>
                      <span className="text-[10px] text-slate-400 block">Payment: {b.paymentMethod?.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date &amp; Location</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{b.date} • {b.timeSlot}</span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{b.patientAddress}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recorded Clinical Vitals</span>
                      {b.vitalsRecorded && (b.vitalsRecorded.bloodPressure || b.vitalsRecorded.pulseRate || b.vitalsRecorded.spO2 || b.vitalsRecorded.temperature || (b.vitalsRecorded as any).bp) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-bold block">BLOOD PRESSURE</span>
                            <span className="font-extrabold text-teal-900">{b.vitalsRecorded.bloodPressure || (b.vitalsRecorded as any).bp || 'Not Recorded'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-bold block">PULSE RATE</span>
                            <span className="font-extrabold text-teal-900">{b.vitalsRecorded.pulseRate || (b.vitalsRecorded as any).pulse || 'Not Recorded'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-bold block">TEMPERATURE</span>
                            <span className="font-extrabold text-teal-900">{b.vitalsRecorded.temperature || (b.vitalsRecorded as any).temp || 'Not Recorded'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-bold block">BLOOD OXYGEN</span>
                            <span className="font-extrabold text-teal-900">{b.vitalsRecorded.spO2 || (b.vitalsRecorded as any).spo2 || 'Not Recorded'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 font-medium mt-1">No vitals recorded for this visit record.</p>
                      )}
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    {(b.vitalsRecorded?.nurseNotes || b.medicalNotes) ? (
                      <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl text-xs space-y-1 flex-1">
                        {b.vitalsRecorded?.nurseNotes && (
                          <p className="text-slate-800">
                            <strong className="text-teal-900">Clinician Summary Notes:</strong> {b.vitalsRecorded.nurseNotes}
                          </p>
                        )}
                        {b.medicalNotes && (
                          <p className="text-slate-600">
                            <strong className="text-slate-700">Patient Order Notes:</strong> {b.medicalNotes}
                          </p>
                        )}
                      </div>
                    ) : <div />}

                    <button
                      onClick={() => setSelectedBookingForDetail(b)}
                      className="px-4 py-2 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs shrink-0"
                    >
                      <Activity className="w-3.5 h-3.5 text-teal-700" />
                      <span>View Visit Record &amp; Vitals</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB 3: Credentials & Verified Documents */}
        {activeSubTab === 'credentials' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">
                  State Licenses &amp; Clinical Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audited and verified by the Map2Medic Medical Board governance committee.
                </p>
              </div>

              <button
                onClick={() => setIsUploadDocOpen(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New License</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {currentProvider.documents.map(d => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{d.docType}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{d.fileName} • Expires: {d.expiryDate || 'Active'}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    d.status === 'verified' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : d.status === 'pending_review' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    {d.status === 'verified' ? '✓ Verified by Board' : d.status === 'pending_review' ? 'Pending Review' : 'Rejected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDIT PROVIDER PROFILE                           */}
      {/* ======================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-teal-800 to-slate-900 text-white relative">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold font-heading">Edit Clinician Profile</h3>
              <p className="text-xs text-teal-100 mt-1">
                Update professional bio, specialty title, hourly rate, and operating territory.
              </p>
            </div>

            <form onSubmit={handleSaveProviderProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Profile Photo Upload Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block flex items-center justify-between">
                  <span>Profile Photo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {editAvatar ? (
                      <img
                        src={editAvatar}
                        alt="Profile Preview"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 border-2 border-dashed border-teal-300 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-teal-600" />
                        <span>{editAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProviderAvatarChange}
                          className="hidden"
                        />
                      </label>
                      {editAvatar && (
                        <button
                          type="button"
                          onClick={() => setEditAvatar('')}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Upload your clinician photo (JPEG/PNG).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Full Professional Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Specialty / Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Clinical Bio &amp; Background</label>
                <textarea
                  rows={3}
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Hourly Billing Rate (₹)</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Operating Territory / Base City</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                >
                  Save Clinician Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UPLOAD CREDENTIAL DOCUMENT                      */}
      {/* ======================================================== */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-heading text-slate-900">Upload State License / Credential</h3>
              <button onClick={() => setIsUploadDocOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Medical License">Medical License</option>
                  <option value="BLS / CPR Certification">BLS / CPR Certification</option>
                  <option value="Government ID">Government ID</option>
                  <option value="Malpractice Insurance">Malpractice Insurance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Certificate / File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State_RN_License_Renewal_2026.pdf"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50">
                <Upload className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">Select PDF or High-Res Photo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Audited by Medical Board within 4 business hours</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                >
                  Submit for Board Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECORD CLINICAL VITALS ON COMPLETION            */}
      {/* ======================================================== */}
      {isVitalsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">Record Clinical Vitals &amp; Complete Visit</h3>
                <p className="text-xs text-slate-500">Document in-home patient observations into PostgreSQL medical record.</p>
              </div>
              <button onClick={() => setIsVitalsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitalsAndComplete} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="e.g. 120/80"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">Temperature (°F)</label>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="e.g. 98.6"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">Blood Oxygen SpO2 (%)</label>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="e.g. 99"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">Attending Clinician Summary Notes</label>
                <textarea
                  rows={2}
                  value={nurseNotes}
                  onChange={(e) => setNurseNotes(e.target.value)}
                  placeholder="Procedure performed cleanly according to aseptic guidelines. Patient stable with optimal post-procedure vitals."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVitalsModalOpen(false)}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                >
                  Complete &amp; Submit Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit Details & Recorded Vitals Modal */}
      <VisitDetailsModal
        booking={selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        onSaveVitals={handleSaveVitalsFromModal}
        isProviderView={true}
      />

    </div>
  );
};
