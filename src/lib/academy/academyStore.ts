/**
 * Academy Store — barrel re-export.
 * Split into domain modules for maintainability.
 * All callers continue to import from this file unchanged.
 */

export { clearAcademyMemoryStore } from './memoryState';
export * from './catalogStore';
export * from './learningStore';
export * from './assessmentStore';
export * from './adminStore';
export * from './tutorStore';
export * from './adaptiveStore';
