/**
 * Halaqa Configuration
 * Static options for Halaqa form with localization keys
 */

export const HALAQA_PERIODS = [
    { value: 'morning', labelKey: 'halaqa.period.morning' },
    { value: 'evening', labelKey: 'halaqa.period.evening' }
] as const;

export const HALAQA_ACTIVITIES = [
    { value: 'tasbit', labelKey: 'halaqa.activity.tasbit' },
    { value: 'hifz', labelKey: 'halaqa.activity.hifz' },
    { value: 'murajaa', labelKey: 'halaqa.activity.murajaa' }
] as const;

export const HALAQA_TEACHING_METHODS = [
    { value: 'in_person', labelKey: 'halaqa.teachingMethod.inPerson' },
    { value: 'remote', labelKey: 'halaqa.teachingMethod.remote' },
    { value: 'hybrid', labelKey: 'halaqa.teachingMethod.hybrid' }
] as const;

export const PLAN_TYPES = [
    { value: 'daily_amount', labelKey: 'plan.type.dailyAmount' },
    { value: 'start_end', labelKey: 'plan.type.startEnd' }
] as const;

export const PLAN_UNITS = [
    { value: 'segments', labelKey: 'plan.unit.segments' },
    { value: 'parts', labelKey: 'plan.unit.juz' }, // Display as "juz" to user, but API uses "parts"
    { value: 'surahs', labelKey: 'plan.unit.surahs' }
] as const;

export const PLAN_DIRECTIONS = [
    { value: 'incremental', labelKey: 'plan.direction.incremental' },
    { value: 'decremental', labelKey: 'plan.direction.decremental' }
] as const;

export type HalaqaPeriod = typeof HALAQA_PERIODS[number]['value'];
export type HalaqaActivity = typeof HALAQA_ACTIVITIES[number]['value'];
export type HalaqaTeachingMethod = typeof HALAQA_TEACHING_METHODS[number]['value'];
export type PlanType = typeof PLAN_TYPES[number]['value'];
export type PlanUnit = typeof PLAN_UNITS[number]['value'];
export type PlanDirection = typeof PLAN_DIRECTIONS[number]['value'];

