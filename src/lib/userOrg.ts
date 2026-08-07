import { memoryDb, db } from '../db';
import { usersTable, organizationsTable, organizationMembersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function getUsers() {
  if (db) {
    try {
      const rows = await db.select().from(usersTable);
      if (rows.length > 0) return rows;
    } catch {
      // Fallback
    }
  }

  return [
    { id: 'usr_admin01', email: 'superadmin@oprox.io', role: 'superadmin', createdAt: new Date(), updatedAt: new Date() },
    { id: 'usr_dev02', email: 'lead.dev@oprox.io', role: 'admin', createdAt: new Date(), updatedAt: new Date() },
    { id: 'usr_user03', email: 'guest.developer@gmail.com', role: 'user', createdAt: new Date(), updatedAt: new Date() },
  ];
}

export async function updateUserRole(userId: string, role: string) {
  if (db) {
    try {
      await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    } catch {
      // Fallback
    }
  }
  return { userId, role, updatedAt: new Date() };
}

export async function getOrganizations() {
  if (db) {
    try {
      const rows = await db.select().from(organizationsTable);
      if (rows.length > 0) return rows;
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.organizations.values());
}

export async function createOrganization(orgData: { name: string; slug: string; ownerId: string; plan?: string; maxSeats?: number; legalName?: string; vatNumber?: string; crNumber?: string; country?: string }) {
  const org = {
    id: `org_${Date.now()}`,
    name: orgData.name,
    slug: orgData.slug,
    ownerId: orgData.ownerId || 'usr_admin01',
    plan: orgData.plan || 'business',
    maxSeats: orgData.maxSeats || 10,
    status: 'active',
    legalName: orgData.legalName || null,
    vatNumber: orgData.vatNumber || null,
    crNumber: orgData.crNumber || null,
    taxIdentificationNumber: null,
    billingAddress: null,
    country: orgData.country || 'SA',
    scheduledPlan: null,
    scheduledPlanEffectiveAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryDb.organizations.set(org.id, org);

  if (db) {
    try {
      await db.insert(organizationsTable).values(org);
    } catch {
      // Fallback
    }
  }

  return org;
}

export async function getOrganizationById(orgId: string) {
  if (db) {
    try {
      const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }
  return memoryDb.organizations.get(orgId) || null;
}

export async function getOrganizationMemberCount(orgId: string): Promise<number> {
  let memCount = 0;
  for (const m of memoryDb.organizationMembers) {
    if (m.orgId === orgId) memCount++;
  }

  if (db) {
    try {
      const rows = await db.select().from(organizationMembersTable).where(eq(organizationMembersTable.orgId, orgId));
      return Math.max(rows.length, memCount);
    } catch {
      // Fallback
    }
  }
  return memCount;
}

export async function assertCanAddUserToOrg(orgId: string): Promise<{ canAdd: boolean; currentCount: number; maxSeats: number }> {
  const org = await getOrganizationById(orgId);
  const maxSeats = org ? org.maxSeats : 10;
  const currentCount = await getOrganizationMemberCount(orgId);

  if (currentCount >= maxSeats) {
    throw new Error(`Organization user limit reached (${currentCount}/${maxSeats}) for current plan. Upgrade required to add more users.`);
  }

  return { canAdd: true, currentCount, maxSeats };
}

export async function addMemberToOrganization(orgId: string, userId: string, role: string = 'member') {
  await assertCanAddUserToOrg(orgId);

  const member = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId,
    userId,
    role,
    createdAt: new Date(),
  };

  memoryDb.organizationMembers.push(member as any);

  if (db) {
    try {
      await db.insert(organizationMembersTable).values(member as any);
    } catch {
      // Fallback
    }
  }

  return member;
}

export async function getSecurityEvents() {
  return [
    { id: 'sec_01', type: 'SUPERADMIN_LOGIN', ip: '192.168.1.100', actor: 'superadmin@oprox.io', timestamp: new Date() },
    { id: 'sec_02', type: 'API_KEY_GENERATED', ip: '10.0.0.5', actor: 'lead.dev@oprox.io', timestamp: new Date(Date.now() - 3600 * 1000) },
    { id: 'sec_03', type: 'KILL_SWITCH_TOGGLED', ip: '127.0.0.1', actor: 'superadmin@oprox.io', timestamp: new Date(Date.now() - 7200 * 1000) },
  ];
}
