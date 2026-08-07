import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  clearAcademyMemoryStore,
  createCategory,
  createCourse,
  createCourseModule,
  createLesson,
  enrollUserInCourse,
  getCourseProgress,
  recordLessonProgress,
  toggleBookmark,
  getUserBookmarks,
  getLearnerDashboardSummary,
  getCourseBySlugOrId,
} from '../src/lib/academy/academyStore';

describe('OPROX Academy — Phase 2: Course Delivery & Progress Engine', () => {
  const tenantId = 'tenant_p2_test';
  const userIdA = 'usr_learner_a';
  const userIdB = 'usr_learner_b';

  beforeEach(() => {
    clearAcademyMemoryStore();
  });

  it('1. verifies migration file 0019 and journal registration', () => {
    const migrationPath = path.join(process.cwd(), 'drizzle', '0019_oprox_academy_phase2_tables.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('acad_lesson_progress');
    expect(migrationContent).toContain('acad_course_progress');
    expect(migrationContent).toContain('acad_learning_sessions');
    expect(migrationContent).toContain('acad_bookmarks');

    const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
    const journalData = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    const entry19 = journalData.entries.find((e: any) => e.idx === 19);
    expect(entry19).toBeDefined();
    expect(entry19.tag).toBe('0019_oprox_academy_phase2_tables');
  });

  it('2. enforces enrollment requirement before recording progress', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'React Architecture',
      titleAr: 'معمارية رياكت',
      slug: 'react-arch',
      priceSar: '0',
    });

    const mod = await createCourseModule({
      tenantId,
      courseId: course.id,
      titleEn: 'Module 1',
      titleAr: 'الوحدة 1',
    });

    const lsn = await createLesson({
      tenantId,
      courseId: course.id,
      moduleId: mod.id,
      titleEn: 'Lesson 1',
      titleAr: 'الدرس 1',
      lessonType: 'TEXT',
    });

    // Try recording progress without enrollment
    await expect(
      recordLessonProgress({
        tenantId,
        userId: userIdA,
        courseId: course.id,
        lessonId: lsn.id,
        completed: true,
      })
    ).rejects.toThrow('NOT_ENROLLED');
  });

  it('3. updates lesson progress, calculates course completion %, and auto-completes enrollment', async () => {
    // Setup course with 2 lessons
    const course = await createCourse({
      tenantId,
      titleEn: 'Fullstack Node.js',
      titleAr: 'تطوير نود الكامل',
      slug: 'fullstack-node',
      priceSar: '0',
    });

    const mod = await createCourseModule({
      tenantId,
      courseId: course.id,
      titleEn: 'Backend Foundation',
      titleAr: 'أساسيات الخلفية',
    });

    const lsn1 = await createLesson({
      tenantId,
      courseId: course.id,
      moduleId: mod.id,
      titleEn: 'Express Setup',
      titleAr: 'إعداد إكسبريس',
      lessonType: 'TEXT',
    });

    const lsn2 = await createLesson({
      tenantId,
      courseId: course.id,
      moduleId: mod.id,
      titleEn: 'Database Connectivity',
      titleAr: 'الربط بقاعدة البيانات',
      lessonType: 'VIDEO',
    });

    // Enroll User A
    const { enrollment } = await enrollUserInCourse(tenantId, userIdA, course.id);
    expect(enrollment.progressPercent).toBe(0);
    expect(enrollment.status).toBe('ACTIVE');

    // Complete Lesson 1
    const step1 = await recordLessonProgress({
      tenantId,
      userId: userIdA,
      courseId: course.id,
      lessonId: lsn1.id,
      completed: true,
      lastPositionSeconds: 120,
    });

    expect(step1.lessonProgress.status).toBe('COMPLETED');
    expect(step1.courseProgress.completedLessonsCount).toBe(1);
    expect(step1.courseProgress.totalLessonsCount).toBe(2);
    expect(step1.courseProgress.progressPercent).toBe(50);
    expect(step1.enrollment.progressPercent).toBe(50);
    expect(step1.enrollment.status).toBe('ACTIVE');

    // Complete Lesson 2
    const step2 = await recordLessonProgress({
      tenantId,
      userId: userIdA,
      courseId: course.id,
      lessonId: lsn2.id,
      completed: true,
    });

    expect(step2.lessonProgress.status).toBe('COMPLETED');
    expect(step2.courseProgress.completedLessonsCount).toBe(2);
    expect(step2.courseProgress.progressPercent).toBe(100);
    expect(step2.courseProgress.status).toBe('COMPLETED');
    expect(step2.enrollment.progressPercent).toBe(100);
    expect(step2.enrollment.status).toBe('COMPLETED');
  });

  it('4. tracks bookmarks and toggles them deterministically', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'AI Engineering',
      titleAr: 'هندسة الذكاء الاصطناعي',
      slug: 'ai-eng',
      priceSar: '0',
    });

    const mod = await createCourseModule({
      tenantId,
      courseId: course.id,
      titleEn: 'LLM Prompting',
      titleAr: 'صياغة الأوامر',
    });

    const lsn = await createLesson({
      tenantId,
      courseId: course.id,
      moduleId: mod.id,
      titleEn: 'Chain of Thought',
      titleAr: 'سلسلة الأفكار',
      lessonType: 'TEXT',
    });

    // Toggle on
    const addRes = await toggleBookmark(tenantId, userIdA, course.id, lsn.id, 'Important concept');
    expect(addRes.bookmarked).toBe(true);
    expect(addRes.bookmark).toBeDefined();

    const bookmarks = await getUserBookmarks(tenantId, userIdA, course.id);
    expect(bookmarks.length).toBe(1);
    expect(bookmarks[0].lessonId).toBe(lsn.id);

    // Toggle off
    const removeRes = await toggleBookmark(tenantId, userIdA, course.id, lsn.id);
    expect(removeRes.bookmarked).toBe(false);
    expect(removeRes.bookmark).toBeNull();

    const emptyBookmarks = await getUserBookmarks(tenantId, userIdA, course.id);
    expect(emptyBookmarks.length).toBe(0);
  });

  it('5. builds accurate Learner Dashboard Summary with isolated user state', async () => {
    // Course 1
    const course1 = await createCourse({
      tenantId,
      titleEn: 'Course One',
      titleAr: 'الدورة الأولى',
      slug: 'course-1',
      priceSar: '0',
    });
    const mod1 = await createCourseModule({ tenantId, courseId: course1.id, titleEn: 'M1', titleAr: 'و1' });
    const lsn1 = await createLesson({ tenantId, courseId: course1.id, moduleId: mod1.id, titleEn: 'L1', titleAr: 'د1', lessonType: 'TEXT' });

    // Course 2
    const course2 = await createCourse({
      tenantId,
      titleEn: 'Course Two',
      titleAr: 'الدورة الثانية',
      slug: 'course-2',
      priceSar: '0',
    });
    const mod2 = await createCourseModule({ tenantId, courseId: course2.id, titleEn: 'M2', titleAr: 'و2' });
    const lsn2 = await createLesson({ tenantId, courseId: course2.id, moduleId: mod2.id, titleEn: 'L2', titleAr: 'د2', lessonType: 'TEXT' });

    // Enroll User A in both courses
    await enrollUserInCourse(tenantId, userIdA, course1.id);
    await enrollUserInCourse(tenantId, userIdA, course2.id);

    // Complete Course 1 only
    await recordLessonProgress({
      tenantId,
      userId: userIdA,
      courseId: course1.id,
      lessonId: lsn1.id,
      completed: true,
    });

    const summaryA = await getLearnerDashboardSummary(tenantId, userIdA);
    expect(summaryA.stats.totalEnrolled).toBe(2);
    expect(summaryA.stats.completedCount).toBe(1);
    expect(summaryA.stats.inProgressCount).toBe(1);
    expect(summaryA.completedCourses.length).toBe(1);
    expect(summaryA.inProgressCourses.length).toBe(1);
    expect(summaryA.continueLearning?.courseId).toBe(course2.id);

    // Verify User B has isolated empty dashboard
    const summaryB = await getLearnerDashboardSummary(tenantId, userIdB);
    expect(summaryB.stats.totalEnrolled).toBe(0);
    expect(summaryB.stats.completedCount).toBe(0);
    expect(summaryB.inProgressCourses.length).toBe(0);
  });
});
