// ── Academy Assessment Store: Assessments, Assignments, Certificates ──

import { db } from '../../db';
import {
  academyProfilesTable,
  instructorProfilesTable,
  academyCategoriesTable,
  academyLearningPathsTable,
  academyCoursesTable,
  academyCourseModulesTable,
  academyLessonsTable,
  academyLessonResourcesTable,
  academyEnrollmentsTable,
  academyLessonProgressTable,
  academyCourseProgressTable,
  academyLearningSessionsTable,
  academyBookmarksTable,
  AcademyProfileRow,
  InstructorProfileRow,
  AcademyCategoryRow,
  AcademyLearningPathRow,
  AcademyCourseRow,
  AcademyCourseModuleRow,
  AcademyLessonRow,
  AcademyLessonResourceRow,
  AcademyEnrollmentRow,
  AcademyLessonProgressRow,
  AcademyCourseProgressRow,
  AcademyLearningSessionRow,
  AcademyBookmarkRow,
  academyAssessmentsTable,
  academyAssessmentQuestionsTable,
  academyAssessmentChoicesTable,
  academyAssessmentAttemptsTable,
  academyLearnerAnswersTable,
  academyAssignmentsTable,
  academyAssignmentSubmissionsTable,
  academyCertificatesTable,
  academyOrgProgramsTable,
  academyOrgProgramCoursesTable,
  academyCohortsTable,
  academyCohortMembersTable,
  academyOrgAssignmentsTable,
  academyInstructorCoursesTable,
  academyAdminLogsTable,
  AcademyAssessmentRow,
  AcademyAssessmentQuestionRow,
  AcademyAssessmentChoiceRow,
  AcademyAssessmentAttemptRow,
  AcademyLearnerAnswerRow,
  AcademyAssignmentRow,
  AcademyAssignmentSubmissionRow,
  AcademyCertificateRow,
  AcademyOrgProgramRow,
  AcademyOrgProgramCourseRow,
  AcademyCohortRow,
  AcademyCohortMemberRow,
  AcademyOrgAssignmentRow,
  AcademyInstructorCourseRow,
  AcademyAdminLogRow,
  academyTutorSessionsTable,
  academyTutorMessagesTable,
  academyLearnerMasteryTable,
  academyAdaptiveRecommendationsTable,
  academyLabSessionsTable,
  AcademyTutorSessionRow,
  AcademyTutorMessageRow,
  AcademyLearnerMasteryRow,
  AcademyAdaptiveRecommendationRow,
  AcademyLabSessionRow,
} from '../../db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { logStructured } from '../logger';
import { getCourseBySlugOrId, getOrCreateAcademyProfile } from './catalogStore';
import { getUserEnrollments, recordLessonProgress, getCourseProgress } from './learningStore';

import {
  memoryProfiles, memoryInstructors, memoryCategories, memoryPaths,
  memoryCourses, memoryModules, memoryLessons, memoryResources,
  memoryEnrollments, memoryLessonProgress, memoryCourseProgress,
  memorySessions, memoryBookmarks, memoryAssessments,
  memoryAssessmentQuestions, memoryAssessmentChoices,
  memoryAssessmentAttempts, memoryLearnerAnswers, memoryAssignments,
  memoryAssignmentSubmissions, memoryCertificates, memoryOrgPrograms,
  memoryOrgProgramCourses, memoryCohorts, memoryCohortMembers,
  memoryOrgAssignments, memoryInstructorCourses, memoryAdminLogs,
  memoryTutorSessions, memoryTutorMessages, memoryLearnerMastery,
  memoryAdaptiveRecommendations, memoryLabSessions,
} from './memoryState';

