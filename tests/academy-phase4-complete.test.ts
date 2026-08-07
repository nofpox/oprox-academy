import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAcademyMemoryStore,
  createCourse,
  getCourseBySlugOrId,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  getInstructorStats,
  getInstructorSubmissions,
  createOrgProgram,
  getOrgPrograms,
  addCourseToOrgProgram,
  createCohort,
  getCohorts,
  addCohortMember,
  getCohortMembers,
  assignOrgLearning,
  getOrgAssignments,
  getOrgProgressSummary,
  getAcademyAdminOverview,
  getAllCoursesAdmin,
  getAllInstructorsAdmin,
  logAdminAction,
  enrollUserInCourse,
  submitAssignment,
  createAssignment,
} from '../src/lib/academy/academyStore';

describe('OPROX Academy — Phase 4 Comprehensive System Tests', () => {
  const tenantId = 'tenant_phase4_test';
  const instructorA = 'user_inst_a';
  const instructorB = 'user_inst_b';
  const adminUser = 'user_admin';
  const orgId = 'org_enterprise_100';

  beforeEach(() => {
    clearAcademyMemoryStore();
  });

  describe('Instructor Studio & Course Authoring', () => {
    it('allows instructors to create, view, update, and delete their courses', async () => {
      const course = await createCourse({
        tenantId,
        instructorId: instructorA,
        titleEn: 'Real Estate Finance Masterclass',
        titleAr: 'ماستر كلاس التمويل العقاري',
        slug: 're-finance-masterclass',
        level: 'INTERMEDIATE',
        language: 'ARABIC',
        status: 'DRAFT',
      });

      expect(course.id).toBeDefined();
      expect(course.status).toBe('DRAFT');

      // Retrieve instructor courses
      const instACourses = await getInstructorCourses(tenantId, instructorA);
      expect(instACourses.length).toBe(1);
      expect(instACourses[0].id).toBe(course.id);

      // Update course to PUBLISHED
      const updated = await updateCourse(tenantId, course.id, {
        status: 'PUBLISHED',
        priceSar: '1500.00',
      });
      expect(updated?.status).toBe('PUBLISHED');

      // Verify instructor stats
      const stats = await getInstructorStats(tenantId, instructorA);
      expect(stats.totalCourses).toBe(1);
      expect(stats.publishedCourses).toBe(1);

      // Delete course
      const deleted = await deleteCourse(tenantId, course.id);
      expect(deleted).toBe(true);

      const remaining = await getInstructorCourses(tenantId, instructorA);
      expect(remaining.length).toBe(0);
    });

    it('isolates instructor access and stats between instructors', async () => {
      await createCourse({
        tenantId,
        instructorId: instructorA,
        titleEn: 'PropTech 101',
        titleAr: 'تقنيات العقارات 101',
        slug: 'proptech-101',
      });

      await createCourse({
        tenantId,
        instructorId: instructorB,
        titleEn: 'Urban Planning Advanced',
        titleAr: 'التخطيط العمراني المتقدم',
        slug: 'urban-planning-adv',
      });

      const coursesA = await getInstructorCourses(tenantId, instructorA);
      const coursesB = await getInstructorCourses(tenantId, instructorB);

      expect(coursesA.length).toBe(1);
      expect(coursesA[0].titleEn).toBe('PropTech 101');

      expect(coursesB.length).toBe(1);
      expect(coursesB[0].titleEn).toBe('Urban Planning Advanced');
    });
  });

  describe('Organization & Enterprise Learning Management', () => {
    it('creates organization programs, cohorts, members, and learning assignments', async () => {
      // 1. Create Course
      const course = await createCourse({
        tenantId,
        instructorId: instructorA,
        titleEn: 'Executive Leadership in Real Estate',
        titleAr: 'القيادة التنفيذية في العقارات',
        slug: 'exec-leadership',
      });

      // 2. Create Org Program
      const program = await createOrgProgram({
        tenantId,
        orgId,
        titleEn: 'Saudi Real Estate Development Pathway',
        titleAr: 'مسار التطوير العقاري السعودي',
        createdById: adminUser,
      });

      expect(program.id).toBeDefined();
      expect(program.orgId).toBe(orgId);

      // 3. Add course to program
      const programCourse = await addCourseToOrgProgram({
        tenantId,
        programId: program.id,
        courseId: course.id,
        orderIndex: 1,
        isRequired: true,
      });

      expect(programCourse.programId).toBe(program.id);

      // 4. Create Cohort
      const cohort = await createCohort({
        tenantId,
        orgId,
        nameEn: 'Cohort 2026-Q1 Executives',
        nameAr: 'دفعة الربع الأول 2026 - التنفيذيون',
        createdById: adminUser,
      });

      expect(cohort.id).toBeDefined();

      // 5. Add Cohort Member
      const member = await addCohortMember(tenantId, cohort.id, 'user_executive_1');
      expect(member.userId).toBe('user_executive_1');

      const members = await getCohortMembers(tenantId, cohort.id);
      expect(members.length).toBe(1);

      // 6. Assign Learning
      const assignment = await assignOrgLearning({
        tenantId,
        orgId,
        targetType: 'COHORT',
        targetId: cohort.id,
        assignmentType: 'PROGRAM',
        itemProgramId: program.id,
        assignedById: adminUser,
      });

      expect(assignment.targetId).toBe(cohort.id);

      // 7. Get Progress Summary Report
      const summary = await getOrgProgressSummary(tenantId, orgId);
      expect(summary.totalPrograms).toBe(1);
      expect(summary.totalCohorts).toBe(1);
      expect(summary.totalAssignments).toBe(1);
    });
  });

  describe('Academy Administration & Oversight', () => {
    it('provides platform overview metrics, course moderation, and audit logs', async () => {
      // Create course
      const course = await createCourse({
        tenantId,
        instructorId: instructorA,
        titleEn: 'Smart Cities & Infrastructure',
        titleAr: 'المدن الذكية والبنية التحتية',
        slug: 'smart-cities',
        status: 'DRAFT',
      });

      // Overview
      const overview = await getAcademyAdminOverview(tenantId);
      expect(overview.totalCourses).toBe(1);
      expect(overview.draftCourses).toBe(1);

      // List courses admin
      const adminCourses = await getAllCoursesAdmin(tenantId);
      expect(adminCourses.length).toBe(1);

      // Moderate status
      const moderated = await updateCourse(tenantId, course.id, { status: 'PUBLISHED' });
      expect(moderated?.status).toBe('PUBLISHED');

      // Log admin action
      const adminLog = await logAdminAction({
        tenantId,
        adminUserId: adminUser,
        action: 'COURSE_APPROVED',
        targetType: 'COURSE',
        targetId: course.id,
        notes: 'Approved after content review',
      });

      expect(adminLog.action).toBe('COURSE_APPROVED');
    });
  });
});
