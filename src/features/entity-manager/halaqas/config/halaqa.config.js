/**
 * Halaqa Configuration
 * Static options for Halaqa form with localization keys
 */
export const HALAQA_PERIODS = [
    { value: 'morning', labelKey: 'halaqa.period.morning' },
    { value: 'evening', labelKey: 'halaqa.period.evening' }
];
export const HALAQA_ACTIVITIES = [
    { value: 'hifz', labelKey: 'halaqa.activity.hifz' }, // Note: hifz must be the first activity for auto-include activities to work correctly
    { value: 'tasbit', labelKey: 'halaqa.activity.tasbit' },
    { value: 'murajaa', labelKey: 'halaqa.activity.murajaa' }
];
export const HALAQA_TEACHING_METHODS = [
    { value: 'in_person', labelKey: 'halaqa.teachingMethod.inPerson' },
    { value: 'remote', labelKey: 'halaqa.teachingMethod.remote' },
    { value: 'hybrid', labelKey: 'halaqa.teachingMethod.hybrid' }
];
export const HALAQA_WEEKLY_HOLIDAYS = [
    { value: 'الأحد', label: 'الأحد', labelKey: 'halaqa.weekdays.sunday' },
    { value: 'الاثنين', label: 'الاثنين', labelKey: 'halaqa.weekdays.monday' },
    { value: 'الثلاثاء', label: 'الثلاثاء', labelKey: 'halaqa.weekdays.tuesday' },
    { value: 'الأربعاء', label: 'الأربعاء', labelKey: 'halaqa.weekdays.wednesday' },
    { value: 'الخميس', label: 'الخميس', labelKey: 'halaqa.weekdays.thursday' },
    { value: 'الجمعة', label: 'الجمعة', labelKey: 'halaqa.weekdays.friday' },
    { value: 'السبت', label: 'السبت', labelKey: 'halaqa.weekdays.saturday' }
];
export const HALAQA_EVALUATION_SYSTEM_TYPES = [
    { value: 'رقمي', label: 'رقمي', labelKey: 'halaqa.evaluationSystemTypeOptions.numeric' },
    { value: 'مئوي', label: 'مئوي', labelKey: 'halaqa.evaluationSystemTypeOptions.percentage' }
];
export const PLAN_TYPES = [
    { value: 'daily_amount', labelKey: 'plan.type.dailyAmount' },
    { value: 'start_end', labelKey: 'plan.type.startEnd' }
];
export const PLAN_UNITS = [
    { value: 'segments', labelKey: 'plan.unit.segments' },
    { value: 'parts', labelKey: 'plan.unit.juz' }, // Display as "juz" to user, but API uses "parts"
    { value: 'surahs', labelKey: 'plan.unit.surahs' }
];
export const PLAN_DIRECTIONS = [
    { value: 'incremental', labelKey: 'plan.direction.incremental' },
    { value: 'decremental', labelKey: 'plan.direction.decremental' }
];
