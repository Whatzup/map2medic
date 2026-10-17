import { db } from './index.ts';
import { 
  servicePricing, 
  providers, 
  providerDocuments, 
  bookings, 
  users, 
  userLogins, 
  patients,
  reviews,
  prescriptions,
  patientVitalsHistory,
  providerSchedules,
  payouts,
  careMessages,
  notifications
} from './schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { INITIAL_SERVICES, INITIAL_PROVIDERS, INITIAL_BOOKINGS, INITIAL_PATIENT } from '../data/mockData.ts';

// Helper to check if a valid database configuration exists
export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (url && url.trim().length > 0 && !url.includes('user:password@host')) {
    return true;
  }
  if (process.env.SQL_HOST && process.env.SQL_HOST.trim().length > 0) {
    return true;
  }
  return false;
}

// In-Memory Database store for graceful fallback when PostgreSQL is not configured or offline
export let isDbAvailable = isDbConfigured();

export const memoryServices: any[] = [...INITIAL_SERVICES];
export const memoryProviders: any[] = [...INITIAL_PROVIDERS];
export const memoryBookings: any[] = [...INITIAL_BOOKINGS];
export const memoryUsers: any[] = [
  {
    uid: 'pat-demo-001',
    email: 'sarah.m@example.com',
    name: 'Sarah Mitchell',
    role: 'patient',
    phone: '+1 (555) 019-2831',
    address: '742 Evergreen Terrace, Sector 4',
  },
  {
    uid: 'prov-001',
    email: 'elena.rodriguez@map2medic.com',
    name: 'Nurse Elena Rodriguez, RN',
    role: 'provider',
    phone: '+1 (555) 234-5678',
  },
];
export const memoryLogins: any[] = [];
export const memoryPatients: any[] = [INITIAL_PATIENT];
export const memoryReviews: any[] = [];
export const memoryPrescriptions: any[] = [];
export const memoryVitalsHistory: any[] = [];
export const memorySchedules: any[] = [];
export const memoryPayouts: any[] = [];
export const memoryMessages: any[] = [];
export const memoryNotifications: any[] = [];

// Helper to disable DB and switch to memory fallback
export function handleDbFailure(error: any) {
  if (!error) return;

  const cause = error?.cause || error;
  const errorMsg = error?.message || '';
  const causeMsg = cause?.message || '';
  const errorCode = error?.code || cause?.code || '';
  const fullErrorString = `${errorMsg} ${causeMsg} ${errorCode} ${String(error)} ${String(cause)}`.toLowerCase();

  const isConnectionError =
    fullErrorString.includes('econnrefused') ||
    fullErrorString.includes('connect') ||
    fullErrorString.includes('timeout') ||
    fullErrorString.includes('enotfound') ||
    fullErrorString.includes('etimedout') ||
    fullErrorString.includes('address') ||
    fullErrorString.includes('getaddrinfo') ||
    fullErrorString.includes('pool') ||
    fullErrorString.includes('closed') ||
    fullErrorString.includes('socket') ||
    fullErrorString.includes('terminated') ||
    fullErrorString.includes('failed query') ||
    fullErrorString.includes('drizzlequeryerror') ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ETIMEDOUT' ||
    String(errorCode).startsWith('08') ||
    String(errorCode).startsWith('28');

  if (isConnectionError) {
    if (isDbAvailable) {
      console.warn('PostgreSQL connection offline or unavailable. Switching to In-Memory Fallback Database. Reason:', causeMsg || errorMsg || error);
      isDbAvailable = false;

      if (isDbConfigured()) {
        setTimeout(() => {
          console.log('PostgreSQL self-healing: Re-enabling database connection attempt...');
          isDbAvailable = true;
        }, 30000);
      }
    }
  } else {
    console.error('PostgreSQL query execution failed:', errorMsg || error);
  }
}

// Record User Login Concept
export async function recordUserLoginInDb(userId: string, email: string, ipAddress?: string, userAgent?: string) {
  const loginId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const loginObj = {
    id: loginId,
    userId,
    email,
    loginAt: new Date().toISOString(),
    ipAddress: ipAddress || '127.0.0.1',
    userAgent: userAgent || 'Map2Medic App',
    status: 'success',
  };
  memoryLogins.push(loginObj);

  if (isDbAvailable) {
    try {
      await db.insert(userLogins).values({
        id: loginId,
        userId,
        email,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Map2Medic App',
        status: 'success',
      }).onConflictDoNothing();
    } catch (error) {
      handleDbFailure(error);
    }
  }
}