export async function createAssessment(data: {
  tenantId: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  passingScorePercent?: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
}): Promise<AcademyAssessmentRow> {
  const assessment: AcademyAssessmentRow = {
    id: `acad_asmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    courseId: data.courseId,
    moduleId: data.moduleId || null,
    lessonId: data.lessonId || null,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    passingScorePercent: data.passingScorePercent ?? 70,
    maxAttempts: data.maxAttempts ?? 3,
    timeLimitMinutes: data.timeLimitMinutes ?? 0,
    shuffleQuestions: data.shuffleQuestions ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentsTable).values(assessment).returning();
      return res || assessment;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_ASSESSMENT_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessments.push(assessment);
  return assessment;
}

export async function addQuestionToAssessment(data: {
  tenantId: string;
  assessmentId: string;
  questionTextEn: string;
  questionTextAr: string;
  questionType?: string;
  points?: number;
  displayOrder?: number;
  explanationEn?: string;
  explanationAr?: string;
}): Promise<AcademyAssessmentQuestionRow> {
  const question: AcademyAssessmentQuestionRow = {
    id: `acad_quest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    assessmentId: data.assessmentId,
    questionTextEn: data.questionTextEn,
    questionTextAr: data.questionTextAr,
    questionType: data.questionType || 'SINGLE_CHOICE',
    points: data.points ?? 1,
    displayOrder: data.displayOrder ?? 1,
    explanationEn: data.explanationEn || null,
    explanationAr: data.explanationAr || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentQuestionsTable).values(question).returning();
      return res || question;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_QUESTION_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessmentQuestions.push(question);
  return question;
}

export async function addChoiceToQuestion(data: {
  tenantId: string;
  questionId: string;
  choiceTextEn: string;
  choiceTextAr: string;
  isCorrect?: boolean;
  displayOrder?: number;
}): Promise<AcademyAssessmentChoiceRow> {
  const choice: AcademyAssessmentChoiceRow = {
    id: `acad_choice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    questionId: data.questionId,
    choiceTextEn: data.choiceTextEn,
    choiceTextAr: data.choiceTextAr,
    isCorrect: data.isCorrect ?? false,
    displayOrder: data.displayOrder ?? 1,
    createdAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentChoicesTable).values(choice).returning();
      return res || choice;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_CHOICE_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessmentChoices.push(choice);
  return choice;
}

export async function getAssessmentById(
  tenantId: string,
  assessmentId: string,
  includeAnswers: boolean = false
): Promise<{
  assessment: AcademyAssessmentRow;
  questions: Array<{
    question: AcademyAssessmentQuestionRow;
    choices: Array<Partial<AcademyAssessmentChoiceRow>>;
  }>;
} | null> {
  let assessment: AcademyAssessmentRow | undefined;
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(academyAssessmentsTable)
        .where(
          and(
            eq(academyAssessmentsTable.tenantId, tenantId),
            eq(academyAssessmentsTable.id, assessmentId)
          )
        );
      assessment = found;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ASSESSMENT_FALLBACK', { error: String(err) });
    }
  }
  if (!assessment) {
    assessment = memoryAssessments.find((a) => a.tenantId === tenantId && a.id === assessmentId);
  }
  if (!assessment) return null;

  let questions: AcademyAssessmentQuestionRow[] = [];
  if (db) {
    try {
      questions = await db
        .select()
        .from(academyAssessmentQuestionsTable)
        .where(
          and(
            eq(academyAssessmentQuestionsTable.tenantId, tenantId),
            eq(academyAssessmentQuestionsTable.assessmentId, assessmentId)
          )
        )
        .orderBy(asc(academyAssessmentQuestionsTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_QUESTIONS_FALLBACK', { error: String(err) });
    }
  }
  if (questions.length === 0) {
    questions = memoryAssessmentQuestions
      .filter((q) => q.tenantId === tenantId && q.assessmentId === assessmentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const enrichedQuestions = await Promise.all(
    questions.map(async (q) => {
      let choices: AcademyAssessmentChoiceRow[] = [];
      if (db) {
        try {
          choices = await db
            .select()
            .from(academyAssessmentChoicesTable)
            .where(
              and(
                eq(academyAssessmentChoicesTable.tenantId, tenantId),
                eq(academyAssessmentChoicesTable.questionId, q.id)
              )
            )
            .orderBy(asc(academyAssessmentChoicesTable.displayOrder));
        } catch (err) {
          logStructured('warn', 'ACADEMY_DB_GET_CHOICES_FALLBACK', { error: String(err) });
        }
      }
      if (choices.length === 0) {
        choices = memoryAssessmentChoices
          .filter((c) => c.tenantId === tenantId && c.questionId === q.id)
          .sort((a, b) => a.displayOrder - b.displayOrder);
      }

      // Safe representation when includeAnswers is false (Secrecy Check!)
      const sanitizedChoices = choices.map((c) => {
        if (includeAnswers) return c;
        const { isCorrect, ...rest } = c;
        return rest;
      });

      const sanitizedQuestion = includeAnswers
        ? q
        : { ...q, explanationEn: null, explanationAr: null };

      return {
        question: sanitizedQuestion,
        choices: sanitizedChoices,
      };
    })
  );

  return {
    assessment,
    questions: enrichedQuestions,
  };
}

export async function listAssessmentsByCourse(
  tenantId: string,
  courseId: string
): Promise<AcademyAssessmentRow[]> {
  let list: AcademyAssessmentRow[] = [];
  if (db) {
    try {
      list = await db
        .select()
        .from(academyAssessmentsTable)
        .where(
          and(
            eq(academyAssessmentsTable.tenantId, tenantId),
            eq(academyAssessmentsTable.courseId, courseId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_ASSESSMENTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryAssessments.filter((a) => a.tenantId === tenantId && a.courseId === courseId);
  }
  return list;
}

// 2. Attempts & Server-Side Scoring
export async function startAssessmentAttempt(
  tenantId: string,
  userId: string,
  assessmentId: string
): Promise<AcademyAssessmentAttemptRow> {
  const fullAsmt = await getAssessmentById(tenantId, assessmentId, true);
  if (!fullAsmt) {
    throw new Error('ASSESSMENT_NOT_FOUND');
  }
  const { assessment } = fullAsmt;

  // Check attempt history
  let attempts: AcademyAssessmentAttemptRow[] = [];
  if (db) {
    try {
      attempts = await db
        .select()
        .from(academyAssessmentAttemptsTable)
        .where(
          and(
            eq(academyAssessmentAttemptsTable.tenantId, tenantId),
            eq(academyAssessmentAttemptsTable.userId, userId),
            eq(academyAssessmentAttemptsTable.assessmentId, assessmentId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ATTEMPTS_FALLBACK', { error: String(err) });
    }
  }
  if (attempts.length === 0) {
    attempts = memoryAssessmentAttempts.filter(
      (a) => a.tenantId === tenantId && a.userId === userId && a.assessmentId === assessmentId
    );
  }

  if (assessment.maxAttempts && attempts.length >= assessment.maxAttempts) {
    throw new Error('MAX_ATTEMPTS_REACHED');
  }

  const attempt: AcademyAssessmentAttemptRow = {
    id: `acad_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    assessmentId,
    courseId: assessment.courseId,
    attemptNumber: attempts.length + 1,
    status: 'IN_PROGRESS',
    scorePoints: 0,
    maxPoints: 0,
    scorePercent: 0,
    passed: false,
    startedAt: new Date(),
    submittedAt: null,
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentAttemptsTable).values(attempt).returning();
      return res || attempt;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_START_ATTEMPT_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessmentAttempts.push(attempt);
  return attempt;
}

