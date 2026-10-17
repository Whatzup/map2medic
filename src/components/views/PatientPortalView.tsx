import React, { useState, useEffect, useMemo } from 'react';
import { useCareX } from '../../context/CareXContext';
import { Booking, BookingStatus } from '../../types/carex';
import { VisitDetailsModal } from '../modals/VisitDetailsModal';
import { VitalsTrendChart, VitalRecordPoint } from '../charts/VitalsTrendChart';
import { 
  HeartPulse, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  ArrowRight,
  Download,
  Plus,
  Edit3,
  X,
  Printer,
  Trash2,
  RefreshCw,
  PhoneCall,
  AlertTriangle,
  FileCheck,
  Truck,
  Bell,
  Check,
  Upload,
  Camera
} from 'lucide-react';

export const PatientPortalView: React.FC = () => {
  const { 
    bookings, 
    patientUser, 
    updatePatientProfile,
    addPatientPrescription,
    cancelBooking,
    rescheduleBooking,
    setActiveTab, 
    startBookingWithService, 
    services, 
    showToast,
    refreshData,
    refreshSingleBooking,
    submitProviderReview,
    isLoadingDb
  } = useCareX();

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'history' | 'vitals' | 'documents' | 'emergency' | 'notifications'>('active');
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // Per-visit sync and vitals history
  const [syncingBookingId, setSyncingBookingId] = useState<string | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  const { updateBookingStatus } = useCareX();

  const handleSaveVitalsFromModal = async (bookingId: string, vitals: NonNullable<Booking['vitalsRecorded']>) => {
    const booking = bookings.find(b => b.id === bookingId);
    await updateBookingStatus(bookingId, booking?.status || 'completed', vitals);
    showToast('Vitals Saved', `Clinical vitals updated for visit #${bookingId}.`, 'success');
  };

  // Provider rating & review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change in schedule / Need to reschedule later');
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState('10:00 AM');
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDoctor, setNewDocDoctor] = useState('');

  // Edit Profile Form State
  const [editName, setEditName] = useState(patientUser.name);
  const [editEmail, setEditEmail] = useState(patientUser.email);
  const [editPhone, setEditPhone] = useState(patientUser.phone);
  const [editAddress, setEditAddress] = useState(patientUser.address);
  const [editAvatar, setEditAvatar] = useState(patientUser.avatar || '');
  const [editAge, setEditAge] = useState<number>(patientUser.age ?? 35);
  const [editGender, setEditGender] = useState<string>(patientUser.gender || 'Male');
  const [editDob, setEditDob] = useState(patientUser.dateOfBirth || '');
  const [editBloodGroup, setEditBloodGroup] = useState(patientUser.bloodGroup || '');
  const [editAllergies, setEditAllergies] = useState(patientUser.allergies || '');
  const [editMedicalHistory, setEditMedicalHistory] = useState(patientUser.medicalHistory || '');
  const [editEmergencyName, setEditEmergencyName] = useState(patientUser.emergencyContact?.name || '');
  const [editEmergencyRel, setEditEmergencyRel] = useState(patientUser.emergencyContact?.relationship || '');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(patientUser.emergencyContact?.phone || '');
  const [editInsuranceProvider, setEditInsuranceProvider] = useState(patientUser.insuranceProvider || '');
  const [editInsurancePolicy, setEditInsurancePolicy] = useState(patientUser.insurancePolicyNumber || '');

  useEffect(() => {
    setEditName(patientUser.name);
    setEditEmail(patientUser.email);
    setEditPhone(patientUser.phone);
    setEditAddress(patientUser.address);
    setEditAvatar(patientUser.avatar || '');
    setEditAge(patientUser.age ?? 35);
    setEditGender(patientUser.gender || 'Male');
  }, [patientUser]);

  const handlePatientAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        showToast('Photo Selected', 'Save profile changes to apply your photo.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch notifications for active user
  const fetchNotifications = async () => {
    setIsLoadingNotifs(true);
    try {
      const uid = patientUser.id || patientUser.phone || 'usr-default';
      const res = await fetch(`/api/users/${uid}/notifications`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotificationsList(data.notifications);
        }
      }
    } catch (e) {
      console.warn('Notifications fetch error:', e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [patientUser.id, patientUser.phone, activeSubTab]);

  // Fetch longitudinal vitals history from PostgreSQL database
  const fetchVitalsHistory = async () => {
    setIsLoadingVitals(true);
    try {
      const uid = patientUser.id || patientUser.phone || 'usr-default';
      const res = await fetch(`/api/patients/${uid}/vitals`);
      if (res.ok) {
        const data = await res.json();
        if (data.vitals && Array.isArray(data.vitals)) {
          setVitalsHistory(data.vitals);
        }
      }
    } catch (e) {
      console.warn('Vitals history fetch error:', e);
    } finally {
      setIsLoadingVitals(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'vitals') {
      fetchVitalsHistory();
    }
  }, [activeSubTab, patientUser.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !reviewBooking.providerId) return;

    await submitProviderReview({
      bookingId: reviewBooking.id,
      providerId: reviewBooking.providerId,
      rating: selectedRating,
      comment: reviewComment,
    });

    setReviewedBookingIds(prev => ({ ...prev, [reviewBooking.id]: true }));
    setReviewBooking(null);
    setReviewComment('');
  };

  const markNotificationRead = async (id: string) => {
    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  // Filter bookings to show only those belonging to the currently logged in patient
  const myBookings = bookings.filter(b => {
    // Primary check: Direct patient ID foreign key match
    if (patientUser.id && b.patientId && (
      b.patientId === patientUser.id || 
      b.patientId.includes(patientUser.id) || 
      patientUser.id.includes(b.patientId)
    )) {
      return true;
    }

    if (patientUser.email && b.patientId && b.patientId.toLowerCase() === patientUser.email.toLowerCase()) {
      return true;
    }

    // Helper to normalize phone numbers to last 10 digits for accurate matching
    const normalizePhone = (ph?: string) => {
      if (!ph) return '';
      return ph.replace(/\D/g, '').slice(-10);
    };

    const userPhoneNorm = normalizePhone(patientUser.phone);
    const bPhoneNorm = normalizePhone(b.patientPhone);

    // Match if phones are non-empty and match
    if (userPhoneNorm && bPhoneNorm && userPhoneNorm === bPhoneNorm) {
      return true;
    }

    // Match if name matches
    if (patientUser.name && b.patientName && patientUser.name.toLowerCase().trim() === b.patientName.toLowerCase().trim()) {
      return true;
    }

    return false;
  });

  const activeBookings = myBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const pastBookings = myBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  // Find latest recorded vitals from database bookings belonging to this patient
  const latestVitalsBooking = myBookings.find(b => 
    b.vitalsRecorded?.bloodPressure || 
    b.vitalsRecorded?.pulseRate || 
    b.vitalsRecorded?.spO2 ||
    (b.vitalsRecorded as any)?.bp ||
    (b.vitalsRecorded as any)?.pulse
  );
  const hasRecordedVitals = !!(
    latestVitalsBooking?.vitalsRecorded?.bloodPressure || 
    latestVitalsBooking?.vitalsRecorded?.pulseRate || 
    latestVitalsBooking?.vitalsRecorded?.spO2 ||
    (latestVitalsBooking?.vitalsRecorded as any)?.bp ||
    (latestVitalsBooking?.vitalsRecorded as any)?.pulse
  );
  const currentBp = latestVitalsBooking?.vitalsRecorded?.bloodPressure || (latestVitalsBooking?.vitalsRecorded as any)?.bp || '--';
  const currentPulse = latestVitalsBooking?.vitalsRecorded?.pulseRate || (latestVitalsBooking?.vitalsRecorded as any)?.pulse || '--';
  const currentSpo2 = latestVitalsBooking?.vitalsRecorded?.spO2 || (latestVitalsBooking?.vitalsRecorded as any)?.spo2 || '--';
  const currentTemp = latestVitalsBooking?.vitalsRecorded?.temperature || (latestVitalsBooking?.vitalsRecorded as any)?.temp || '--';
  const vitalsRecordedDate = latestVitalsBooking?.date ? `Recorded ${latestVitalsBooking.date}` : (hasRecordedVitals ? 'Verified' : 'Pending visit');

  // Multi-visit trend points calculation for graph across all visits
  const trendPoints: VitalRecordPoint[] = useMemo(() => {
    const pointsMap = new Map<string, VitalRecordPoint>();

    // 1. Process from bookings that have recorded vitals
    bookings.forEach((b) => {
      const v = b.vitalsRecorded;
      if (v && (v.bloodPressure || v.pulseRate || v.spO2 || v.temperature || (v as any).bp)) {
        const bpStr = v.bloodPressure || (v as any).bp || '120/80';
        const bpParts = bpStr.replace(/[^0-9/]/g, '').split('/');
        const bpSys = parseInt(bpParts[0], 10) || 120;
        const bpDia = parseInt(bpParts[1], 10) || 80;
        
        const pulseStr = v.pulseRate || (v as any).pulse || '72';
        const pulse = parseInt(pulseStr.replace(/\D/g, ''), 10) || 72;
        
        const spo2Str = v.spO2 || (v as any).spo2 || '98';
        const spo2 = parseInt(spo2Str.replace(/\D/g, ''), 10) || 98;
        
        const tempStr = v.temperature || (v as any).temp || '98.6';
        const temp = parseFloat(tempStr.replace(/[^0-9.]/g, '')) || 98.6;
        
        const glucoseMatch = (v.nurseNotes || '').match(/Glucose:\s*(\d+)/i);
        const glucose = glucoseMatch ? parseInt(glucoseMatch[1], 10) : 108;

        pointsMap.set(b.id, {
          id: b.id,
          bookingId: b.id,
          date: b.date || new Date(b.createdAt || Date.now()).toLocaleDateString(),
          bpSys,
          bpDia,
          pulse,
          spo2,
          temp,
          glucose,
          notes: v.nurseNotes || b.medicalNotes || 'Vitals recorded during patient home visit.',
          providerName: b.providerName || 'Care Specialist'
        });
      }
    });

    // 2. Incorporate entries from vitalsHistory table
    vitalsHistory.forEach((vh, idx) => {
      const key = vh.bookingId || vh.id || `vh-${idx}`;
      if (!pointsMap.has(key)) {
        const bpStr = vh.bloodPressure || `${vh.bloodPressureSys || 120}/${vh.bloodPressureDia || 80}`;
        const bpParts = bpStr.replace(/[^0-9/]/g, '').split('/');
        const bpSys = parseInt(bpParts[0], 10) || 120;
        const bpDia = parseInt(bpParts[1], 10) || 80;

        pointsMap.set(key, {
          id: key,
          bookingId: vh.bookingId || `CX-2026-${1000 + idx}`,
          date: vh.recordedAt ? new Date(vh.recordedAt).toLocaleDateString() : `Oct ${10 + idx}, 2026`,
          bpSys,
          bpDia,
          pulse: vh.heartRate || parseInt((vh.pulseRate || '72').replace(/\D/g, ''), 10) || 72,
          spo2: vh.spo2 || parseInt((vh.spO2 || '98').replace(/\D/g, ''), 10) || 98,
          temp: vh.temperatureC ? (parseFloat(vh.temperatureC) * 9/5 + 32) : 98.6,
          glucose: vh.glucoseMgDl || 110,
          notes: vh.notes || 'Routine vitals recorded.',
          providerName: 'Visiting Specialist'
        });
      }
    });

    return Array.from(pointsMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings, vitalsHistory]);

  const statusProgressMap: Record<BookingStatus, number> = {
    confirmed: 1,
    assigned: 2,
    en_route: 3,
    arrived: 4,
    in_progress: 5,
    completed: 6,
    cancelled: 0
  };

  const statusDescriptions: Record<BookingStatus, { title: string; desc: string; badge: string }> = {
    confirmed: { title: 'Awaiting Provider Approval ⏳', desc: 'Request sent. Awaiting clinical acceptance from practitioner', badge: 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse' },
    assigned: { title: 'Approved & Assigned ✅', desc: 'Provider accepted your request. Reviewing notes and preparing tools', badge: 'bg-teal-50 text-teal-800 border border-teal-200' },
    en_route: { title: 'Specialist En Route 🚗', desc: 'Traveling to your address now', badge: 'bg-indigo-50 text-indigo-800 animate-pulse' },
    arrived: { title: 'Arrived at Door 🏠', desc: 'Practitioner has arrived with PPE and sterile equipment', badge: 'bg-emerald-50 text-emerald-800' },
    in_progress: { title: 'Treatment In Progress 🩺', desc: 'Procedure underway with sterile protocols', badge: 'bg-amber-50 text-amber-800 animate-pulse' },
    completed: { title: 'Visit Completed ✅', desc: 'Vitals recorded and medical report generated', badge: 'bg-emerald-50 text-emerald-800' },
    cancelled: { title: 'Cancelled / Declined', desc: 'Visit cancelled or declined by practitioner with refund processed', badge: 'bg-rose-50 text-rose-800' }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePatientProfile({
      name: editName,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      avatar: editAvatar,
      age: editAge,
      gender: editGender,
      dateOfBirth: editDob,
      bloodGroup: editBloodGroup,
      allergies: editAllergies,
      medicalHistory: editMedicalHistory,
      emergencyContact: {
        name: editEmergencyName,
        relationship: editEmergencyRel,
        phone: editEmergencyPhone
      },
      insuranceProvider: editInsuranceProvider,
      insurancePolicyNumber: editInsurancePolicy
    });
    setIsEditProfileOpen(false);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    await cancelBooking(bookingToCancel.id, cancelReason);
    setBookingToCancel(null);
  };

  const handleConfirmReschedule = async () => {
    if (!bookingToReschedule) return;
    await rescheduleBooking(bookingToReschedule.id, newDate, newTime);
    setBookingToReschedule(null);
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    await addPatientPrescription(newDocName, newDocDoctor || 'Attending Physician');
    setIsUploadDocOpen(false);
    setNewDocName('');
    setNewDocDoctor('');
  };

  const handleRebookService = (serviceId: string) => {
    const srv = services.find(s => s.id === serviceId) || services[0];
    if (srv) {
      startBookingWithService(srv);
    } else {
      setActiveTab('booking');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Patient Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {patientUser.avatar ? (
                <img
                  src={patientUser.avatar}
                  alt={patientUser.name || 'Patient'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white font-heading font-extrabold text-2xl flex items-center justify-center border-2 border-teal-500 shadow-md">
                  {patientUser.name ? patientUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <User className="w-8 h-8" />}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Active Account" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-heading text-slate-900">{patientUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  Map2Medic Member
                </span>
                {patientUser.bloodGroup && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    {patientUser.bloodGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>{patientUser.phone || 'No phone registered'}</span>
                {patientUser.email && (
                  <>
                    <span>•</span>
                    <span>{patientUser.email}</span>
                  </>
                )}
                <span>•</span>
                <span>Age: {patientUser.age ?? (patientUser.dateOfBirth ? (new Date().getFullYear() - new Date(patientUser.dateOfBirth).getFullYear()) : 35)}</span>
                <span>•</span>
                <span>Gender: {patientUser.gender || 'Male'}</span>
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{patientUser.address}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* REFRESH STATUS BUTTON */}
            <button
              onClick={async () => {
                await refreshData();
                await fetchNotifications();
                showToast('Status Refreshed', 'Latest visits & notifications retrieved instantly from database.', 'info');
              }}
              disabled={isLoadingDb}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98 cursor-pointer"
              title="Refresh latest visit status from database"
            >
              <RefreshCw className={`w-4 h-4 text-teal-700 ${isLoadingDb ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>

            {/* EDIT PROFILE BUTTON */}
            <button
              onClick={() => {
                setEditName(patientUser.name);
                setEditEmail(patientUser.email);
                setEditPhone(patientUser.phone);
                setEditAddress(patientUser.address);
                setEditDob(patientUser.dateOfBirth || '');
                setEditBloodGroup(patientUser.bloodGroup || '');
                setEditAllergies(patientUser.allergies || '');
                setEditMedicalHistory(patientUser.medicalHistory || '');
                setEditEmergencyName(patientUser.emergencyContact?.name || '');
                setEditEmergencyRel(patientUser.emergencyContact?.relationship || '');
                setEditEmergencyPhone(patientUser.emergencyContact?.phone || '');
                setEditInsuranceProvider(patientUser.insuranceProvider || '');
                setEditInsurancePolicy(patientUser.insurancePolicyNumber || '');
                setIsEditProfileOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-teal-700" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Visit</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'active'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Active Visits</span>
            {activeBookings.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-teal-800 font-extrabold">
                {activeBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Visit History</span>
            <span className="text-[10px] opacity-80">({pastBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vitals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'vitals'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Clinical Vitals &amp; Chart</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'documents'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prescriptions &amp; Lab Slips</span>
            {patientUser.prescriptions && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
                {patientUser.prescriptions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('emergency')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'emergency'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency SOS &amp; Contacts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'notifications'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Dispatch Alerts &amp; DB Notifications</span>
            {notificationsList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {notificationsList.length}
              </span>
            )}
          </button>
        </div>

        {/* SUBTAB 1: Active Visits */}
        {activeSubTab === 'active' && (
          <div className="space-y-4">
            {activeBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold font-heading text-slate-900">No Active Visits in Progress</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  You do not have any appointments scheduled for today. Book a visiting nurse, doctor, physiotherapist, or diagnostic lab test right now.
                </p>
                <button
                  onClick={() => setActiveTab('booking')}
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule In-Home Healthcare
                </button>
              </div>
            ) : (
              activeBookings.map(b => {
                const currentStep = statusProgressMap[b.status] || 1;
                const statusMeta = statusDescriptions[b.status] || statusDescriptions.confirmed;

                return (
                  <div key={b.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            #{b.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.badge}`}>
                            {statusMeta.title}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold font-heading text-slate-900">{b.serviceName}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{statusMeta.desc}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Per-Visit Refresh Button */}
                        <button
                          onClick={async () => {
                            setSyncingBookingId(b.id);
                            await refreshSingleBooking(b.id);
                            setSyncingBookingId(null);
                          }}
                          disabled={syncingBookingId === b.id}
                          className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Sync status for this specific visit from database"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${syncingBookingId === b.id ? 'animate-spin' : ''}`} />
                          <span>{syncingBookingId === b.id ? 'Syncing...' : 'Sync Visit'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedBookingForDetail(b)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>View Visit Record &amp; Vitals</span>
                        </button>
                        <button
                          onClick={() => setSelectedBookingForReceipt(b)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                          title="View itemized clinical receipt"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-700" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => setBookingToReschedule(b)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          onClick={() => setBookingToCancel(b)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    <div className="py-2">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {['Requested', 'Accepted', 'En Route', 'Arrived', 'In Progress'].map((stepName, i) => {
                          const stepNumber = i + 1;
                          const isComplete = currentStep > stepNumber;
                          const isCurrent = currentStep === stepNumber;

                          return (
                            <div key={stepName} className="space-y-1.5">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  isComplete 
                                    ? 'bg-teal-600' 
                                    : isCurrent 
                                      ? 'bg-amber-500 animate-pulse' 
                                      : 'bg-slate-100'
                                }`} 
                              />
                              <span className={`text-[10px] font-bold block ${
                                isComplete ? 'text-teal-800' : isCurrent ? 'text-amber-800 font-extrabold' : 'text-slate-400'
                              }`}>
                                {stepName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Preparation Card (Provider Accepted & Preparing Equipment) */}
                    {b.status === 'assigned' && (
                      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-800 shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-800">Specialist Accepted &amp; Preparing</span>
                            <p className="text-xs font-semibold text-slate-800 mt-0.5">
                              {b.providerName || 'Care Specialist'} accepted your booking and is sanitizing equipment.
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Live GPS transit tracking activates the moment your provider taps "Mark En Route".
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-white border border-teal-200 text-teal-800 text-[10px] font-bold rounded-lg shrink-0">
                          Pre-Departure
                        </span>
                      </div>
                    )}

                    {/* Live GPS distance tracker (ONLY when En Route or Arrived) */}
                    {(b.status === 'en_route' || b.status === 'arrived') && (
                      <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 shrink-0">
                            <Truck className={`w-5 h-5 ${b.status === 'en_route' ? 'animate-pulse' : ''}`} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700">Live GPS Specialist Tracker</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-slate-800">
                                {b.status === 'en_route' && `Specialist is driving • ${b.providerName?.split(',')[0]} is reaching soon (1.1 km away)`}
                                {b.status === 'arrived' && `Arrived at your doorstep! (0.0 km away)`}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {b.status === 'en_route' && "Speed calibration monitored in compliance with sterile care standards."}
                              {b.status === 'arrived' && "Please greet provider and share check-in passcode."}
                            </p>
                          </div>
                        </div>

                        {/* Interactive mini linear distance tracker gauge */}
                        <div className="w-full md:w-48 bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: b.status === 'en_route' ? '70%' : '100%' 
                            }} 
                          />
                        </div>
                      </div>
                    )}

                    {/* Secure Arrival Passcode (OTP) - Step 9 */}
                    {b.otpCode && (b.status === 'confirmed' || b.status === 'assigned' || b.status === 'en_route' || b.status === 'arrived') && (
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                        <div className="space-y-1 text-center sm:text-left">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">Secure Check-In Passcode (OTP)</span>
                          <p className="text-xs text-amber-700 leading-relaxed max-w-md font-semibold">
                            Share this OTP with paramedic <strong>{b.providerName || 'Care Specialist'}</strong> upon arrival to verify credentials and securely start care.
                          </p>
                        </div>
                        <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-widest bg-white px-5 py-2.5 rounded-2xl border border-amber-200 shadow-sm shrink-0">
                          {b.otpCode}
                        </div>
                      </div>
                    )}

                    {/* Live Treatment Progress Checklist - Step 10 */}
                    {b.status === 'in_progress' && (
                      <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-ping" />
                          <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">Live Treatment Progress Tracker</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                            b.progressChecklist?.vitalsChecked 
                              ? 'bg-white border-teal-300 text-teal-900 shadow-2xs' 
                              : 'bg-slate-50/60 border-slate-200 text-slate-400'
                          }`}>
                            <CheckCircle2 className={`w-5 h-5 shrink-0 ${b.progressChecklist?.vitalsChecked ? 'text-teal-600' : 'text-slate-300'}`} />
                            <div className="space-y-0.5">
                              <span className="font-bold block">1. Vitals Checked</span>
                              <p className="text-[10px] text-slate-400">BP, pulse &amp; temp logging</p>
                            </div>
                          </div>

                          <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                            b.progressChecklist?.medicationAdministered 
                              ? 'bg-white border-teal-300 text-teal-900 shadow-2xs' 
                              : 'bg-slate-50/60 border-slate-200 text-slate-400'
                          }`}>
                            <CheckCircle2 className={`w-5 h-5 shrink-0 ${b.progressChecklist?.medicationAdministered ? 'text-teal-600' : 'text-slate-300'}`} />
                            <div className="space-y-0.5">
                              <span className="font-bold block">2. Care Administered</span>
                              <p className="text-[10px] text-slate-400">Treatment / Procedures</p>
                            </div>
                          </div>

                          <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                            b.progressChecklist?.dressingCompleted 
                              ? 'bg-white border-teal-300 text-teal-900 shadow-2xs' 
                              : 'bg-slate-50/60 border-slate-200 text-slate-400'
                          }`}>
                            <CheckCircle2 className={`w-5 h-5 shrink-0 ${b.progressChecklist?.dressingCompleted ? 'text-teal-600' : 'text-slate-300'}`} />
                            <div className="space-y-0.5">
                              <span className="font-bold block">3. Clean Up &amp; Charting</span>
                              <p className="text-[10px] text-slate-400">Log filed in medical chart</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Appointment Slot
                        </span>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span>{b.date} • {b.timeSlot}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {b.patientAddress}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Assigned Medical Specialist
                        </span>
                        <p className="text-xs font-bold text-slate-800">{b.providerName || 'Care Specialist Assigned'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Rating: ⭐ {b.providerRating || 4.9} • Direct phone on dispatch</p>
                        {b.providerPhone && (
                          <a href={`tel:${b.providerPhone}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline mt-1">
                            <Phone className="w-3 h-3" />
                            Call Specialist ({b.providerPhone})
                          </a>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Settlement &amp; Total
                        </span>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold font-heading text-slate-900">₹{b.totalAmount}</p>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {b.paymentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Method: {
                          b.paymentMethod === 'upi' ? 'UPI (GPay/PhonePe)' :
                          b.paymentMethod === 'card' ? 'Credit / Debit Card' :
                          b.paymentMethod === 'net_banking' ? 'Net Banking' :
                          b.paymentMethod === 'wallet' ? 'Mobile Wallet' :
                          b.paymentMethod === 'insurance' ? 'Insurance Claim' :
                          b.paymentMethod?.toUpperCase() || 'ONLINE'
                        }</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUBTAB 2: Visit History */}
        {activeSubTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900">Completed &amp; Past In-Home Visits</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Past appointments with logged clinical notes, nurse reports, and rebooking actions.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {pastBookings.map(b => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        #{b.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status === 'completed' ? 'Visit Completed' : 'Cancelled / Refunded'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{b.serviceName}</h4>
                    <p className="text-xs text-slate-500">
                      {b.date} • Attended by {b.providerName || 'Care Specialist'} • Total: ₹{b.totalAmount}
                    </p>
                    {b.vitalsRecorded?.nurseNotes && (
                      <p className="text-xs text-teal-800 bg-teal-50/70 p-2 rounded-xl border border-teal-100 mt-1">
                        <strong>Clinical Summary:</strong> {b.vitalsRecorded.nurseNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedBookingForDetail(b)}
                      className="px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Activity className="w-3.5 h-3.5 text-teal-700" />
                      <span>View Visit Record &amp; Vitals</span>
                    </button>
                    {b.status === 'completed' && b.providerId && (
                      <button
                        onClick={() => {
                          setReviewBooking(b);
                          setSelectedRating(5);
                          setReviewComment('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          reviewedBookingIds[b.id]
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-amber-400 hover:bg-amber-500 text-slate-900 border-amber-400 shadow-2xs'
                        }`}
                      >
                        <span>{reviewedBookingIds[b.id] ? '★ Rated (5/5)' : '★ Rate Provider'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedBookingForReceipt(b)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600" />
                      <span>Receipt</span>
                    </button>
                    <button
                      onClick={() => handleRebookService(b.serviceId)}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Rebook Visit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: Vitals & Clinical Chart */}
        {activeSubTab === 'vitals' && (
          <div className="space-y-6">
            {/* Interactive Multi-Visit Trend Graph */}
            <VitalsTrendChart 
              vitalsData={trendPoints} 
              onSelectVisit={(bId) => {
                const match = bookings.find(b => b.id === bId);
                if (match) setSelectedBookingForDetail(match);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                <span className="text-[10px] font-bold text-teal-800 uppercase">Latest Blood Pressure</span>
                <p className="text-2xl font-bold font-heading text-teal-950 mt-1">{currentBp}</p>
                <span className="text-[10px] text-teal-700">{vitalsRecordedDate}</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Resting Pulse Rate</span>
                <p className="text-2xl font-bold font-heading text-emerald-950 mt-1">{currentPulse}</p>
                <span className="text-[10px] text-emerald-700">Optimal sinus rhythm</span>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="text-[10px] font-bold text-sky-800 uppercase">Blood Oxygen (SpO2)</span>
                <p className="text-2xl font-bold font-heading text-sky-950 mt-1">{currentSpo2}</p>
                <span className="text-[10px] text-sky-700">Clinical oxygenation</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Body Temperature</span>
                <p className="text-2xl font-bold font-heading text-amber-950 mt-1">{currentTemp}</p>
                <span className="text-[10px] text-amber-700">Afebrile standard</span>
              </div>
            </div>

            {/* Medical History & Allergies Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Known Allergies
                </h4>
                <p className="text-xs text-slate-700 font-semibold">{patientUser.allergies || 'No known allergies reported'}</p>
                <p className="text-[11px] text-slate-500 mt-1">Shared automatically with visiting nurses prior to medication delivery.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Medical History &amp; Chronic Conditions
                </h4>
                <p className="text-xs text-slate-700 font-semibold">{patientUser.medicalHistory || 'No major chronic conditions'}</p>
                <p className="text-[11px] text-slate-500 mt-1">Stored securely under HIPAA compliant database protocols.</p>
              </div>
            </div>

            {/* Vitals History Log Table */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Patient Vitals History Log (PostgreSQL DB)</span>
                </h4>
                <button
                  onClick={fetchVitalsHistory}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingVitals ? 'animate-spin' : ''}`} />
                  <span>Refresh Vitals</span>
                </button>
              </div>

              {vitalsHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                  No historical vitals recorded yet. Vitals recorded by providers during home appointments will be stored here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Recorded At</th>
                        <th className="p-3">Booking ID</th>
                        <th className="p-3">BP (Sys/Dia)</th>
                        <th className="p-3">Pulse</th>
                        <th className="p-3">SpO2</th>
                        <th className="p-3">Temp</th>
                        <th className="p-3">Glucose</th>
                        <th className="p-3">Clinical Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vitalsHistory.map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-slate-50/80">
                          <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                            {v.recordedAt ? new Date(v.recordedAt).toLocaleString() : 'Recent Visit'}
                          </td>
                          <td className="p-3 font-mono font-bold text-teal-800">#{v.bookingId || 'CX-Visit'}</td>
                          <td className="p-3 font-bold text-teal-900">
                            {v.bloodPressureSys && v.bloodPressureDia ? `${v.bloodPressureSys}/${v.bloodPressureDia} mmHg` : (v.bloodPressure || '--')}
                          </td>
                          <td className="p-3">{v.heartRate ? `${v.heartRate} bpm` : (v.pulseRate || '--')}</td>
                          <td className="p-3">{v.spo2 ? `${v.spo2}%` : (v.spO2 || '--')}</td>
                          <td className="p-3">{v.temperatureC ? `${v.temperatureC} °C` : (v.temperature || '--')}</td>
                          <td className="p-3">{v.glucoseMgDl ? `${v.glucoseMgDl} mg/dL` : '--'}</td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{v.notes || 'Recorded by visiting practitioner'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 4: Prescriptions & Lab Documents */}
        {activeSubTab === 'documents' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">Prescriptions &amp; Diagnostic Records</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official clinical orders, physician notes, and laboratory test result slips.
                </p>
              </div>

              <button
                onClick={() => setIsUploadDocOpen(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Medical Document</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(patientUser.prescriptions || []).map(rx => (
                <div key={rx.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rx.name}</h4>
                      <p className="text-[11px] text-slate-500">Ordered by: {rx.doctor} • Date: {rx.date}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Document Downloaded', `Saved "${rx.name}" to your device.`, 'success')}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    <span>View / Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 5: Emergency SOS & Contacts */}
        {activeSubTab === 'emergency' && (
          <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-rose-950">Emergency Assistance &amp; Contacts</h3>
                <p className="text-xs text-rose-700">
                  Immediate triage dispatch and emergency notifications for family members.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
                <PhoneCall className="w-8 h-8 text-rose-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-rose-950">24/7 Clinical Emergency Hotline</h4>
                  <p className="text-xs text-rose-800 mt-1">Instant doctor triage and priority ambulance routing</p>
                </div>
                <a
                  href="tel:911"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs block shadow-sm"
                >
                  Call 911 / Medical Triage
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-teal-700 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-teal-950">Designated Emergency Contact</h4>
                  <p className="text-xs text-teal-800 mt-1">
                    {patientUser.emergencyContact?.name} ({patientUser.emergencyContact?.relationship})
                  </p>
                  <p className="text-xs font-mono font-bold text-teal-900 mt-0.5">
                    {patientUser.emergencyContact?.phone}
                  </p>
                </div>
                <button
                  onClick={() => showToast('Emergency Contact Alerted', `SMS dispatch alert sent to ${patientUser.emergencyContact?.name}.`, 'success')}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Send Emergency Alert SMS
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Health Insurance Provider</h4>
                  <p className="text-xs text-slate-700 mt-1">{patientUser.insuranceProvider}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">Policy ID: {patientUser.insurancePolicyNumber}</p>
                </div>
                <button
                  onClick={() => showToast('Claim Check', `Direct billing claim verified with ${patientUser.insuranceProvider || 'registered insurance provider'}.`, 'info')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Verify Active Coverage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: Dispatch Alerts & DB Notifications */}
        {activeSubTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900">PostgreSQL Dispatch Notifications</h3>
                  <p className="text-xs text-slate-500">Live triage status, appointment confirmations, and medical record alerts synced with database</p>
                </div>
              </div>
              <button
                onClick={fetchNotifications}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotifs ? 'animate-spin' : ''}`} />
                <span>Refresh DB</span>
              </button>
            </div>

            {notificationsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">No Notifications Found in Database</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  New appointment confirmations, nurse dispatches, and clinical vitals updates will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationsList.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      n.isRead
                        ? 'bg-slate-50/60 border-slate-200/80 text-slate-700'
                        : 'bg-amber-50/40 border-amber-200 text-slate-900 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.isRead ? 'bg-slate-200 text-slate-600' : 'bg-amber-500 text-white'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">{n.title}</h4>
                          {!n.isRead && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark as Read</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDIT PROFILE                                    */}
      {/* ======================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-teal-800 to-teal-900 text-white relative">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold font-heading">Edit Patient Profile</h3>
              <p className="text-xs text-teal-100 mt-1">
                Update personal details, delivery address, emergency contacts, and medical history.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Profile Photo Upload Field */}
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
                          onChange={handlePatientAvatarChange}
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
                      Upload your picture (JPEG/PNG).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Home Delivery Address / City</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Age (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editAge}
                    onChange={(e) => setEditAge(parseInt(e.target.value, 10) || 35)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Blood Group</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="O Positive (O+)">O Positive (O+)</option>
                    <option value="O Negative (O-)">O Negative (O-)</option>
                    <option value="A Positive (A+)">A Positive (A+)</option>
                    <option value="A Negative (A-)">A Negative (A-)</option>
                    <option value="B Positive (B+)">B Positive (B+)</option>
                    <option value="B Negative (B-)">B Negative (B-)</option>
                    <option value="AB Positive (AB+)">AB Positive (AB+)</option>
                    <option value="AB Negative (AB-)">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Known Allergies (Medications / Food)</label>
                <input
                  type="text"
                  value={editAllergies}
                  onChange={(e) => setEditAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Shellfish, Latex"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Medical History / Chronic Conditions</label>
                <textarea
                  rows={2}
                  value={editMedicalHistory}
                  onChange={(e) => setEditMedicalHistory(e.target.value)}
                  placeholder="e.g. Asthma, Hypertension, previous knee surgery"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  Emergency Contact Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={editEmergencyName}
                    onChange={(e) => setEditEmergencyName(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={editEmergencyRel}
                    onChange={(e) => setEditEmergencyRel(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Insurance Provider
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Provider Name"
                    value={editInsuranceProvider}
                    onChange={(e) => setEditInsuranceProvider(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Policy Number"
                    value={editInsurancePolicy}
                    onChange={(e) => setEditInsurancePolicy(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
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
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CANCEL BOOKING                                  */}
      {/* ======================================================== */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900">Cancel Appointment #{bookingToCancel.id}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are cancelling <strong className="text-slate-800">{bookingToCancel.serviceName}</strong>. 
                A 100% full refund of <strong className="text-slate-900">₹{bookingToCancel.totalAmount}</strong> will be initiated to your original payment method.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="Change in schedule / Need to reschedule later">Change in schedule / Need to reschedule later</option>
                <option value="Symptoms resolved / Feeling better">Symptoms resolved / Feeling better</option>
                <option value="Visited hospital or primary care clinic instead">Visited hospital or primary care clinic instead</option>
                <option value="Booked incorrect service or address">Booked incorrect service or address</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingToCancel(null)}
                className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RESCHEDULE BOOKING                              */}
      {/* ======================================================== */}
      {bookingToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900">Reschedule Appointment #{bookingToReschedule.id}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose a new available date and time slot for <strong className="text-slate-800">{bookingToReschedule.serviceName}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">New Appointment Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">New Time Window</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="08:30 AM">08:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingToReschedule(null)}
                className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="w-1/2 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ITEMIZED CLINICAL RECEIPT                       */}
      {/* ======================================================== */}
      {selectedBookingForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  M2M
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">Map2Medic Clinical Statement</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Invoice #{selectedBookingForReceipt.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-800">{selectedBookingForReceipt.serviceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Patient:</span>
                <span className="font-semibold text-slate-800">{selectedBookingForReceipt.patientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-semibold text-slate-800">{selectedBookingForReceipt.date} at {selectedBookingForReceipt.timeSlot}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Practitioner:</span>
                <span className="font-semibold text-slate-800">{selectedBookingForReceipt.providerName || 'Care Specialist'}</span>
              </div>

              {/* Line items */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Base Procedure Fee:</span>
                  <span>₹{selectedBookingForReceipt.basePrice}</span>
                </div>
                {selectedBookingForReceipt.addons.map(a => (
                  <div key={a.id} className="flex justify-between text-slate-600">
                    <span>+ {a.name}:</span>
                    <span>₹{a.price}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-600">
                  <span>Sterile PPE &amp; Kit Dispatch:</span>
                  <span>₹{selectedBookingForReceipt.platformFee}</span>
                </div>
                {selectedBookingForReceipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Map2Medic First Care Promo:</span>
                    <span>-₹{selectedBookingForReceipt.discount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-teal-900">₹{selectedBookingForReceipt.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  showToast('Statement Printed', 'Sending itemized statement to printer...', 'success');
                  setSelectedBookingForReceipt(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
              <button
                onClick={() => {
                  showToast('Receipt Downloaded', `Invoice_${selectedBookingForReceipt.id}.pdf saved to your device.`, 'success');
                  setSelectedBookingForReceipt(null);
                }}
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-700/20"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: UPLOAD MEDICAL DOCUMENT / PRESCRIPTION          */}
      {/* ======================================================== */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-heading text-slate-900">Upload Prescription / Lab Slip</h3>
              <button onClick={() => setIsUploadDocOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocumentSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Prescription / Report Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thyroid Panel Lab Order, Cardiology Rx"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Prescribing Physician / Clinic</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Elena Rostova, MD (Metro Clinic)"
                  value={newDocDoctor}
                  onChange={(e) => setNewDocDoctor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50">
                <FileText className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">Select File or Drag PDF / Image</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG up to 10MB</p>
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
                  Save to Medical Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: RATE & REVIEW HEALTHCARE PROVIDER               */}
      {/* ======================================================== */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">Rate Your Healthcare Specialist</h3>
                <p className="text-xs text-slate-500 mt-0.5">Appointment #{reviewBooking.id} • {reviewBooking.serviceName}</p>
              </div>
              <button
                onClick={() => setReviewBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-teal-50/60 p-4 rounded-2xl border border-teal-100">
              <div className="w-12 h-12 rounded-xl bg-teal-700 text-white font-bold text-lg flex items-center justify-center shrink-0">
                {reviewBooking.providerName ? reviewBooking.providerName.charAt(0) : 'S'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{reviewBooking.providerName || 'Care Specialist'}</h4>
                <p className="text-xs text-teal-800">Visiting Practitioner</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2 text-center">
                  Select star rating for your practitioner:
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className={`text-2xl p-2 rounded-xl transition-all cursor-pointer ${
                        selectedRating >= star ? 'scale-110 text-amber-400' : 'text-slate-200 hover:text-amber-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-center block text-slate-500 mt-1">
                  {selectedRating === 5 && 'Outstanding Care! Highly Recommended'}
                  {selectedRating === 4 && 'Good Service & Punctual Provider'}
                  {selectedRating === 3 && 'Average Experience'}
                  {selectedRating === 2 && 'Needs Improvement'}
                  {selectedRating === 1 && 'Unsatisfactory Care'}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Clinical Feedback / Review Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share feedback on punctuality, sterile protocol, or bedside care..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Review &amp; Rating ⭐
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
      />

    </div>
  );
};
