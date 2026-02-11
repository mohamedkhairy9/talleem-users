import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useHalaqa } from '@/features/entity-manager/halaqas/hooks/useHalaqas';
import { PageHeader, Button } from '@/globals/components';
import type { PageHeaderBadge } from '@/globals/components';
import PlanStudentsModal from '@/features/entity-manager/halaqas/components/PlanStudentsModal';
import HalaqaQuickStats from '@/features/entity-manager/halaqas/components/HalaqaQuickStats';
import { CalendarIcon, CircleIcon, EditIcon } from '@/globals/icons';
import HalaqaBasicInfo from '@/features/entity-manager/halaqas/components/HalaqaBasicInfo';
import HalaqaDatesSchedule from '@/features/entity-manager/halaqas/components/HalaqaDatesSchedule';
import HalaqaActivities from '@/features/entity-manager/halaqas/components/HalaqaActivities';
import HalaqaStudents from '@/features/entity-manager/halaqas/components/HalaqaStudents';
import HalaqaAdditionalInfo from '@/features/entity-manager/halaqas/components/HalaqaAdditionalInfo';
import HalaqaPlansSection from '@/features/entity-manager/halaqas/components/HalaqaPlansSection';
import { AlertTriangleIcon } from '@/globals/icons';
import type { HalaqaActivity } from '@/features/entity-manager/halaqas/config';
import type { Student, Plan } from '@/features/entity-manager/halaqas/types';

/**
 * Halaqa Detail Page
 * Displays detailed information about a specific halaqa
 */
const HalaqaDetailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id, lang } = useParams<{ id: string; lang: string }>();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'en';
    const [showPlanForm, setShowPlanForm] = useState(false);

    const { data, isLoading, error } = useHalaqa(id || '');
    const [selectedPlanStudents, setSelectedPlanStudents] = useState<Student[]>([]);
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

    // API returns { data: { id, name, ... } }; axios puts body in response.data
    const raw = data?.data;
    const halaqa = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: any }).data : raw;

    const getLocalizedText = (obj: { en?: string; ar?: string } | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (obj && currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj && obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    const handleBack = () => {
        navigate(`/${lang || currentLang}/halaqas`);
    };

    const handleEdit = () => {
        navigate(`/${lang || currentLang}/halaqas/${id}/edit`);
    };

    // Create a map of student IDs to student objects for quick lookup
    const studentsMap = useMemo(() => {
        if (!halaqa?.students) return new Map<number, Student>();
        const map = new Map<number, Student>();
        halaqa.students.forEach((student: Student) => {
            map.set(student.id, student);
        });
        return map;
    }, [halaqa?.students]);

    // Get student(s) for a plan
    const getPlanStudent = (plan: Plan): Student[] => {
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
            return [studentsMap.get(plan.student_id)!];
        }
        // If plan has student_id but not found in students, create a placeholder
        if (plan.student_id) {
            return [{ id: plan.student_id }];
        }
        // If no student info, return empty array
        return [];
    };

    const handleShowPlanStudents = (plan: Plan) => {
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

    const handleViewStudent = (student: Student) => {
        setSelectedPlanStudents([student]);
        setIsStudentsModalOpen(true);
    };

    // Prepare badges for header - MUST be before early returns to maintain hook order
    const headerBadges: PageHeaderBadge[] = useMemo(() => {
        if (!halaqa) return [];
        const badges: PageHeaderBadge[] = [];
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
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                    <p className="text-gray-600 text-sm">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (error || !halaqa) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('halaqa.notFound', 'Halaqa not found')}</h2>
                    <p className="text-gray-600">{t('halaqa.notFoundDescription', 'The halaqa you are looking for does not exist or has been removed.')}</p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('common.back', 'Back to Halaqas')}
                </Button>
            </div>
        );
    }

    // Calculate stats
    const studentCount = halaqa.current_students_count ?? halaqa.students?.length ?? 0;
    const maxStudents = halaqa.max_students ?? 0;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <PageHeader
                    title={getLocalizedText(halaqa.name)}
                    breadcrumb={{
                        label: t('halaqa.backToHalaqas', 'Back to Halaqas'),
                        onClick: handleBack
                    }}
                    badges={headerBadges}
                    actions={[
                        {
                            label: t('common.edit', 'Edit'),
                            onClick: handleEdit,
                            variant: 'primary',
                            icon: <EditIcon width={16} height={16} className="me-2" />
                        }
                    ]}
                />
                <HalaqaQuickStats
                    studentCount={studentCount}
                    maxStudents={maxStudents}
                    plansCount={halaqa.plans?.length ?? 0}
                    durationInDays={halaqa.duration_in_days}
                    activitiesCount={halaqa.activities?.length ?? 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    <HalaqaBasicInfo
                        name={getLocalizedText(halaqa.name)}
                        teacher={halaqa.teacher?.name}
                        entityType={halaqa.memorization_program_entity_type?.name}
                        period={halaqa.period}
                        teachingMethod={halaqa.teaching_method}
                        platform={halaqa.platform?.name}
                        getLocalizedText={getLocalizedText}
                    />

                    {halaqa.students && halaqa.students.length > 0 && (
                        <HalaqaStudents
                            students={halaqa.students}
                            onViewAll={handleViewAllStudents}
                            onViewStudent={handleViewStudent}
                            getLocalizedText={getLocalizedText}
                        />
                    )}
                </div>

                {/* Right Column - Additional Info */}
                <div className="space-y-6">
                    <HalaqaAdditionalInfo
                        durationInDays={halaqa.duration_in_days}
                        weeklyHoliday={halaqa.weekly_holiday}
                        evaluationSystem={halaqa.evaluation_system}
                        totalMark={halaqa.total_mark}
                    />

                    {halaqa.activities && halaqa.activities.length > 0 && (
                        <HalaqaActivities activities={halaqa.activities} />
                    )}

                    <HalaqaDatesSchedule
                        startDate={halaqa.start_date}
                        endDate={halaqa.end_date}
                        sessionTime={halaqa.session_time}
                    />
                </div>
            </div>

            {/* Plans Section */}
            <HalaqaPlansSection
                plans={halaqa.plans || []}
                halaqaId={id || ''}
                students={halaqa.students}
                activities={halaqa.activities as HalaqaActivity[] | undefined}
                showPlanForm={showPlanForm}
                onTogglePlanForm={() => setShowPlanForm(!showPlanForm)}
                onPlanFormSuccess={() => setShowPlanForm(false)}
                onViewPlanStudents={handleShowPlanStudents}
                getPlanStudent={getPlanStudent}
                getLocalizedText={getLocalizedText}
            />

            {/* Students Modal */}
            <PlanStudentsModal
                isOpen={isStudentsModalOpen}
                students={selectedPlanStudents}
                onClose={() => setIsStudentsModalOpen(false)}
                currentLang={currentLang}
            />
        </div>
    );
};

export default HalaqaDetailPage;
