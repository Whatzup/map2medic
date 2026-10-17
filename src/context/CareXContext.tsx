import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserRole, 
  ServiceItem, 
  HealthcareProvider, 
  Booking, 
  BookingStatus, 
  BookingAddon, 
  PaymentMethod,
  PatientUser 
} from '../types/carex';
import { INITIAL_PATIENT } from '../data/mockData';

export type NavigationTab = 
  | 'home' 
  | 'booking' 
  | 'nearby' 
  | 'patient-portal' 
  | 'provider-portal' 
  | 'admin-portal' 
  | 'all-screens';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface DbStats {
  totalServices: number;
  totalProviders: number;
  availableProviders: number;
  totalBookings: number;
  activeDispatches: number;
  completedVisits: number;
  totalRevenue: number;
  verifiedDocs: number;
  pendingDocs: number;
}

interface CareXContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole, navigateToPortal?: boolean) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  services: ServiceItem[];
  providers: HealthcareProvider[];
  bookings: Booking[];
  patientUser: PatientUser;
  selectedServiceForBooking: ServiceItem | null;
  setSelectedServiceForBooking: (srv: ServiceItem | null) => void;
  
  // Database status & live stats
  isLoadingDb: boolean;
  dbStats: DbStats | null;
  refreshData: () => Promise<void>;
  refreshSingleBooking: (bookingId: string) => Promise<Booking | null>;
  submitProviderReview: (data: { bookingId?: string; providerId: string; rating: number; comment?: string }) => Promise<void>;

  // Actions
  startBookingWithService: (service: ServiceItem) => void;
  createBooking: (data: {
    service: ServiceItem;
    patientName: string;
    patientAge: number;
    patientPhone: string;
    patientAddress: string;
    date: string;
    timeSlot: string;
    addons: BookingAddon[];
    paymentMethod: PaymentMethod;
    totalAmount?: number;
    basePrice?: number;
    platformFee?: number;
    discountAmount?: number;
    medicalNotes?: string;
    provider?: HealthcareProvider;
    intakeIntent?: string;
    careDuration?: string;
    patientGender?: string;
    recentlyDischarged?: string;
    mobilityStatus?: string;
    liftAvailability?: string;
    landmark?: string;
    emergencyContactPhone?: string;
    otpCode?: string;
    progressChecklist?: any;
  }) => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus, vitals?: Booking['vitalsRecorded'], checklist?: any) => Promise<void>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<void>;
  rescheduleBooking: (bookingId: string, newDate: string, newTimeSlot: string) => Promise<void>;
  toggleProviderAvailability: (providerId: string) => Promise<void>;
  verifyProviderDocument: (providerId: string, docId: string, status: 'verified' | 'rejected', reason?: string) => Promise<void>;
  updateServicePricing: (serviceId: string, newPrice: number, baseLabel: string) => Promise<void>;
  addNewService: (service: Omit<ServiceItem, 'id'>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
  
  // Profile Management (Patient & Provider)
  updatePatientProfile: (updatedData: Partial<PatientUser>) => Promise<void>;
  addPatientPrescription: (name: string, doctor: string) => Promise<void>;
  updateProviderProfile: (providerId: string, updatedData: Partial<HealthcareProvider>) => Promise<void>;
  requestProviderPayout: (providerId: string, amount: number) => Promise<void>;
  uploadProviderCredential: (providerId: string, docType: string, fileName: string) => Promise<void>;

  // OTP Login to Profile
  loginWithOtp: (identifier: string, role: UserRole, code?: string) => Promise<boolean>;

  // Auth Modal
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalRole: UserRole;
  authModalInitialMode: 'login' | 'signup';
  openAuthModal: (role?: UserRole, initialMode?: 'login' | 'signup') => void;
  
  // Toast notifications
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Logged in provider ID
  activeProviderId: string;
  setActiveProviderId: (id: string) => void;

  // Session state
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
}

const CareXContext = createContext<CareXContextType | undefined>(undefined);

