import React, { useCallback, useEffect, useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import Select from 'react-select';
import { useHalaqa, useUpdateHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { normalizeSessionTime } from '@/utils';
import { HALAQA_ACTIVITIES, HALAQA_EVALUATION_SYSTEM_TYPES, HALAQA_PERIODS, HALAQA_TEACHING_METHODS, HALAQA_WEEKLY_HOLIDAYS } from '../config';
import { updateHalaqaSchema } from '../schemas/halaqa.schema';
/**
 * Edit Halaqa Form Component
 * Same fields as create form; submits via PUT /halaqas/:id
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
            activities: [],
            weekly_holiday: [],
            evaluation_system_type: 'رقمي',
            custom_total_mark: undefined,
            max_students: undefined,
            session_time: '',
            platform_id: undefined,
            teaching_method: 'in_person'
        }
    });
    const teachingMethod = useWatch({ control, name: 'teaching_method' });
    const evaluationSystemType = useWatch({ control, name: 'evaluation_system_type' });
    const activities = useWatch({ control, name: 'activities' });
    const { teachersOptions, platformsOptions, autoIncludeActivities, isLoadingTeachers, isLoadingPlatforms } = useCreateHalaqaFormQueries({ includeStudents: false });
    useEffect(() => {
        if (teachingMethod === 'in_person')
            setValue('platform_id', undefined);
    }, [teachingMethod, setValue]);
    useEffect(() => {
        if (evaluationSystemType !== 'رقمي')
            setValue('custom_total_mark', undefined);
    }, [evaluationSystemType, setValue]);
    useEffect(() => {
        if (Array.isArray(activities) && activities.length > 0 && autoIncludeActivities.length > 0) {
            const hasHifz = activities.includes('hifz');
            if (!hasHifz)
                return;
            const toAdd = autoIncludeActivities.filter((a) => !activities.includes(a));
            if (toAdd.length > 0) {
                setValue('activities', [...activities, ...toAdd], { shouldValidate: true, shouldDirty: true, shouldTouch: false });
            }
        }
    }, [activities, autoIncludeActivities, setValue]);
    const periodOptions = useMemo(() => HALAQA_PERIODS.map((p) => ({ value: p.value, label: t(p.labelKey, p.value) })), [t]);
    const activityOptions = useMemo(() => HALAQA_ACTIVITIES.map((a) => ({ value: a.value, label: t(a.labelKey, a.value) })), [t]);
    const teachingMethodOptions = useMemo(() => HALAQA_TEACHING_METHODS.map((m) => ({ value: m.value, label: t(m.labelKey, m.value) })), [t]);
    const weeklyHolidayOptions = useMemo(() => HALAQA_WEEKLY_HOLIDAYS.map((day) => ({ value: day.value, label: t(day.labelKey, day.label) })), [t]);
    const evaluationSystemOptions = useMemo(() => HALAQA_EVALUATION_SYSTEM_TYPES.map((item) => ({ value: item.value, label: t(item.labelKey, item.label) })), [t]);
    const getErrorMessage = useCallback((message) => (message ? t(message, message) : undefined), [t]);
    const raw = data?.data;
    const halaqa = raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;
    useEffect(() => {
        if (!halaqa)
            return;
        const weeklyHoliday = typeof halaqa.weekly_holiday === 'string'
            ? halaqa.weekly_holiday.split(',').map((d) => d.trim()).filter(Boolean)
            : [];
        const evalType = halaqa.evaluation_system_type === 'رقمي' || halaqa.evaluation_system_type === 'مئوي'
            ? halaqa.evaluation_system_type
            : (halaqa.evaluation_system === 'رقمي' || halaqa.evaluation_system === 'مئوي' ? halaqa.evaluation_system : 'رقمي');
        const customTotalMark = halaqa.custom_total_mark != null
            ? halaqa.custom_total_mark
            : (evalType === 'رقمي' && halaqa.total_mark != null ? halaqa.total_mark : undefined);
        const sessionTime = halaqa.session_time || (halaqa.session_from && halaqa.session_to ? `${halaqa.session_from}-${halaqa.session_to}` : '');
        reset({
            name: { ar: halaqa.name?.ar || '', en: halaqa.name?.en || '' },
            teacher_id: halaqa.teacher?.id || halaqa.teacher_id || 0,
            period: halaqa.period || 'morning',
            activities: Array.isArray(halaqa.activities) ? halaqa.activities : [],
            weekly_holiday: weeklyHoliday,
            evaluation_system_type: evalType,
            custom_total_mark: customTotalMark,
            max_students: halaqa.max_students ?? undefined,
            session_time: normalizeSessionTime(sessionTime),
            platform_id: halaqa.platform?.id ?? halaqa.platform_id ?? undefined,
            teaching_method: halaqa.teaching_method || 'in_person'
        });
    }, [halaqa, reset]);
    const onSubmit = async (data) => {
        if (!id)
            return;
        const { platform_id, weekly_holiday, custom_total_mark, ...rest } = data;
        const payload = {
            ...rest,
            session_time: normalizeSessionTime(data.session_time),
            weekly_holiday: Array.isArray(weekly_holiday) && weekly_holiday.length > 0 ? weekly_holiday.join(',') : '',
            custom_total_mark: data.evaluation_system_type === 'رقمي' && typeof custom_total_mark === 'number' ? custom_total_mark : null,
            ...(data.teaching_method !== 'in_person' && platform_id ? { platform_id } : {})
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
                <SelectRFH name="weekly_holiday" control={control} label={t('halaqa.weeklyHoliday', 'Weekly holiday')} isMulti options={weeklyHolidayOptions} error={getErrorMessage(errors.weekly_holiday?.message)} placeholder={t('halaqa.selectWeeklyHoliday', 'Select weekly holidays')}/>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <FormSelect name="period" control={control} label={t('halaqa.period', 'Period')} required options={periodOptions} error={getErrorMessage(errors.period?.message)} className="w-full"/>
                <Controller name="activities" control={control} render={({ field, fieldState }) => {
            const handleChange = (selectedOptions) => {
                let selectedValues = [];
                if (selectedOptions) {
                    if (Array.isArray(selectedOptions)) {
                        selectedValues = selectedOptions.map((opt) => opt.value || opt.id);
                    }
                    else {
                        selectedValues = [selectedOptions.value || selectedOptions.id];
                    }
                }
                const hasHifz = selectedValues.includes('hifz');
                if (hasHifz && autoIncludeActivities.length > 0) {
                    const toAdd = autoIncludeActivities.filter((a) => !selectedValues.includes(a));
                    selectedValues = [...selectedValues, ...toAdd];
                }
                field.onChange(selectedValues);
            };
            const currentValue = field.value || [];
            const selectedOptions = Array.isArray(currentValue)
                ? currentValue.map(val => activityOptions.find(opt => opt.value === val)).filter(Boolean)
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
                                {Array.isArray(field.value) && field.value.includes('hifz') && autoIncludeActivities.length > 0 && (<p className="mt-1 text-xs text-blue-600">
                                        {t('halaqa.hifzRequiresTasbit', 'Note: Hifz automatically includes Tasbit')}
                                    </p>)}
                            </div>);
        }}/>
            </div>

            <div className={`grid grid-cols-1 gap-4 items-start ${evaluationSystemType === 'رقمي' ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
                <FormSelect name="evaluation_system_type" control={control} label={t('halaqa.evaluationSystemType', 'Evaluation system type')} required options={evaluationSystemOptions} error={getErrorMessage(errors.evaluation_system_type?.message)} placeholder={t('halaqa.selectEvaluationSystemType', 'Select evaluation system type')}/>
                {evaluationSystemType === 'رقمي' && (<FormInput name="custom_total_mark" control={control} label={t('halaqa.customTotalMark', 'Custom total mark')} required type="number" error={getErrorMessage(errors.custom_total_mark?.message)}/>)}
                <FormInput name="max_students" control={control} label={t('halaqa.maxStudents', 'Maximum students')} required type="number" error={getErrorMessage(errors.max_students?.message)}/>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('halaqa.sessionTime', 'Session Time')}
                    <span className="text-red-500 ms-1">*</span>
                </label>
                <Controller name="session_time" control={control} render={({ field, fieldState }) => {
            const match = (field.value || '').match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
            const startTime = match ? match[1] : '';
            const endTime = match ? match[2] : '';
            return (<div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[120px]">
                                    <input type="time" value={startTime} onChange={(e) => {
                    const start = e.target.value;
                    const end = endTime || start;
                    field.onChange(start ? `${start}-${end}` : '');
                }} onBlur={field.onBlur} className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-primary-600 transition-colors duration-200 ${fieldState.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`} aria-label={t('halaqa.sessionStartTime', 'Start time')}/>
                                    <span className="block text-xs text-gray-500 mt-0.5">{t('halaqa.sessionStartTime', 'Start time')}</span>
                                </div>
                                <span className="text-gray-400 font-medium pt-5">–</span>
                                <div className="flex-1 min-w-[120px]">
                                    <input type="time" step="60" value={endTime} onChange={(e) => {
                    const end = e.target.value;
                    const start = startTime || end;
                    field.onChange(end ? `${start}-${end}` : '');
                }} onBlur={field.onBlur} className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-primary-600 transition-colors duration-200 ${fieldState.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`} aria-label={t('halaqa.sessionEndTime', 'End time')}/>
                                    <span className="block text-xs text-gray-500 mt-0.5">{t('halaqa.sessionEndTime', 'End time')}</span>
                                </div>
                            </div>);
        }}/>
                {errors.session_time?.message && (<p className="mt-1 text-xs text-red-600">{getErrorMessage(errors.session_time.message)}</p>)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <div className={teachingMethod && teachingMethod !== 'in_person' ? '' : 'xl:col-span-2'}>
                    <FormSelect name="teaching_method" control={control} label={t('halaqa.teachingMethod', 'Teaching Method')} required options={teachingMethodOptions} error={getErrorMessage(errors.teaching_method?.message)}/>
                </div>
                {teachingMethod && teachingMethod !== 'in_person' && (<SelectRFH name="platform_id" control={control} label={t('halaqa.platform', 'Platform')} required options={platformsOptions} loading={isLoadingPlatforms} error={getErrorMessage(errors.platform_id?.message)} placeholder={t('halaqa.selectPlatform', 'Select a platform')}/>)}
            </div>

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
