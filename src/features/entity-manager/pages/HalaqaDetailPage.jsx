import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useHalaqa } from '@/features/entity-manager/halaqas/hooks/useHalaqas';
import { PageHeader, Button } from '@/shared/components';
import PlanStudentsModal from '@/features/entity-manager/halaqas/components/PlanStudentsModal';
import HalaqaQuickStats from '@/features/entity-manager/halaqas/components/HalaqaQuickStats';
import { CalendarIcon, CircleIcon, AlertTriangleIcon, XIcon } from '@/shared/icons';
import HalaqaBasicInfo from '@/features/entity-manager/halaqas/components/HalaqaBasicInfo';
import HalaqaDatesSchedule from '@/features/entity-manager/halaqas/components/HalaqaDatesSchedule';
import HalaqaActivities from '@/features/entity-manager/halaqas/components/HalaqaActivities';
import HalaqaStudents from '@/features/entity-manager/halaqas/components/HalaqaStudents';
import HalaqaAdditionalInfo from '@/features/entity-manager/halaqas/components/HalaqaAdditionalInfo';
import HalaqaPlansSection from '@/features/entity-manager/halaqas/components/HalaqaPlansSection';
import EditStudentPlanModal from '@/features/entity-manager/halaqas/components/EditStudentPlanModal';
/**
 * Halaqa Detail Page
 * Displays detailed information about a specific halaqa
 */
