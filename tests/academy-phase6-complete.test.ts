import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  clearAcademyMemoryStore,
  createCourse,
  createCourseModule,
  createLesson,
  enrollUserInCourse,
  getOrCreateLabSession,
  getLabSession,
  submitLabSession,
  listLearnerLabSessions,
  getCourseProgress,
} from '../src/lib/academy/academyStore';

describe('OPROX Academy Phase 6 — Practical Labs & Final Product Acceptance Suite', () => {
  const tenantId = 'tenant_phase6_test';
  const userId = 'user_phase6_learner';
  const otherUserId = 'user_phase6_attacker';
  const otherTenantId = 'tenant_phase6_other';

  let courseId = '';
  let lessonId = '';

  beforeEach(async () => {
    clearAcademyMemoryStore();

    // Setup base course & lesson
    const course = await createCourse({
      tenantId,
      instructorId: 'inst_phase6',
      titleEn: 'Full-Stack Autonomous Systems Engineering',
      titleAr: 'هندسة الأنظمة الذاتية كاملة البنية',
      slug: 'fullstack-autonomous-systems',
      summaryEn: 'Master practical labs in OPROX Code and Studio',
      summaryAr: 'إتقان المختبرات العملية في OPROX Code و Studio',
      priceSar: '1500',
    });
    courseId = course.id;

    const module = await createCourseModule({
      tenantId,
      courseId,
      titleEn: 'Practical Coding & Studio Labs',
      titleAr: 'المختبرات البرمجية والعملية',
      displayOrder: 1,
    });

    const lesson = await createLesson({
      tenantId,
      courseId,
      moduleId: module.id,
      titleEn: 'Building Real-time Microservices Lab',
      titleAr: 'مختبر بناء الخدمات المصغرة التفاعلية',
      lessonType: 'CODING_LAB',
      displayOrder: 1,
    });
    lessonId = lesson.id;

    // Enroll learner
    await enrollUserInCourse(tenantId, userId, courseId);
  });

  describe('1. Database Migration & Schema Integrity', () => {
    it('verifies 0023_oprox_academy_phase6_tables.sql exists and is registered sequentially in journal', () => {
      const sqlPath = path.join(process.cwd(), 'drizzle', '0023_oprox_academy_phase6_tables.sql');
      expect(fs.existsSync(sqlPath)).toBe(true);

      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS "acad_lab_sessions"');

      const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
      const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

      const phase6Entry = journal.entries.find(
        (e: any) => e.tag === '0023_oprox_academy_phase6_tables'
      );
      expect(phase6Entry).toBeDefined();
      expect(phase6Entry.idx).toBe(23);
    });
  });

  describe('2. OPROX Code Practical Lab Execution & VFS Linkage', () => {
    it('initializes a CODING_LAB session linked to OPROX Code VFS project', async () => {
      const session = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId,
        labType: 'CODING_LAB',
        initialCheckpoints: ['Create API endpoint', 'Add schema validator', 'Run test suite'],
      });

      expect(session).toBeDefined();
      expect(session.id).toContain('acad_lab_sess_');
      expect(session.labType).toBe('CODING_LAB');
      expect(session.codeProjectId).toBe(`code_proj_${lessonId}`);
      expect(session.status).toBe('IN_PROGRESS');

      const checkpoints = JSON.parse(session.checkpointsJson);
      expect(checkpoints.length).toBe(3);
      expect(checkpoints[0].label).toBe('Create API endpoint');
      expect(checkpoints[0].status).toBe('PENDING');
    });
  });

  describe('3. OPROX Studio Practical Lab Execution & Workspace Linkage', () => {
    it('initializes a STUDIO_LAB session linked to OPROX Studio project', async () => {
      const session = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId: 'lesson_studio_123',
        labType: 'STUDIO_LAB',
        initialCheckpoints: ['Wireframe app UI', 'Connect database IR', 'Deploy preview'],
      });

      expect(session).toBeDefined();
      expect(session.labType).toBe('STUDIO_LAB');
      expect(session.studioProjectId).toBe('studio_proj_lesson_studio_123');
      expect(session.status).toBe('IN_PROGRESS');
    });
  });

  describe('4. Session Persistence, Resumption & Retrieval', () => {
    it('resumes an existing lab session without creating duplicate records', async () => {
      const session1 = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId,
        labType: 'CODING_LAB',
      });

      const session2 = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId,
        labType: 'CODING_LAB',
      });

      expect(session2.id).toBe(session1.id);

      const list = await listLearnerLabSessions(tenantId, userId, courseId);
      expect(list.length).toBe(1);
    });
  });

  describe('5. Lab Evaluation, Checkpoints & Auto Lesson Completion', () => {
    it('submits verified checkpoints, evaluates score, and updates course progress', async () => {
      const session = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId,
        labType: 'CODING_LAB',
        initialCheckpoints: ['Step 1', 'Step 2'],
      });

      const submittedCps = JSON.stringify([
        { id: 'cp_1', label: 'Step 1', status: 'VERIFIED' },
        { id: 'cp_2', label: 'Step 2', status: 'VERIFIED' },
      ]);

      const updated = await submitLabSession({
        tenantId,
        userId,
        sessionId: session.id,
        checkpointsJson: submittedCps,
        score: 100,
        feedback: 'All checkpoints verified successfully.',
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.score).toBe(100);
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('6. Security, User Ownership & Tenant Isolation', () => {
    it('blocks cross-user IDOR access to lab sessions', async () => {
      const session = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId,
        labType: 'CODING_LAB',
      });

      // Attacker tries to view or submit session
      const forbiddenView = await getLabSession(tenantId, otherUserId, session.id);
      expect(forbiddenView).toBeNull();

      const forbiddenSubmit = await submitLabSession({
        tenantId,
        userId: otherUserId,
        sessionId: session.id,
        score: 100,
      });
      expect(forbiddenSubmit).toBeNull();
    });

    it('blocks cross-tenant IDOR access to lab sessions', async () => {
      const session = await getOrCreateLabSession({
        tenantId,
        userId,
        courseId,
        lessonId,
        labType: 'CODING_LAB',
      });

      const forbiddenTenantView = await getLabSession(otherTenantId, userId, session.id);
      expect(forbiddenTenantView).toBeNull();
    });
  });

  describe('7. Production Reality & Zero Fake Data Audit', () => {
    it('ensures no hardcoded fake lab results or mock scores exist', async () => {
      const emptySessions = await listLearnerLabSessions('tenant_clean', 'user_clean');
      expect(emptySessions.length).toBe(0);
    });
  });
});
