import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores';
import { Button, Table } from '@/shared/components';
import { AlertTriangleIcon, ClipboardCheckIcon, EyeIcon, UsersIcon, XIcon } from '@/shared/icons';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { getErrorMessage } from '@/shared/utils';
import {
    useConductExamDetail,
    useConductExamEvaluationTemplates,
    useConductExamSessionWindowConfig,
    useStartStudentExam,
    useStudentExamResultsMap,
    useTodayConductExams
} from '../hooks/useExamConduction';
import ExamMushafViewer from './ExamMushafViewer';
import {
    formatExamConductionWindow,
    getExamConductionAvailability
} from '../utils/examAvailability';
import { getExamStartPermission } from '../utils/examStartPermissions';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
const EXAM_TYPES = ['maqata3', 'sard'];

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[170px_minmax(0,1fr)]">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
);

const DetailCard = ({ title, children }) => (
    <section className={CARD_CLASS}>
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
    </section>
);

function getTimeRange(exam) {
    return `${formatTimePart(exam?.time_from)} - ${formatTimePart(exam?.time_to)}`;
}

function getExamSegmentLabel(exam, currentLang, t) {
    return getLocalizedText(exam?.exam_segment?.name, currentLang, t('common.not_available', 'N/A'));
}

function getEntityLabel(exam, currentLang, t) {
    return getLocalizedText(exam?.entity?.name, currentLang, t('common.not_available', 'N/A'));
}

function getResponsibleLabel(exam, t) {
    return t(
        `scheduledExams.responsibleOptions.${exam?.responsible === 'general_management' ? 'generalManagement' : exam?.responsible}`,
        exam?.responsible ?? '-'
    );
}

function getMethodLabel(exam, t) {
    return t(
        `scheduledExams.methodOptions.${exam?.method === 'in_person' ? 'inPerson' : 'remote'}`,
        exam?.method ?? '-'
    );
}

