import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '@/features/auth';
import { useFormWithValidation } from '@/shared/utils';
import * as yup from 'yup';
import { FormInput } from '@/shared/components';
import { ROUTE_PATHS } from '@/config';
import { useTranslation } from 'react-i18next';
import i18n, { DEFAULT_LANG } from '@/i18n';
/**
 * Login Form Schema
 */
const loginSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email address')
        .required('Email is required'),
    password: yup
        .string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required')
});
/**
 * Login Form Component
 */
const LoginForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginMutation = useLoginMutation();
    const { t } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { control, handleSubmit, formState: { errors } } = useFormWithValidation({
        schema: loginSchema,
        defaultValues: {
            email: '',
            password: ''
        }
    });
    const onSubmit = async (data) => {
        loginMutation.mutate(data, {
            onSuccess: () => {
                // Redirect to the page user was trying to access, or dashboard
                const from = location.state?.from?.pathname;
                if (from) {
                    navigate(from, { replace: true });
                }
                else {
                    // Redirect to default language dashboard
                    const defaultLang = i18n.language || DEFAULT_LANG;
                    navigate(`/${defaultLang}`, { replace: true });
                }
            }
        });
    };
    return (<form dir={isRtl ? 'rtl' : 'ltr'} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput name="email" control={control} label={t('auth.email.label', 'Email')} type="email" required error={errors.email?.message}/>

            <FormInput name="password" control={control} label={t('auth.password.label', 'Password')} type="password" required error={errors.password?.message}/>

            {loginMutation.error && (<div className="text-red-600 text-sm">
                    {loginMutation.error.message || t('auth.login_failed', 'Login failed. Please try again.')}
                </div>)}

            <button type="submit" disabled={loginMutation.isPending} className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${loginMutation.isPending
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700'} text-white`}>
                {loginMutation.isPending ? (<div className="flex items-center gap-4 justify-center">
                        {t('common.loading', 'Loading...')}
                    </div>) : (t('auth.login', 'Login'))}
            </button>

            <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-gray-600">
                    {t('auth.no_account', "Don't have an account?")}{' '}
                    <button type="button" onClick={() => {
            const currentLang = window.location.pathname.split('/')[1] || DEFAULT_LANG;
            navigate(`/${currentLang}/${ROUTE_PATHS.REGISTER}`);
        }} className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                        {t('auth.join_now', 'Join Now')}
                    </button>
                </p>
                <p className="text-sm text-gray-600">
                    {t('auth.check_join_status_hint', 'Need to check your join request status?')}{' '}
                    <button type="button" onClick={() => {
            const currentLang = window.location.pathname.split('/')[1] || DEFAULT_LANG;
            navigate(`/${currentLang}/${ROUTE_PATHS.REGISTER}?checkStatus=1`);
        }} className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                        {t('auth.check_join_status_click_here', 'Click here')}
                    </button>
                </p>
            </div>
        </form>);
};
export default LoginForm;
