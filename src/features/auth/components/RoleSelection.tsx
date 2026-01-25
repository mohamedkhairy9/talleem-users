import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserRoleType } from '../types/registration.types';
import { TeacherIcon, BriefcaseIcon } from '@/globals/icons';
import { Button } from '@/globals/components';

interface RoleSelectionProps {
    onSelectRole: (role: UserRoleType) => void;
    onCheckStatus: () => void;
}

/**
 * Role Selection Component
 * Displays 2 cards for user role selection (Teacher and Entity Manager)
 */
const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole, onCheckStatus }) => {
    const { t } = useTranslation();

    const roles: Array<{ type: UserRoleType; labelKey: string; icon: React.ReactNode }> = [
        { type: 1, labelKey: 'auth.role.teacher', icon: <TeacherIcon width={48} height={48} className="text-gray-700 group-hover:text-primary-600" /> },
        { type: 3, labelKey: 'auth.role.entityManager', icon: <BriefcaseIcon width={48} height={48} className="text-gray-700 group-hover:text-primary-600" /> }
    ];

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h3 className="text-lg text-gray-500 mb-2 font-medium">
                    {t('auth.select_role', 'Select Your Role')}
                </h3>
                <p className="text-sm text-gray-400">
                    {t('auth.select_role_description', 'Choose your role to continue with registration')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                    <button
                        key={role.type}
                        type="button"
                        onClick={() => onSelectRole(role.type)}
                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 text-center group"
                    >
                        <div className="flex justify-center mb-4">{role.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-700">
                            {t(role.labelKey, role.type === 1 ? 'Teacher' : 'Entity Manager')}
                        </h3>
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCheckStatus}
                    className="w-full md:w-auto"
                >
                    {t('auth.check_join_request_status', 'متابعة حالة طلب الانضمام')}
                </Button>
            </div>
        </div>
    );
};

export default RoleSelection;


