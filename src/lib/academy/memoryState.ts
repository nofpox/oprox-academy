/**
 * Shared in-memory state for Academy store modules.
 * Used as fallback in non-Postgres / test environments.
 */
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

// In-memory fallback stores for unit testing / non-Postgres environments
export const memoryProfiles: AcademyProfileRow[] = [];
export const memoryInstructors: InstructorProfileRow[] = [];
export const memoryCategories: AcademyCategoryRow[] = [];
export const memoryPaths: AcademyLearningPathRow[] = [];
export const memoryCourses: AcademyCourseRow[] = [];
export const memoryModules: AcademyCourseModuleRow[] = [];
export const memoryLessons: AcademyLessonRow[] = [];
export const memoryResources: AcademyLessonResourceRow[] = [];
export const memoryEnrollments: AcademyEnrollmentRow[] = [];
export const memoryLessonProgress: AcademyLessonProgressRow[] = [];
export const memoryCourseProgress: AcademyCourseProgressRow[] = [];
export const memorySessions: AcademyLearningSessionRow[] = [];
export const memoryBookmarks: AcademyBookmarkRow[] = [];

// Phase 3 Memory Fallbacks
export const memoryAssessments: AcademyAssessmentRow[] = [];
export const memoryAssessmentQuestions: AcademyAssessmentQuestionRow[] = [];
export const memoryAssessmentChoices: AcademyAssessmentChoiceRow[] = [];
export const memoryAssessmentAttempts: AcademyAssessmentAttemptRow[] = [];
export const memoryLearnerAnswers: AcademyLearnerAnswerRow[] = [];
export const memoryAssignments: AcademyAssignmentRow[] = [];
export const memoryAssignmentSubmissions: AcademyAssignmentSubmissionRow[] = [];
export const memoryCertificates: AcademyCertificateRow[] = [];

// Phase 4 Memory Fallbacks
export const memoryOrgPrograms: AcademyOrgProgramRow[] = [];
export const memoryOrgProgramCourses: AcademyOrgProgramCourseRow[] = [];
export const memoryCohorts: AcademyCohortRow[] = [];
export const memoryCohortMembers: AcademyCohortMemberRow[] = [];
export const memoryOrgAssignments: AcademyOrgAssignmentRow[] = [];
export const memoryInstructorCourses: AcademyInstructorCourseRow[] = [];
export const memoryAdminLogs: AcademyAdminLogRow[] = [];

// Phase 5 Memory Fallbacks
export const memoryTutorSessions: AcademyTutorSessionRow[] = [];
export const memoryTutorMessages: AcademyTutorMessageRow[] = [];
export const memoryLearnerMastery: AcademyLearnerMasteryRow[] = [];
export const memoryAdaptiveRecommendations: AcademyAdaptiveRecommendationRow[] = [];

// Phase 6 Memory Fallbacks
export const memoryLabSessions: AcademyLabSessionRow[] = [];


export function clearAcademyMemoryStore(): void {
  memoryProfiles.length = 0;
  memoryInstructors.length = 0;
  memoryCategories.length = 0;
  memoryPaths.length = 0;
  memoryCourses.length = 0;
  memoryModules.length = 0;
  memoryLessons.length = 0;
  memoryResources.length = 0;
  memoryEnrollments.length = 0;
  memoryLessonProgress.length = 0;
  memoryCourseProgress.length = 0;
  memorySessions.length = 0;
  memoryBookmarks.length = 0;
  memoryAssessments.length = 0;
  memoryAssessmentQuestions.length = 0;
  memoryAssessmentChoices.length = 0;
  memoryAssessmentAttempts.length = 0;
  memoryLearnerAnswers.length = 0;
  memoryAssignments.length = 0;
  memoryAssignmentSubmissions.length = 0;
  memoryCertificates.length = 0;
  memoryOrgPrograms.length = 0;
  memoryOrgProgramCourses.length = 0;
  memoryCohorts.length = 0;
  memoryCohortMembers.length = 0;
  memoryOrgAssignments.length = 0;
  memoryInstructorCourses.length = 0;
  memoryAdminLogs.length = 0;
  memoryTutorSessions.length = 0;
  memoryTutorMessages.length = 0;
  memoryLearnerMastery.length = 0;
  memoryAdaptiveRecommendations.length = 0;
  memoryLabSessions.length = 0;
}

