import React from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Button, FormInput, FormSelect, FormTextarea, FormFile } from '@/globals/components';
import { XIcon } from '@/globals/icons';
import { useFormWithValidation } from '@/utils';
import { useCreateTeacherLeave } from '../hooks/useTeacherLeaves';
import type { CreateLeavePayload } from '../types/teacher-leaves.types';
import { createLeaveFormSchema, type CreateLeaveFormData } from '../schemas/createLeave.schema';
import { getErrorMessage } from '@/utils/helpers/errorHandler';
import { LEAVE_SUB_TYPES } from '../config/table.config';

interface CreateLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateLeaveModal: React.FC<CreateLeaveModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormWithValidation<CreateLeaveFormData>({
        schema: createLeaveFormSchema,
        defaultValues: {
            leave_type: 'leave',
            leave_sub_type: 'sick',
            from_date: '',
            to_date: '',
            medical_report: null,
            date: '',
            from_time: '09:00',
            to_time: '17:00',
            notes: ''
        }
    });

    const createMutation = useCreateTeacherLeave();
    const leaveType = useWatch({ control, name: 'leave_type' });
    const leaveSubType = useWatch({ control, name: 'leave_sub_type' });

    const resetForm = () => {
        reset({
            leave_type: 'leave',
            leave_sub_type: 'sick',
            from_date: '',
            to_date: '',
            medical_report: null,
            date: '',
            from_time: '09:00',
            to_time: '17:00',
            notes: ''
        });
    };

    const handleClose = () => {
        if (!createMutation.isPending) {
            resetForm();
            onClose();
        }
    };

    const getValidationError = (message?: string) =>
        message ? t(`leaves.validation.${message}`, message) : undefined;

    const onSubmit = (data: CreateLeaveFormData) => {
        let payload: CreateLeavePayload;
        if (data.leave_type === 'leave') {
            const file = data.medical_report instanceof File ? data.medical_report : null;
            payload = {
                leave_type: 'leave',
                leave_sub_type: data.leave_sub_type!,
                from_date: data.from_date!,
                to_date: data.to_date!,
                notes: (data.notes ?? '').trim() || '',
                medical_report: file ? [file] : undefined
            };
        } else {
            payload = {
                leave_type: 'pto',
                date: data.date!,
                from_time: data.from_time!,
                to_time: data.to_time!,
                notes: (data.notes ?? '').trim() || ''
            };
        }
        createMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('leaves.createSuccess', 'Leave request submitted.'));
                onSuccess();
                handleClose();
            },
            onError: (err) => toast.error(getErrorMessage(err))
        });
    };

    if (!isOpen) return null;

    const leaveSubTypeOptions = LEAVE_SUB_TYPES.map((opt) => ({
        value: opt.key,
        label: t(opt.labelKey, opt.key)
    }));

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={handleClose} />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl z-10">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('leaves.createLeave', 'Create Leave Request')}
                        </h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label={t('common.closeAria')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                        {/* Leave type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('leaves.leaveType', 'Type')} <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                name="leave_type"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex gap-4">
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={field.value === 'leave'}
                                                onChange={() => field.onChange('leave')}
                                                onBlur={field.onBlur}
                                                className="text-primary-600"
                                            />
                                            <span>{t('leaves.type.leave', 'Leave')}</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={field.value === 'pto'}
                                                onChange={() => field.onChange('pto')}
                                                onBlur={field.onBlur}
                                                className="text-primary-600"
                                            />
                                            <span>{t('leaves.type.pto', 'PTO (Hourly)')}</span>
                                        </label>
                                    </div>
                                )}
                            />
                        </div>

                        {leaveType === 'leave' && (
                            <>
                                <FormSelect<CreateLeaveFormData>
                                    name="leave_sub_type"
                                    control={control}
                                    label={t('leaves.subType', 'Sub type')}
                                    required
                                    options={leaveSubTypeOptions}
                                    error={getValidationError(errors.leave_sub_type?.message)}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput<CreateLeaveFormData>
                                        name="from_date"
                                        control={control}
                                        type="date"
                                        label={t('leaves.fromDate', 'From date')}
                                        required
                                        error={getValidationError(errors.from_date?.message)}
                                    />
                                    <FormInput<CreateLeaveFormData>
                                        name="to_date"
                                        control={control}
                                        type="date"
                                        label={t('leaves.toDate', 'To date')}
                                        required
                                        error={getValidationError(errors.to_date?.message)}
                                    />
                                </div>
                                {leaveSubType === 'sick' && <FormFile<CreateLeaveFormData>
                                    name="medical_report"
                                    control={control}
                                    label={t('leaves.medicalReport', 'Medical report')}
                                    required={leaveSubType === 'sick'}
                                    accept="image/*,.pdf"
                                    error={getValidationError(errors.medical_report?.message)}
                                />
                                }
                            </>
                        )}

                        {leaveType === 'pto' && (
                            <>
                                <FormInput<CreateLeaveFormData>
                                    name="date"
                                    control={control}
                                    type="date"
                                    label={t('leaves.date', 'Date')}
                                    required
                                    error={getValidationError(errors.date?.message)}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput<CreateLeaveFormData>
                                        name="from_time"
                                        control={control}
                                        type="time"
                                        label={t('leaves.fromTime', 'From time')}
                                        required
                                        error={getValidationError(errors.from_time?.message)}
                                    />
                                    <FormInput<CreateLeaveFormData>
                                        name="to_time"
                                        control={control}
                                        type="time"
                                        label={t('leaves.toTime', 'To time')}
                                        required
                                        error={getValidationError(errors.to_time?.message)}
                                    />
                                </div>
                            </>
                        )}

                        <FormTextarea<CreateLeaveFormData>
                            name="notes"
                            control={control}
                            label={t('leaves.notes', 'Notes')}
                            placeholder={t('leaves.notesPlaceholder', 'Optional notes')}
                            rows={2}
                        />

                        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={createMutation.isPending}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" variant="primary" loading={createMutation.isPending}>
                                {t('leaves.submit', 'Submit')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateLeaveModal;