export async function submitAssessmentAttempt(
  tenantId: string,
  userId: string,
  attemptId: string,
  answers: Array<{
    questionId: string;
    selectedChoiceIds?: string[];
    shortAnswerText?: string;
  }>
): Promise<{
  attempt: AcademyAssessmentAttemptRow;
  answers: AcademyLearnerAnswerRow[];
  passed: boolean;
  scorePercent: number;
  scorePoints: number;
  maxPoints: number;
}> {
  let attempt: AcademyAssessmentAttemptRow | undefined;
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(academyAssessmentAttemptsTable)
        .where(
          and(
            eq(academyAssessmentAttemptsTable.tenantId, tenantId),
            eq(academyAssessmentAttemptsTable.id, attemptId)
          )
        );
      attempt = found;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ATTEMPT_FALLBACK', { error: String(err) });
    }
  }
  if (!attempt) {
    attempt = memoryAssessmentAttempts.find((a) => a.tenantId === tenantId && a.id === attemptId);
  }

  if (!attempt) {
    throw new Error('ATTEMPT_NOT_FOUND');
  }
  if (attempt.userId !== userId) {
    throw new Error('FORBIDDEN_ATTEMPT_OWNERSHIP'); // IDOR Protection
  }
  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error('ATTEMPT_ALREADY_SUBMITTED');
  }

  const fullAsmt = await getAssessmentById(tenantId, attempt.assessmentId, true);
  if (!fullAsmt) {
    throw new Error('ASSESSMENT_NOT_FOUND');
  }

  let totalEarned = 0;
  let totalMax = 0;
  const recordedAnswers: AcademyLearnerAnswerRow[] = [];

  for (const qEntry of fullAsmt.questions) {
    const question = qEntry.question;
    const choices = qEntry.choices as AcademyAssessmentChoiceRow[];
    totalMax += question.points;

    const userAns = answers.find((a) => a.questionId === question.id);
    let isCorrect = false;
    let pointsEarned = 0;

    if (userAns) {
      const selectedChoiceIds = userAns.selectedChoiceIds || [];
      const shortText = (userAns.shortAnswerText || '').trim().toLowerCase();

      if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        const correctChoice = choices.find((c) => c.isCorrect);
        if (correctChoice && selectedChoiceIds.includes(correctChoice.id)) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE') {
        const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id).sort();
        const userChoiceIds = [...selectedChoiceIds].sort();

        if (
          correctChoiceIds.length === userChoiceIds.length &&
          correctChoiceIds.every((id, idx) => id === userChoiceIds[idx])
        ) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.questionType === 'SHORT_ANSWER') {
        const correctChoices = choices.filter((c) => c.isCorrect);
        const match = correctChoices.some(
          (c) =>
            c.choiceTextEn.trim().toLowerCase() === shortText ||
            c.choiceTextAr.trim().toLowerCase() === shortText
        );
        if (match) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      }
    }

    totalEarned += pointsEarned;

    const ansRecord: AcademyLearnerAnswerRow = {
      id: `acad_ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      attemptId,
      questionId: question.id,
      selectedChoiceIds: userAns?.selectedChoiceIds ? JSON.stringify(userAns.selectedChoiceIds) : null,
      shortAnswerText: userAns?.shortAnswerText || null,
      isCorrect,
      pointsEarned,
      createdAt: new Date(),
    };

    recordedAnswers.push(ansRecord);
  }

  const scorePercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const passed = scorePercent >= fullAsmt.assessment.passingScorePercent;

  const updatedAttempt: AcademyAssessmentAttemptRow = {
    ...attempt,
    status: 'SUBMITTED',
    scorePoints: totalEarned,
    maxPoints: totalMax,
    scorePercent,
    passed,
    submittedAt: new Date(),
  };

  if (db) {
    try {
      await db
        .update(academyAssessmentAttemptsTable)
        .set(updatedAttempt)
        .where(eq(academyAssessmentAttemptsTable.id, attemptId));

      for (const ans of recordedAnswers) {
        await db.insert(academyLearnerAnswersTable).values(ans);
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_SUBMIT_ATTEMPT_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryAssessmentAttempts.findIndex((a) => a.id === attemptId);
  if (idx !== -1) memoryAssessmentAttempts[idx] = updatedAttempt;
  else memoryAssessmentAttempts.push(updatedAttempt);

  memoryLearnerAnswers.push(...recordedAnswers);

  // If passed and linked to a lesson, auto-record lesson completion!
  if (passed && fullAsmt.assessment.lessonId) {
    try {
      const enrollments = await getUserEnrollments(tenantId, userId);
      const enr = enrollments.find((e) => e.courseId === fullAsmt.assessment.courseId);
      if (enr) {
        await recordLessonProgress({
          tenantId,
          userId,
          courseId: fullAsmt.assessment.courseId,
          lessonId: fullAsmt.assessment.lessonId,
          completed: true,
        });
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_QUIZ_AUTO_LESSON_PROGRESS_ERROR', { error: String(err) });
    }
  }

  return {
    attempt: updatedAttempt,
    answers: recordedAnswers,
    passed,
    scorePercent,
    scorePoints: totalEarned,
    maxPoints: totalMax,
  };
}

export async function getLearnerAssessmentAttempts(
  tenantId: string,
  userId: string,
  assessmentId?: string
): Promise<AcademyAssessmentAttemptRow[]> {
  let list: AcademyAssessmentAttemptRow[] = [];
  if (db) {
    try {
      const conditions = [
        eq(academyAssessmentAttemptsTable.tenantId, tenantId),
        eq(academyAssessmentAttemptsTable.userId, userId),
      ];
      if (assessmentId) {
        conditions.push(eq(academyAssessmentAttemptsTable.assessmentId, assessmentId));
      }
      list = await db
        .select()
        .from(academyAssessmentAttemptsTable)
        .where(and(...conditions))
        .orderBy(desc(academyAssessmentAttemptsTable.attemptNumber));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LEARNER_ATTEMPTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryAssessmentAttempts
      .filter((a) => a.tenantId === tenantId && a.userId === userId && (!assessmentId || a.assessmentId === assessmentId))
      .sort((a, b) => b.attemptNumber - a.attemptNumber);
  }
  return list;
}

// 3. Assignments & Submissions
export async function createAssignment(data: {
  tenantId: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  titleEn: string;
  titleAr: string;
  instructionsEn?: string;
  instructionsAr?: string;
  maxScore?: number;
  passingScore?: number;
  allowResubmission?: boolean;
  dueDate?: Date;
}): Promise<AcademyAssignmentRow> {
  const assignment: AcademyAssignmentRow = {
    id: `acad_asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    courseId: data.courseId,
    moduleId: data.moduleId || null,
    lessonId: data.lessonId || null,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    instructionsEn: data.instructionsEn || null,
    instructionsAr: data.instructionsAr || null,
    maxScore: data.maxScore ?? 100,
    passingScore: data.passingScore ?? 60,
    allowResubmission: data.allowResubmission ?? true,
    dueDate: data.dueDate || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssignmentsTable).values(assignment).returning();
      return res || assignment;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_ASSIGNMENT_FALLBACK', { error: String(err) });
    }
  }
  memoryAssignments.push(assignment);
  return assignment;
}

