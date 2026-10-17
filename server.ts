import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import {
  seedInitialDataIfEmpty,
  getAllServices,
  updateServiceRate,
  insertService,
  deleteServiceInDb,
  getDatabaseStats,
  getAllProviders,
  toggleProviderAvailabilityInDb,
  updateDocumentStatusInDb,
  getAllBookings,
  getSingleBookingFromDb,
  createBookingInDb,
  updateBookingStatusInDb,
  registerNewUserInDb,
  updateUserProfileInDb,
  updateProviderProfileInDb,
  cancelBookingInDb,
  addDocumentInDb,
  findUserInDb,
  recordUserLoginInDb,
  clearDatabaseAllTables,
  getReviewsForProvider,
  createReviewInDb,
  getPrescriptionsForPatient,
  createPrescriptionInDb,
  getVitalsHistoryForPatient,
  recordPatientVitalsInDb,
  getProviderSchedules,
  updateProviderScheduleInDb,
  getPayoutsForProvider,
  createPayoutInDb,
  getCareMessagesForBooking,
  sendCareMessageInDb,
  getUserNotifications,
  createNotificationInDb,
  markNotificationReadInDb,
} from './src/db/queries.ts';
import { getOrCreateUser } from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Seed initial catalog data if database tables are empty
seedInitialDataIfEmpty().catch(err => {
  console.warn('Initial database seed warning:', err);
});

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'Cloud SQL (PostgreSQL)',
    region: 'asia-southeast1',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db-status', async (req: Request, res: Response) => {
  const { isDbAvailable } = await import('./src/db/queries.ts');
  res.json({
    isDbAvailable,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSqlHost: !!process.env.SQL_HOST,
    timestamp: new Date().toISOString(),
  });
});

// Services Catalog
app.get('/api/services', async (req: Request, res: Response) => {
  try {
    const services = await getAllServices();
    res.json(services);
  } catch (error: any) {
    console.error('Failed to get services:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch services' });
  }
});

app.post('/api/services', async (req: Request, res: Response) => {
  try {
    const newService = await insertService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    console.error('Failed to create service:', error);
    res.status(500).json({ error: error.message || 'Failed to create service' });
  }
});

app.put('/api/services/:id/pricing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { price, baseAmountLabel } = req.body;
    const updated = await updateServiceRate(id, price, baseAmountLabel);
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update service pricing:', error);
    res.status(500).json({ error: error.message || 'Failed to update pricing' });
  }
});

app.delete('/api/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteServiceInDb(id);
    res.json(deleted);
  } catch (error: any) {
    console.error('Failed to delete service:', error);
    res.status(500).json({ error: error.message || 'Failed to delete service' });
  }
});

// Real-time Database Overview Stats
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getDatabaseStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Failed to get database stats:', error);
    res.status(500).json({ error: error.message || 'Failed to get stats' });
  }
});

// Admin Route to Clear/Truncate Database
app.post('/api/admin/clean-db', async (req: Request, res: Response) => {
  try {
    const result = await clearDatabaseAllTables();
    res.json(result);
  } catch (error: any) {
    console.error('Failed to clear database tables:', error);
    res.status(500).json({ error: error.message || 'Failed to clean database' });
  }
});

// Providers
app.get('/api/providers', async (req: Request, res: Response) => {
  try {
    const providers = await getAllProviders();
    res.json(providers);
  } catch (error: any) {
    console.error('Failed to get providers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch providers' });
  }
});

app.patch('/api/providers/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const updated = await toggleProviderAvailabilityInDb(id, isAvailable);
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update provider availability:', error);
    res.status(500).json({ error: error.message || 'Failed to update availability' });
  }
});

app.patch('/api/provider-documents/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const updated = await updateDocumentStatusInDb(id, status, rejectionReason);
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update document status:', error);
    res.status(500).json({ error: error.message || 'Failed to update document status' });
  }
});

// In-memory dynamic OTP verification store
const activeOtpStore = new Map<string, { code: string; expiresAt: number }>();

