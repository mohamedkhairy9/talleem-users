import * as yup from 'yup';

/**
 * Create Halaqa Form Schema
 */
export const createHalaqaSchema = yup.object({
    name: yup.object({
        ar: yup.string().required('Arabic name is required'),
        en: yup.string().required('English name is required')
    }).required('Name is required'),
    teacher_id: yup.number().required('Teacher is required').positive(),
    period: yup.string().oneOf(['morning', 'evening'], 'Period must be morning or evening').required('Period is required'),
    start_date: yup.string().required('Start date is required'),
    end_date: yup.string().required('End date is required').test(
        'is-after-start',
        'End date must be after start date',
        function(value) {
            const { start_date } = this.parent;
            if (!start_date || !value) return true;
            return new Date(value) >= new Date(start_date);
        }
    ),
    activities: yup.array().of(yup.string().oneOf(['tasbit', 'hifz', 'murajaa'])).min(1, 'At least one activity is required').required('Activities are required'),
    student_ids: yup.array().of(yup.number()).min(1, 'At least one student is required').required('Students are required'),
    session_time: yup.string().required('Session time is required').matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Session time must be in format HH:MM-HH:MM'),
    platform_id: yup.number().required('Platform is required').positive(),
    teaching_method: yup.string().oneOf(['in_person', 'remote', 'hybrid'], 'Teaching method must be in_person, remote, or hybrid').required('Teaching method is required')
});

/**
 * Create Halaqa Form Data Type
 */
export interface CreateHalaqaFormData {
    name: {
        ar: string;
        en: string;
    };
    teacher_id: number;
    period: 'morning' | 'evening';
    start_date: string;
    end_date: string;
    activities: Array<'tasbit' | 'hifz' | 'murajaa'>;
    student_ids: number[];
    session_time: string;
    platform_id: number;
    teaching_method: 'in_person' | 'remote' | 'hybrid';
}

