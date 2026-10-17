import React, { useState, useEffect } from 'react';
import { useCareX } from '../../context/CareXContext';
import { ServiceItem, BookingAddon, HealthcareProvider, Booking } from '../../types/carex';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Info,
  HeartPulse,
  Phone,
  AlertTriangle,
  Activity,
  Star,
  Shield,
  HelpCircle,
  Truck,
  Heart,
  ChevronRight,
  Sparkles,
  Smartphone,
  Coins
} from 'lucide-react';

interface IntentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  recommendedServiceIds: string[];
}

export const BookingView: React.FC = () => {
  const { 
    services, 
    providers, 
    patientUser, 
    selectedServiceForBooking, 
    setSelectedServiceForBooking, 
    createBooking, 
    setActiveTab, 
    showToast,
    openAuthModal
  } = useCareX();

  // Selected Intent / Intake Category
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  // Selected Service
  const [selectedService, setSelectedService] = useState<ServiceItem | undefined>(undefined);

  // Selected Provider
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);

  // Pre-select nearest available provider when providers list loads
  useEffect(() => {
    if (providers && providers.length > 0) {
      const availableProvs = providers
        .filter(p => p.isAvailable)
        .sort((a, b) => {
          const distA = parseFloat(a.distanceKm?.toString() || '0');
          const distB = parseFloat(b.distanceKm?.toString() || '0');
          return distA - distB;
        });
      if (availableProvs.length > 0) {
        setSelectedProvider(availableProvs[0]);
      } else {
        setSelectedProvider(providers[0]);
      }
    }
  }, [providers]);

  // Wizard Step (1: Intent, 2: Intake details, 3: Recommendation, 4: Duration, 5: Schedule, 6: Provider Preview, 7: Address/Access, 8: Payment)
  const [step, setStep] = useState<number>(1);

  // Patient Intake State
  const [patientName, setPatientName] = useState(() => patientUser?.name || '');
  const [patientPhone, setPatientPhone] = useState(() => patientUser?.phone || '');
  const [patientAge, setPatientAge] = useState<number>(34);
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [patientCondition, setPatientCondition] = useState('');
  const [recentlyDischarged, setRecentlyDischarged] = useState<'yes' | 'no'>('no');
  const [mobilityStatus, setMobilityStatus] = useState<'ambulatory' | 'assisted' | 'bedridden'>('ambulatory');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Duration selection
  const [careDuration, setCareDuration] = useState<'one-time' | '12h' | '24h' | 'weekly' | 'monthly'>('one-time');

  // Schedule & Date Selection
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:00 AM - 12:00 PM (Morning Care)');

  // Address & Access Details
  const [patientAddress, setPatientAddress] = useState(() => patientUser?.address || '');
  const [liftAvailability, setLiftAvailability] = useState<'yes_lift' | 'stairs_1' | 'stairs_2' | 'ground'>('yes_lift');
  const [landmark, setLandmark] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'net_banking' | 'wallet'>('upi');
  const [paymentAcknowledged, setPaymentAcknowledged] = useState(false);

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Pre-fill profile info if available
  useEffect(() => {
    if (patientUser) {
      setPatientName(prev => prev || patientUser.name || '');
      setPatientPhone(prev => prev || patientUser.phone || '');
      setPatientAddress(prev => prev || patientUser.address || '');
    }
  }, [patientUser]);

  // Sync selected service if passed from home screen
  useEffect(() => {
    if (selectedServiceForBooking) {
      setSelectedService(selectedServiceForBooking);
      // Auto-set intent matching the preselected service category
      const mappedIntent = mapCategoryToIntent(selectedServiceForBooking.category);
      setSelectedIntent(mappedIntent);
      setStep(3); // Skip to recommendation page since service is pre-selected
    } else if (!selectedService && services.length > 0) {
      setSelectedService(services[0]);
    }
  }, [selectedServiceForBooking, services]);

  const mapCategoryToIntent = (cat: string): string => {
    if (cat === 'post_hospital_recovery') return 'post_hospital_recovery';
    if (cat === 'elderly_care') return 'elderly_care';
    if (cat === 'clinical_procedures') return 'clinical_procedures';
    if (cat === 'emergency_support') return 'emergency_support';
    if (cat === 'rehab_support') return 'rehab_support';
    return 'basic_nursing';
  };

  // Define 6 primary intent options with high-fidelity branding from Image 3
  const intentOptions: IntentOption[] = [
    {
      id: 'post_hospital_recovery',
      label: 'Post-Hospitalization Recovery',
      description: 'Dedicated post-surgical rehab, pain management & healing assessments.',
      icon: HeartPulse,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50',
      borderColor: 'border-indigo-100',
      recommendedServiceIds: ['srv-postsurgery-rehab', 'srv-pain-management', 'srv-vital-signs', 'srv-mobility-assistance']
    },
    {
      id: 'elderly_care',
      label: 'Elderly Care & Support',
      description: 'Daily health checks, movement aid, meals support & hygiene helper.',
      icon: User,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-100',
      recommendedServiceIds: ['srv-elderly-monitoring', 'srv-medication-reminders', 'srv-personal-hygiene', 'srv-mobility-assistance', 'srv-bedsore-prevention']
    },
    {
      id: 'clinical_procedures',
      label: 'Medical Procedure at Home',
      description: 'Professional injections, IV drip setups, catheter care & wound dressings.',
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50',
      borderColor: 'border-emerald-100',
      recommendedServiceIds: ['srv-dressing-wound-care', 'srv-injection-administration', 'srv-iv-drip-setup', 'srv-catheter-care-proc', 'srv-ryles-tube-feeding']
    },
    {
      id: 'emergency_support',
      label: 'Emergency / Critical Support',
      description: 'Immediate private ambulance dispatching and direct doctor escalation lines.',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50/50',
      borderColor: 'border-rose-100',
      recommendedServiceIds: ['srv-ambulance-coordination', 'srv-doctor-escalation']
    },
    {
      id: 'basic_nursing',
      label: 'Chronic Condition Monitoring',
      description: 'Routine vitals checking, position rotation & bedside patient observation.',
      icon: Heart,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50/50',
      borderColor: 'border-teal-100',
      recommendedServiceIds: ['srv-vital-signs', 'srv-bedside-observation', 'srv-medication-reminders', 'srv-newborn-care', 'srv-dietician-consult']
    },
    {
      id: 'rehab_support',
      label: 'Rehabilitation Support',
      description: 'Professional physiotherapy sessions, orthopedic rehab & strength exercises.',
      icon: Sparkles,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50/50',
      borderColor: 'border-violet-100',
      recommendedServiceIds: ['srv-physiotherapy-assistance', 'srv-mobility-assistance']
    }
  ];

  const currentIntent = intentOptions.find(opt => opt.id === selectedIntent);

  // Recommended services list
  const recommendedServices = services.filter(srv => {
    if (selectedIntent) {
      const intent = intentOptions.find(i => i.id === selectedIntent);
      return intent?.recommendedServiceIds.includes(srv.id);
    }
    return false;
  });

  // Dynamically assign clinical professional details
  const getAssignedStaff = (): { name: string; title: string; rating: string; experience: string; avatar: string; badges: string[] } => {
    const prov = selectedProvider || providers.find(p => p.isAvailable) || providers[0];
    if (prov) {
      return {
        name: prov.name,
        title: prov.title,
        rating: (prov.rating || 5.0).toString(),
        experience: `${prov.experienceYears || 2} Years Experience`,
        avatar: prov.avatar || '',
        badges: prov.badges || ['Verified Map2Medic Specialist']
      };
    }

    return {
      name: 'Care Specialist on Duty',
      title: selectedService?.name ? `${selectedService.name} Practitioner` : 'Healthcare Professional',
      rating: '5.0',
      experience: 'Licensed & Verified',
      avatar: '',
      badges: ['Board Certified', 'PPE Protocols Compliant']
    };
  };

  const assignedStaff = getAssignedStaff();

  // Pricing calculations
  const calculatePricing = () => {
    const base = selectedService?.price || 0;
    
    // Care Duration impact from Image 2
    let durationImpact = 0;
    if (careDuration === '12h') {
      durationImpact = 1999;
    } else if (careDuration === '24h') {
      durationImpact = 3999;
    }

    // Urgency premium
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;
    const isNight = selectedTimeSlot.toLowerCase().includes('night');
    const urgencyPremium = (isToday || isNight) ? 150 : 0;

    const platformFee = 5;
    const subTotal = base + durationImpact + urgencyPremium + platformFee;

    // Plan-based discount percentages
    let discountPercent = 0;
    if (careDuration === 'weekly') discountPercent = 7;
    else if (careDuration === 'monthly') discountPercent = 15;

    const discountAmount = Math.round(subTotal * (discountPercent / 100));
    const grandTotal = Math.max(0, subTotal - discountAmount);

    return {
      base,
      durationImpact,
      urgencyPremium,
      platformFee,
      subTotal,
      discountAmount,
      grandTotal,
      discountPercent
    };
  };

  const priceStats = calculatePricing();

  const handleIntentClick = (intentId: string) => {
    setSelectedIntent(intentId);
    // Find the first recommended service under this intent to default to
    const matchingIntent = intentOptions.find(i => i.id === intentId);
    if (matchingIntent && matchingIntent.recommendedServiceIds.length > 0) {
      const firstRecSrv = services.find(s => s.id === matchingIntent.recommendedServiceIds[0]);
      if (firstRecSrv) setSelectedService(firstRecSrv);
    }
    setStep(2);
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Name Required', 'Please enter the patient full name.', 'warning');
      return;
    }
    setStep(3);
  };

  const handleRecommendationSubmit = () => {
    if (!selectedService) {
      showToast('Select a Service', 'Please pick a recommended care procedure to proceed.', 'warning');
      return;
    }
    setStep(4);
  };

  const handleFinalBookingSubmit = () => {
    if (!paymentAcknowledged) {
      showToast('Acknowledge Payment Policy', 'Please agree that all payments are securely processed online only.', 'warning');
      return;
    }

    const notesSummary = [
      `Intake Intent: ${currentIntent?.label || 'General Care'}`,
      `Gender: ${patientGender.toUpperCase()}`,
      `Recently Discharged: ${recentlyDischarged.toUpperCase()}`,
      `Mobility Status: ${mobilityStatus.toUpperCase()}`,
      `Lift Access: ${liftAvailability}`,
      landmark ? `Landmark: ${landmark}` : null,
      patientCondition ? `Diagnosis/Condition: ${patientCondition}` : null,
      medicalNotes ? `Special instructions: ${medicalNotes}` : null
    ].filter(Boolean).join(' · ');

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const created = createBooking({
      service: selectedService!,
      patientName,
      patientAge,
      patientPhone,
      patientAddress,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      addons: [],
      paymentMethod: paymentMethod,
      totalAmount: priceStats.grandTotal,
      basePrice: priceStats.base,
      platformFee: priceStats.platformFee,
      discountAmount: priceStats.discountAmount,
      medicalNotes: notesSummary,
      provider: selectedProvider || undefined,
      intakeIntent: selectedIntent || 'general',
      careDuration,
      patientGender,
      recentlyDischarged,
      mobilityStatus,
      liftAvailability,
      landmark,
      emergencyContactPhone,
      otpCode,
      progressChecklist: {
        vitalsChecked: false,
        medicationAdministered: false,
        dressingCompleted: false
      }
    });

    setConfirmedBooking(created);
  };

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-200">Healthcare Visit Scheduled</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 font-heading">Paramedic Dispatched!</h2>
            <p className="text-emerald-100 text-xs mt-1">
              Ref ID: <strong className="font-mono text-white text-sm">{confirmedBooking.id}</strong>
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Safe OTP share box from Step 9 */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center space-y-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">Secure Check-In Passcode (OTP)</span>
              <div className="text-4xl font-extrabold text-slate-900 tracking-widest font-mono select-all">
                {confirmedBooking.otpCode}
              </div>
              <p className="text-xs text-amber-700 font-medium leading-relaxed max-w-sm mx-auto">
                Share this passcode with paramedic <strong>{assignedStaff.name}</strong> upon arrival at your doorstep to securely initiate care.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-4">
              <HeartPulse className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <h4 className="text-sm font-bold text-teal-900">{confirmedBooking.serviceName}</h4>
                <p className="text-teal-700 font-medium mt-0.5">{confirmedBooking.serviceType} · {confirmedBooking.date} at {confirmedBooking.timeSlot}</p>
                <div className="mt-3 flex items-center gap-3">
                  <img src={assignedStaff.avatar} alt="Staff" className="w-8 h-8 rounded-full object-cover border border-teal-200" />
                  <div>
                    <p className="font-bold text-teal-950">{assignedStaff.name}</p>
                    <p className="text-[10px] text-teal-700">{assignedStaff.title}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-teal-950 font-heading">₹{confirmedBooking.totalAmount}</span>
                <span className="text-[9px] block text-emerald-700 font-bold uppercase mt-1">Paid via {paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-800">{confirmedBooking.patientName} ({confirmedBooking.patientAge} yrs)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination Address:</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{confirmedBooking.patientAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration Commitment:</span>
                <span className="font-semibold text-slate-800 uppercase tracking-wider">{confirmedBooking.careDuration} plan</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('patient-portal')}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                <span>Track Live Progress & Vitals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setConfirmedBooking(null);
                  setStep(1);
                  setSelectedIntent(null);
                  setCareDuration('one-time');
                  setSelectedServiceForBooking(null);
                }}
                className="py-3 px-5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Book Another Visit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patientUser) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 font-heading">Patient Authentication Required</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To protect patient safety, match nearest clinical specialists, and allow real-time dispatch tracking, you must log in to your patient profile before initiating care requests.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => openAuthModal('patient', 'login')}
              className="py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-700/20 active:scale-98 cursor-pointer font-semibold"
            >
              Log In / Create Account
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="py-2.5 px-4 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Browse Services Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto mb-4">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Healthcare Services Catalog is Empty</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The database was successfully cleaned to start completely from scratch. Please click "Log In / Sign Up" above and select **Admin** to create services and customize rates from the Admin Catalog first!
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Go to Home Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Step Indicator Panel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Fast Schedule</span>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                Book a Healthcare Visit
              </h1>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Step {step} of 8
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
              <div key={num} className="space-y-1">
                <div className={`h-1 rounded-full transition-all ${
                  step >= num ? 'bg-teal-600' : 'bg-slate-200'
                }`} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form Left Section (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* STEP 1: Intent Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center max-w-md mx-auto space-y-1 mb-2">
                  <h2 className="text-lg font-bold text-slate-900">How can we help today?</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select a primary intent category to receive tailored clinical recommendations and care specialist allocations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {intentOptions.map(opt => {
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleIntentClick(opt.id)}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer hover:border-teal-400 hover:shadow-sm space-y-3 ${opt.bgColor} ${opt.borderColor} hover:bg-white`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white ${opt.color} bg-white shadow-xs`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{opt.label}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Patient Intake Details */}
            {step === 2 && (
              <form onSubmit={handleIntakeSubmit} className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Patient Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Specify basic patient demographics to support matching clinicians.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Patient Name</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Sarah Jenkins"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Age</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={patientAge}
                        onChange={(e) => setPatientAge(parseInt(e.target.value) || 34)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Gender</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value as any)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Recently Discharged from Hospital?</label>
                    <div className="flex gap-2">
                      {['yes', 'no'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRecentlyDischarged(opt as any)}
                          className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                            recentlyDischarged === opt ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Mobility Status</label>
                    <div className="flex gap-1.5">
                      {['ambulatory', 'assisted', 'bedridden'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMobilityStatus(opt as any)}
                          className={`flex-1 py-2 text-[10px] border rounded-xl font-bold capitalize transition-all cursor-pointer ${
                            mobilityStatus === opt ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Condition / Primary Diagnosis</label>
                  <input
                    type="text"
                    value={patientCondition}
                    onChange={(e) => setPatientCondition(e.target.value)}
                    placeholder="e.g. Post-OP Knee Arthroplasty Recovery, Diabetes Mellitus"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Anything Paramedic should know? (Optional)</label>
                  <textarea
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Allergies, chronic conditions, access hurdles, patient comfort instructions..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                  >
                    <span>Proceed to Service Options</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Recommended Services selection */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recommended Services</h3>
                  <p className="text-xs text-slate-500 mt-0.5">We selected these clinically recommended options based on your selected intake intent.</p>
                </div>

                <div className="space-y-3">
                  {recommendedServices.length > 0 ? (
                    recommendedServices.map(srv => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setSelectedService(srv)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                          selectedService?.id === srv.id
                            ? 'bg-teal-50/50 border-teal-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          selectedService?.id === srv.id ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <HeartPulse className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{srv.name}</span>
                            <span className="font-mono text-xs font-extrabold text-teal-800">₹{srv.price}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{srv.description}</p>
                          <div className="flex gap-2 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>{srv.subCategory}</span>
                            <span>·</span>
                            <span>{srv.serviceType}</span>
                            {srv.priority === 'Critical' && (
                              <>
                                <span>·</span>
                                <span className="text-rose-600">Critical Priority</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold">No Recommended Services found.</p>
                      <p>Pick a service manually using the Catalog tab on the home directory.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRecommendationSubmit}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                  >
                    <span>Proceed to Care Commitment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Duration commitment (Image 2) */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Choose Care Duration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select a flexible duration or structured care plan commitment.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'one-time', label: 'One-time Visit', price: 'Base Price', use: 'Single clinic-level procedure' },
                    { id: '12h', label: '12-Hour Bedside Shift', price: '+ ₹1,999', use: 'Extended post-OP bedside observation' },
                    { id: '24h', label: '24-Hour Bedside Attendant', price: '+ ₹3,999', use: 'Continuous dedicated medical watch' },
                    { id: 'weekly', label: 'Weekly Care Plan', price: '7% Discount', use: 'Short-term therapeutic healing plans' },
                    { id: 'monthly', label: 'Monthly Care Package', price: '15% Discount', use: 'Long-term chronic condition monitoring' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCareDuration(opt.id as any)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        careDuration === opt.id
                          ? 'bg-teal-50/50 border-teal-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900 block">{opt.label}</span>
                        <span className="text-[10px] text-slate-500 block leading-relaxed">{opt.use}</span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-teal-800">{opt.price}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                  >
                    <span>Proceed to Schedule Visit</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Schedule visit */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Appointment Schedule</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Choose preferred date and clinical duty timeframe slots.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Select Care Date</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {[
                        { id: new Date().toISOString().split('T')[0], label: 'Today (Immediate)' },
                        { id: new Date(Date.now() + 86400000).toISOString().split('T')[0], label: 'Tomorrow' }
                      ].map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDate(d.id)}
                          className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedDate === d.id ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Select timeframe slot</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: '08:00 AM - 12:00 PM (Morning Care)', label: 'Morning Slot (8 AM - 12 PM)' },
                        { id: '12:00 PM - 04:00 PM (Afternoon Care)', label: 'Afternoon Slot (12 PM - 4 PM)' },
                        { id: '04:00 PM - 08:00 PM (Evening Care)', label: 'Evening Slot (4 PM - 8 PM)' },
                        { id: '08:00 PM - 08:00 AM (Night Shift)', label: 'Night Care Shift (Urgent Premium)' }
                      ].map(slot => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot.id)}
                          className={`p-3.5 text-left border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedTimeSlot === slot.id ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                  >
                    <span>Proceed to Staff Assignment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Staff Selection & Approval Preview */}
            {step === 6 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Online Professional</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select a verified professional who is online now. The nearest ones are listed on top.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: List of online providers sorted by distance */}
                  <div className="md:col-span-6 space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {providers.filter(p => p.isAvailable).sort((a, b) => {
                      const dA = parseFloat(a.distanceKm?.toString() || '0');
                      const dB = parseFloat(b.distanceKm?.toString() || '0');
                      return dA - dB;
                    }).map((p) => {
                      const isSelected = selectedProvider?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProvider(p)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={p.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80'}
                              alt={p.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                              <p className="text-[10px] text-teal-700 font-semibold">{p.title}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span className="flex items-center gap-0.5 text-amber-500 font-bold">★ {p.rating}</span>
                                <span>·</span>
                                <span>{p.experienceYears} yrs exp</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-[10px]">
                            <span className="font-extrabold text-teal-800 block">₹{p.hourlyRate}/hr</span>
                            <span className="text-slate-400 font-medium block mt-0.5">{p.distanceKm} km away</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[8px] uppercase tracking-wider mt-1 inline-block">Online</span>
                          </div>
                        </div>
                      );
                    })}

                    {providers.filter(p => p.isAvailable).length === 0 && (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-semibold">
                        No online professionals found. Please check back later.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Provider Profile details */}
                  <div className="md:col-span-6">
                    {selectedProvider ? (
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={selectedProvider.avatar}
                            alt={selectedProvider.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-xs shrink-0"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{selectedProvider.name}</h4>
                            <p className="text-xs text-teal-700 font-semibold">{selectedProvider.title}</p>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded-md mt-1">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              Verifiable State License
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-100">
                          &quot;{selectedProvider.bio}&quot;
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-3 rounded-xl border border-slate-100 text-slate-600">
                          <div>
                            <span className="text-slate-400 block">Rating:</span>
                            <strong className="text-slate-800">★ {selectedProvider.rating} / 5.0</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Visits Completed:</span>
                            <strong className="text-slate-800">{selectedProvider.completedVisits || 0} visits</strong>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-400 block">Distance:</span>
                            <strong className="text-slate-800">{selectedProvider.distanceKm} km (Near you)</strong>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-400 block">Estimated ETA:</span>
                            <strong className="text-slate-800">{selectedProvider.etaMinutes} minutes</strong>
                          </div>
                        </div>

                        <div className="text-center p-3 rounded-2xl bg-teal-600/10 border border-teal-100/50 text-[10px] text-teal-900 font-bold">
                          👉 You are requesting approval from {selectedProvider.name.split(',')[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 text-xs font-semibold h-full flex flex-col items-center justify-center">
                        Please select an online provider from the list to preview details and request approval.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedProvider}
                    onClick={() => setStep(7)}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Proceed to Access Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: Address & Access details */}
            {step === 7 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Address & Location Access</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Specify dispatch details for the care professional’s transit.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Patient Location / Address</label>
                    <input
                      type="text"
                      required
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      placeholder="e.g. Flat 104, Bluebell Apartments, Metro District"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Nearby Landmark</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Opposite Metro Station, Near Apollo Pharmacy"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Building Access / Lift</label>
                      <select
                        value={liftAvailability}
                        onChange={(e) => setLiftAvailability(e.target.value as any)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                      >
                        <option value="yes_lift">Has Lift / Elevator</option>
                        <option value="stairs_1">Stairs Only - 1st Floor</option>
                        <option value="stairs_2">Stairs Only - 2nd Floor+</option>
                        <option value="ground">Ground Floor / Direct Access</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Emergency Contact mobile number</label>
                    <input
                      type="tel"
                      required
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(8)}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                  >
                    <span>Proceed to Secure Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 8: Payment methods & warning acknowledgment */}
            {step === 8 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Secure Payment Gateway</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select a payment option and confirm checkout to finalize appointment.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'upi', label: 'UPI (GPay / PhonePe)', icon: Smartphone },
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                    { id: 'net_banking', label: 'Net Banking', icon: Shield },
                    { id: 'wallet', label: 'Mobile Wallet', icon: Coins }
                  ].map(m => {
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-4 text-left border rounded-xl flex items-center gap-3 transition-all cursor-pointer text-xs font-bold ${
                          paymentMethod === m.id ? 'bg-teal-50 text-teal-800 border-teal-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <IconComp className="w-4 h-4 text-teal-600" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Secure Payment Explicit Warnings from Image 3 */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-800">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[10px]">Mandatory Online Payment Compliance</p>
                      <p className="leading-relaxed">
                        To maintain clinical audit records, satisfy professional malpractice liabilities, and qualify for emergency medical insurance claims, 
                        <strong> all services must be paid through the Map2Medic app only.</strong>
                      </p>
                      <p className="font-bold underline">
                        Direct cash payments or offline transactions with dispatch paramedics are strictly prohibited.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={paymentAcknowledged}
                    onChange={(e) => setPaymentAcknowledged(e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded-md focus:ring-teal-500 mt-0.5 cursor-pointer"
                  />
                  <span>
                    I explicitly understand that cash payments are strictly prohibited, and I agree to pay exclusively through this app platform.
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(7)}
                    className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!paymentAcknowledged}
                    onClick={handleFinalBookingSubmit}
                    className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Securely Pay & Authorize Dispatch (₹{priceStats.grandTotal})</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Transparent Price Summary Right Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Transparent Price Summary
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              {selectedService ? (
                <div className="flex justify-between">
                  <div className="max-w-[70%]">
                    <span className="font-bold text-slate-900 block">{selectedService.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{selectedService.subCategory} · {selectedService.serviceType}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">₹{priceStats.base}</span>
                </div>
              ) : (
                <div className="text-slate-400 italic">No care procedure selected yet</div>
              )}

              {/* Care duration surcharge */}
              {priceStats.durationImpact > 0 && (
                <div className="flex justify-between pl-2.5 border-l-2 border-teal-500">
                  <div>
                    <span className="font-semibold text-slate-800 block capitalize">{careDuration} committed shift</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Continuous bedside nursing oversight</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">+₹{priceStats.durationImpact}</span>
                </div>
              )}

              {/* Urgency Premium */}
              {priceStats.urgencyPremium > 0 && (
                <div className="flex justify-between pl-2.5 border-l-2 border-amber-500">
                  <div>
                    <span className="font-semibold text-slate-800 block">Urgent / Night Dispatch Fee</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Surcharge for immediate or off-hour requests</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">+₹{priceStats.urgencyPremium}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Platform Sanitization Fee</span>
                <span className="font-mono font-bold">₹{priceStats.platformFee}</span>
              </div>

              {/* Seeding-based Plan Discounts */}
              {priceStats.discountPercent > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">
                  <span>Care Plan Discount ({priceStats.discountPercent}%)</span>
                  <span className="font-mono">-₹{priceStats.discountAmount}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-slate-950 block">Grand Total</span>
                  <span className="text-[10px] text-slate-400 block">All medical taxes & travel included</span>
                </div>
                <span className="text-2xl font-extrabold text-teal-800 font-heading">₹{priceStats.grandTotal}</span>
              </div>
            </div>

            {/* Quality badge certifications */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>NABL Accredited Quality</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                All dispatches conform strictly to NABL clinical parameters, utilizing sterilized equipment, sealed PPE, and verified, certified professionals.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
