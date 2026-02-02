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

export type HalaqaPeriod = typeof HALAQA_PERIODS[number]['value'];
export type HalaqaActivity = typeof HALAQA_ACTIVITIES[number]['value'];
export type HalaqaTeachingMethod = typeof HALAQA_TEACHING_METHODS[number]['value'];