const ExamConductionWorkspace = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = i18n.language || 'ar';
    const actingRole = useAuthStore((state) => state.actingRole ??
        state.user?.entity?.role ??
        state.user?.entity?.roles ??
        state.user?.roles ??
        null);
    useDateFormatStore((state) => state.dateFormat);

    const { list, isLoading: isLoadingTodayExams, error: todayExamsError, refresh } = useTodayConductExams();
    const { templates, isLoading: isLoadingTemplates } = useConductExamEvaluationTemplates();
    const { beforeMinutes, afterMinutes } = useConductExamSessionWindowConfig();
    const startStudentExamMutation = useStartStudentExam();
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [selectedExamType, setSelectedExamType] = useState('maqata3');
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [startedExamSession, setStartedExamSession] = useState(null);
    const [activeStudentId, setActiveStudentId] = useState(null);
    const [isMushafOpen, setIsMushafOpen] = useState(false);
    const [activeSegmentId, setActiveSegmentId] = useState(null);

    const { exam, isLoading: isLoadingExamDetail, error: examDetailError } = useConductExamDetail(selectedExamId || '', {
        enabled: Boolean(selectedExamId)
    });

    useEffect(() => {
        if (selectedExamId || list.length === 0) {
            return;
        }

        setSelectedExamId(list[0]?.id ?? null);
    }, [selectedExamId, list]);

    useEffect(() => {
        if (selectedTemplateId || templates.length === 0) {
            return;
        }

        setSelectedTemplateId(templates[0]?.id ?? null);
    }, [selectedTemplateId, templates]);

    useEffect(() => {
        setStartedExamSession(null);
        setActiveStudentId(null);
        setIsMushafOpen(false);
        setActiveSegmentId(null);
    }, [selectedExamId, selectedExamType, selectedTemplateId]);

    const students = Array.isArray(exam?.students) ? exam.students : [];
    const teachers = Array.isArray(exam?.teachers) ? exam.teachers : [];
    const { resultsMap } = useStudentExamResultsMap(selectedExamId || '', students, {
        enabled: Boolean(selectedExamId) && students.length > 0
    });
    const selectedTemplate = templates.find((template) => Number(template?.id) === Number(selectedTemplateId)) ?? null;
    const activeStudent = students.find((student) => Number(student?.id) === Number(activeStudentId)) ?? null;
    const examAvailability = useMemo(() => getExamConductionAvailability(exam, {
        beforeMinutes,
        afterMinutes
    }), [afterMinutes, beforeMinutes, exam]);
    const startPermission = useMemo(
        () => getExamStartPermission(exam?.responsible, actingRole),
        [actingRole, exam?.responsible]
    );
    const conductionWindowLabel = useMemo(
        () => formatExamConductionWindow(examAvailability.window, currentLang),
        [currentLang, examAvailability.window]
    );
    const responsibilityLabel = useMemo(
        () => getResponsibleLabel(exam, t),
        [exam, t]
    );
    const startPermissionMessage = useMemo(
        () => t(
            'examConduction.validation.startNotAllowedForResponsible',
            'Only the responsible side assigned to this exam can start it. This exam belongs to {{responsible}}.',
            { responsible: responsibilityLabel }
        ),
        [responsibilityLabel, t]
    );

    const studentColumns = useMemo(() => ([
        {
            header: t('examConduction.table.student', 'Student'),
            accessor: (row) => row?.name || '-',
            minWidth: 180
        },
        {
            header: t('examConduction.table.juzNumbers', 'Juz Numbers'),
            accessor: (row) => Array.isArray(row?.juz_numbers) && row.juz_numbers.length > 0
                ? row.juz_numbers.join(', ')
                : '-',
            minWidth: 180
        },
        {
            header: t('examConduction.table.examStatus', 'Exam Status'),
            accessor: (row) => {
                const studentResultState = resultsMap[row?.id];

                return (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        studentResultState?.isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                    >
                        {studentResultState?.isCompleted
                            ? t('examConduction.completedResult', 'Completed')
                            : t('examConduction.pendingResult', 'Pending')}
                    </span>
                );
            },
            minWidth: 160
        }
    ]), [resultsMap, t]);

    const handleStartExam = (student) => {
        if (!selectedExamId) {
            toast.error(t('examConduction.validation.examRequired', 'Please select an exam first.'));
            return;
        }

        if (resultsMap[student?.id]?.isCompleted) {
            toast.error(t('examConduction.validation.examAlreadyCompleted', 'This student exam is already completed. You can view the result instead.'));
            return;
        }

        if (!startPermission.canStart) {
            toast.error(startPermissionMessage);
            return;
        }

        if (!examAvailability.isAvailable) {
            toast.error(t(
                'examConduction.validation.examOutsideWindow',
                'This exam is not available right now. It can only be conducted within the configured time window before or after the scheduled session.'
            ));
            return;
        }

        if (!selectedTemplateId) {
            toast.error(t('examConduction.validation.templateRequired', 'Please select an evaluation template first.'));
            return;
        }

        setActiveStudentId(student?.id ?? null);

        startStudentExamMutation.mutate({
            scheduledExamId: selectedExamId,
            studentId: student?.id,
            payload: {
                exam_type: selectedExamType,
                evaluation_parameter_id: Number(selectedTemplateId)
            }
        }, {
            onSuccess: (response) => {
                setStartedExamSession(response?.data ?? response);
                toast.success(t('examConduction.startSuccess', 'Exam started successfully.'));
            },
            onError: (requestError) => {
                setActiveStudentId(null);
                toast.error(getErrorMessage(requestError) || t('examConduction.startError', 'Error starting exam.'));
            }
        });
    };

    const handleViewResult = (student) => {
        navigate(`/${lang || 'ar'}/exam-conduction/${selectedExamId}/students/${student?.id}/result`);
    };

    const handleGoToConductForm = () => {
        if (!selectedExamId || !activeStudentId || !startedExamSession) {
            return;
        }

        navigate(`/${lang || 'ar'}/exam-conduction/${selectedExamId}/students/${activeStudentId}/conduct`, {
            state: {
                startData: startedExamSession,
                startPayload: {
                    exam_type: startedExamSession?.exam_type || selectedExamType,
                    evaluation_parameter_id: Number(startedExamSession?.evaluation_parameter?.id ?? selectedTemplateId)
                },
                selectedTemplate
            }
        });
    };

    if (todayExamsError) {
        return (
            <div className="py-12 text-center text-red-600">
                {todayExamsError?.message || t('examConduction.loadError', 'Error loading exam conduction list. Please try again.')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className={CARD_CLASS}>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('examConduction.sections.todayExams', 'Today Scheduled Exams')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {t('examConduction.sections.todayExamsHint', 'Choose the exam you want to review from today list.')}
                        </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => refresh()} disabled={isLoadingTodayExams}>
                        {t('common.refresh', 'Refresh')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {list.map((item) => {
                        const isSelected = Number(item?.id) === Number(selectedExamId);

                        return (
                            <button
                                key={item?.id}
                                type="button"
                                onClick={() => setSelectedExamId(item?.id)}
                                className={`rounded-xl border px-4 py-4 text-start transition-colors ${
                                    isSelected
                                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                                }`}
                            >
                                <p className="text-base font-semibold text-gray-900">
                                    {getExamSegmentLabel(item, currentLang, t)}
                                </p>
                                <p className="mt-2 text-sm text-gray-600">
                                    {getTimeRange(item)}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {getDisplayDate(item?.exam_date)}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {!isLoadingTodayExams && list.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">
                        {t('examConduction.noData', 'No exams available for conduction today.')}
                    </p>
                ) : null}
            </section>

            {isLoadingExamDetail ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                        <p className="text-sm text-gray-600">{t('common.loading')}</p>
                    </div>
                </div>
            ) : null}

            {examDetailError ? (
                <div className="py-12 text-center text-red-600">
                    {examDetailError?.message || t('examConduction.loadDetailError', 'Error loading exam conduction details. Please try again.')}
                </div>
            ) : null}

            {!isLoadingExamDetail && !examDetailError && exam ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <DetailCard title={t('examConduction.detail.schedule', 'Schedule')}>
                            <InfoRow label={t('examConduction.table.entity', 'Entity')} value={getEntityLabel(exam, currentLang, t)} />
                            <InfoRow label={t('examConduction.table.segment', 'Segment')} value={getExamSegmentLabel(exam, currentLang, t)} />
                            <InfoRow label={t('examConduction.table.date', 'Date')} value={getDisplayDate(exam?.exam_date)} />
                            <InfoRow label={t('examConduction.table.time', 'Time')} value={getTimeRange(exam)} />
                            <InfoRow label={t('examConduction.table.conductionWindow', 'Conduction Window')} value={conductionWindowLabel} />
                            <InfoRow label={t('scheduledExams.table.responsible', 'Responsible')} value={responsibilityLabel} />
                            <InfoRow label={t('examConduction.table.method', 'Method')} value={getMethodLabel(exam, t)} />
                            <InfoRow label={t('examConduction.table.location', 'Location')} value={exam?.location || '-'} />
                            <InfoRow label={t('examConduction.table.availability', 'Availability')} value={examAvailability.isAvailable ? t('examConduction.available', 'Available') : t('examConduction.unavailable', 'Unavailable')} />
                        </DetailCard>

                        <section className={CARD_CLASS}>
                            {!startPermission.canStart ? (
                                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {startPermissionMessage}
                                </div>
                            ) : null}

                            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-sm font-medium text-gray-700">
                                        {t('examConduction.examType', 'Exam Type')}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {EXAM_TYPES.map((type) => {
                                            const isSelected = selectedExamType === type;

                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setSelectedExamType(type)}
                                                    className={`min-w-[140px] rounded-xl border px-5 py-3 text-base font-semibold transition-colors ${
                                                        isSelected
                                                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                            : 'border-gray-200 bg-white text-gray-900 hover:border-primary-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {t(`examConduction.types.${type}`, type)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-gray-700">
                                        {t('examConduction.evaluationTemplate', 'Evaluation Template')}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {templates.map((template) => {
                                            const isSelected = Number(template?.id) === Number(selectedTemplateId);

                                            return (
                                                <button
                                                    key={template?.id}
                                                    type="button"
                                                    onClick={() => setSelectedTemplateId(template?.id)}
                                                    className={`rounded-xl border px-4 py-3 text-start transition-colors ${
                                                        isSelected
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <p className="font-semibold text-gray-900">
                                                        {getLocalizedText(template?.name, currentLang, t('common.not_available', 'N/A'))}
                                                    </p>
                                                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                        {template?.evaluation_system ? (
                                                            <p>
                                                                {t('examConduction.evaluationSystem', 'Evaluation System')}: {getLocalizedText(template?.evaluation_system, currentLang, '-')}
                                                            </p>
                                                        ) : null}
                                                        {template?.total_grade != null ? (
                                                            <p>
                                                                {t('examConduction.totalGrade', 'Total Grade')}: {template.total_grade}
                                                            </p>
                                                        ) : null}
                                                        {Array.isArray(template?.criteria) && template.criteria.length > 0 ? (
                                                            <p>
                                                                {t('examConduction.criteria', 'Criteria')}: {template.criteria.length}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {isLoadingTemplates ? (
                                        <p className="mt-2 text-sm text-gray-500">{t('common.loading', 'Loading...')}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {t('examConduction.detail.students', 'Students')}
                                </h2>
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                                    <UsersIcon width={18} height={18} />
                                </div>
                            </div>

                            <Table
                                columns={studentColumns}
                                data={students}
                                loading={false}
                                emptyMessage={t('examConduction.noStudents', 'No students assigned to this exam.')}
                                rowClassName={(row) => (
                                    resultsMap[row?.id]?.isCompleted
                                        ? 'bg-emerald-50/60'
                                        : ''
                                )}
                                actionButtons={{
                                    customActions: [
                                        {
                                            key: 'start',
                                            label: t('examConduction.startExam', 'Start Exam'),
                                            title: t('examConduction.startExam', 'Start Exam'),
                                            icon: ClipboardCheckIcon,
                                            disabled: (row) => startStudentExamMutation.isPending || !selectedTemplateId || resultsMap[row?.id]?.isCompleted || !examAvailability.isAvailable,
                                            onClick: handleStartExam
                                        },
                                        {
                                            key: 'result',
                                            label: t('examConduction.viewResult', 'View Result'),
                                            title: t('examConduction.viewResult', 'View Result'),
                                            icon: EyeIcon,
                                            disabled: (row) => !resultsMap[row?.id]?.isCompleted,
                                            onClick: handleViewResult
                                        }
                                    ]
                                }}
                            />
                        </section>

                        {startedExamSession ? (
                            <section className={CARD_CLASS}>
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {t('examConduction.startedExamSummary', 'Started Exam Summary')}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={handleGoToConductForm}
                                        >
                                            {t('examConduction.submitGrades', 'Submit Grades')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setIsMushafOpen(true)}
                                        >
                                            {t('examConduction.openMushaf', 'Open Mushaf')}
                                        </Button>
                                        <div className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                                            {t(`examConduction.statuses.${startedExamSession?.status || 'started'}`, startedExamSession?.status || 'started')}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InfoRow label={t('examConduction.student', 'Student')} value={activeStudent?.name || '-'} />
                                    <InfoRow label={t('examConduction.examType', 'Exam Type')} value={t(`examConduction.types.${startedExamSession?.exam_type || selectedExamType}`, startedExamSession?.exam_type || selectedExamType)} />
                                    <InfoRow label={t('examConduction.evaluationTemplate', 'Evaluation Template')} value={getLocalizedText(startedExamSession?.evaluation_parameter?.name ?? selectedTemplate?.name, currentLang, '-')} />
                                    <InfoRow label={t('examConduction.conductedBy', 'Conducted By')} value={startedExamSession?.conducted_by?.name || '-'} />
                                </div>

                                <div className="mt-5 overflow-x-auto">
                                    <table className="w-full min-w-[680px] divide-y divide-gray-200 border border-gray-200">
                                        <thead className="bg-sky-50">
                                            <tr>
                                                <th className="px-4 py-3 text-start text-sm font-semibold text-gray-900">{t('examConduction.segmentLabel', 'Segment')}</th>
                                                <th className="px-4 py-3 text-start text-sm font-semibold text-gray-900">{t('examConduction.juzLabel', 'Juz')}</th>
                                                <th className="px-4 py-3 text-start text-sm font-semibold text-gray-900">{t('examConduction.firstVerse', 'First Verse')}</th>
                                                <th className="px-4 py-3 text-start text-sm font-semibold text-gray-900">{t('examConduction.lastVerse', 'Last Verse')}</th>
                                                <th className="px-4 py-3 text-start text-sm font-semibold text-gray-900">{t('examConduction.columnTotal', 'Total')}</th>
                                                <th className="px-4 py-3 text-start text-sm font-semibold text-gray-900">{t('common.actions', 'Actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {(Array.isArray(startedExamSession?.segments) ? startedExamSession.segments : []).map((segment) => (
                                                <tr key={segment?.id}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{segment?.order ?? '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{segment?.juz_number ?? '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{segment?.first_verse_key || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{segment?.last_verse_key || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{segment?.column_total ?? 0}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setActiveSegmentId(segment?.id ?? null);
                                                                setIsMushafOpen(true);
                                                            }}
                                                        >
                                                            {t('examConduction.showInMushaf', 'Show in Mushaf')}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ) : null}
                    </div>

                    <div className="space-y-6">
                        <DetailCard title={t('examConduction.detail.teachers', 'Teachers')}>
                            {teachers.length > 0 ? (
                                <div className="space-y-3">
                                    {teachers.map((teacher, index) => (
                                        <div key={teacher?.id ?? index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
                                            {getLocalizedText(teacher?.name, currentLang, '-')}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">{t('examConduction.noTeachers', 'No teachers assigned.')}</p>
                            )}
                        </DetailCard>
                    </div>
                </div>
            ) : null}

            {!selectedExamId && !isLoadingTodayExams ? (
                <div className="py-12 text-center text-gray-500">
                    <AlertTriangleIcon width={42} height={42} className="mx-auto mb-4 text-gray-300" />
                    {t('examConduction.noData', 'No exams available for conduction today.')}
                </div>
            ) : null}

            {isMushafOpen && startedExamSession ? (
                <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain">
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.75 }}
                        aria-hidden="true"
                        onClick={() => setIsMushafOpen(false)}
                    />

                    <div className="relative flex min-h-[100dvh] items-start justify-center px-4 pb-8 pt-20 z-10">
                        <div className="relative flex max-h-[calc(100dvh-6rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                            <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 shrink-0">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {t('examConduction.mushafViewerTitle', 'Interactive Mushaf')}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {t('examConduction.mushafViewerSubtitle', 'Choose the segment and preview exactly what the student will be reciting.')}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsMushafOpen(false)}
                                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                    aria-label={t('examConduction.closeMushaf', 'Close Mushaf')}
                                >
                                    <XIcon width={22} height={22} />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 sm:px-6">
                                <ExamMushafViewer
                                    segments={startedExamSession?.segments}
                                    selectedSegmentId={activeSegmentId}
                                    onSelectSegment={setActiveSegmentId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ExamConductionWorkspace;
