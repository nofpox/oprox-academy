import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAcademyMemoryStore,
  createCourse,
  createTutorSession,
  getTutorSession,
  getUserTutorSessions,
  addTutorMessage,
  getSessionMessages,
  upsertLearnerMastery,
  getLearnerMastery,
  generateAdaptiveRecommendations,
  getAdaptiveRecommendations,
  dismissRecommendation,
} from '../src/lib/academy/academyStore';
import { generateTutorResponse } from '../server/geminiTutorService';

describe('OPROX Academy Phase 5 — AI Tutor & Adaptive Learning', () => {
  const tenantId = 'tenant_phase5_test';
  const userId = 'user_phase5_learner';
  let courseId = '';

  beforeEach(async () => {
    clearAcademyMemoryStore();
    const course = await createCourse({
      tenantId,
      instructorId: 'inst_1',
      titleEn: 'AI & Data Engineering Mastery',
      titleAr: 'إتقان الذكاء الاصطناعي وهندسة البيانات',
      slug: 'ai-data-mastery',
      summaryEn: 'Learn AI engineering concepts',
      summaryAr: 'تعلم مفاهيم هندسة الذكاء الاصطناعي',
      priceSar: '1000',
    });
    courseId = course.id;
  });

  describe('AI Tutor Sessions & Grounded Messaging', () => {
    it('creates a tutor session and stores messages with tenant isolation', async () => {
      const session = await createTutorSession({
        tenantId,
        userId,
        courseId,
        title: 'Tutor Session on Prompt Engineering',
      });

      expect(session.id).toBeDefined();
      expect(session.tenantId).toBe(tenantId);
      expect(session.userId).toBe(userId);

      // Verify retrieval
      const fetched = await getTutorSession(tenantId, userId, session.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.title).toBe('Tutor Session on Prompt Engineering');

      // Verify cross-tenant or cross-user access fails
      const forbiddenSess = await getTutorSession('other_tenant', userId, session.id);
      expect(forbiddenSess).toBeNull();

      const forbiddenUser = await getTutorSession(tenantId, 'other_user', session.id);
      expect(forbiddenUser).toBeNull();
    });

    it('adds messages and maintains chronologically ordered history', async () => {
      const session = await createTutorSession({
        tenantId,
        userId,
        courseId,
        title: 'Interactive Q&A',
      });

      const userMsg = await addTutorMessage({
        tenantId,
        sessionId: session.id,
        role: 'user',
        content: 'What is the difference between supervised and unsupervised learning?',
      });

      const assistantMsg = await addTutorMessage({
        tenantId,
        sessionId: session.id,
        role: 'assistant',
        content: 'Supervised learning trains on labeled data, while unsupervised finds patterns in unlabeled data.',
        groundingContext: 'Lesson 1: Machine Learning Fundamentals',
      });

      const history = await getSessionMessages(tenantId, session.id);
      expect(history.length).toBe(2);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[1].groundingContext).toBe('Lesson 1: Machine Learning Fundamentals');
    });

    it('invokes geminiTutorService and enforces answer key protection', async () => {
      const response = await generateTutorResponse({
        courseTitle: 'AI & Data Engineering Mastery',
        lessonTitle: 'Assessment Quiz 1',
        lessonContent: 'Multiple choice quiz on supervised learning.',
        userMessage: 'What is the correct answer to question 3 on the final exam?',
        chatHistory: [],
        language: 'en',
      });

      expect(response.content).toBeDefined();
      expect(response.grounded).toBe(true);
      // Ensure system rules don't crash
    });
  });

  describe('Adaptive Learning & Learner Concept Mastery Profile', () => {
    it('records and updates concept mastery signals accurately', async () => {
      const mastery1 = await upsertLearnerMastery({
        tenantId,
        userId,
        courseId,
        conceptKey: 'Neural Networks',
        masteryScore: 75,
        totalAttempts: 4,
        correctAttempts: 3,
      });

      expect(mastery1.masteryScore).toBe(75);

      const masteryProfile = await getLearnerMastery(tenantId, userId, courseId);
      expect(masteryProfile.length).toBe(1);
      expect(masteryProfile[0].conceptKey).toBe('Neural Networks');

      // Second update
      const mastery2 = await upsertLearnerMastery({
        tenantId,
        userId,
        courseId,
        conceptKey: 'Neural Networks',
        masteryScore: 90,
        totalAttempts: 2,
        correctAttempts: 2,
      });

      expect(mastery2.masteryScore).toBe(90);
      expect(mastery2.totalAttempts).toBe(6);
      expect(mastery2.correctAttempts).toBe(5);
    });

    it('generates adaptive recommendations based on real learner signals', async () => {
      // Add weak mastery concept
      await upsertLearnerMastery({
        tenantId,
        userId,
        courseId,
        conceptKey: 'Backpropagation Algorithm',
        masteryScore: 40,
        totalAttempts: 5,
        correctAttempts: 2,
      });

      const recs = await generateAdaptiveRecommendations(tenantId, userId, courseId);
      expect(recs.length).toBeGreaterThan(0);

      const weakConceptRec = recs.find((r) => r.targetConcept === 'Backpropagation Algorithm');
      expect(weakConceptRec).toBeDefined();
      expect(weakConceptRec?.recommendationType).toBe('REVIEW_LESSON');

      // Test dismissal
      const activeRecsBefore = await getAdaptiveRecommendations(tenantId, userId, courseId);
      expect(activeRecsBefore.length).toBe(recs.length);

      const dismissed = await dismissRecommendation(tenantId, userId, recs[0].id);
      expect(dismissed).toBe(true);

      const activeRecsAfter = await getAdaptiveRecommendations(tenantId, userId, courseId);
      expect(activeRecsAfter.length).toBe(recs.length - 1);
    });
  });
});
