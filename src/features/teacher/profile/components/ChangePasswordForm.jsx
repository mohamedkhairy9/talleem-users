import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useChangePasswordMutation } from '@/features/auth';
import { Button, Input } from '@/shared/components';
const ChangePasswordForm = ({ onSuccess }) => {
    const { t } = useTranslation();
    const changePassword = useChangePasswordMutation();
    const { register, handleSubmit, watch, reset, setError, formState: { errors } } = useForm({
        defaultValues: { new_password: '', new_password_confirmation: '' }
    });
    const newPassword = watch('new_password');
    const onSubmit = (data) => {
        changePassword.mutate(data, {
            onSuccess: () => {
                reset({ new_password: '', new_password_confirmation: '' });
                onSuccess?.();
            },
            onError: (err) => {
                const msg = err?.response?.data?.message ?? err?.message ?? t('profile.changePassword.error', 'Failed to change password.');
                setError('root', { type: 'manual', message: msg });
            }
        });
    };
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register('new_password', {
        required: t('validation.required', 'This field is required'),
        minLength: { value: 6, message: t('validation.minLength', { min: 6 }) }
    })} type="password" label={t('profile.changePassword.newPassword', 'New password')} required error={errors.new_password?.message} autoComplete="new-password"/>
            <Input {...register('new_password_confirmation', {
        required: t('validation.required', 'This field is required'),
        validate: (v) => v === newPassword || t('profile.changePassword.mismatch', 'Passwords do not match')
    })} type="password" label={t('profile.changePassword.confirmPassword', 'Confirm new password')} required error={errors.new_password_confirmation?.message} autoComplete="new-password"/>
            {errors.root?.message && (<p className="text-sm text-red-600">{errors.root.message}</p>)}
            <Button type="submit" variant="primary" loading={changePassword.isPending}>
                {t('profile.changePassword.submit', 'Change password')}
            </Button>
        </form>);
};
export default ChangePasswordForm;
