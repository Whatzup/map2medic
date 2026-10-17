import { db } from './index.ts';
import { users, patients, providers } from './schema.ts';
import { eq } from 'drizzle-orm';
import { isDbAvailable, memoryUsers, memoryPatients, handleDbFailure } from './queries.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string, role?: string) {
  if (isDbAvailable) {
    try {
      const result = await db.insert(users)
        .values({
          uid,
          email,
          name: name || email.split('@')[0],
          role: role || 'patient',
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            ...(name ? { name } : {}),
            ...(role ? { role } : {}),
          },
        })
        .returning();

      if (result.length > 0) {
        const u = result[0];
        // Ensure patient profile exists in patients table if role is 'patient'
        if (u.role === 'patient') {
          try {
            await db.insert(patients).values({
              id: `pat-${u.uid}`,
              userId: u.uid,
              name: u.name || 'Patient User',
              phone: u.phone || (u.uid.includes('usr-') ? u.uid.replace('usr-', '') : u.uid),
            }).onConflictDoUpdate({
              target: patients.userId,
              set: {
                name: u.name || undefined,
                phone: u.phone || undefined,
              }
            });
          } catch (pe) {
            console.warn('Auto patient record sync warning:', pe);
          }
        } else if (u.role === 'provider') {
          try {
            const provCheck = await db.select().from(providers).where(eq(providers.userId, u.uid));
            if (provCheck.length === 0) {
              await db.insert(providers).values({
                id: `prov-${u.uid.replace('usr-', '')}`,
                userId: u.uid,
                name: u.name || 'Healthcare Provider',
                title: 'Licensed Healthcare Specialist',
                rating: '5.0',
                reviewCount: 0,
                experienceYears: 3,
                distanceKm: '2.0',
                etaMinutes: 20,
                isAvailable: true,
                currentLocationName: u.address || 'Central District',
                badges: ['Board Certified', 'Verified Map2Medic Specialist'],
                hourlyRate: 60,
                completedVisits: 0,
                phone: u.phone || null,
                email: u.email || null,
                bio: 'Licensed provider specializing in sterile home clinical care and bedside procedures.',
                pendingPayout: 0,
                totalEarningsMonth: 0,
              }).onConflictDoNothing();
            }
          } catch (pe) {
            console.warn('Auto provider record sync warning:', pe);
          }
        }
        return u;
      }
    } catch (error) {
      handleDbFailure(error);
    }
  }

  // Fallback to in-memory user registry
  let user = memoryUsers.find(u => u.uid === uid || u.email === email);
  if (!user) {
    user = {
      uid,
      email,
      name: name || email.split('@')[0],
      role: role || 'patient',
      createdAt: new Date(),
    };
    memoryUsers.push(user);
  } else {
    if (name) user.name = name;
    if (role) user.role = role;
    if (email) user.email = email;
  }

  if (user.role === 'patient') {
    let p = memoryPatients.find((p: any) => p.userId === user.uid);
    if (!p) {
      p = {
        id: `pat-${user.uid}`,
        userId: user.uid,
        name: user.name || 'Patient User',
        phone: user.phone || user.uid,
      };
      memoryPatients.push(p);
    }
  }

  return user;
}
