/**
 * Entity Manager Feature Module
 *
 * This module contains all features specific to entity managers:
 * - Halaqas management
 * - Warnings management
 *
 * Future modules for teachers, admins, etc. should be organized similarly
 * in their own feature folders (e.g., src/features/teacher/, src/features/admin/)
 */
// Halaqas exports
export * from './halaqas';
export { default as HalaqaList } from './halaqas/components/HalaqaList';
export { default as CreateHalaqaForm } from './halaqas/components/CreateHalaqaForm';
export { default as EditHalaqaForm } from './halaqas/components/EditHalaqaForm';
// Warnings exports
export * from './warnings';
export { default as WarningsList } from './warnings/components/WarningsList';
export { default as CreateWarningForm } from './warnings/components/CreateWarningForm';
// Join Requests exports
export * from './join-requests';
export { default as JoinRequestsList } from './join-requests/components/JoinRequestsList';
export { default as ViewJoinRequestModal } from './join-requests/components/ViewJoinRequestModal';
// Scheduled Exams exports
export * from './scheduled-exams/hooks/useScheduledExams';
export { default as CreateScheduledExamForm } from './scheduled-exams/components/CreateScheduledExamForm';