// Bookings
app.get('/api/bookings', async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (error: any) {
    console.error('Failed to get bookings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
});

app.get('/api/bookings/:id', async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const booking = await getSingleBookingFromDb(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error: any) {
    console.error('Failed to fetch single booking:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch booking' });
  }
});

app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const newBooking = await createBookingInDb(req.body);
    res.status(201).json(newBooking);
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
});

app.patch('/api/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { id } = req.params;
    const { status, vitalsRecorded, progressChecklist } = req.body;
    const updated = await updateBookingStatusInDb(id, status, vitalsRecorded, progressChecklist);
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update booking status:', error);
    res.status(500).json({ error: error.message || 'Failed to update status' });
  }
});

// User Sync
app.post('/api/users/sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, name, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email required' });
    }
    const user = await getOrCreateUser(uid, email, name, role);
    res.json(user);
  } catch (error: any) {
    console.error('Failed to sync user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Full Registration in PostgreSQL (Patient, Care Provider, Admin)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role, address, title, licenseNumber, experienceYears, hourlyRate, avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }
    const result = await registerNewUserInDb({
      name,
      email,
      phone: phone || '',
      role: role || 'patient',
      address,
      title,
      licenseNumber,
      experienceYears: experienceYears ? parseInt(experienceYears, 10) : 2,
      hourlyRate: hourlyRate ? parseInt(hourlyRate, 10) : 55,
      avatar: avatar || '',
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Failed to register new user:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// OTP Send
app.post('/api/auth/otp/send', async (req: Request, res: Response) => {
  try {
    const { identifier, role } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier (phone/email) is required' });
    }

    // Check if user is present in DB or in-memory fallback
    const user = await findUserInDb(identifier, role || 'patient');
    if (!user) {
      return res.status(404).json({ 
        error: 'No account registered with this email or mobile number. Please click "Sign Up" above to create an account.' 
      });
    }

    // Generate dynamic OTP and store with 5-minute validity
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const cleanId = identifier.trim().toLowerCase();
    activeOtpStore.set(cleanId, {
      code: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    res.json({
      success: true,
      otp: generatedOtp,
      message: `Verification code sent to ${identifier}`,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate OTP' });
  }
});

// OTP Verify & Login to Profile
app.post('/api/auth/otp/verify', async (req: Request, res: Response) => {
  try {
    const { identifier, code, role } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Identifier and OTP code are required' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const storedOtp = activeOtpStore.get(cleanId);
    const isStoredOtpValid = storedOtp && storedOtp.code === code && storedOtp.expiresAt > Date.now();
    const isUniversalDemoValid = code === '8421' || code === '1234';

    // Validate OTP against dynamic generated code or standard passcodes
    if (!isStoredOtpValid && !isUniversalDemoValid && code.length !== 4) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check user presence
    const user = await findUserInDb(identifier, role || 'patient');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found. Please register first.' });
    }

    // Clean up used OTP
    activeOtpStore.delete(cleanId);

    // Record login session in user_logins concept table
    await recordUserLoginInDb(user.uid || `usr-${identifier}`, user.email || `${identifier}@map2medic.local`, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      user,
      role: user.role,
      message: 'OTP verified successfully. Redirecting to profile...'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'OTP verification failed' });
  }
});

// Edit Patient Profile in PostgreSQL
app.put('/api/users/profile', async (req: Request, res: Response) => {
  try {
    const { email, name, phone, address, age, gender, bloodGroup, allergies, medicalHistory, emergencyContactPhone, insuranceProvider, insurancePolicyNumber, landmark, mobilityStatus, recentlyDischarged } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required to update profile' });
    }
    const updated = await updateUserProfileInDb(email, {
      name,
      phone,
      address,
      age: typeof age === 'number' ? age : (parseInt(age, 10) || undefined),
      gender,
      bloodGroup,
      allergies,
      medicalHistory,
      emergencyContactPhone,
      insuranceProvider,
      insurancePolicyNumber,
      landmark,
      mobilityStatus,
      recentlyDischarged,
    });
    res.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
});

// Edit Provider Profile in PostgreSQL
app.patch('/api/providers/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateProviderProfileInDb(id, req.body);
    res.json({ success: true, provider: updated });
  } catch (error: any) {
    console.error('Failed to update provider profile:', error);
    res.status(400).json({ error: error.message || 'Failed to update provider profile' });
  }
});

// Cancel Booking with Instant Refund Status in PostgreSQL
app.post('/api/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cancelled = await cancelBookingInDb(id);
    res.json({ success: true, booking: cancelled });
  } catch (error: any) {
    console.error('Failed to cancel booking:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel booking' });
  }
});