// Seed Initial Data if empty and create all 14 concept tables
export async function seedInitialDataIfEmpty() {
  if (!isDbAvailable) return;
  try {
    console.log('Verifying schemas and ensuring database concept tables exist in PostgreSQL...');
    
    // 1. Users concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'patient',
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. User Logins concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_logins (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        email TEXT NOT NULL,
        login_at TIMESTAMP DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT,
        status TEXT NOT NULL DEFAULT 'success'
      );
    `);

    // 3. Patients concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL UNIQUE,
        name TEXT NOT NULL,
        age INTEGER DEFAULT 35,
        gender TEXT,
        phone TEXT,
        address TEXT,
        emergency_contact_phone TEXT,
        mobility_status TEXT,
        recently_discharged TEXT,
        medical_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Service Pricing catalog concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_pricing (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        sub_category TEXT,
        price INTEGER NOT NULL,
        base_amount_label TEXT NOT NULL,
        duration TEXT NOT NULL,
        service_type TEXT NOT NULL,
        description TEXT NOT NULL,
        includes TEXT[],
        popular BOOLEAN DEFAULT FALSE,
        requires_prescription BOOLEAN DEFAULT FALSE,
        priority TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Providers concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(uid) ON DELETE CASCADE,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        avatar TEXT,
        rating TEXT DEFAULT '5.0',
        review_count INTEGER DEFAULT 0,
        experience_years INTEGER DEFAULT 1,
        distance_km TEXT DEFAULT '2.0',
        eta_minutes INTEGER DEFAULT 20,
        is_available BOOLEAN DEFAULT TRUE,
        current_location_name TEXT DEFAULT 'Metro District',
        badges TEXT[],
        hourly_rate INTEGER DEFAULT 50,
        completed_visits INTEGER DEFAULT 0,
        phone TEXT,
        email TEXT,
        bio TEXT,
        pending_payout INTEGER DEFAULT 0,
        total_earnings_month INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Provider Documents concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS provider_documents (
        id TEXT PRIMARY KEY,
        provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE,
        patient_id TEXT REFERENCES users(uid) ON DELETE CASCADE,
        doc_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_review',
        rejection_reason TEXT,
        expiry_date TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Bookings concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        patient_id TEXT REFERENCES users(uid) ON DELETE SET NULL,
        service_id TEXT REFERENCES service_pricing(id) ON DELETE SET NULL,
        provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        base_price INTEGER NOT NULL,
        addons JSONB,
        platform_fee INTEGER NOT NULL DEFAULT 5,
        discount INTEGER NOT NULL DEFAULT 0,
        total_amount INTEGER NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'card',
        payment_status TEXT NOT NULL DEFAULT 'paid',
        medical_notes TEXT,
        vitals_recorded JSONB,
        intake_intent TEXT,
        care_duration TEXT,
        otp_code TEXT,
        progress_checklist JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Reviews concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
        patient_id TEXT REFERENCES users(uid) ON DELETE SET NULL,
        provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 9. Prescriptions concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
        patient_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        instructions TEXT,
        duration_days INTEGER DEFAULT 7,
        issued_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 10. Patient Vitals History concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patient_vitals_history (
        id TEXT PRIMARY KEY,
        patient_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
        blood_pressure_sys INTEGER,
        blood_pressure_dia INTEGER,
        heart_rate INTEGER,
        temperature_c TEXT,
        spo2 INTEGER,
        glucose_mg_dl INTEGER,
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 11. Provider Schedule concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS provider_schedules (
        id TEXT PRIMARY KEY,
        provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 12. Payouts concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        payout_method TEXT NOT NULL DEFAULT 'direct_deposit',
        payout_date TIMESTAMP DEFAULT NOW(),
        transaction_ref TEXT
      );
    `);

    // 13. Care Messages concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS care_messages (
        id TEXT PRIMARY KEY,
        booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
        sender_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        receiver_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 14. Notifications concept table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'general',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure missing columns are dynamically added to pre-existing tables
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

      ALTER TABLE user_logins ADD COLUMN IF NOT EXISTS user_id TEXT;
      ALTER TABLE user_logins ADD COLUMN IF NOT EXISTS email TEXT;

      ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS name TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 35;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS mobility_status TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS recently_discharged TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_notes TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS landmark TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;

      ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id TEXT;
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS pending_payout INTEGER DEFAULT 0;
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS total_earnings_month INTEGER DEFAULT 0;

      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS provider_id TEXT;
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS patient_id TEXT;
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS doc_type TEXT;
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS uploaded_at TEXT;
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review';
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS expiry_date TEXT;

      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_id TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_id TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_price INTEGER;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS addons JSONB;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 5;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount INTEGER;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS medical_notes TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vitals_recorded JSONB;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_intent TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS care_duration TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS otp_code TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS progress_checklist JSONB;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_name TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_age INTEGER;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_gender TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_phone TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_address TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS landmark TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lift_availability TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mobility_status TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recently_discharged TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_name TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_name TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_phone TEXT;

      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS patient_id TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS provider_id TEXT;

      ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS booking_id TEXT;
      ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_id TEXT;
      ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS provider_id TEXT;

      ALTER TABLE patient_vitals_history ADD COLUMN IF NOT EXISTS patient_id TEXT;
      ALTER TABLE patient_vitals_history ADD COLUMN IF NOT EXISTS booking_id TEXT;

      ALTER TABLE provider_schedules ADD COLUMN IF NOT EXISTS provider_id TEXT;
      ALTER TABLE payouts ADD COLUMN IF NOT EXISTS provider_id TEXT;

      ALTER TABLE care_messages ADD COLUMN IF NOT EXISTS booking_id TEXT;
      ALTER TABLE care_messages ADD COLUMN IF NOT EXISTS sender_id TEXT;
      ALTER TABLE care_messages ADD COLUMN IF NOT EXISTS receiver_id TEXT;

      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id TEXT;

      DO $$
      DECLARE
          col RECORD;
          tbl TEXT;
          tables TEXT[] := ARRAY['users', 'user_logins', 'patients', 'service_pricing', 'providers', 'provider_documents', 'bookings', 'reviews', 'prescriptions', 'patient_vitals_history', 'provider_schedules', 'payouts', 'care_messages', 'notifications'];
      BEGIN
          FOREACH tbl IN ARRAY tables
          LOOP
              IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
                  FOR col IN 
                      SELECT column_name 
                      FROM information_schema.columns 
                      WHERE table_name = tbl AND is_nullable = 'NO' AND column_name NOT IN ('id', 'uid')
                  LOOP
                      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', tbl, col.column_name);
                  END LOOP;
              END IF;
          END LOOP;
      END $$;
    `);

    console.log('PostgreSQL all 14 concept tables verified and schema migrated successfully!');

    // Reconciliation: Ensure every registered user in users table has a corresponding patient or provider row
    try {
      const allUsers = await db.select().from(users);
      const existingProviders = await db.select().from(providers);
      const existingPatients = await db.select().from(patients);

      for (const u of allUsers) {
        if (u.role === 'provider') {
          const matchedProv = existingProviders.find(p => p.userId === u.uid || (u.email && p.email === u.email) || (u.phone && p.phone === u.phone));
          if (!matchedProv) {
            const provId = `prov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
            await db.insert(providers).values({
              id: provId,
              userId: u.uid,
              name: u.name || 'Care Specialist',
              title: 'Registered Healthcare Provider',
              avatar: null,
              rating: '5.0',
              reviewCount: 0,
              experienceYears: 4,
              distanceKm: '2.0',
              etaMinutes: 20,
              isAvailable: true,
              currentLocationName: u.address || 'Central District',
              badges: ['Board Certified', 'Verified Map2Medic Specialist'],
              hourlyRate: 60,
              completedVisits: 0,
              phone: u.phone || null,
              email: u.email || null,
              bio: `Licensed care specialist providing sterile home visits, procedures, and bedside nursing oversight.`,
              pendingPayout: 0,
              totalEarningsMonth: 0,
            }).onConflictDoNothing();
          }
        } else if (u.role === 'patient') {
          const matchedPat = existingPatients.find(p => p.userId === u.uid);
          if (!matchedPat) {
            await db.insert(patients).values({
              id: `pat-${u.uid}`,
              userId: u.uid,
              name: u.name || 'Patient User',
              phone: u.phone || null,
              address: u.address || null,
            }).onConflictDoNothing();
          }
        }
      }
    } catch (healError) {
      console.warn('User table reconciliation warning:', healError);
    }

    // Seed services pricing catalog only if service_pricing table is empty (preserving all user, patient, and provider data)
    const existingServices = await db.select().from(servicePricing);
    if (existingServices.length === 0) {
      for (const srv of INITIAL_SERVICES) {
        await db.insert(servicePricing).values({
          id: srv.id,
          name: srv.name,
          category: srv.category,
          subCategory: srv.subCategory || null,
          price: srv.price,
          baseAmountLabel: srv.baseAmountLabel,
          duration: srv.duration,
          serviceType: srv.serviceType,
          description: srv.description,
          includes: srv.includes || [],
          popular: srv.popular || false,
          requiresPrescription: srv.requiresPrescription || false,
          priority: srv.priority || null,
        }).onConflictDoNothing();
      }
    }
  } catch (error) {
    handleDbFailure(error);
  }
}

// Service Catalog Queries
export async function getAllServices() {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(servicePricing);
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryServices;
}