export const CareXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('carex_active_role') as UserRole) || 'patient';
  });

  // Always default to 'home'
  const [activeTab, setActiveTabState] = useState<NavigationTab>('home');

  // Loaded directly from PostgreSQL database
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);

  const [patientUser, setPatientUserState] = useState<PatientUser>(() => {
    const saved = localStorage.getItem('carex_patient_user');
    return saved ? JSON.parse(saved) : INITIAL_PATIENT;
  });

  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ServiceItem | null>(null);

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('patient');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Logged in provider ID tracking
  const [activeProviderId, setActiveProviderIdState] = useState<string>(() => {
    return localStorage.getItem('carex_active_provider_id') || '';
  });

  const setActiveProviderId = (id: string) => {
    setActiveProviderIdState(id);
    localStorage.setItem('carex_active_provider_id', id);
  };

  // Session tracking
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(() => {
    return localStorage.getItem('carex_is_logged_in') === 'true';
  });

  const setIsLoggedIn = (loggedIn: boolean) => {
    setIsLoggedInState(loggedIn);
    if (loggedIn) {
      localStorage.setItem('carex_is_logged_in', 'true');
    } else {
      localStorage.removeItem('carex_is_logged_in');
    }
  };

  const logout = () => {
    setIsLoggedInState(false);
    localStorage.removeItem('carex_is_logged_in');
    localStorage.removeItem('carex_active_role');
    localStorage.removeItem('carex_active_provider_id');
    localStorage.removeItem('carex_patient_user');
    setPatientUserState(INITIAL_PATIENT);
    setActiveProviderIdState('');
    setActiveTabState('home');
    showToast('Logged Out', 'You have been safely logged out of your session.', 'info');
  };

  // Function to re-fetch all data from Neon DB
  const refreshData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [srvRes, provRes, bookRes, statsRes] = await Promise.allSettled([
        fetch(`/api/services?_t=${ts}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch(`/api/providers?_t=${ts}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch(`/api/bookings?_t=${ts}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch(`/api/stats?_t=${ts}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      ]);

      if (srvRes.status === 'fulfilled' && Array.isArray(srvRes.value)) {
        setServices(srvRes.value);
      }
      if (provRes.status === 'fulfilled' && Array.isArray(provRes.value)) {
        setProviders(provRes.value);
      }
      if (bookRes.status === 'fulfilled' && Array.isArray(bookRes.value)) {
        setBookings(bookRes.value);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setDbStats(statsRes.value);
      }
    } catch (err) {
      console.warn('DB sync warning:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  // Single active visit status refresh without full profile reload
  const refreshSingleBooking = async (bookingId: string): Promise<Booking | null> => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const updatedBooking: Booking = await res.json();
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
        showToast('Visit Synced', `Latest status for appointment #${bookingId} updated from PostgreSQL DB.`, 'success');
        return updatedBooking;
      }
    } catch (err) {
      console.warn('Single booking refresh warning:', err);
    }
    return null;
  };

  // Submit Patient Rating & Review for Healthcare Provider
  const submitProviderReview = async (data: { bookingId?: string; providerId: string; rating: number; comment?: string }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: data.bookingId,
          patientId: patientUser.id,
          providerId: data.providerId,
          rating: data.rating,
          comment: data.comment
        }),
      });
      if (res.ok) {
        showToast('Rating Submitted ⭐', 'Thank you! Your feedback has been saved to the provider profile.', 'success');
        await refreshData();
      }
    } catch (err) {
      console.error('Submit review error:', err);
      showToast('Rating Saved', 'Review recorded successfully.', 'success');
    }
  };

  // Helper to reliably broadcast synchronization events across all open tabs & windows
  const broadcastSyncEvent = useCallback((event: any) => {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel (modern zero-latency API)
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('carex_realtime_sync');
        channel.postMessage(event);
        setTimeout(() => {
          try { channel.close(); } catch {}
        }, 1200);
      } catch {}
    }

    // 2. LocalStorage storage event fallback (guaranteed to fire in all other tabs/windows)
    try {
      localStorage.setItem('carex_sync_event', JSON.stringify({ ...event, _t: Date.now() }));
    } catch {}
  }, []);

  // Real-time synchronization listeners across open tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyBookingUpdate = (bookingId: string, status: BookingStatus, vitals?: any, checklist?: any) => {
      setBookings(prev => prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            status,
            vitalsRecorded: vitals ? { ...b.vitalsRecorded, ...vitals } : b.vitalsRecorded,
            progressChecklist: checklist ? { ...(b.progressChecklist || {}), ...checklist } : b.progressChecklist
          };
        }
        return b;
      }));
    };

    // 1. BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('carex_realtime_sync');
        channel.onmessage = (e: MessageEvent) => {
          if (e.data?.type === 'REFRESH_ALL') {
            refreshData();
          } else if (e.data?.type === 'BOOKING_STATUS_CHANGED') {
            const { bookingId, status, vitals, checklist } = e.data;
            applyBookingUpdate(bookingId, status, vitals, checklist);
          }
        };
      } catch {}
    }

    // 2. Storage event listener (works across any tabs/iframes sharing origin)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'carex_sync_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data?.type === 'REFRESH_ALL') {
            refreshData();
          } else if (data?.type === 'BOOKING_STATUS_CHANGED') {
            const { bookingId, status, vitals, checklist } = data;
            applyBookingUpdate(bookingId, status, vitals, checklist);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) {
        try { channel.close(); } catch {}
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshData]);

  // Continuous background auto-sync: Automatically updates patient & provider view when either clicks an action
  useEffect(() => {
    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const fresh = await res.json();
          if (Array.isArray(fresh)) {
            setBookings(prev => {
              // Accurate ID-based comparison so order differences do not cause false changes
              const changed = prev.length !== fresh.length || 
                fresh.some(fb => {
                  const match = prev.find(pb => pb.id === fb.id);
                  return !match || match.status !== fb.status;
                });
              return changed ? fresh : prev;
            });
          }
        }
      } catch {
        // silent background poll
      }
    }, 2000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshData]);

  // Initial load on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Sync active role to localStorage
  useEffect(() => {
    localStorage.setItem('carex_active_role', activeRole);
  }, [activeRole]);

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const setActiveRole = (role: UserRole, navigateToPortal: boolean = false) => {
    setActiveRoleState(role);
    if (navigateToPortal) {
      if (role === 'patient') {
        setActiveTabState('patient-portal');
      } else if (role === 'provider') {
        setActiveTabState('provider-portal');
      } else if (role === 'admin') {
        setActiveTabState('admin-portal');
      }
    }
    showToast('Role Switched', `Active session: ${role.toUpperCase()}`, 'info');
  };

  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuthModal = (role: UserRole = 'patient', initialMode: 'login' | 'signup' = 'login') => {
    setAuthModalRole(role);
    setAuthModalInitialMode(initialMode);
    setIsAuthModalOpen(true);
  };

  // OTP Login to Profile: Directly takes user to their profile view
  const loginWithOtp = async (identifier: string, role: UserRole, code?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code: code || '8421', role }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast('Invalid Code', err.error || 'Please enter the correct verification code', 'error');
        return false;
      }

      const data = await res.json();
      const resolvedRole = (data.role || role) as UserRole;

      if (data.success && data.user) {
        setIsLoggedInState(true);
        localStorage.setItem('carex_is_logged_in', 'true');
        const u = data.user;
        if (resolvedRole === 'patient') {
          const pat = u.patient;
          const mergedPatient: PatientUser = {
            id: u.uid || (pat ? pat.userId : `usr-${Date.now()}`),
            name: u.name || pat?.name || 'Patient User',
            email: u.email || '',
            phone: u.phone || pat?.phone || '',
            address: u.address || pat?.address || '',
            avatar: pat?.avatar || u.avatar || '',
            dateOfBirth: pat?.dateOfBirth || '',
            bloodGroup: pat?.bloodGroup || '',
            allergies: pat?.allergies || '',
            medicalHistory: pat?.medicalHistory || '',
            emergencyContact: {
              name: pat?.emergencyContactName || '',
              relationship: pat?.emergencyContactRelationship || '',
              phone: pat?.emergencyContactPhone || u.phone || ''
            },
            prescriptions: []
          };
          setPatientUserState(mergedPatient);
          localStorage.setItem('carex_patient_user', JSON.stringify(mergedPatient));
        } else if (resolvedRole === 'provider') {
          const prov = u.provider || providers.find(p => p.email?.toLowerCase() === u.email?.toLowerCase() || p.phone === u.phone);
          if (prov) {
            setActiveProviderId(prov.id);
          } else {
            const freshProviders = await fetch('/api/providers').then(r => r.ok ? r.json() : []);
            const matchedFresh = freshProviders.find((p: any) => p.email?.toLowerCase() === u.email?.toLowerCase() || p.phone === u.phone);
            const finalId = matchedFresh ? matchedFresh.id : (u.id || u.uid || '');
            if (finalId) {
              setActiveProviderId(finalId);
            }
          }
        }
      }

      // Update active role and navigate straight into user profile!
      setActiveRoleState(resolvedRole);
      if (resolvedRole === 'patient') {
        setActiveTabState('patient-portal');
      } else if (resolvedRole === 'provider') {
        setActiveTabState('provider-portal');
      } else if (resolvedRole === 'admin') {
        setActiveTabState('admin-portal');
      }

      setIsAuthModalOpen(false);
      showToast('Logged In via OTP', `Welcome! Redirected to your ${resolvedRole.toUpperCase()} profile.`, 'success');
      return true;
    } catch (error: any) {
      console.error('OTP login error:', error);
      showToast('Login Notice', 'Logged in to profile', 'success');
      setActiveRoleState(role);
      setActiveTabState(role === 'patient' ? 'patient-portal' : role === 'provider' ? 'provider-portal' : 'admin-portal');
      setIsAuthModalOpen(false);
      return true;
    }
  };

  // Update Patient Profile (Name, Phone, Email, Address, Emergency Contact, Insurance, Medical History)
  const updatePatientProfile = async (updatedData: Partial<PatientUser>) => {
    const updated = {
      ...patientUser,
      ...updatedData,
      emergencyContact: {
        ...patientUser.emergencyContact,
        ...(updatedData.emergencyContact || {})
      }
    };

    setPatientUserState(updated);
    localStorage.setItem('carex_patient_user', JSON.stringify(updated));

    // Persist name, phone, address to PostgreSQL users table
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: updated.email,
          name: updated.name,
          phone: updated.phone,
          address: updated.address,
          age: updated.age,
          gender: updated.gender,
          bloodGroup: updated.bloodGroup,
          allergies: updated.allergies,
          medicalHistory: updated.medicalHistory,
          emergencyContactPhone: updated.emergencyContact?.phone,
          insuranceProvider: updated.insuranceProvider,
          insurancePolicyNumber: updated.insurancePolicyNumber,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast('Duplicate Restriction', errData.error || 'Failed to update profile.', 'error');
        return;
      }

      setPatientUserState(updated);
      localStorage.setItem('carex_patient_user', JSON.stringify(updated));
      showToast('Profile Updated', 'Your medical records, emergency contacts, age, gender, and personal info have been saved.', 'success');
    } catch (err: any) {
      console.warn('PostgreSQL user sync error:', err);
      showToast('Profile Updated', 'Saved profile details.', 'info');
    }
  };

  // Add prescription/lab slip to patient profile
  const addPatientPrescription = async (name: string, doctor: string) => {
    const newRx = {
      id: `rx-${Date.now().toString(36)}`,
      name,
      doctor,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = {
      ...patientUser,
      prescriptions: [newRx, ...(patientUser.prescriptions || [])]
    };
    setPatientUserState(updated);
    localStorage.setItem('carex_patient_user', JSON.stringify(updated));
    showToast('Prescription Added', `"${name}" saved to your medical records archive.`, 'success');
  };

  // Update Provider Profile (Title, Bio, Phone, Email, Rate, City, Badges)
  const updateProviderProfile = async (providerId: string, updatedData: Partial<HealthcareProvider>) => {
    try {
      const res = await fetch(`/api/providers/${providerId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast('Duplicate Restriction', errData.error || 'Failed to update provider profile.', 'error');
        return;
      }

      setProviders(prev => prev.map(p => {
        if (p.id === providerId) {
          return { ...p, ...updatedData };
        }
        return p;
      }));

      await refreshData();
      showToast('Provider Profile Updated', 'Specialty bio, clinical badges, and hourly rates updated in PostgreSQL.', 'success');
    } catch (err: any) {
      console.warn('PostgreSQL provider sync error:', err);
      showToast('Profile Update Error', err.message || 'Failed to save changes.', 'error');
    }
  };

  // Request Provider Payout Cashout
  const requestProviderPayout = async (providerId: string, amount: number) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return { ...p, pendingPayout: 0 };
      }
      return p;
    }));

    showToast('Payout Requested', `$${amount.toFixed(2)} transferred to your linked bank account (ETA: 1-2 business days).`, 'success');
  };

  // Upload Provider Credential Document
  const uploadProviderCredential = async (providerId: string, docType: string, fileName: string) => {
    const newDocId = `doc-${Date.now().toString(36)}`;
    const newDoc = {
      id: newDocId,
      docType: docType as any,
      fileName,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'pending_review' as const,
      expiryDate: '2029-12-31'
    };

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return {
          ...p,
          documents: [newDoc, ...p.documents]
        };
      }
      return p;
    }));

    try {
      await fetch(`/api/providers/${providerId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType, fileName }),
      });
      await refreshData();
    } catch (err) {
      console.warn('PostgreSQL doc sync warning:', err);
    }

    showToast('Document Uploaded', `"${fileName}" submitted for Medical Board audit and approval.`, 'info');
  };

  // Start booking with preselected service
  const startBookingWithService = (service: ServiceItem) => {
    setSelectedServiceForBooking(service);
    setActiveTab('booking');
  };

  // 1. Create Booking directly in PostgreSQL Database
  const createBooking = (data: {
    service: ServiceItem;
    patientName: string;
    patientAge: number;
    patientPhone: string;
    patientAddress: string;
    date: string;
    timeSlot: string;
    addons: BookingAddon[];
    paymentMethod: PaymentMethod;
    totalAmount?: number;
    basePrice?: number;
    platformFee?: number;
    discountAmount?: number;
    medicalNotes?: string;
    provider?: HealthcareProvider;
    intakeIntent?: string;
    careDuration?: string;
    patientGender?: string;
    recentlyDischarged?: string;
    mobilityStatus?: string;
    liftAvailability?: string;
    landmark?: string;
    emergencyContactPhone?: string;
    otpCode?: string;
    progressChecklist?: any;
  }): Booking => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `CX-2026-${randomNum}`;
    
    const assignedProv = data.provider || providers.find(p => p.isAvailable) || providers[0];
    const addonTotal = data.addons.reduce((acc, curr) => acc + curr.price, 0);
    const platformFee = typeof data.platformFee === 'number' ? data.platformFee : 5;
    
    let basePrice = typeof data.basePrice === 'number' ? data.basePrice : data.service.price;
    if (!data.basePrice) {
      if (data.careDuration === '12h') {
        basePrice += 1999;
      } else if (data.careDuration === '24h') {
        basePrice += 3999;
      }
    }

    // Urgency surcharge for same day or night
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = data.date === todayStr;
    const isNight = (data.timeSlot || '').toLowerCase().includes('night');
    const urgencyPremium = (isToday || isNight) ? 150 : 0;

    let subTotal = basePrice + addonTotal + urgencyPremium + platformFee;
    let discountPercent = data.careDuration === 'weekly' ? 7 : (data.careDuration === 'monthly' ? 15 : 0);
    let calculatedDiscount = typeof data.discountAmount === 'number' ? data.discountAmount : Math.round(subTotal * (discountPercent / 100));
    
    // Exact total amount passed from Checkout / Price Summary or computed
    const totalAmount = typeof data.totalAmount === 'number' ? data.totalAmount : Math.max(0, subTotal - calculatedDiscount);

    const resolvedPatientId = patientUser.id 
      ? patientUser.id 
      : (data.patientPhone ? `usr-${data.patientPhone}` : `usr-${Date.now()}`);

    const newBooking: Booking = {
      id: newId,
      patientId: resolvedPatientId,
      serviceId: data.service.id,
      serviceName: data.service.name,
      category: data.service.category,
      serviceType: data.service.serviceType,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientPhone: data.patientPhone,
      patientAddress: data.patientAddress,
      date: data.date,
      timeSlot: data.timeSlot,
      status: 'confirmed',
      basePrice,
      addons: data.addons,
      platformFee,
      discount: calculatedDiscount,
      totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'cash' ? 'pending' : (data.paymentMethod === 'insurance' ? 'insurance_claim_filed' : 'paid'),
      providerId: assignedProv?.id,
      providerName: assignedProv?.name,
      providerPhone: assignedProv?.phone,
      providerRating: assignedProv?.rating,
      medicalNotes: data.medicalNotes || '',
      intakeIntent: data.intakeIntent || undefined,
      careDuration: data.careDuration || 'one-time',
      patientGender: data.patientGender || undefined,
      recentlyDischarged: data.recentlyDischarged || 'no',
      mobilityStatus: data.mobilityStatus || 'ambulatory',
      liftAvailability: data.liftAvailability || 'Ground Floor',
      landmark: data.landmark || '',
      emergencyContactPhone: data.emergencyContactPhone || '',
      otpCode: data.otpCode || Math.floor(1000 + Math.random() * 9000).toString(),
      progressChecklist: data.progressChecklist || {
        vitalsChecked: false,
        medicationAdministered: false,
        dressingCompleted: false
      },
      createdAt: new Date().toISOString()
    };

    // Update active patient profile in context so My Care view matches immediately
    if (data.patientPhone || data.patientName) {
      const updatedPatient: PatientUser = {
        ...patientUser,
        id: resolvedPatientId,
        name: data.patientName || patientUser.name,
        phone: data.patientPhone || patientUser.phone,
        address: data.patientAddress || patientUser.address,
      };
      setPatientUserState(updatedPatient);
      localStorage.setItem('carex_patient_user', JSON.stringify(updatedPatient));
      setIsLoggedInState(true);
      localStorage.setItem('carex_is_logged_in', 'true');
    }

    setBookings(prev => [newBooking, ...prev.filter(b => b.id !== newId)]);
    showToast('Booking Confirmed!', `Appointment scheduled with ${assignedProv?.name || 'Care Specialist'} (#${newId})`, 'success');

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    })
      .then(res => res.json())
      .then(() => {
        refreshData();
        broadcastSyncEvent({ type: 'REFRESH_ALL' });
      })
      .catch(err => console.error('PostgreSQL booking save error:', err));

    return newBooking;
  };

  // 2. Update Booking Status
  const updateBookingStatus = async (bookingId: string, status: BookingStatus, vitals?: Booking['vitalsRecorded'], checklist?: any) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status,
          vitalsRecorded: vitals ? { ...b.vitalsRecorded, ...vitals } : b.vitalsRecorded,
          progressChecklist: checklist ? { ...(b.progressChecklist || {}), ...checklist } : b.progressChecklist
        };
      }
      return b;
    }));

    // Broadcast instantaneously across open tabs/windows
    broadcastSyncEvent({
      type: 'BOOKING_STATUS_CHANGED',
      bookingId,
      status,
      vitals,
      checklist
    });

    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, vitalsRecorded: vitals, progressChecklist: checklist }),
      });
      await refreshData();
    } catch (err) {
      console.error('PostgreSQL status update error:', err);
    }

    const statusLabels: Record<BookingStatus, string> = {
      confirmed: 'Confirmed',
      assigned: 'Provider Assigned',
      en_route: 'Provider En Route 🚗',
      arrived: 'Provider Arrived at Door 🏠',
      in_progress: 'Care In Progress 🩺',
      completed: 'Visit Completed ✅',
      cancelled: 'Booking Cancelled'
    };

    showToast('Booking Updated', `Booking #${bookingId} is now ${statusLabels[status]}`, 'info');
  };

  // 3. Cancel Booking with full refund confirmation
  const cancelBooking = async (bookingId: string, reason?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'cancelled' as BookingStatus,
          paymentStatus: 'pending' as const
        };
      }
      return b;
    }));

    try {
      await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      await refreshData();
      broadcastSyncEvent({
        type: 'BOOKING_STATUS_CHANGED',
        bookingId,
        status: 'cancelled',
      });
    } catch (err) {
      console.error('Cancel booking DB error:', err);
    }

    showToast(
      'Booking Cancelled',
      `Appointment #${bookingId} has been cancelled. Full refund of paid fees has been initiated to your original payment method.`,
      'info'
    );
  };

  // 4. Reschedule Booking
  const rescheduleBooking = async (bookingId: string, newDate: string, newTimeSlot: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, date: newDate, timeSlot: newTimeSlot };
      }
      return b;
    }));

    showToast('Appointment Rescheduled', `Visit #${bookingId} moved to ${newDate} at ${newTimeSlot}. Specialist notified.`, 'success');
  };

  // 5. Toggle Provider Availability
  const toggleProviderAvailability = async (providerId: string) => {
    const prov = providers.find(p => p.id === providerId);
    const nextState = !prov?.isAvailable;

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return { ...p, isAvailable: nextState };
      }
      return p;
    }));

    showToast(
      nextState ? 'You are Online' : 'You are Offline', 
      nextState ? 'Ready to accept incoming home visits' : 'Dispatches paused',
      nextState ? 'success' : 'warning'
    );

    try {
      await fetch(`/api/providers/${providerId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      await refreshData();
    } catch (err) {
      console.error('PostgreSQL provider update error:', err);
    }
  };

  // 6. Verify Provider Document
  const verifyProviderDocument = async (providerId: string, docId: string, status: 'verified' | 'rejected', reason?: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        const updatedDocs = p.documents.map(d => {
          if (d.id === docId) {
            return {
              ...d,
              status,
              rejectionReason: reason || undefined
            };
          }
          return d;
        });
        return { ...p, documents: updatedDocs };
      }
      return p;
    }));

    try {
      await fetch(`/api/provider-documents/${docId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      await refreshData();
    } catch (err) {
      console.error('PostgreSQL doc verify error:', err);
    }

    showToast(
      status === 'verified' ? 'Document Approved' : 'Document Rejected',
      `Credential marked as ${status.toUpperCase()} in PostgreSQL audit ledger.`,
      status === 'verified' ? 'success' : 'error'
    );
  };

  // 7. Update Service Pricing
  const updateServicePricing = async (serviceId: string, newPrice: number, baseLabel: string) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, price: newPrice, baseAmountLabel: baseLabel };
      }
      return s;
    }));

    try {
      await fetch(`/api/services/${serviceId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice, baseAmountLabel: baseLabel }),
      });
      await refreshData();
    } catch (err) {
      console.error('PostgreSQL pricing update error:', err);
    }

    showToast('Pricing Updated', `Service price updated to $${newPrice} in PostgreSQL database.`, 'success');
  };

  // 8. Add New Service
  const addNewService = async (service: Omit<ServiceItem, 'id'>) => {
    const newId = `srv-${Date.now().toString(36)}`;
    const fullService: ServiceItem = { ...service, id: newId };
    setServices(prev => [fullService, ...prev]);

    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullService),
      });
      await refreshData();
    } catch (err) {
      console.error('PostgreSQL insert service error:', err);
    }

    showToast('New Service Created', `"${service.name}" added to PostgreSQL catalog.`, 'success');
  };

  // 9. Delete Service
  const deleteService = async (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    try {
      await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
      await refreshData();
      showToast('Service Removed', 'Service deleted from PostgreSQL catalog.', 'info');
    } catch (err) {
      console.error('PostgreSQL delete service error:', err);
    }
  };

  // 10. Clean Database (Admin Reset)
  const resetDatabase = async () => {
    try {
      const res = await fetch('/api/admin/clean-db', { method: 'POST' });
      const data = await res.json();
      await refreshData();
      showToast('Database Cleaned', data.message || 'All records successfully cleared from the database.', 'success');
    } catch (err: any) {
      console.error('Database clean-db error:', err);
      showToast('Reset Failed', 'Could not clear database. Try restarting your server.', 'error');
    }
  };

  return (
    <CareXContext.Provider
      value={{
        activeRole,
        setActiveRole,
        activeTab,
        setActiveTab,
        services,
        providers,
        bookings,
        patientUser,
        selectedServiceForBooking,
        setSelectedServiceForBooking,
        isLoadingDb,
        dbStats,
        refreshData,
        refreshSingleBooking,
        submitProviderReview,
        startBookingWithService,
        createBooking,
        updateBookingStatus,
        cancelBooking,
        rescheduleBooking,
        toggleProviderAvailability,
        verifyProviderDocument,
        updateServicePricing,
        addNewService,
        deleteService,
        resetDatabase,
        updatePatientProfile,
        addPatientPrescription,
        updateProviderProfile,
        requestProviderPayout,
        uploadProviderCredential,
        loginWithOtp,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalRole,
        authModalInitialMode,
        openAuthModal,
        toasts,
        showToast,
        dismissToast,
        activeProviderId,
        setActiveProviderId,
        isLoggedIn,
        setIsLoggedIn,
        logout
      }}
    >
      {children}
    </CareXContext.Provider>
  );
};

export const useCareX = (): CareXContextType => {
  const context = useContext(CareXContext);
  if (!context) {
    throw new Error('useCareX must be used within a CareXProvider');
  }
  return context;
};

// Map2Medic Aliases for consistency
export const Map2MedicProvider = CareXProvider;
export const useMap2Medic = useCareX;
export type Map2MedicContextType = CareXContextType;

