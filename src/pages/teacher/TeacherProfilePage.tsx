import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import { useAuthStore } from '@/stores';
import { useLocale } from '@/utils';
import { getLocalizedName } from '@/features/teacher/profile/utils/getLocalizedName';
import ChangePasswordForm from '@/features/teacher/profile/components/ChangePasswordForm';

/** Bilingual name from API */
interface BilingualLike {
    en?: string;
    ar?: string;
}

/** Nested object with optional name (entity, branch, city, etc.) */
interface WithName {
    name?: BilingualLike;
}

/** Stored teacher from login response */
interface StoredTeacher {
    phone?: string;
    entity?: WithName;
    branch?: WithName;
    main_program?: WithName;
    nationality?: WithName;
    academic_qualification?: WithName;
    major?: WithName;
    years_of_experience?: number;
    memorization_amount?: string;
    national_id?: string;
    address?: string;
    city?: WithName;
    license?: { license_number?: string };
}

/**
 * Teacher Profile Page
 * Renders user and teacher data from the stored login response (no API call).
 */
const TeacherProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { currentLocale } = useLocale();
    const user = useAuthStore(state => state.user);
    const teacher = useAuthStore(state => state.teacher) as StoredTeacher | null;

    const getName = (name: BilingualLike | undefined) =>
        getLocalizedName(name, currentLocale);

    const str = (v: unknown): string => {
        if (v == null) return '—';
        if (typeof v === 'string') return v;
        return String(v);
    };

    if (!user) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {t('profile.loadError', 'Failed to load profile.')}
            </div>
        );
    }

    const userDisplayName: string = typeof user.name === 'object'
        ? getName(user.name as BilingualLike)
        : str(user.name ?? user.email);

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('profile.title', 'My Profile')}
                subtitle={t('profile.subtitle', 'View your account and change password')}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Main data: entity, branch, program, user info */}
                <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('profile.mainData', 'Main data')}
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <InfoRow label={t('profile.name', 'Name')} value={userDisplayName} />
                        <InfoRow label={t('auth.email.label', 'Email')} value={str(user.email)} />
                        <InfoRow label={t('profile.phone', 'Phone')} value={str(user.phone ?? teacher?.phone)} />
                        <InfoRow
                            label={t('profile.entity', 'Entity')}
                            value={user.entity ? getName(user.entity.name as BilingualLike) : (teacher?.entity ? getName(teacher.entity.name) : '—')}
                        />
                        <InfoRow
                            label={t('profile.branch', 'Branch')}
                            value={user.branch ? getName(user.branch.name as BilingualLike) : (teacher?.branch ? getName(teacher.branch.name) : '—')}
                        />
                        <InfoRow
                            label={t('profile.mainProgram', 'Main program')}
                            value={user.entity?.main_program ? getName(user.entity.main_program.name as BilingualLike) : (teacher?.main_program ? getName(teacher.main_program.name) : '—')}
                        />
                        {teacher && (
                            <>
                                <InfoRow
                                    label={t('profile.nationality', 'Nationality')}
                                    value={teacher.nationality ? getName(teacher.nationality.name) : '—'}
                                />
                                <InfoRow
                                    label={t('profile.academicQualification', 'Academic qualification')}
                                    value={teacher.academic_qualification ? getName(teacher.academic_qualification.name) : '—'}
                                />
                                <InfoRow
                                    label={t('profile.major', 'Major')}
                                    value={teacher.major ? getName(teacher.major.name) : '—'}
                                />
                                <InfoRow
                                    label={t('profile.yearsOfExperience', 'Years of experience')}
                                    value={teacher.years_of_experience != null ? String(teacher.years_of_experience) : '—'}
                                />
                                <InfoRow
                                    label={t('profile.memorizationAmount', 'Memorization amount')}
                                    value={teacher.memorization_amount ?? '—'}
                                />
                                <InfoRow
                                    label={t('profile.nationalId', 'National ID')}
                                    value={teacher.national_id ?? '—'}
                                />
                                <InfoRow
                                    label={t('profile.address', 'Address')}
                                    value={teacher.address ?? '—'}
                                />
                                <InfoRow
                                    label={t('profile.city', 'City')}
                                    value={teacher.city ? getName(teacher.city.name) : '—'}
                                />
                                {teacher.license && (
                                    <InfoRow
                                        label={t('profile.licenseNumber', 'License number')}
                                        value={teacher.license.license_number ?? '—'}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Change password */}
                <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('profile.changePassword.title', 'Change password')}
                        </h2>
                    </div>
                    <div className="p-4">
                        <ChangePasswordForm
                            onSuccess={() => {
                                // Optional: toast or message
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{value || '—'}</dd>
        </div>
    );
}

export default TeacherProfilePage;