export async function updateServiceRate(id: string, price: number, baseLabel: string) {
  if (isDbAvailable) {
    try {
      const updated = await db.update(servicePricing)
        .set({ price, baseAmountLabel: baseLabel })
        .where(eq(servicePricing.id, id))
        .returning();
      if (updated.length > 0) return updated[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const idx = memoryServices.findIndex(s => s.id === id);
  if (idx !== -1) {
    memoryServices[idx] = { ...memoryServices[idx], price, baseAmountLabel: baseLabel };
    return memoryServices[idx];
  }
  return null;
}

export async function insertService(data: any) {
  if (isDbAvailable) {
    try {
      const dbData = { ...data };
      if (dbData.createdAt) {
        dbData.createdAt = new Date(dbData.createdAt);
      }
      const inserted = await db.insert(servicePricing).values(dbData).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const newService = {
    id: data.id || `srv-${Date.now().toString(36)}`,
    name: data.name,
    category: data.category,
    price: data.price,
    baseAmountLabel: data.baseAmountLabel || 'per visit',
    duration: data.duration || '45 mins',
    serviceType: data.serviceType || 'Home Visit',
    description: data.description || '',
    includes: data.includes || [],
    popular: data.popular || false,
    requiresPrescription: data.requiresPrescription || false,
  };
  memoryServices.unshift(newService);
  return newService;
}

export async function deleteServiceInDb(id: string) {
  if (isDbAvailable) {
    try {
      const deleted = await db.delete(servicePricing).where(eq(servicePricing.id, id)).returning();
      if (deleted.length > 0) return deleted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const idx = memoryServices.findIndex(s => s.id === id);
  if (idx !== -1) {
    const deleted = memoryServices[idx];
    memoryServices.splice(idx, 1);
    return deleted;
  }
  return null;
}

export async function getDatabaseStats() {
  if (isDbAvailable) {
    try {
      const allServices = await db.select().from(servicePricing);
      const allProviders = await db.select().from(providers);
      const allBookings = await db.select().from(bookings);
      const allDocs = await db.select().from(providerDocuments);
      const allReviews = await db.select().from(reviews);
      const allPrescriptions = await db.select().from(prescriptions);

      const totalRevenue = allBookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const verifiedDocs = allDocs.filter(d => d.status === 'verified').length;
      const pendingDocs = allDocs.filter(d => d.status === 'pending_review').length;
      const completedVisits = allBookings.filter(b => b.status === 'completed').length;
      const activeDispatches = allBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;

      return {
        totalServices: allServices.length,
        totalProviders: allProviders.length,
        availableProviders: allProviders.filter(p => p.isAvailable).length,
        totalBookings: allBookings.length,
        activeDispatches,
        completedVisits,
        totalRevenue,
        verifiedDocs,
        pendingDocs,
        totalReviews: allReviews.length + memoryReviews.length,
        totalPrescriptions: allPrescriptions.length + memoryPrescriptions.length,
      };
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const totalRevenue = memoryBookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  let verifiedDocs = 0;
  let pendingDocs = 0;
  memoryProviders.forEach(p => {
    p.documents.forEach((doc: any) => {
      if (doc.status === 'verified') verifiedDocs++;
      if (doc.status === 'pending_review') pendingDocs++;
    });
  });

  const completedVisits = memoryBookings.filter(b => b.status === 'completed').length;
  const activeDispatches = memoryBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;

  return {
    totalServices: memoryServices.length,
    totalProviders: memoryProviders.length,
    availableProviders: memoryProviders.filter(p => p.isAvailable).length,
    totalBookings: memoryBookings.length,
    activeDispatches,
    completedVisits,
    totalRevenue,
    verifiedDocs,
    pendingDocs,
    totalReviews: memoryReviews.length,
    totalPrescriptions: memoryPrescriptions.length,
  };
}

// Provider Queries
export async function getAllProviders() {
  const provMap = new Map<string, any>();
  for (const mp of memoryProviders) {
    if (mp && mp.id) provMap.set(mp.id, mp);
  }

  if (isDbAvailable) {
    try {
      const allProviders = await db.select().from(providers);
      const allDocs = await db.select().from(providerDocuments);

      for (const p of allProviders) {
        provMap.set(p.id, {
          ...provMap.get(p.id),
          ...p,
          rating: parseFloat(p.rating || '5.0'),
          distanceKm: parseFloat(p.distanceKm || '2.0'),
          documents: allDocs.filter(d => d.providerId === p.id),
        });
      }
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return Array.from(provMap.values());
}

export async function toggleProviderAvailabilityInDb(providerId: string, isAvailable: boolean) {
  if (isDbAvailable) {
    try {
      const updated = await db.update(providers)
        .set({ isAvailable })
        .where(eq(providers.id, providerId))
        .returning();
      if (updated.length > 0) return updated[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const p = memoryProviders.find(prov => prov.id === providerId);
  if (p) {
    p.isAvailable = isAvailable;
    return p;
  }
  return null;
}

export async function updateDocumentStatusInDb(docId: string, status: string, reason?: string) {
  if (isDbAvailable) {
    try {
      const updated = await db.update(providerDocuments)
        .set({
          status,
          rejectionReason: reason || null,
        })
        .where(eq(providerDocuments.id, docId))
        .returning();
      if (updated.length > 0) return updated[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  for (const p of memoryProviders) {
    const doc = p.documents.find((d: any) => d.id === docId);
    if (doc) {
      doc.status = status as any;
      doc.rejectionReason = reason || undefined;
      return doc;
    }
  }
  return null;
}

// Bookings Queries
export async function getAllBookings() {
  let dbBookingsList: any[] = [];
  if (isDbAvailable) {
    try {
      const rawBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
      const allUsers = await db.select().from(users);
      const allPatients = await db.select().from(patients);
      const allServices = await db.select().from(servicePricing);
      const allProviders = await db.select().from(providers);

      dbBookingsList = rawBookings.map(b => {
        const memMatch = memoryBookings.find(mb => mb.id === b.id);
        const patientUser = allUsers.find(u => 
          u.uid === b.patientId || 
          (b.patientId && (u.uid.includes(b.patientId) || b.patientId.includes(u.uid) || (u.phone && b.patientId.includes(u.phone)))) ||
          (memMatch?.patientPhone && u.phone && u.phone.includes(memMatch.patientPhone))
        );
        const patientProfile = allPatients.find(p => p.userId === b.patientId || (patientUser && p.userId === patientUser.uid));
        const service = allServices.find(s => s.id === b.serviceId);
        const provider = allProviders.find(p => p.id === b.providerId);

        return {
          ...memMatch,
          ...b,
          patientName: b.patientName || patientUser?.name || patientProfile?.name || memMatch?.patientName || 'Patient User',
          patientAge: b.patientAge || patientProfile?.age || memMatch?.patientAge || 35,
          patientGender: b.patientGender || patientProfile?.gender || memMatch?.patientGender || 'Male',
          patientPhone: b.patientPhone || patientUser?.phone || patientProfile?.phone || memMatch?.patientPhone || '',
          patientAddress: b.patientAddress || patientUser?.address || patientProfile?.address || memMatch?.patientAddress || 'Metro District',
          landmark: b.landmark || patientProfile?.landmark || memMatch?.landmark || 'Near Main Entrance',
          liftAvailability: b.liftAvailability || memMatch?.liftAvailability || 'Ground Floor',
          emergencyContactPhone: b.emergencyContactPhone || patientProfile?.emergencyContactPhone || memMatch?.emergencyContactPhone || '',
          mobilityStatus: b.mobilityStatus || patientProfile?.mobilityStatus || memMatch?.mobilityStatus || 'Ambulatory',
          recentlyDischarged: b.recentlyDischarged || patientProfile?.recentlyDischarged || memMatch?.recentlyDischarged || 'No',
          serviceName: b.serviceName || service?.name || memMatch?.serviceName || 'Care Visit',
          category: service?.category || memMatch?.category || 'Clinical',
          serviceType: service?.serviceType || memMatch?.serviceType || 'Home Visit',
          providerName: b.providerName || provider?.name || memMatch?.providerName || 'Care Specialist',
          providerPhone: b.providerPhone || provider?.phone || memMatch?.providerPhone || '',
          providerRating: provider?.rating || memMatch?.providerRating || '5.0',
        };
      });
    } catch (error) {
      handleDbFailure(error);
    }
  }

  // Combine DB bookings with memoryBookings so no created booking is ever lost!
  const combinedMap = new Map<string, any>();
  for (const mb of memoryBookings) {
    if (mb && mb.id) combinedMap.set(mb.id, mb);
  }
  for (const dbb of dbBookingsList) {
    if (dbb && dbb.id) {
      const existing = combinedMap.get(dbb.id);
      combinedMap.set(dbb.id, { ...existing, ...dbb });
    }
  }

  return Array.from(combinedMap.values()).sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
}

export async function getSingleBookingFromDb(id: string) {
  if (isDbAvailable) {
    try {
      const all = await getAllBookings();
      const match = all.find(b => b.id === id);
      if (match) return match;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryBookings.find(b => b.id === id) || null;
}

export async function createBookingInDb(data: any) {
  let patientUid = data.patientId;
  if (!patientUid || patientUid === 'undefined' || patientUid === 'null') {
    patientUid = data.patientPhone ? `usr-${data.patientPhone}` : `usr-${Date.now()}`;
  }
  const bookingId = data.id || `CX-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const parsedAge = typeof data.patientAge === 'number' && data.patientAge > 0
    ? data.patientAge
    : (parseInt(data.patientAge, 10) || 35);
  const parsedGender = data.patientGender || 'Male';

  const memBooking: any = {
    ...data,
    id: bookingId,
    patientId: patientUid,
    patientName: data.patientName || 'Patient User',
    patientAge: parsedAge,
    patientGender: parsedGender,
    patientPhone: data.patientPhone || '',
    patientAddress: data.patientAddress || '',
    serviceName: data.serviceName || data.service?.name || 'Care Visit',
    providerName: data.providerName || data.provider?.name || 'Care Specialist',
    providerPhone: data.providerPhone || data.provider?.phone || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };

  // Keep memory cache updated
  const existingMemIdx = memoryBookings.findIndex((mb: any) => mb.id === bookingId);
  if (existingMemIdx !== -1) {
    memoryBookings[existingMemIdx] = memBooking;
  } else {
    memoryBookings.unshift(memBooking);
  }

  if (isDbAvailable) {
    try {
      // ALWAYS Upsert User & Patient Profile in PostgreSQL
      if (patientUid || data.patientPhone || data.patientName) {
        try {
          await db.insert(users).values({
            uid: patientUid,
            email: data.email || `${patientUid}@map2medic.local`,
            name: data.patientName || 'Patient User',
            phone: data.patientPhone || null,
            address: data.patientAddress || null,
            role: 'patient',
          }).onConflictDoUpdate({
            target: users.uid,
            set: {
              ...(data.patientName ? { name: data.patientName } : {}),
              ...(data.patientPhone ? { phone: data.patientPhone } : {}),
              ...(data.patientAddress ? { address: data.patientAddress } : {}),
            }
          });

          await db.insert(patients).values({
            id: `pat-${patientUid}`,
            userId: patientUid,
            name: data.patientName || 'Patient User',
            age: parsedAge,
            gender: parsedGender,
            phone: data.patientPhone || null,
            address: data.patientAddress || null,
            landmark: data.landmark || null,
            emergencyContactPhone: data.emergencyContactPhone || null,
            mobilityStatus: data.mobilityStatus || null,
            recentlyDischarged: data.recentlyDischarged || null,
            medicalNotes: data.medicalNotes || null,
          }).onConflictDoUpdate({
            target: patients.userId,
            set: {
              ...(data.patientName ? { name: data.patientName } : {}),
              ...(data.patientPhone ? { phone: data.patientPhone } : {}),
              ...(data.patientAddress ? { address: data.patientAddress } : {}),
              age: parsedAge,
              gender: parsedGender,
              ...(data.landmark ? { landmark: data.landmark } : {}),
              ...(data.emergencyContactPhone ? { emergencyContactPhone: data.emergencyContactPhone } : {}),
              ...(data.mobilityStatus ? { mobilityStatus: data.mobilityStatus } : {}),
              ...(data.recentlyDischarged ? { recentlyDischarged: data.recentlyDischarged } : {}),
              ...(data.medicalNotes ? { medicalNotes: data.medicalNotes } : {}),
            }
          });
        } catch (e) {
          console.warn('Patient upsert warning:', e);
        }
      }

      // Safe Foreign Key checks for servicePricing and providers
      let safeServiceId = data.serviceId || null;
      if (safeServiceId) {
        try {
          const srvCheck = await db.select().from(servicePricing).where(eq(servicePricing.id, safeServiceId));
          if (srvCheck.length === 0) safeServiceId = null;
        } catch {
          safeServiceId = null;
        }
      }

      let safeProviderId = data.providerId || null;
      let matchedProvName = data.providerName || null;
      let matchedProvPhone = data.providerPhone || null;

      if (safeProviderId) {
        try {
          const provCheck = await db.select().from(providers).where(eq(providers.id, safeProviderId));
          if (provCheck.length === 0) {
            safeProviderId = null;
          } else {
            matchedProvName = matchedProvName || provCheck[0].name;
            matchedProvPhone = matchedProvPhone || provCheck[0].phone;
          }
        } catch {
          safeProviderId = null;
        }
      }

      const inserted = await db.insert(bookings).values({
        id: bookingId,
        patientId: patientUid,
        serviceId: safeServiceId,
        providerId: safeProviderId,
        patientName: data.patientName || 'Patient User',
        patientAge: parsedAge,
        patientGender: parsedGender,
        patientPhone: data.patientPhone || null,
        patientAddress: data.patientAddress || null,
        landmark: data.landmark || null,
        liftAvailability: data.liftAvailability || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        mobilityStatus: data.mobilityStatus || null,
        recentlyDischarged: data.recentlyDischarged || null,
        serviceName: data.serviceName || data.service?.name || 'Care Visit',
        providerName: matchedProvName || 'Care Specialist',
        providerPhone: matchedProvPhone || '',
        date: data.date || new Date().toISOString().split('T')[0],
        timeSlot: data.timeSlot || '09:00 AM',
        status: data.status || 'confirmed',
        basePrice: typeof data.basePrice === 'number' ? data.basePrice : 50,
        addons: data.addons || null,
        platformFee: typeof data.platformFee === 'number' ? data.platformFee : 5,
        discount: typeof data.discount === 'number' ? data.discount : 0,
        totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 55,
        paymentMethod: data.paymentMethod || 'card',
        paymentStatus: data.paymentStatus || 'paid',
        medicalNotes: data.medicalNotes || null,
        vitalsRecorded: data.vitalsRecorded || null,
        intakeIntent: data.intakeIntent || null,
        careDuration: data.careDuration || null,
        otpCode: data.otpCode || null,
        progressChecklist: data.progressChecklist || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      }).returning();

      // Auto-create confirmation notification in DB
      await createNotificationInDb({
        userId: patientUid,
        title: 'Booking Confirmed',
        body: `Care appointment #${bookingId} confirmed for ${data.date || 'today'} (${data.timeSlot || '09:00 AM'}). Dispatch team notified!`,
        type: 'booking_status',
      });

      if (inserted.length > 0) {
        const b = inserted[0];
        const resObj = {
          ...memBooking,
          ...b,
          patientName: data.patientName || 'Patient User',
          patientPhone: data.patientPhone || '',
          patientAddress: data.patientAddress || '',
          providerName: matchedProvName || 'Care Specialist',
          providerPhone: matchedProvPhone || '',
        };

        const idx = memoryBookings.findIndex((mb: any) => mb.id === bookingId);
        if (idx !== -1) {
          memoryBookings[idx] = resObj;
        }

        return resObj;
      }
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return memBooking;
}

export async function saveVitalsToHistoryFromBooking(bookingId: string, vitalsObj: any) {
  if (!vitalsObj) return;
  try {
    let patientUid = 'usr-patient';
    const bMem = memoryBookings.find(b => b.id === bookingId);
    if (bMem?.patientId) {
      patientUid = bMem.patientId;
    } else if (isDbAvailable) {
      const bDb = await db.select().from(bookings).where(eq(bookings.id, bookingId));
      if (bDb.length > 0 && bDb[0].patientId) {
        patientUid = bDb[0].patientId;
      }
    }

    let sys: number | undefined;
    let dia: number | undefined;
    const bpStr = vitalsObj.bloodPressure || vitalsObj.bp;
    if (bpStr && typeof bpStr === 'string' && bpStr.includes('/')) {
      const parts = bpStr.split('/');
      sys = parseInt(parts[0], 10) || undefined;
      dia = parseInt(parts[1], 10) || undefined;
    }

    let hr: number | undefined;
    const hrStr = vitalsObj.pulseRate || vitalsObj.pulse || vitalsObj.heartRate;
    if (hrStr) {
      hr = parseInt(String(hrStr).replace(/\D/g, ''), 10) || undefined;
    }

    let spo2Num: number | undefined;
    const spo2Str = vitalsObj.spO2 || vitalsObj.spo2;
    if (spo2Str) {
      spo2Num = parseInt(String(spo2Str).replace(/\D/g, ''), 10) || undefined;
    }

    let glucoseNum: number | undefined;
    const gStr = vitalsObj.bloodSugar || vitalsObj.glucose || vitalsObj.glucoseMgDl;
    if (gStr) {
      glucoseNum = parseInt(String(gStr).replace(/\D/g, ''), 10) || undefined;
    }

    const tempStr = vitalsObj.temperature || vitalsObj.temp || vitalsObj.temperatureC;
    const notesStr = vitalsObj.notes || vitalsObj.medicalNotes || `Vitals recorded during appointment #${bookingId}`;

    await recordPatientVitalsInDb({
      patientId: patientUid,
      bookingId,
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      heartRate: hr,
      temperatureC: tempStr ? String(tempStr) : undefined,
      spo2: spo2Num,
      glucoseMgDl: glucoseNum,
      notes: notesStr,
    });
  } catch (e) {
    console.warn('Auto-save vitals history error:', e);
  }
}

export async function updateBookingStatusInDb(id: string, status: string, vitals?: any, checklist?: any) {
  if (vitals) {
    await saveVitalsToHistoryFromBooking(id, vitals);
  }

  if (isDbAvailable) {
    try {
      const setPayload: any = { status };
      if (vitals) {
        setPayload.vitalsRecorded = vitals;
      }
      if (checklist) {
        setPayload.progressChecklist = checklist;
      }
      const updated = await db.update(bookings)
        .set(setPayload)
        .where(eq(bookings.id, id))
        .returning();

      // If status completed, update provider completedVisits, pendingPayout, totalEarningsMonth
      if (status === 'completed' && updated.length > 0 && updated[0].providerId) {
        const provId = updated[0].providerId;
        const totalAmt = updated[0].totalAmount || 50;
        const netEarnings = Math.max(10, totalAmt - (updated[0].platformFee || 5));
        try {
          await db.update(providers)
            .set({
              completedVisits: sql`COALESCE(${providers.completedVisits}, 0) + 1`,
              pendingPayout: sql`COALESCE(${providers.pendingPayout}, 0) + ${netEarnings}`,
              totalEarningsMonth: sql`COALESCE(${providers.totalEarningsMonth}, 0) + ${netEarnings}`
            })
            .where(eq(providers.id, provId));
        } catch (e) {
          console.warn('Failed to update provider earnings on visit completion:', e);
        }
      }

      if (updated.length > 0) {
        const bMem = memoryBookings.find(book => book.id === id);
        if (bMem) {
          bMem.status = status;
          if (vitals) bMem.vitalsRecorded = vitals;
          if (checklist) bMem.progressChecklist = checklist;
        }
        return updated[0];
      }
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const b = memoryBookings.find(book => book.id === id);
  if (b) {
    b.status = status as any;
    if (vitals) {
      b.vitalsRecorded = { ...b.vitalsRecorded, ...vitals };
    }
    if (checklist) {
      b.progressChecklist = { ...b.progressChecklist, ...checklist };
    }
    return b;
  }
  return null;
}

// -------------------------------------------------------------
// DUPLICATE EMAIL & PHONE RESTRICTION ENGINE
// -------------------------------------------------------------
export async function checkExistingUserDuplicates(
  email?: string,
  phone?: string,
  excludeUid?: string
): Promise<{ isDuplicate: boolean; emailExists: boolean; phoneExists: boolean; message: string }> {
  const normEmail = email ? email.trim().toLowerCase() : '';
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const normPhone = cleanPhone.length >= 7 ? cleanPhone.slice(-10) : '';

  let emailExists = false;
  let phoneExists = false;

  const matchEmail = (e?: string | null) => {
    if (!normEmail || !e || !e.trim()) return false;
    return e.trim().toLowerCase() === normEmail;
  };

  const matchPhone = (p?: string | null) => {
    if (!normPhone || !p) return false;
    const targetClean = p.replace(/\D/g, '');
    if (!targetClean || targetClean.length < 7) return false;
    const targetNorm = targetClean.slice(-10);
    return targetNorm === normPhone || targetNorm.endsWith(normPhone) || normPhone.endsWith(targetNorm);
  };

  const isExcluded = (idOrUid?: string | null, userId?: string | null) => {
    if (!excludeUid) return false;
    const ex = excludeUid.trim().toLowerCase();
    if (!ex) return false;
    if (idOrUid && (idOrUid.toLowerCase() === ex || idOrUid.toLowerCase().includes(ex) || ex.includes(idOrUid.toLowerCase()))) return true;
    if (userId && (userId.toLowerCase() === ex || userId.toLowerCase().includes(ex) || ex.includes(userId.toLowerCase()))) return true;
    return false;
  };

  if (isDbAvailable) {
    try {
      // 1. Check users table
      const allUsers = await db.select().from(users);
      for (const u of allUsers) {
        if (isExcluded(u.uid)) continue;
        if (matchEmail(u.email)) emailExists = true;
        if (matchPhone(u.phone)) phoneExists = true;
      }

      // 2. Check patients table
      const allPatients = await db.select().from(patients);
      for (const pat of allPatients) {
        if (isExcluded(pat.id, pat.userId)) continue;
        if (matchPhone(pat.phone)) phoneExists = true;
      }

      // 3. Check providers table
      const allProvs = await db.select().from(providers);
      for (const prov of allProvs) {
        if (isExcluded(prov.id, prov.userId)) continue;
        if (matchEmail(prov.email)) emailExists = true;
        if (matchPhone(prov.phone)) phoneExists = true;
      }
    } catch (e) {
      handleDbFailure(e);
    }
  }

  // Check memory cache
  for (const u of memoryUsers) {
    if (isExcluded(u.uid)) continue;
    if (matchEmail(u.email)) emailExists = true;
    if (matchPhone(u.phone)) phoneExists = true;
  }

  for (const pat of memoryPatients) {
    if (isExcluded(pat.id, pat.userId)) continue;
    if (matchPhone(pat.phone)) phoneExists = true;
  }

  for (const prov of memoryProviders) {
    if (isExcluded(prov.id, (prov as any).userId)) continue;
    if (matchEmail(prov.email)) emailExists = true;
    if (matchPhone(prov.phone)) phoneExists = true;
  }

  if (emailExists && phoneExists) {
    return {
      isDuplicate: true,
      emailExists: true,
      phoneExists: true,
      message: `Duplicate User Restricted: Both Email ID (${email}) AND Mobile Phone Number (${phone}) are already registered to an existing patient or provider. Each user must have a unique email and phone number.`
    };
  }
  if (emailExists) {
    return {
      isDuplicate: true,
      emailExists: true,
      phoneExists: false,
      message: `Duplicate Email ID Restricted: An account with Email ID "${email}" is already registered. Each patient/provider must have a unique email address.`
    };
  }
  if (phoneExists) {
    return {
      isDuplicate: true,
      emailExists: false,
      phoneExists: true,
      message: `Duplicate Phone Number Restricted: An account with Mobile Phone Number "${phone}" is already registered. Each patient/provider must have a unique phone number.`
    };
  }

  return { isDuplicate: false, emailExists: false, phoneExists: false, message: '' };
}

// User & Patient Registration Concept
export async function registerNewUserInDb(data: {
  name: string;
  email: string;
  phone: string;
  role: string;
  address?: string;
  title?: string;
  licenseNumber?: string;
  experienceYears?: number;
  hourlyRate?: number;
  avatar?: string;
}) {
  // Validate duplicate restrictions
  const dupCheck = await checkExistingUserDuplicates(data.email, data.phone);
  if (dupCheck.isDuplicate) {
    throw new Error(dupCheck.message);
  }

  const uid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newUser = {
    id: memoryUsers.length + 100,
    uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    address: data.address || null,
    createdAt: new Date()
  };

  if (isDbAvailable) {
    try {
      const userRows = await db.insert(users).values({
        uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        address: data.address || null,
      }).returning();

      let patientRecord = null;
      if (data.role === 'patient') {
        const patRows = await db.insert(patients).values({
          id: `pat-${uid}`,
          userId: uid,
          name: data.name,
          phone: data.phone,
          address: data.address || null,
        }).returning();
        patientRecord = patRows[0];
      }

      let providerRecord = null;
      if (data.role === 'provider') {
        const provId = `prov-${Date.now().toString(36)}`;
        const provRows = await db.insert(providers).values({
          id: provId,
          userId: uid,
          name: data.name,
          title: data.title || 'Registered Care Provider',
          avatar: data.avatar || null,
          rating: '5.0',
          reviewCount: 0,
          experienceYears: data.experienceYears || 2,
          distanceKm: '1.5',
          etaMinutes: 20,
          isAvailable: true,
          currentLocationName: data.address || 'Central District',
          badges: ['Board Certified', 'Newly Registered'],
          hourlyRate: data.hourlyRate || 55,
          completedVisits: 0,
          phone: data.phone,
          email: data.email,
          bio: `Licensed ${data.title || 'specialist'} providing sterile home healthcare visits and clinical procedures.`,
          pendingPayout: 0,
          totalEarningsMonth: 0,
        }).returning();
        providerRecord = provRows[0];

        if (data.licenseNumber) {
          await db.insert(providerDocuments).values({
            id: `doc-${Date.now().toString(36)}`,
            providerId: provId,
            docType: `State Medical License (${data.licenseNumber})`,
            fileName: `license_${provId}.pdf`,
            uploadedAt: new Date().toISOString().split('T')[0],
            status: 'pending_review',
            expiryDate: '2028-12-31',
          }).onConflictDoNothing();
        }
      }

      if (userRows[0]) memoryUsers.push(userRows[0]);
      if (patientRecord) memoryPatients.push(patientRecord);
      if (providerRecord) memoryProviders.unshift(providerRecord);

      return {
        user: userRows[0],
        patient: patientRecord,
        provider: providerRecord,
      };
    } catch (error) {
      handleDbFailure(error);
    }
  }

  memoryUsers.push(newUser);

  let patientRecord = null;
  if (data.role === 'patient') {
    patientRecord = {
      id: `pat-${uid}`,
      userId: uid,
      name: data.name,
      phone: data.phone,
      address: data.address || null,
    };
    memoryPatients.push(patientRecord);
  }

  let providerRecord = null;
  if (data.role === 'provider') {
    const provId = `prov-${Date.now().toString(36)}`;
    providerRecord = {
      id: provId,
      userId: uid,
      name: data.name,
      title: (data.title || 'Registered Care Provider') as any,
      avatar: data.avatar || null,
      rating: 5.0,
      reviewCount: 0,
      experienceYears: data.experienceYears || 2,
      distanceKm: 1.5,
      etaMinutes: 20,
      isAvailable: true,
      currentLocationName: data.address || 'Central District',
      badges: ['Board Certified', 'Newly Registered'],
      hourlyRate: data.hourlyRate || 55,
      completedVisits: 0,
      phone: data.phone,
      email: data.email,
      bio: `Licensed ${data.title || 'specialist'} providing sterile home healthcare visits and clinical procedures.`,
      pendingPayout: 0,
      totalEarningsMonth: 0,
      documents: data.licenseNumber ? [
        {
          id: `doc-${Date.now().toString(36)}`,
          docType: `State Medical License (${data.licenseNumber})` as any,
          fileName: `license_${provId}.pdf`,
          uploadedAt: new Date().toISOString().split('T')[0],
          status: 'pending_review' as const,
          expiryDate: '2028-12-31'
        }
      ] : []
    };
    memoryProviders.unshift(providerRecord);
  }

  return {
    user: newUser,
    patient: patientRecord,
    provider: providerRecord,
  };
}

export async function updateUserProfileInDb(email: string, data: {
  name?: string;
  phone?: string;
  address?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  landmark?: string;
  mobilityStatus?: string;
  recentlyDischarged?: string;
}) {
  let existingUid: string | undefined;
  if (isDbAvailable) {
    try {
      const existingUsers = await db.select().from(users).where(eq(users.email, email));
      if (existingUsers.length > 0) {
        existingUid = existingUsers[0].uid;
      }
    } catch (e) {
      handleDbFailure(e);
    }
  }
  if (!existingUid) {
    existingUid = memoryUsers.find(u => u.email === email)?.uid;
  }

  // Check if updating phone number conflicts with another account
  if (data.phone) {
    const dupCheck = await checkExistingUserDuplicates(undefined, data.phone, existingUid);
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.message);
    }
  }

  if (isDbAvailable) {
    try {
      const existing = await db.select().from(users).where(eq(users.email, email));
      let userRow;
      if (existing.length === 0) {
        const uid = `usr-${Date.now()}`;
        const inserted = await db.insert(users).values({
          uid,
          email,
          name: data.name || 'Patient',
          phone: data.phone || null,
          address: data.address || null,
          role: 'patient',
        }).returning();
        userRow = inserted[0];
      } else {
        const updated = await db.update(users)
          .set({
            ...(data.name ? { name: data.name } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.address ? { address: data.address } : {}),
          })
          .where(eq(users.email, email))
          .returning();
        userRow = updated[0];
      }

      if (userRow) {
        await db.insert(patients).values({
          id: `pat-${userRow.uid}`,
          userId: userRow.uid,
          name: userRow.name || 'Patient',
          phone: userRow.phone || null,
          address: userRow.address || null,
          age: typeof data.age === 'number' ? data.age : 35,
          gender: data.gender || 'Male',
          bloodGroup: data.bloodGroup || null,
          allergies: data.allergies || null,
          medicalNotes: data.medicalHistory || null,
          emergencyContactPhone: data.emergencyContactPhone || null,
          insuranceProvider: data.insuranceProvider || null,
          insurancePolicyNumber: data.insurancePolicyNumber || null,
          landmark: data.landmark || null,
          mobilityStatus: data.mobilityStatus || null,
          recentlyDischarged: data.recentlyDischarged || null,
        }).onConflictDoUpdate({
          target: patients.userId,
          set: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.address ? { address: data.address } : {}),
            ...(data.age !== undefined ? { age: data.age } : {}),
            ...(data.gender ? { gender: data.gender } : {}),
            ...(data.bloodGroup ? { bloodGroup: data.bloodGroup } : {}),
            ...(data.allergies ? { allergies: data.allergies } : {}),
            ...(data.medicalHistory ? { medicalNotes: data.medicalHistory } : {}),
            ...(data.emergencyContactPhone ? { emergencyContactPhone: data.emergencyContactPhone } : {}),
            ...(data.insuranceProvider ? { insuranceProvider: data.insuranceProvider } : {}),
            ...(data.insurancePolicyNumber ? { insurancePolicyNumber: data.insurancePolicyNumber } : {}),
            ...(data.landmark ? { landmark: data.landmark } : {}),
            ...(data.mobilityStatus ? { mobilityStatus: data.mobilityStatus } : {}),
            ...(data.recentlyDischarged ? { recentlyDischarged: data.recentlyDischarged } : {}),
          }
        });
      }

      return userRow;
    } catch (error: any) {
      if (error.message && error.message.includes('Duplicate')) throw error;
      handleDbFailure(error);
    }
  }

  let user = memoryUsers.find(u => u.email === email);
  if (!user) {
    user = {
      uid: `usr-${Date.now()}`,
      email,
      name: data.name || 'Patient',
      phone: data.phone || null,
      address: data.address || null,
      role: 'patient'
    };
    memoryUsers.push(user);
  } else {
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.address) user.address = data.address;
  }
  return user;
}

export async function updateProviderProfileInDb(providerId: string, data: {
  name?: string;
  title?: string;
  bio?: string;
  phone?: string;
  email?: string;
  hourlyRate?: number;
  currentLocationName?: string;
  avatar?: string;
}) {
  if (data.email || data.phone) {
    const dupCheck = await checkExistingUserDuplicates(data.email, data.phone, providerId);
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.message);
    }
  }

  if (isDbAvailable) {
    try {
      const updated = await db.update(providers)
        .set({
          ...(data.name ? { name: data.name } : {}),
          ...(data.title ? { title: data.title } : {}),
          ...(data.bio ? { bio: data.bio } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate } : {}),
          ...(data.currentLocationName ? { currentLocationName: data.currentLocationName } : {}),
          ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
        })
        .where(eq(providers.id, providerId))
        .returning();
      if (updated.length > 0) return updated[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const p = memoryProviders.find(prov => prov.id === providerId);
  if (p) {
    if (data.name) p.name = data.name;
    if (data.title) p.title = data.title as any;
    if (data.bio) p.bio = data.bio;
    if (data.phone) p.phone = data.phone;
    if (data.email) p.email = data.email;
    if (data.hourlyRate !== undefined) p.hourlyRate = data.hourlyRate;
    if (data.currentLocationName) p.currentLocationName = data.currentLocationName;
    if (data.avatar !== undefined) p.avatar = data.avatar;
    return p;
  }
  return null;
}

export async function cancelBookingInDb(bookingId: string) {
  if (isDbAvailable) {
    try {
      const updated = await db.update(bookings)
        .set({
          status: 'cancelled',
          paymentStatus: 'pending'
        })
        .where(eq(bookings.id, bookingId))
        .returning();
      if (updated.length > 0) return updated[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const b = memoryBookings.find(book => book.id === bookingId);
  if (b) {
    b.status = 'cancelled';
    b.paymentStatus = 'pending';
    return b;
  }
  return null;
}

export async function addDocumentInDb(providerId: string, docType: string, fileName: string) {
  if (isDbAvailable) {
    try {
      const id = `doc-${Date.now().toString(36)}`;
      const inserted = await db.insert(providerDocuments).values({
        id,
        providerId,
        docType,
        fileName,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'pending_review',
        expiryDate: '2029-12-31'
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const p = memoryProviders.find(prov => prov.id === providerId);
  if (p) {
    const newDoc = {
      id: `doc-${Date.now().toString(36)}`,
      docType: docType as any,
      fileName,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'pending_review' as const,
      expiryDate: '2029-12-31'
    };
    p.documents.unshift(newDoc);
    return newDoc;
  }
  return null;
}

export async function findUserInDb(identifier: string, role: string) {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhoneInput = cleanId.replace(/\D/g, '');

  const isPhoneMatch = (dbPhone: string | null) => {
    if (!dbPhone) return false;
    const dbClean = dbPhone.replace(/\D/g, '');
    if (!dbClean || !cleanPhoneInput) return false;
    return dbClean === cleanPhoneInput || dbClean.endsWith(cleanPhoneInput) || cleanPhoneInput.endsWith(dbClean);
  };
  
  if (isDbAvailable) {
    try {
      const results = await db.select().from(users);
      const matched = results.find(u => 
        (u.email && u.email.toLowerCase() === cleanId) || 
        isPhoneMatch(u.phone)
      );
      if (matched) {
        let patientRec: any = null;
        let providerRec: any = null;
        if (matched.role === 'patient') {
          const patRows = await db.select().from(patients).where(eq(patients.userId, matched.uid));
          if (patRows.length > 0) patientRec = patRows[0];
        } else if (matched.role === 'provider') {
          const provRows = await db.select().from(providers).where(eq(providers.userId, matched.uid));
          if (provRows.length > 0) providerRec = provRows[0];
        }
        return {
          ...matched,
          patient: patientRec,
          provider: providerRec,
        };
      }
      
      const provs = await db.select().from(providers);
      const matchedProv = provs.find(p => 
        (p.email && p.email.toLowerCase() === cleanId) || 
        isPhoneMatch(p.phone)
      );
      if (matchedProv) {
        return {
          uid: matchedProv.userId || matchedProv.id,
          id: matchedProv.id,
          email: matchedProv.email,
          name: matchedProv.name,
          phone: matchedProv.phone,
          role: 'provider',
          address: matchedProv.currentLocationName,
          provider: matchedProv,
        };
      }
    } catch (error) {
      handleDbFailure(error);
    }
  }
  
  const matchedMemUser = memoryUsers.find(u => 
    (u.email && u.email.toLowerCase() === cleanId) || 
    isPhoneMatch(u.phone)
  );
  if (matchedMemUser) {
    const pat = memoryPatients.find(p => p.userId === matchedMemUser.uid);
    const prov = memoryProviders.find(p => p.userId === matchedMemUser.uid || p.id === matchedMemUser.uid);
    return {
      ...matchedMemUser,
      patient: pat || null,
      provider: prov || null,
    };
  }
  
  const matchedProv = memoryProviders.find(p => 
    (p.email && p.email.toLowerCase() === cleanId) || 
    isPhoneMatch(p.phone)
  );
  if (matchedProv) {
    return {
      uid: matchedProv.userId || matchedProv.id,
      id: matchedProv.id,
      email: matchedProv.email,
      name: matchedProv.name,
      phone: matchedProv.phone,
      role: 'provider',
      address: matchedProv.currentLocationName,
      provider: matchedProv,
    };
  }

  return null;
}

// -------------------------------------------------------------
// NEW CONCEPT QUERIES (Reviews, Prescriptions, Vitals, Schedules, Payouts, Messages, Notifications)
// -------------------------------------------------------------

// 1. Reviews Queries
export async function getReviewsForProvider(providerId: string) {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(reviews).where(eq(reviews.providerId, providerId)).orderBy(desc(reviews.createdAt));
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryReviews.filter(r => r.providerId === providerId);
}

export async function createReviewInDb(data: {
  bookingId?: string;
  patientId?: string;
  providerId: string;
  rating: number;
  comment?: string;
}) {
  const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newRev = { id, ...data, createdAt: new Date().toISOString() };
  memoryReviews.unshift(newRev);

  // Recalculate rating in memory
  const provMem = memoryProviders.find(p => p.id === data.providerId);
  const provRevsMem = memoryReviews.filter(r => r.providerId === data.providerId);
  if (provMem && provRevsMem.length > 0) {
    const avg = (provRevsMem.reduce((sum, r) => sum + r.rating, 0) / provRevsMem.length).toFixed(1);
    provMem.rating = parseFloat(avg);
    provMem.reviewCount = provRevsMem.length;
  }

  if (isDbAvailable) {
    try {
      const inserted = await db.insert(reviews).values({
        id,
        bookingId: data.bookingId || null,
        patientId: data.patientId || null,
        providerId: data.providerId,
        rating: data.rating,
        comment: data.comment || null,
      }).returning();

      // Recalculate provider rating in DB
      const allDbRevs = await db.select().from(reviews).where(eq(reviews.providerId, data.providerId));
      if (allDbRevs.length > 0) {
        const avg = (allDbRevs.reduce((sum, r) => sum + r.rating, 0) / allDbRevs.length).toFixed(1);
        await db.update(providers)
          .set({
            rating: avg,
            reviewCount: allDbRevs.length,
          })
          .where(eq(providers.id, data.providerId));
      }

      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return newRev;
}

// 2. Prescriptions Queries
export async function getPrescriptionsForPatient(patientId: string) {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId)).orderBy(desc(prescriptions.issuedAt));
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryPrescriptions.filter(p => p.patientId === patientId);
}

export async function createPrescriptionInDb(data: {
  bookingId?: string;
  patientId: string;
  providerId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  durationDays?: number;
}) {
  const id = `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newRx = { id, ...data, issuedAt: new Date().toISOString() };
  memoryPrescriptions.unshift(newRx);

  if (isDbAvailable) {
    try {
      const inserted = await db.insert(prescriptions).values({
        id,
        bookingId: data.bookingId || null,
        patientId: data.patientId,
        providerId: data.providerId,
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        instructions: data.instructions || null,
        durationDays: data.durationDays || 7,
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return newRx;
}

// 3. Patient Vitals History Queries
export async function getVitalsHistoryForPatient(patientId: string) {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(patientVitalsHistory).where(eq(patientVitalsHistory.patientId, patientId)).orderBy(desc(patientVitalsHistory.recordedAt));
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryVitalsHistory.filter(v => v.patientId === patientId);
}

export async function recordPatientVitalsInDb(data: {
  patientId: string;
  bookingId?: string;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRate?: number;
  temperatureC?: string;
  spo2?: number;
  glucoseMgDl?: number;
  notes?: string;
}) {
  const id = `vtl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newVtl = { id, ...data, recordedAt: new Date().toISOString() };
  memoryVitalsHistory.unshift(newVtl);

  if (isDbAvailable) {
    try {
      const inserted = await db.insert(patientVitalsHistory).values({
        id,
        patientId: data.patientId,
        bookingId: data.bookingId || null,
        bloodPressureSys: data.bloodPressureSys || null,
        bloodPressureDia: data.bloodPressureDia || null,
        heartRate: data.heartRate || null,
        temperatureC: data.temperatureC || null,
        spo2: data.spo2 || null,
        glucoseMgDl: data.glucoseMgDl || null,
        notes: data.notes || null,
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return newVtl;
}

// 4. Provider Schedules Queries
export async function getProviderSchedules(providerId: string) {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(providerSchedules).where(eq(providerSchedules.providerId, providerId));
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memorySchedules.filter(s => s.providerId === providerId);
}

export async function updateProviderScheduleInDb(data: {
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}) {
  const id = `sch-${data.providerId}-${data.dayOfWeek}`;
  const idx = memorySchedules.findIndex(s => s.id === id);
  if (idx !== -1) {
    memorySchedules[idx] = { ...memorySchedules[idx], ...data };
  } else {
    memorySchedules.push({ id, ...data });
  }

  if (isDbAvailable) {
    try {
      const inserted = await db.insert(providerSchedules).values({
        id,
        providerId: data.providerId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      }).onConflictDoUpdate({
        target: providerSchedules.id,
        set: {
          startTime: data.startTime,
          endTime: data.endTime,
          isActive: data.isActive,
        }
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return { id, ...data };
}

// 5. Payouts Queries
export async function getPayoutsForProvider(providerId: string) {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(payouts).where(eq(payouts.providerId, providerId)).orderBy(desc(payouts.payoutDate));
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryPayouts.filter(p => p.providerId === providerId);
}

export async function createPayoutInDb(data: {
  providerId: string;
  amount: number;
  status?: string;
  payoutMethod?: string;
}) {
  const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newPay = { id, ...data, transactionRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`, payoutDate: new Date().toISOString() };
  memoryPayouts.unshift(newPay);

  if (isDbAvailable) {
    try {
      const inserted = await db.insert(payouts).values({
        id,
        providerId: data.providerId,
        amount: data.amount,
        status: data.status || 'completed',
        payoutMethod: data.payoutMethod || 'direct_deposit',
        transactionRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return newPay;
}

// 6. Care Messages Queries
export async function getCareMessagesForBooking(bookingId: string) {
  if (isDbAvailable) {
    try {
      const res = await db.select().from(careMessages).where(eq(careMessages.bookingId, bookingId)).orderBy(careMessages.createdAt);
      if (res.length > 0) return res;
    } catch (error) {
      handleDbFailure(error);
    }
  }
  return memoryMessages.filter(m => m.bookingId === bookingId);
}

export async function sendCareMessageInDb(data: {
  bookingId?: string;
  senderId: string;
  receiverId: string;
  message: string;
}) {
  const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newMsg = { id, ...data, isRead: false, createdAt: new Date().toISOString() };
  memoryMessages.push(newMsg);

  if (isDbAvailable) {
    try {
      const inserted = await db.insert(careMessages).values({
        id,
        bookingId: data.bookingId || null,
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
        isRead: false,
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return newMsg;
}

// 7. Notifications Queries
export async function getUserNotifications(userId: string) {
  if (isDbAvailable) {
    try {
      const allNotifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
      const matched = allNotifs.filter(n => 
        n.userId === userId || 
        (userId && n.userId && (n.userId.includes(userId) || userId.includes(n.userId)))
      );
      return matched;
    } catch (error) {
      handleDbFailure(error);
    }
  }

  const matchedMem = memoryNotifications.filter(n => 
    n.userId === userId || 
    (userId && n.userId && (n.userId.includes(userId) || userId.includes(n.userId)))
  );
  return matchedMem;
}

export async function createNotificationInDb(data: {
  userId: string;
  title: string;
  body: string;
  type?: string;
}) {
  const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newNotif = { id, ...data, isRead: false, createdAt: new Date().toISOString() };
  memoryNotifications.unshift(newNotif);

  if (isDbAvailable) {
    try {
      if (data.userId) {
        await db.insert(users).values({
          uid: data.userId,
          email: `${data.userId}@map2medic.local`,
          name: 'Patient User',
          role: 'patient',
        }).onConflictDoNothing();
      }

      const inserted = await db.insert(notifications).values({
        id,
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type || 'general',
        isRead: false,
      }).returning();
      if (inserted.length > 0) return inserted[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return newNotif;
}

export async function markNotificationReadInDb(id: string) {
  const n = memoryNotifications.find(notif => notif.id === id);
  if (n) {
    n.isRead = true;
  }

  if (isDbAvailable) {
    try {
      const updated = await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      if (updated.length > 0) return updated[0];
    } catch (error) {
      handleDbFailure(error);
    }
  }

  return n || null;
}

export async function clearDatabaseAllTables() {
  memoryServices.length = 0;
  memoryProviders.length = 0;
  memoryBookings.length = 0;
  memoryUsers.length = 0;
  memoryLogins.length = 0;
  memoryPatients.length = 0;
  memoryReviews.length = 0;
  memoryPrescriptions.length = 0;
  memoryVitalsHistory.length = 0;
  memorySchedules.length = 0;
  memoryPayouts.length = 0;
  memoryMessages.length = 0;
  memoryNotifications.length = 0;

  if (isDbAvailable) {
    try {
      await db.execute(sql`TRUNCATE TABLE notifications CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE care_messages CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE payouts CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE provider_schedules CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE patient_vitals_history CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE prescriptions CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE reviews CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE user_logins CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE provider_documents CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE bookings CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE providers CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE patients CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE service_pricing CASCADE;`);
      await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
      return { success: true, message: 'All 14 PostgreSQL concept tables reset successfully!' };
    } catch (error: any) {
      console.error('Failed to clear database concept tables:', error);
      throw error;
    }
  }
  return { success: true, message: 'In-memory database reset successfully!' };
}
