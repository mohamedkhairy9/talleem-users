import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components';
import { BookOpenIcon, PlusIcon, XIcon } from '@/shared/icons';
import CreatePlanForm from './CreatePlanForm';
import HalaqaPlanCard from './HalaqaPlanCard';
const HalaqaPlansSection = ({ plans, halaqaId, students, activities, showPlanForm, onTogglePlanForm, onPlanFormSuccess, onViewPlanStudents, onEditStudentPlan, getPlanStudent, getLocalizedText }) => {
    const { t } = useTranslation();
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <BookOpenIcon width={20} height={20} className="text-indigo-600"/>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('plan.plans')}
                        {plans && plans.length > 0 && (<span className="ml-2 text-sm font-normal text-gray-500">({plans.length})</span>)}
                    </h2>
                </div>
                {!showPlanForm && (<Button type="button" variant="primary" size="sm" onClick={onTogglePlanForm}>
                        <PlusIcon width={16} height={16} className="me-2"/>
                        {t('plan.createPlan', 'Create Plan')}
                    </Button>)}
            </div>

            {showPlanForm && (<div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-primary-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('plan.createNewPlan', 'Create New Plan')}
                        </h3>
                        <button type="button" onClick={onTogglePlanForm} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors" aria-label={t('common.close')}>
                            <XIcon width={20} height={20}/>
                        </button>
                    </div>
                    <CreatePlanForm halaqaId={halaqaId} students={students} activities={activities} onSuccess={onPlanFormSuccess} onCancel={onTogglePlanForm}/>
                </div>)}

            {/* Display existing plans if available */}
            {plans && plans.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((plan, index) => {
                const planStudents = getPlanStudent(plan);
                return (<HalaqaPlanCard key={plan.id || index} plan={plan} planStudents={planStudents} onViewStudents={() => onViewPlanStudents(plan)} onEditStudentPlan={onEditStudentPlan} getLocalizedText={getLocalizedText}/>);
            })}
                </div>) : (<div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <BookOpenIcon width={32} height={32} className="text-gray-400"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('plan.noPlans', 'No plans created yet')}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t('plan.noPlansDescription', 'Create your first plan to get started')}</p>
                    {!showPlanForm && (<Button type="button" variant="primary" size="sm" onClick={onTogglePlanForm}>
                            <PlusIcon width={16} height={16} className="me-2"/>
                            {t('plan.createPlan', 'Create Plan')}
                        </Button>)}
                </div>)}
        </div>);
};
export default HalaqaPlansSection;
