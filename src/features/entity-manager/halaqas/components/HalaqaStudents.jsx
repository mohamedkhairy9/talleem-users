import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormattedDate } from '@/globals/components/ui';
import { UsersIcon, UserIcon } from '@/globals/icons';
const HalaqaStudents = ({ students, onViewAll, onViewStudent, getLocalizedText }) => {
    const { t } = useTranslation();
    if (!students || students.length === 0)
        return null;
    const displayStudents = students.slice(0, 6);
    const hasMore = students.length > 6;
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <UsersIcon width={20} height={20} className="text-green-600"/>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('halaqa.students', 'Students')}
                        <span className="ml-2 text-sm font-normal text-gray-500">({students.length})</span>
                    </h2>
                </div>
                <button type="button" onClick={onViewAll} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    {t('halaqa.viewAll', 'View All')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayStudents.map((student, index) => (<div key={student.id || index} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer" onClick={() => onViewStudent(student)}>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <UserIcon width={20} height={20} className="text-primary-600"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {getLocalizedText(student.name) || t('plan.studentId', { id: student.id })}
                                </p>
                                {student.joined_at && (<p className="text-xs text-gray-500 mt-0.5">
                                        {t('halaqa.joinedAt', 'Joined')}: <FormattedDate value={student.joined_at}/>
                                    </p>)}
                            </div>
                        </div>
                    </div>))}
            </div>
            {hasMore && (<div className="mt-4 text-center">
                    <button type="button" onClick={onViewAll} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        {String(t('halaqa.viewMoreStudents', 'View {{count}} more students', { count: students.length - 6 }))}
                    </button>
                </div>)}
        </div>);
};
export default HalaqaStudents;
