import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAcademyMemoryStore,
  getOrCreateAcademyProfile,
  updateAcademyProfile,
  createInstructorProfile,
  getInstructorProfile,
  listInstructors,
  createCategory,
  listCategories,
  createLearningPath,
  listLearningPaths,
  createCourse,
  getCourseBySlugOrId,
  listCourses,
  createCourseModule,
  createLesson,
  createResource,
  enrollUserInCourse,
  getUserEnrollments,
} from '../src/lib/academy/academyStore';

describe('OPROX Academy — Phase 1 Foundation & Core Learning Domain', () => {
  const tenantA = 'tenant_acad_a';
  const tenantB = 'tenant_acad_b';
  const user1 = 'usr_student_01';
  const user2 = 'usr_student_02';

  beforeEach(() => {
    clearAcademyMemoryStore();
  });

  it('1. Learner Profile & Instructor Profile Isolation', async () => {
    // Get/create profile for Tenant A
    const profA = await getOrCreateAcademyProfile(tenantA, user1, {
      headline: 'Software Engineer',
      preferLanguage: 'en',
    });
    expect(profA.id).toBeDefined();
    expect(profA.tenantId).toBe(tenantA);
    expect(profA.headline).toBe('Software Engineer');

    // Update profile
    const updated = await updateAcademyProfile(tenantA, user1, {
      headline: 'Senior AI Systems Architect',
      preferLanguage: 'ar',
    });
    expect(updated.headline).toBe('Senior AI Systems Architect');
    expect(updated.preferLanguage).toBe('ar');

    // Tenant B profile isolation
    const profB = await getOrCreateAcademyProfile(tenantB, user1);
    expect(profB.tenantId).toBe(tenantB);
    expect(profB.headline).toBeNull(); // Tenant B profile is fresh and isolated

    // Create Instructor in Tenant A
    const instA = await createInstructorProfile({
      tenantId: tenantA,
      userId: user2,
      title: 'Dr. Faisal Al-Rashid',
      bio: 'PhD in Distributed Systems & AI Governance',
      expertiseAreas: ['Distributed Systems', 'Cloud Native'],
    });
    expect(instA.id).toBeDefined();
    expect(instA.verificationStatus).toBe('VERIFIED');

    // Fetch Instructor Tenant A vs Tenant B
    const fetchedA = await getInstructorProfile(tenantA, instA.id);
    expect(fetchedA).not.toBeNull();
    expect(fetchedA?.title).toBe('Dr. Faisal Al-Rashid');

    const fetchedB = await getInstructorProfile(tenantB, instA.id);
    expect(fetchedB).toBeNull(); // Multi-tenant isolation verified
  });

  it('2. Category & Learning Path Hierarchy', async () => {
    const cat1 = await createCategory({
      tenantId: tenantA,
      nameEn: 'Artificial Intelligence',
      nameAr: 'الذكاء الاصطناعي',
      slug: 'ai-and-ml',
      icon: 'Cpu',
    });
    expect(cat1.id).toBeDefined();

    const catList = await listCategories(tenantA);
    expect(catList.length).toBe(1);
    expect(catList[0].nameAr).toBe('الذكاء الاصطناعي');

    // Tenant B category isolation
    const catListB = await listCategories(tenantB);
    expect(catListB.length).toBe(0);

    // Learning Path
    const path1 = await createLearningPath({
      tenantId: tenantA,
      titleEn: 'Full-Stack Autonomous Engineering',
      titleAr: 'الهندسة البرمجية المستقلة الشاملة',
      slug: 'fullstack-ai-engineering',
      level: 'ADVANCED',
      estimatedHours: 40,
    });
    expect(path1.id).toBeDefined();

    const pathList = await listLearningPaths(tenantA);
    expect(pathList.length).toBe(1);
    expect(pathList[0].estimatedHours).toBe(40);
  });

  it('3. Course, Modules, Lessons & Resources Full Syllabus Tree', async () => {
    const course = await createCourse({
      tenantId: tenantA,
      titleEn: 'OPROX Autonomous Agent Architecture',
      titleAr: 'بنية وكلاء أوب روكس المستقلة',
      slug: 'oprox-agent-architecture',
      summaryEn: 'Deep dive into deterministic LLM orchestration and tools.',
      summaryAr: 'شرح تفصيلي لتنظيم النماذج اللغوية والأدوات.',
      language: 'both',
      level: 'ADVANCED',
    });

    const module1 = await createCourseModule({
      tenantId: tenantA,
      courseId: course.id,
      titleEn: 'Module 1: Agentic Loop Fundamentals',
      titleAr: 'الوحدة 1: أساسيات دورة الوكلاء',
      displayOrder: 1,
    });

    const lesson1 = await createLesson({
      tenantId: tenantA,
      moduleId: module1.id,
      courseId: course.id,
      titleEn: 'Lesson 1.1: Context Window Management',
      titleAr: 'الدرس 1.1: إدارة نافذة السياق',
      durationMinutes: 25,
      isPreview: true,
    });

    const resource1 = await createResource({
      tenantId: tenantA,
      lessonId: lesson1.id,
      titleEn: 'Architecture Diagram PDF',
      titleAr: 'مخطط البنية المفهومية',
      resourceUrl: 'https://cdn.oprox.io/docs/architecture.pdf',
    });

    // Retrieve detailed course tree
    const detailed = await getCourseBySlugOrId(tenantA, 'oprox-agent-architecture');
    expect(detailed).not.toBeNull();
    expect(detailed?.course.titleEn).toBe('OPROX Autonomous Agent Architecture');
    expect(detailed?.modules.length).toBe(1);
    expect(detailed?.modules[0].lessons.length).toBe(1);
    expect(detailed?.modules[0].lessons[0].resources.length).toBe(1);
    expect(detailed?.modules[0].lessons[0].resources[0].resourceUrl).toBe(
      'https://cdn.oprox.io/docs/architecture.pdf'
    );
  });

  it('4. Course Search, Filtering & Multi-Tenant Isolation', async () => {
    // Create courses in Tenant A
    await createCourse({
      tenantId: tenantA,
      titleEn: 'TypeScript Enterprise Design Patterns',
      titleAr: 'أنماط تصميم تايب سكريبت للمؤسسات',
      slug: 'ts-enterprise-patterns',
      level: 'INTERMEDIATE',
      language: 'en',
    });

    await createCourse({
      tenantId: tenantA,
      titleEn: 'PostgreSQL Database Performance Tuning',
      titleAr: 'تحسين أداء قواعد بيانات بوستجري',
      slug: 'postgres-perf-tuning',
      level: 'ADVANCED',
      language: 'both',
    });

    // Create course in Tenant B
    await createCourse({
      tenantId: tenantB,
      titleEn: 'Tenant B Isolated Security Course',
      titleAr: 'دورة أمان معزولة',
      slug: 'tenant-b-security',
    });

    // Filter by query 'typescript'
    const tsResults = await listCourses(tenantA, { q: 'typescript' });
    expect(tsResults.length).toBe(1);
    expect(tsResults[0].slug).toBe('ts-enterprise-patterns');

    // Filter by Arabic query 'بوستجري'
    const arResults = await listCourses(tenantA, { q: 'بوستجري' });
    expect(arResults.length).toBe(1);
    expect(arResults[0].slug).toBe('postgres-perf-tuning');

    // Verify Tenant B course is strictly isolated
    const tenantACourses = await listCourses(tenantA);
    expect(tenantACourses.some((c) => c.slug === 'tenant-b-security')).toBe(false);

    const tenantBCourses = await listCourses(tenantB);
    expect(tenantBCourses.length).toBe(1);
    expect(tenantBCourses[0].slug).toBe('tenant-b-security');
  });

  it('5. Enrollment Engine & Duplicate Enrollment Prevention', async () => {
    const course = await createCourse({
      tenantId: tenantA,
      titleEn: 'Cloud Native Microservices Architecture',
      titleAr: 'بنية الخدمات المصغرة السحابية',
      slug: 'cloud-microservices',
    });

    // Initial enrollment
    const enroll1 = await enrollUserInCourse(tenantA, user1, course.id);
    expect(enroll1.isNew).toBe(true);
    expect(enroll1.enrollment.id).toBeDefined();
    expect(enroll1.enrollment.progressPercent).toBe(0);

    // Duplicate enrollment check
    const enroll2 = await enrollUserInCourse(tenantA, user1, course.id);
    expect(enroll2.isNew).toBe(false);
    expect(enroll2.enrollment.id).toBe(enroll1.enrollment.id);

    // List user enrollments
    const myEnrollments = await getUserEnrollments(tenantA, user1);
    expect(myEnrollments.length).toBe(1);
    expect(myEnrollments[0].course?.titleEn).toBe('Cloud Native Microservices Architecture');

    // Tenant B user isolation check
    const tenantBEnrollments = await getUserEnrollments(tenantB, user1);
    expect(tenantBEnrollments.length).toBe(0);
  });
});
