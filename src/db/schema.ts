import { pgTable, serial, text, integer, boolean, timestamp, jsonb, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. User Account Concept (Users table)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Auth UID
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('patient').notNull(), // 'patient' | 'provider' | 'admin'
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. User Login Session Concept (Logins table)
export const userLogins = pgTable('user_logins', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  loginAt: timestamp('login_at').defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').default('success').notNull(),
});

// 3. Patient Concept (Patients table)
export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull().unique(),
  name: text('name').notNull(),
  age: integer('age').default(35),
  gender: text('gender'),
  phone: text('phone'),
  address: text('address'),
  landmark: text('landmark'),
  emergencyContactPhone: text('emergency_contact_phone'),
  mobilityStatus: text('mobility_status'),
  recentlyDischarged: text('recently_discharged'),
  medicalNotes: text('medical_notes'),
  bloodGroup: text('blood_group'),
  allergies: text('allergies'),
  insuranceProvider: text('insurance_provider'),
  insurancePolicyNumber: text('insurance_policy_number'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Healthcare Provider Concept (Providers table)
export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title').notNull(),
  avatar: text('avatar'),
  rating: text('rating').default('5.0'),
  reviewCount: integer('review_count').default(0),
  experienceYears: integer('experience_years').default(1),
  distanceKm: text('distance_km').default('2.0'),
  etaMinutes: integer('eta_minutes').default(20),
  isAvailable: boolean('is_available').default(true),
  currentLocationName: text('current_location_name').default('Metro District'),
  badges: text('badges').array(),
  hourlyRate: integer('hourly_rate').default(50),
  completedVisits: integer('completed_visits').default(0),
  phone: text('phone'),
  email: text('email'),
  bio: text('bio'),
  pendingPayout: integer('pending_payout').default(0),
  totalEarningsMonth: integer('total_earnings_month').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Service Pricing Concept (Pricing Catalog table)
export const servicePricing = pgTable('service_pricing', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  price: integer('price').notNull(),
  baseAmountLabel: text('base_amount_label').notNull(),
  duration: text('duration').notNull(),
  serviceType: text('service_type').notNull(),
  description: text('description').notNull(),
  includes: text('includes').array(),
  popular: boolean('popular').default(false),
  requiresPrescription: boolean('requires_prescription').default(false),
  priority: text('priority'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Booking Concept (Bookings table)
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(), // e.g. "CX-2026-4821"
  patientId: text('patient_id').references(() => users.uid, { onDelete: 'set null' }),
  serviceId: text('service_id').references(() => servicePricing.id, { onDelete: 'set null' }),
  providerId: text('provider_id').references(() => providers.id, { onDelete: 'set null' }),
  patientName: text('patient_name'),
  patientAge: integer('patient_age'),
  patientGender: text('patient_gender'),
  patientPhone: text('patient_phone'),
  patientAddress: text('patient_address'),
  landmark: text('landmark'),
  liftAvailability: text('lift_availability'),
  emergencyContactPhone: text('emergency_contact_phone'),
  mobilityStatus: text('mobility_status'),
  recentlyDischarged: text('recently_discharged'),
  serviceName: text('service_name'),
  providerName: text('provider_name'),
  providerPhone: text('provider_phone'),
  date: text('date').notNull(),
  timeSlot: text('time_slot').notNull(),
  status: text('status').default('confirmed').notNull(),
  basePrice: integer('base_price').notNull(),
  addons: jsonb('addons'),
  platformFee: integer('platform_fee').default(5).notNull(),
  discount: integer('discount').default(0).notNull(),
  totalAmount: integer('total_amount').notNull(),
  paymentMethod: text('payment_method').default('card').notNull(),
  paymentStatus: text('payment_status').default('paid').notNull(),
  medicalNotes: text('medical_notes'),
  vitalsRecorded: jsonb('vitals_recorded'),
  intakeIntent: text('intake_intent'),
  careDuration: text('care_duration'),
  otpCode: text('otp_code'),
  progressChecklist: jsonb('progress_checklist'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Provider / Patient Documents Concept
export const providerDocuments = pgTable('provider_documents', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').references(() => providers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').references(() => users.uid, { onDelete: 'cascade' }),
  docType: text('doc_type').notNull(),
  fileName: text('file_name').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  status: text('status').default('pending_review').notNull(), // 'verified' | 'pending_review' | 'rejected'
  rejectionReason: text('rejection_reason'),
  expiryDate: text('expiry_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Reviews Concept (Ratings & Patient Feedback)
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').references(() => users.uid, { onDelete: 'set null' }),
  providerId: text('provider_id').references(() => providers.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Prescriptions Concept (E-Prescriptions & Care Directives)
export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  patientId: text('patient_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  providerId: text('provider_id').references(() => providers.id, { onDelete: 'set null' }).notNull(),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  instructions: text('instructions'),
  durationDays: integer('duration_days').default(7),
  issuedAt: timestamp('issued_at').defaultNow(),
});

// 10. Patient Vitals History Concept (Longitudinal Health Tracking)
export const patientVitalsHistory = pgTable('patient_vitals_history', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  bloodPressureSys: integer('blood_pressure_sys'),
  bloodPressureDia: integer('blood_pressure_dia'),
  heartRate: integer('heart_rate'),
  temperatureC: text('temperature_c'),
  spo2: integer('spo2'),
  glucoseMgDl: integer('glucose_mg_dl'),
  notes: text('notes'),
  recordedAt: timestamp('recorded_at').defaultNow(),
});

// 11. Provider Schedule & Shift Availability Concept
export const providerSchedules = pgTable('provider_schedules', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').references(() => providers.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sun, 1 = Mon...
  startTime: text('start_time').notNull(), // "08:00"
  endTime: text('end_time').notNull(), // "17:00"
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Payouts & Earnings Settlement Concept
export const payouts = pgTable('payouts', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').references(() => providers.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(),
  status: text('status').default('completed').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  payoutMethod: text('payout_method').default('direct_deposit').notNull(),
  payoutDate: timestamp('payout_date').defaultNow(),
  transactionRef: text('transaction_ref'),
});

// 13. Care Messages Concept (Direct Patient-Provider Messaging)
export const careMessages = pgTable('care_messages', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  receiverId: text('receiver_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Notifications & Dispatch Alerts Concept
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').default('general').notNull(), // 'booking' | 'prescription' | 'vitals' | 'system'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Drizzle Schema Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  bookings: many(bookings),
  logins: many(userLogins),
  reviews: many(reviews),
  prescriptions: many(prescriptions),
  vitalsHistory: many(patientVitalsHistory),
  notifications: many(notifications),
  sentMessages: many(careMessages, { relationName: 'sentMessages' }),
  receivedMessages: many(careMessages, { relationName: 'receivedMessages' }),
  patientProfile: one(patients, {
    fields: [users.uid],
    references: [patients.userId],
  }),
  providerProfile: one(providers, {
    fields: [users.uid],
    references: [providers.userId],
  }),
}));

export const userLoginsRelations = relations(userLogins, ({ one }) => ({
  user: one(users, {
    fields: [userLogins.userId],
    references: [users.uid],
  }),
}));

export const patientsRelations = relations(patients, ({ one }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.uid],
  }),
}));