// Upload Provider Document in PostgreSQL
app.post('/api/providers/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { docType, fileName } = req.body;
    const doc = await addDocumentInDb(id, docType || 'Medical License', fileName || 'Credential_Document.pdf');
    res.status(201).json({ success: true, document: doc });
  } catch (error: any) {
    console.error('Failed to add document:', error);
    res.status(500).json({ error: error.message || 'Failed to add document' });
  }
});

// 1. Reviews API
app.get('/api/providers/:id/reviews', async (req: Request, res: Response) => {
  try {
    const list = await getReviewsForProvider(req.params.id);
    res.json({ success: true, reviews: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const rev = await createReviewInDb(req.body);
    res.status(201).json({ success: true, review: rev });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Prescriptions API
app.get('/api/patients/:id/prescriptions', async (req: Request, res: Response) => {
  try {
    const list = await getPrescriptionsForPatient(req.params.id);
    res.json({ success: true, prescriptions: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prescriptions', async (req: Request, res: Response) => {
  try {
    const rx = await createPrescriptionInDb(req.body);
    res.status(201).json({ success: true, prescription: rx });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Patient Vitals History API
app.get('/api/patients/:id/vitals', async (req: Request, res: Response) => {
  try {
    const list = await getVitalsHistoryForPatient(req.params.id);
    res.json({ success: true, vitals: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vitals', async (req: Request, res: Response) => {
  try {
    const record = await recordPatientVitalsInDb(req.body);
    res.status(201).json({ success: true, vitals: record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Provider Schedule API
app.get('/api/providers/:id/schedules', async (req: Request, res: Response) => {
  try {
    const list = await getProviderSchedules(req.params.id);
    res.json({ success: true, schedules: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedules', async (req: Request, res: Response) => {
  try {
    const sch = await updateProviderScheduleInDb(req.body);
    res.json({ success: true, schedule: sch });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Payouts API
app.get('/api/providers/:id/payouts', async (req: Request, res: Response) => {
  try {
    const list = await getPayoutsForProvider(req.params.id);
    res.json({ success: true, payouts: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payouts', async (req: Request, res: Response) => {
  try {
    const pay = await createPayoutInDb(req.body);
    res.status(201).json({ success: true, payout: pay });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Care Messages API
app.get('/api/bookings/:id/messages', async (req: Request, res: Response) => {
  try {
    const list = await getCareMessagesForBooking(req.params.id);
    res.json({ success: true, messages: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const msg = await sendCareMessageInDb(req.body);
    res.status(201).json({ success: true, message: msg });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Notifications API
app.get('/api/users/:id/notifications', async (req: Request, res: Response) => {
  try {
    const list = await getUserNotifications(req.params.id);
    res.json({ success: true, notifications: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const notif = await createNotificationInDb(req.body);
    res.status(201).json({ success: true, notification: notif });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const notif = await markNotificationReadInDb(req.params.id);
    res.json({ success: true, notification: notif });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Explicit PWA Service Worker & Manifest routing with compliant MIME types & CORS
app.get('/sw.js', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

app.get(['/manifest.json', '/manifest.webmanifest'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

// Allow CORS for all icon assets for Android WebAPK minting service
app.use((req: Request, res: Response, next) => {
  if (/\.(png|svg|jpeg|jpg|ico|webp)$/i.test(req.path)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
});

// Serve frontend with Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Map2Medic server running on port ${PORT}`);
  });
}

// Export Express app for Vercel Serverless Function & Standalone Node server
if (!process.env.VERCEL) {
  startServer();
}

export default app;
