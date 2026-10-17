export type ServiceCategory = 
  | 'all'
  | 'basic_nursing'
  | 'clinical_procedures'
  | 'post_hospital_recovery'
  | 'elderly_care'
  | 'rehab_support'
  | 'diagnostic_assistance'
  | 'emergency_support'
  | 'add_on_services'
  | 'nursing' 
  | 'doctor' 
  | 'physiotherapy' 
  | 'diagnostics' 
  | 'equipment_mothercare';

export type ServiceType = 'Home Visit' | 'Clinic Visit' | 'Teleconsult';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  subCategory?: string;
  price: number;
  baseAmountLabel: string; // e.g. "per visit", "per session", "per 4-hr shift"
  duration: string;
  serviceType: ServiceType;
  description: string;
  includes: string[];
  popular?: boolean;
  requiresPrescription?: boolean;
  priority?: string;
  iconName?: string;
}

export type BookingStatus = 
  | 'confirmed'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface BookingAddon {
  id: string;
  name: string;
  price: number;
  description: string;
}

export type PaymentMethod = 'upi' | 'card' | 'net_banking' | 'wallet' | 'insurance' | 'cash';

export interface Booking {
  id: string; // e.g. "CX-2026-4821"
  patientId?: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  serviceType: ServiceType;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientAddress: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  basePrice: number;
  addons: BookingAddon[];
  platformFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'insurance_claim_filed';
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  providerRating?: number;
  medicalNotes?: string;
  intakeIntent?: string;
  careDuration?: string;
  patientGender?: string;
  recentlyDischarged?: string;
  mobilityStatus?: string;
  liftAvailability?: string;
  landmark?: string;
  emergencyContactPhone?: string;
  otpCode?: string;
  progressChecklist?: {
    vitalsChecked: boolean;
    medicationAdministered: boolean;
    dressingCompleted: boolean;
  };
  createdAt: string;
  vitalsRecorded?: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    spO2?: string;
    bloodSugar?: string;
    nurseNotes?: string;
    recordedAt?: string;
  };
}

export type ProviderSpecialty = 
  | 'Registered Nurse (RN)' 
  | 'General Physician (MD)' 
  | 'Licensed Physiotherapist' 
  | 'Phlebotomist / Lab Tech'
  | 'Pediatric Nurse';

export interface ProviderDocument {
  id: string;
  docType: 'Medical License' | 'Government ID' | 'BLS / CPR Certification' | 'Malpractice Insurance';
  fileName: string;
  uploadedAt: string;
  status: 'verified' | 'pending_review' | 'rejected';
  rejectionReason?: string;
  expiryDate?: string;
}

export interface HealthcareProvider {
  id: string;
  name: string;
  title: ProviderSpecialty;
  avatar: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  distanceKm: number;
  etaMinutes: number;
  isAvailable: boolean;
  currentLocationName: string;
  badges: string[];
  hourlyRate: number;
  completedVisits: number;
  phone: string;
  email: string;
  bio: string;
  documents: ProviderDocument[];
  pendingPayout: number;
  totalEarningsMonth: number;
}

export type UserRole = 'patient' | 'provider' | 'admin';

export interface PatientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  prescriptions?: {
    id: string;
    name: string;
    doctor: string;
    date: string;
  }[];
}