export async function getAssignmentById(
  tenantId: string,
  assignmentId: string
): Promise<AcademyAssignmentRow | null> {
  let found: AcademyAssignmentRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentsTable)
        .where(
          and(
            eq(academyAssignmentsTable.tenantId, tenantId),
            eq(academyAssignmentsTable.id, assignmentId)
          )
        );
      found = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ASSIGNMENT_FALLBACK', { error: String(err) });
    }
  }
  if (!found) {
    found = memoryAssignments.find((a) => a.tenantId === tenantId && a.id === assignmentId);
  }
  return found || null;
}

export async function listAssignmentsByCourse(
  tenantId: string,
  courseId: string
): Promise<AcademyAssignmentRow[]> {
  let list: AcademyAssignmentRow[] = [];
  if (db) {
    try {
      list = await db
        .select()
        .from(academyAssignmentsTable)
        .where(
          and(
            eq(academyAssignmentsTable.tenantId, tenantId),
            eq(academyAssignmentsTable.courseId, courseId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_ASSIGNMENTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryAssignments.filter((a) => a.tenantId === tenantId && a.courseId === courseId);
  }
  return list;
}

export async function submitAssignment(
  tenantId: string,
  userId: string,
  assignmentId: string,
  submissionText: string,
  resourceUrls?: string[]
): Promise<AcademyAssignmentSubmissionRow> {
  const assignment = await getAssignmentById(tenantId, assignmentId);
  if (!assignment) {
    throw new Error('ASSIGNMENT_NOT_FOUND');
  }

  // Check existing submission
  let existing: AcademyAssignmentSubmissionRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(
          and(
            eq(academyAssignmentSubmissionsTable.tenantId, tenantId),
            eq(academyAssignmentSubmissionsTable.userId, userId),
            eq(academyAssignmentSubmissionsTable.assignmentId, assignmentId)
          )
        );
      existing = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SUBMISSION_FALLBACK', { error: String(err) });
    }
  }
  if (!existing) {
    existing = memoryAssignmentSubmissions.find(
      (s) => s.tenantId === tenantId && s.userId === userId && s.assignmentId === assignmentId
    );
  }

  if (existing && !assignment.allowResubmission && existing.status === 'GRADED') {
    throw new Error('RESUBMISSION_NOT_ALLOWED');
  }

  const submission: AcademyAssignmentSubmissionRow = {
    id: existing?.id || `acad_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    assignmentId,
    courseId: assignment.courseId,
    submissionText,
    resourceUrls: resourceUrls ? JSON.stringify(resourceUrls) : null,
    status: 'SUBMITTED',
    score: null,
    instructorFeedbackEn: null,
    instructorFeedbackAr: null,
    gradedByUserId: null,
    submittedAt: new Date(),
    gradedAt: null,
  };

  if (db) {
    try {
      if (existing) {
        await db
          .update(academyAssignmentSubmissionsTable)
          .set(submission)
          .where(eq(academyAssignmentSubmissionsTable.id, existing.id));
      } else {
        await db.insert(academyAssignmentSubmissionsTable).values(submission);
      }
      return submission;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_SUBMIT_ASSIGNMENT_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryAssignmentSubmissions.findIndex((s) => s.id === submission.id);
  if (idx !== -1) memoryAssignmentSubmissions[idx] = submission;
  else memoryAssignmentSubmissions.push(submission);

  return submission;
}

export async function getLearnerAssignmentSubmission(
  tenantId: string,
  userId: string,
  assignmentId: string
): Promise<AcademyAssignmentSubmissionRow | null> {
  let found: AcademyAssignmentSubmissionRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(
          and(
            eq(academyAssignmentSubmissionsTable.tenantId, tenantId),
            eq(academyAssignmentSubmissionsTable.userId, userId),
            eq(academyAssignmentSubmissionsTable.assignmentId, assignmentId)
          )
        );
      found = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LEARNER_SUBMISSION_FALLBACK', { error: String(err) });
    }
  }
  if (!found) {
    found = memoryAssignmentSubmissions.find(
      (s) => s.tenantId === tenantId && s.userId === userId && s.assignmentId === assignmentId
    );
  }
  return found || null;
}

export async function gradeAssignmentSubmission(
  tenantId: string,
  instructorUserId: string,
  submissionId: string,
  score: number,
  feedbackEn?: string,
  feedbackAr?: string
): Promise<AcademyAssignmentSubmissionRow> {
  let sub: AcademyAssignmentSubmissionRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(
          and(
            eq(academyAssignmentSubmissionsTable.tenantId, tenantId),
            eq(academyAssignmentSubmissionsTable.id, submissionId)
          )
        );
      sub = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SUBMISSION_FOR_GRADE_FALLBACK', { error: String(err) });
    }
  }
  if (!sub) {
    sub = memoryAssignmentSubmissions.find((s) => s.tenantId === tenantId && s.id === submissionId);
  }

  if (!sub) {
    throw new Error('SUBMISSION_NOT_FOUND');
  }

  const updated: AcademyAssignmentSubmissionRow = {
    ...sub,
    score,
    status: 'GRADED',
    instructorFeedbackEn: feedbackEn || null,
    instructorFeedbackAr: feedbackAr || null,
    gradedByUserId: instructorUserId,
    gradedAt: new Date(),
  };

  if (db) {
    try {
      await db
        .update(academyAssignmentSubmissionsTable)
        .set(updated)
        .where(eq(academyAssignmentSubmissionsTable.id, submissionId));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GRADE_SUBMISSION_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryAssignmentSubmissions.findIndex((s) => s.id === submissionId);
  if (idx !== -1) memoryAssignmentSubmissions[idx] = updated;
  else memoryAssignmentSubmissions.push(updated);

  return updated;
}

// 4. Certificates & Public Verification
export async function checkCertificateEligibility(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<{
  eligible: boolean;
  completedLessons: boolean;
  passedAssessments: boolean;
  passedAssignments: boolean;
  reason?: string;
}> {
  // Check lesson progress
  const progress = await getCourseProgress(tenantId, userId, courseId);
  const completedLessons = progress ? progress.progressPercent >= 100 : false;

  // Check required assessments
  const assessments = await listAssessmentsByCourse(tenantId, courseId);
  let passedAssessments = true;
  for (const asmt of assessments) {
    const attempts = await getLearnerAssessmentAttempts(tenantId, userId, asmt.id);
    const hasPassed = attempts.some((att) => att.passed);
    if (!hasPassed) {
      passedAssessments = false;
      break;
    }
  }

  // Check required assignments
  const assignments = await listAssignmentsByCourse(tenantId, courseId);
  let passedAssignments = true;
  for (const asgn of assignments) {
    const sub = await getLearnerAssignmentSubmission(tenantId, userId, asgn.id);
    if (!sub || sub.status !== 'GRADED' || (sub.score !== null && sub.score < asgn.passingScore)) {
      passedAssignments = false;
      break;
    }
  }

  const eligible = completedLessons && passedAssessments && passedAssignments;
  let reason: string | undefined;
  if (!completedLessons) reason = 'COURSE_LESSONS_INCOMPLETE';
  else if (!passedAssessments) reason = 'REQUIRED_ASSESSMENTS_NOT_PASSED';
  else if (!passedAssignments) reason = 'REQUIRED_ASSIGNMENTS_NOT_PASSED';

  return {
    eligible,
    completedLessons,
    passedAssessments,
    passedAssignments,
    reason,
  };
}

export async function issueCertificate(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyCertificateRow> {
  const eligibility = await checkCertificateEligibility(tenantId, userId, courseId);
  if (!eligibility.eligible) {
    throw new Error(`NOT_ELIGIBLE: ${eligibility.reason}`);
  }

  // Duplicate Certificate Protection
  let existingCert: AcademyCertificateRow | undefined;
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(academyCertificatesTable)
        .where(
          and(
            eq(academyCertificatesTable.tenantId, tenantId),
            eq(academyCertificatesTable.userId, userId),
            eq(academyCertificatesTable.courseId, courseId)
          )
        );
      existingCert = found;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_CERTIFICATE_FALLBACK', { error: String(err) });
    }
  }
  if (!existingCert) {
    existingCert = memoryCertificates.find(
      (c) => c.tenantId === tenantId && c.userId === userId && c.courseId === courseId
    );
  }

  if (existingCert) {
    return existingCert; // Prevent duplicate issuance!
  }

  const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const certNumber = `CERT-OPX-2026-${randPart}`;
  const vCode = `vcode_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const cert: AcademyCertificateRow = {
    id: `acad_cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    courseId,
    certificateNumber: certNumber,
    verificationCode: vCode,
    completionScorePercent: 100,
    issueDate: new Date(),
    status: 'ISSUED',
    metadata: JSON.stringify({ issuer: 'OPROX Academy Certification Engine', version: 'Phase 3' }),
    createdAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyCertificatesTable).values(cert).returning();
      return res || cert;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ISSUE_CERT_FALLBACK', { error: String(err) });
    }
  }

  memoryCertificates.push(cert);
  return cert;
}

export async function getLearnerCertificates(
  tenantId: string,
  userId: string
): Promise<AcademyCertificateRow[]> {
  let list: AcademyCertificateRow[] = [];
  if (db) {
    try {
      list = await db
        .select()
        .from(academyCertificatesTable)
        .where(
          and(
            eq(academyCertificatesTable.tenantId, tenantId),
            eq(academyCertificatesTable.userId, userId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_CERTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryCertificates.filter((c) => c.tenantId === tenantId && c.userId === userId);
  }
  return list;
}

export async function verifyCertificate(verificationCodeOrNumber: string): Promise<{
  valid: boolean;
  certificateNumber?: string;
  verificationCode?: string;
  issueDate?: Date;
  completionScorePercent?: number;
  status?: string;
  courseTitleEn?: string;
  courseTitleAr?: string;
  learnerName?: string;
  reason?: string;
}> {
  let cert: AcademyCertificateRow | undefined;
  if (db) {
    try {
      const [byCode] = await db
        .select()
        .from(academyCertificatesTable)
        .where(eq(academyCertificatesTable.verificationCode, verificationCodeOrNumber));

      if (byCode) {
        cert = byCode;
      } else {
        const [byNum] = await db
          .select()
          .from(academyCertificatesTable)
          .where(eq(academyCertificatesTable.certificateNumber, verificationCodeOrNumber));
        cert = byNum;
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_VERIFY_CERT_FALLBACK', { error: String(err) });
    }
  }

  if (!cert) {
    cert = memoryCertificates.find(
      (c) => c.verificationCode === verificationCodeOrNumber || c.certificateNumber === verificationCodeOrNumber
    );
  }

  if (!cert || cert.status !== 'ISSUED') {
    return {
      valid: false,
      reason: 'INVALID_OR_REVOKED_CERTIFICATE',
    };
  }

  // Enrich with course title and learner profile
  const course = await getCourseBySlugOrId(cert.tenantId, cert.courseId);
  const profile = await getOrCreateAcademyProfile(cert.tenantId, cert.userId);

  return {
    valid: true,
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    issueDate: cert.issueDate,
    completionScorePercent: cert.completionScorePercent,
    status: cert.status,
    courseTitleEn: course?.course.titleEn || 'OPROX Accredited Course',
    courseTitleAr: course?.course.titleAr || 'دورة معتمدة من أوبروكس',
    learnerName: profile ? `Learner (${profile.userId.substring(0, 8)})` : 'Verified Learner',
  };
}

// ── Phase 4: Instructor Studio & Course Management ─────────────────────────