const HalaqaDetailPage = () => {
    const { t, i18n } = useTranslation();
    const { id, lang } = useParams();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'ar';
    const [showPlanForm, setShowPlanForm] = useState(false);
    const { data, isLoading, error } = useHalaqa(id || '');
    const [selectedPlanStudents, setSelectedPlanStudents] = useState([]);
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
    const [showMissingPlansModal, setShowMissingPlansModal] = useState(false);
    const [studentPlanToEdit, setStudentPlanToEdit] = useState(null);
    const plansSectionRef = useRef(null);
    // API returns { data: { id, name, ... } }; axios puts body in response.data
    const raw = data;
    const halaqa = raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;
    const studentsWithMissingPlans = halaqa?.students_with_missing_plans ?? [];
    useEffect(() => {
        console.log('Halaqa detail page debug:', {
            routeId: id || null,
            lang: lang || currentLang,
            isLoading,
            hasData: !!halaqa,
            meetingLink: halaqa?.meeting_link ?? halaqa?.platform_link ?? null,
            error: error ?? null
        });
    }, [id, lang, currentLang, isLoading, halaqa, error]);
    // When halaqa has students_with_missing_plans, show warning modal once
    useEffect(() => {
        if (halaqa && studentsWithMissingPlans.length > 0) {
            setShowMissingPlansModal(true);
        }
    }, [halaqa?.id, studentsWithMissingPlans.length]);
    const getLocalizedText = (obj) => {
        if (typeof obj === 'string')
            return obj;
        if (obj && currentLang === 'ar' && obj.ar)
            return obj.ar;
        if (obj && obj.en)
            return obj.en;
        return t('common.not_available', 'N/A');
    };
    const handleBack = () => {
        navigate(`/${lang || currentLang}/halaqas`);
    };
    // const handleEdit = () => {
    //     console.log('Edit halaqa button clicked:', {
    //         id,
    //         halaqa
    //     });
    //     navigate(`/${lang || currentLang}/halaqas/${id}/edit`);
    // };
    // Create a map of student IDs to student objects for quick lookup
    const studentsMap = useMemo(() => {
        if (!halaqa?.students)
            return new Map();
        const map = new Map();
        halaqa.students.forEach((student) => {
            map.set(student.id, student);
        });
        return map;
    }, [halaqa?.students]);
    // Get student(s) for a plan
    const getPlanStudent = (plan) => {
        // If plan has students array directly, use it
        if (plan.students && Array.isArray(plan.students) && plan.students.length > 0) {
            return plan.students;
        }
        // If plan has a single student object, wrap it in an array
        if (plan.student) {
            return [plan.student];
        }
        // If plan has student_id, find it in halaqa students array
        if (plan.student_id && studentsMap.has(plan.student_id)) {
            return [studentsMap.get(plan.student_id)];
        }
        // If plan has student_id but not found in students, create a placeholder
        if (plan.student_id) {
            return [{ id: plan.student_id }];
        }
        // If no student info, return empty array
        return [];
    };
    const handleShowPlanStudents = (plan) => {
        const planStudents = getPlanStudent(plan);
        if (planStudents.length > 0) {
            setSelectedPlanStudents(planStudents);
            setIsStudentsModalOpen(true);
        }
    };
    const handleViewAllStudents = () => {
        setSelectedPlanStudents(halaqa?.students || []);
        setIsStudentsModalOpen(true);
    };
    const handleViewStudent = (student) => {
        setSelectedPlanStudents([student]);
        setIsStudentsModalOpen(true);
    };
    const handleCloseMissingPlansModalAndScrollToPlans = () => {
        setShowMissingPlansModal(false);
        setShowPlanForm(true);
        setTimeout(() => {
            plansSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };
    const handleEditStudentPlan = (plan, student) => {
        if (!student?.id) {
            return;
        }
        setStudentPlanToEdit({ plan, student });
    };
    // Prepare badges for header - MUST be before early returns to maintain hook order
    const headerBadges = useMemo(() => {
        if (!halaqa)
            return [];
        const badges = [];
        if (halaqa.memorization_program_entity_type?.name) {
            badges.push({
                key: 'entity-type',
                label: getLocalizedText(halaqa.memorization_program_entity_type.name),
                icon: <CircleIcon width={16} height={16} />
            });
        }
        if (halaqa.period) {
            badges.push({
                key: 'period',
                label: String(t(`halaqa.period.${halaqa.period}`, halaqa.period)),
                icon: <CalendarIcon width={16} height={16} />
            });
        }
        return badges;
    }, [halaqa?.memorization_program_entity_type?.name, halaqa?.period, currentLang, t, getLocalizedText]);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                <p className="text-gray-600 text-sm">{t('common.loading')}</p>
            </div>
        </div>);
    }
    if (error || !halaqa) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
                <AlertTriangleIcon width={64} height={64} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('halaqa.notFound')}</h2>
                <p className="text-gray-600">{t('halaqa.notFoundDescription')}</p>
            </div>
            <Button type="button" variant="primary" onClick={handleBack}>
                {t('halaqa.backToHalaqas')}
            </Button>
        </div>);
    }
    // Calculate stats
    const studentCount = halaqa.current_students_count ?? halaqa.students?.length ?? 0;
    const maxStudents = halaqa.max_students ?? 0;
    return (<div className="space-y-6 ">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <PageHeader title={getLocalizedText(halaqa.name)} breadcrumb={{
                label: t('halaqa.backToHalaqas'),
                onClick: handleBack
            }} badges={headerBadges}
                // actions={[
                //     {
                //         label: t('common.edit'),
                //         onClick: handleEdit,
                //         variant: 'primary',
                //         icon: <EditIcon width={16} height={16} className="me-2" />
                //     }
                // ]}
                actions={[]} />
            <HalaqaQuickStats studentCount={studentCount} maxStudents={maxStudents} plansCount={halaqa.plans?.length ?? 0} durationInDays={halaqa.duration_in_days} activitiesCount={halaqa.activities?.length ?? 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Information */}
            <div className="lg:col-span-2 space-y-6">
                <HalaqaBasicInfo name={getLocalizedText(halaqa.name)} teacher={halaqa.teacher?.name} entityType={halaqa.memorization_program_entity_type?.name} period={halaqa.period} teachingMethod={halaqa.teaching_method} platform={halaqa.platform?.name} getLocalizedText={getLocalizedText} />

                {halaqa.students && halaqa.students.length > 0 && (<HalaqaStudents students={halaqa.students} onViewAll={handleViewAllStudents} onViewStudent={handleViewStudent} getLocalizedText={getLocalizedText} />)}
            </div>

            {/* Right Column - Additional Info */}
            <div className="space-y-6">
                <HalaqaAdditionalInfo durationInDays={halaqa.duration_in_days} weeklyHoliday={halaqa.weekly_holiday} evaluationSystem={halaqa.evaluation_system} totalMark={halaqa.total_mark} />

                {halaqa.activities && halaqa.activities.length > 0 && (<HalaqaActivities activities={halaqa.activities} />)}

                <HalaqaDatesSchedule startDate={halaqa.start_date} endDate={halaqa.end_date} sessionTime={halaqa.session_time} />
            </div>
        </div>

        {/* Missing plans warning modal */}
        {showMissingPlansModal && studentsWithMissingPlans.length > 0 && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setShowMissingPlansModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <AlertTriangleIcon width={24} height={24} className="text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('plan.studentsWithMissingPlans')}
                        </h3>
                    </div>
                    <button type="button" onClick={() => setShowMissingPlansModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg" aria-label={t('common.close')}>
                        <XIcon width={20} height={20} />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    {t('plan.missingPlansDescription')}
                </p>
                <ul className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                    {studentsWithMissingPlans.map((item) => (<li key={item.student_id} className="text-sm">
                        <span className="font-medium text-gray-900">
                            {getLocalizedText(item.student_name)}
                        </span>
                        <span className="text-gray-500 ml-1">
                            — {t('plan.missingActivities')}: {item.missing_activities.join(', ')}
                        </span>
                    </li>))}
                </ul>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setShowMissingPlansModal(false)}>
                        {t('common.close')}
                    </Button>
                    <Button type="button" variant="primary" onClick={handleCloseMissingPlansModalAndScrollToPlans}>
                        {t('plan.goToPlansSection')}
                    </Button>
                </div>
            </div>
        </div>)}

        {/* Plans Section */}
        <div id="halaqa-plans-section" ref={plansSectionRef}>
            <HalaqaPlansSection plans={halaqa.plans || []} halaqaId={id || ''} students={halaqa.students} activities={halaqa.activities} showPlanForm={showPlanForm} onTogglePlanForm={() => setShowPlanForm(!showPlanForm)} onPlanFormSuccess={() => setShowPlanForm(false)} onViewPlanStudents={handleShowPlanStudents} onEditStudentPlan={handleEditStudentPlan} getPlanStudent={getPlanStudent} getLocalizedText={getLocalizedText} />
        </div>

        {/* Students Modal */}
        <PlanStudentsModal isOpen={isStudentsModalOpen} students={selectedPlanStudents} onClose={() => setIsStudentsModalOpen(false)} currentLang={currentLang} />
        <EditStudentPlanModal halaqaId={id || ''} student={studentPlanToEdit?.student} plan={studentPlanToEdit?.plan} activities={halaqa.activities} onClose={() => setStudentPlanToEdit(null)} />
    </div>);
};
export default HalaqaDetailPage;