export const providersRelations = relations(providers, ({ many, one }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.uid],
  }),
  documents: many(providerDocuments),
  bookings: many(bookings),
  reviews: many(reviews),
  prescriptions: many(prescriptions),
  schedules: many(providerSchedules),
  payouts: many(payouts),
}));

export const providerDocumentsRelations = relations(providerDocuments, ({ one }) => ({
  provider: one(providers, {
    fields: [providerDocuments.providerId],
    references: [providers.id],
  }),
  patient: one(users, {
    fields: [providerDocuments.patientId],
    references: [users.uid],
  }),
}));

export const servicePricingRelations = relations(servicePricing, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  patient: one(users, {
    fields: [bookings.patientId],
    references: [users.uid],
  }),
  provider: one(providers, {
    fields: [bookings.providerId],
    references: [providers.id],
  }),
  service: one(servicePricing, {
    fields: [bookings.serviceId],
    references: [servicePricing.id],
  }),
  reviews: many(reviews),
  prescriptions: many(prescriptions),
  vitals: many(patientVitalsHistory),
  messages: many(careMessages),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  patient: one(users, {
    fields: [reviews.patientId],
    references: [users.uid],
  }),
  provider: one(providers, {
    fields: [reviews.providerId],
    references: [providers.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  booking: one(bookings, {
    fields: [prescriptions.bookingId],
    references: [bookings.id],
  }),
  patient: one(users, {
    fields: [prescriptions.patientId],
    references: [users.uid],
  }),
  provider: one(providers, {
    fields: [prescriptions.providerId],
    references: [providers.id],
  }),
}));

export const patientVitalsHistoryRelations = relations(patientVitalsHistory, ({ one }) => ({
  patient: one(users, {
    fields: [patientVitalsHistory.patientId],
    references: [users.uid],
  }),
  booking: one(bookings, {
    fields: [patientVitalsHistory.bookingId],
    references: [bookings.id],
  }),
}));

export const providerSchedulesRelations = relations(providerSchedules, ({ one }) => ({
  provider: one(providers, {
    fields: [providerSchedules.providerId],
    references: [providers.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  provider: one(providers, {
    fields: [payouts.providerId],
    references: [providers.id],
  }),
}));

export const careMessagesRelations = relations(careMessages, ({ one }) => ({
  booking: one(bookings, {
    fields: [careMessages.bookingId],
    references: [bookings.id],
  }),
  sender: one(users, {
    relationName: 'sentMessages',
    fields: [careMessages.senderId],
    references: [users.uid],
  }),
  receiver: one(users, {
    relationName: 'receivedMessages',
    fields: [careMessages.receiverId],
    references: [users.uid],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.uid],
  }),
}));
