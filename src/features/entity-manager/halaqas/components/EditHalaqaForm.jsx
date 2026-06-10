import React, { useCallback, useEffect, useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useFormWithValidation, normalizeDate, getGregorianDate } from '@/shared/utils';
import { FormInput, FormSelect, Button } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { useHalaqa, useUpdateHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { HALAQA_ACTIVITIES, HALAQA_PERIODS } from '../config';
import { updateHalaqaSchema } from '../schemas/halaqa.schema';
import { generateOptions } from '../utils/formOptionsUtils';

const REQUIRED_HIFZ_ACTIVITIES = ['tasbit'];

function mergeOptions(primary = [], fallback = []) {
    const map = new Map();
    [...primary, ...fallback].forEach((option) => {
        const value = option?.value ?? option?.id;
        if (value == null || map.has(value))
            return;
        map.set(value, option);
    });
    return Array.from(map.values());
}

/**
 * Edit Halaqa Form Component
 * Matches PUT /halaqas/:id payload:
 * { name, teacher_id, period, start_date, end_date, activities, student_ids }
 */
const EditHalaqaForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams();
    const queryClient = useQueryClient();
    const updateHalaqaMutation = useUpdateHalaqa();
    const { data, isLoading: isLoadingHalaqa, error: halaqaError } = useHalaqa(id || '');
    const { control, handleSubmit, formState: { errors }, setValue, reset } = useFormWithValidation({
        schema: updateHalaqaSchema,
        defaultValues: {
            name: { ar: '', en: '' },
            teacher_id: 0,
            period: 'morning',
            start_date: '',
            end_date: '',
            activities: [],
            student_ids: []
        }
    });
    const activities = useWatch({ control, name: 'activities' });
    const { teachersOptions: fetchedTeachersOptions, studentsOptions: fetchedStudentsOptions, isLoadingTeachers, isLoadingStudents } = useCreateHalaqaFormQueries();

    useEffect(() => {
        if (Array.isArray(activities) && activities.length > 0 && REQUIRED_HIFZ_ACTIVITIES.length > 0) {
            const hasHifz = activities.includes('hifz');
            if (!hasHifz)
                return;
            const toAdd = REQUIRED_HIFZ_ACTIVITIES.filter((activity) => !activities.includes(activity));
            if (toAdd.length > 0) {
                setValue('activities', [...activities, ...toAdd], {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: false
                });
            }
        }
    }, [activities, setValue]);

    const periodOptions = useMemo(() => HALAQA_PERIODS.map((period) => ({
        value: period.value,
        label: t(period.labelKey, period.value)
    })), [t]);
    const activityOptions = useMemo(() => HALAQA_ACTIVITIES.map((activity) => ({
        value: activity.value,
        label: t(activity.labelKey, activity.value)
    })), [t]);
    const getErrorMessage = useCallback((message) => (message ? t(message, message) : undefined), [t]);

    const raw = data;
    const halaqa = raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;
    
    const teacherFallbackOptions = useMemo(() => {
        if (!halaqa?.teacher?.id)
            return [];
        return generateOptions([{
            id: halaqa.teacher.id,
            name: halaqa.teacher.name
        }]);
    }, [halaqa?.teacher]);

    const studentsFallbackOptions = useMemo(() => {
        if (!Array.isArray(halaqa?.students) || halaqa.students.length === 0)
            return [];
        return generateOptions(halaqa.students.map((student) => ({
            id: student.id,
            name: student.name
        })));
    }, [halaqa?.students]);

    const teachersOptions = useMemo(() => mergeOptions(fetchedTeachersOptions, teacherFallbackOptions), [fetchedTeachersOptions, teacherFallbackOptions]);
    const studentsOptions = useMemo(() => mergeOptions(fetchedStudentsOptions, studentsFallbackOptions), [fetchedStudentsOptions, studentsFallbackOptions]);

    useEffect(() => {
        if (!halaqa)
            return;

        const studentIds = Array.isArray(halaqa.students)
            ? halaqa.students.map((student) => student.id).filter(Boolean)
            : Array.isArray(halaqa.student_ids)
                ? halaqa.student_ids.filter(Boolean)
                : [];

        reset({
            name: {
                ar: halaqa?.name?.ar ?? (typeof halaqa?.name === 'string' ? halaqa.name : ''),
                en: halaqa?.name?.en ?? (typeof halaqa?.name === 'string' ? halaqa.name : '')
            },
            teacher_id: halaqa.teacher?.id || halaqa.teacher_id || 0,
            period: halaqa.period || 'morning',
            start_date: normalizeDate(getGregorianDate(halaqa.start_date ?? halaqa.date?.from)),
            end_date: normalizeDate(getGregorianDate(halaqa.end_date ?? halaqa.date?.to)),
            activities: Array.isArray(halaqa.activities) ? halaqa.activities : [],
            student_ids: studentIds
        });
    }, [halaqa, reset]);

    const onSubmit = async (formData) => {
        if (!id)
            return;

        const payload = {
            name: formData.name,
            teacher_id: formData.teacher_id,
            period: formData.period,
            start_date: normalizeDate(formData.start_date),
            end_date: normalizeDate(formData.end_date),
            activities: formData.activities,
            student_ids: formData.student_ids
        };

        updateHalaqaMutation.mutate({ id, data: payload }, {
            onSuccess: () => {
                toast.success(t('halaqa.updateSuccess', 'Halaqa updated successfully'));
                queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                queryClient.invalidateQueries({ queryKey: ['halaqa', id] });
                navigate(`/${lang || 'ar'}/halaqas/${id}`);
            },
            onError: (error) => {
                toast.error(error?.message || t('halaqa.updateError', 'Error updating halaqa. Please try again.'));
            }
        });
    };

    if (isLoadingHalaqa) {
        return (<div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>);
    }

    if (halaqaError || !halaqa) {
        return (<div className="text-center py-12 text-red-600">
                {t('halaqa.notFound', 'Halaqa not found')}
            </div>);
    }

    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="name.en" control={control} label={t('halaqa.nameEn', 'Name (English)')} required error={getErrorMessage(errors.name?.en?.message)}/>
                <FormInput name="name.ar" control={control} label={t('halaqa.nameAr', 'Name (Arabic)')} required error={getErrorMessage(errors.name?.ar?.message)}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <SelectRFH name="teacher_id" control={control} label={t('halaqa.teacher', 'Teacher')} required options={teachersOptions} loading={isLoadingTeachers} error={getErrorMessage(errors.teacher_id?.message)} placeholder={t('halaqa.selectTeacher', 'Select a teacher')}/>
                <FormSelect name="period" control={control} label={t('halaqa.period', 'Period')} required options={periodOptions} error={getErrorMessage(errors.period?.message)} className="w-full"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="start_date" control={control} label={t('halaqa.startDate', 'Start Date')} required type="date" error={getErrorMessage(errors.start_date?.message)}/>
                <FormInput name="end_date" control={control} label={t('halaqa.endDate', 'End Date')} required type="date" error={getErrorMessage(errors.end_date?.message)}/>
            </div>

            <Controller name="activities" control={control} render={({ field, fieldState }) => {
            const handleChange = (selectedOptions) => {
                let selectedValues = [];
                if (selectedOptions) {
                    if (Array.isArray(selectedOptions)) {
                        selectedValues = selectedOptions.map((option) => option.value || option.id);
                    }
                    else {
                        selectedValues = [selectedOptions.value || selectedOptions.id];
                    }
                }
                const hasHifz = selectedValues.includes('hifz');
                if (hasHifz && REQUIRED_HIFZ_ACTIVITIES.length > 0) {
                    const toAdd = REQUIRED_HIFZ_ACTIVITIES.filter((activity) => !selectedValues.includes(activity));
                    selectedValues = [...selectedValues, ...toAdd];
                }
                field.onChange(selectedValues);
            };
            const currentValue = field.value || [];
            const selectedOptions = Array.isArray(currentValue)
                ? currentValue.map((value) => activityOptions.find((option) => option.value === value)).filter(Boolean)
                : [];
            return (<div>
                            <label htmlFor="activities" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('halaqa.activities', 'Activities')}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Select isMulti value={selectedOptions} options={activityOptions} onChange={handleChange} onBlur={field.onBlur} name={field.name} placeholder={t('halaqa.selectActivities', 'Select activities')} className="react-select w-full" classNamePrefix="react-select" menuPortalTarget={document.body} menuPosition="fixed" getOptionValue={(option) => String(option.value ?? option.id ?? '')} getOptionLabel={(option) => option.label ?? option.name ?? ''} styles={{
                    control: (base, state) => ({
                        ...base,
                        borderColor: fieldState.error ? '#ef4444' : state.isFocused ? '#004247' : '#d1d5db',
                        boxShadow: state.isFocused ? (fieldState.error ? '0 0 0 1px #ef4444' : '0 0 0 1px #004247') : 'none',
                        minHeight: '48px',
                        '&:hover': { borderColor: fieldState.error ? '#ef4444' : '#004247' }
                    }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#004247' : state.isFocused ? '#f0f9fa' : 'white',
                        color: state.isSelected ? 'white' : '#374151',
                        cursor: 'pointer',
                        '&:active': { backgroundColor: '#004247', color: 'white' }
                    })
                }}/>
                            <p className="mt-1 h-4 text-xs text-red-600" role="alert">
                                {getErrorMessage((fieldState.error?.message || errors.activities?.message) ?? '') ?? ''}
                            </p>
                            {Array.isArray(field.value) && field.value.includes('hifz') && REQUIRED_HIFZ_ACTIVITIES.length > 0 && (<p className="mt-1 text-xs text-blue-600">
                                    {t('halaqa.hifzRequiresTasbit', 'Note: Hifz automatically includes Tasbit')}
                                </p>)}
                        </div>);
        }}/>

            <SelectRFH name="student_ids" control={control} label={t('plan.students', 'Students')} required isMulti options={studentsOptions} loading={isLoadingStudents} error={getErrorMessage(errors.student_ids?.message)} placeholder={t('plan.selectStudents', 'Select one or more students')}/>

            {updateHalaqaMutation.error && (<div className="text-red-600 text-sm">
                    {updateHalaqaMutation.error.message || t('halaqa.updateError', 'Error updating halaqa. Please try again.')}
                </div>)}

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(`/${lang || 'ar'}/halaqas/${id}`)}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="submit" variant="primary" loading={updateHalaqaMutation.isPending} disabled={updateHalaqaMutation.isPending}>
                    {updateHalaqaMutation.isPending ? t('common.loading', 'Loading...') : t('halaqa.update', 'Update Halaqa')}
                </Button>
            </div>
        </form>);
};

export default EditHalaqaForm;
