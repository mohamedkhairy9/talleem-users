import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, PageHeader } from '@/shared/components';
import { BookOpenIcon, XIcon } from '@/shared/icons';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { getErrorMessage } from '@/shared/utils';
import { useConductExamDetail, useConductExamEvaluationTemplates, useSubmitStudentExam } from '../hooks/useExamConduction';
import ExamMushafViewer from './ExamMushafViewer';
import {
    getExamConductionSegmentPayloadId,
    getExamConductionSegments
} from '../utils/examSegments';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function getSessionData(state) {
    return state?.startData?.data ?? state?.startData ?? null;
}

function getTimeRange(exam) {
    return `${formatTimePart(exam?.time_from)} - ${formatTimePart(exam?.time_to)}`;
}

function buildCriteria(sessionData, selectedTemplate, currentLang, t) {
    const rawCriteria = normalizeArray(sessionData?.evaluation_parameter?.criteria);
    const templateCriteria = normalizeArray(selectedTemplate?.criteria);
    const criteria = rawCriteria.length > 0 ? rawCriteria : templateCriteria;

    return criteria.map((criteriaItem) => ({
        id: criteriaItem?.id ?? criteriaItem?.criteria_id,
        name: getLocalizedText(
            criteriaItem?.criteria_name ?? criteriaItem?.name,
            currentLang,
            t('common.not_available', 'N/A')
        ),
        degree: criteriaItem?.degree ?? criteriaItem?.max_degree ?? 0
    })).filter((criteriaItem) => criteriaItem.id != null);
}

function buildInitialScores(segments, criteria) {
    const result = {};

    segments.forEach((segment) => {
        criteria.forEach((criteriaItem) => {
            result[`${segment.id}-${criteriaItem.id}`] = '';
        });
    });

    return result;
}

function getEvaluationTemplate(templates, templateId) {
    return templates.find((template) => template.id === Number(templateId)) ?? null;
}

function validateGradeValue(rawValue, maxDegree, t) {
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
        return t('examConduction.validation.gradeRequired', 'This grade is required.');
    }

    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue)) {
        return t('examConduction.validation.gradeMustBeNumber', 'Grade must be a valid number.');
    }

    if (numericValue < 0) {
        return t('examConduction.validation.gradeMin', 'Grade cannot be less than 0.');
    }

    if (numericValue > Number(maxDegree ?? 0)) {
        return t('examConduction.validation.gradeMax', {
            max: Number(maxDegree ?? 0),
            defaultValue: 'Grade cannot exceed {{max}}.'
        });
    }

    return '';
}

const ConductExamForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { lang, scheduledExamId, studentId } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    useDateFormatStore((state) => state.dateFormat);
    const sessionData = getSessionData(location.state);
    const { exam, isLoading, error } = useConductExamDetail(scheduledExamId || '');
    const { templates } = useConductExamEvaluationTemplates();
    const submitStudentExamMutation = useSubmitStudentExam();
    const [scores, setScores] = useState({});
    const [scoreErrors, setScoreErrors] = useState({});
    const [activeSegmentId, setActiveSegmentId] = useState(null);
    const [isMushafOpen, setIsMushafOpen] = useState(false);

    const selectedStudent = useMemo(() => {
        const students = normalizeArray(exam?.students);
        return students.find((student) => String(student?.id ?? student?.student_id) === String(studentId)) ?? null;
    }, [exam?.students, studentId]);

    const selectedTemplate = useMemo(() => {
        return (
            location.state?.selectedTemplate ??
            getEvaluationTemplate(templates, location.state?.startPayload?.evaluation_parameter_id) ??
            null
        );
    }, [location.state?.selectedTemplate, location.state?.startPayload?.evaluation_parameter_id, templates]);

    const examType = sessionData?.exam_type ?? location.state?.startPayload?.exam_type ?? 'maqata3';
    const segments = useMemo(() => getExamConductionSegments({
        examType,
        rawSegments: sessionData?.segments,
        studentJuzNumbers: selectedStudent?.juz_numbers,
        fallbackJuzNumbers: normalizeArray(sessionData?.segments).map((segment) => segment?.juz_number)
    }), [examType, selectedStudent?.juz_numbers, sessionData?.segments]);
    const criteria = useMemo(
        () => buildCriteria(sessionData, selectedTemplate, currentLang, t),
        [sessionData, selectedTemplate, currentLang, t]
    );

    useEffect(() => {
        if (segments.length === 0 || criteria.length === 0) {
            return;
        }

        setScores(buildInitialScores(segments, criteria));
        setScoreErrors({});
    }, [segments, criteria]);

    useEffect(() => {
        if (segments.length === 0) {
            return;
        }

        const hasActiveSegment = segments.some((segment) => String(segment.id) === String(activeSegmentId));

        if (!hasActiveSegment) {
            setActiveSegmentId(segments[0].id);
        }
    }, [activeSegmentId, segments]);

    const handleScoreChange = (segmentId, criteriaId, value) => {
        const criteriaItem = criteria.find((item) => String(item.id) === String(criteriaId));
        const fieldKey = `${segmentId}-${criteriaId}`;

        setScores((previous) => ({
            ...previous,
            [fieldKey]: value
        }));

        setScoreErrors((previous) => ({
            ...previous,
            [fieldKey]: validateGradeValue(value, criteriaItem?.degree ?? 0, t)
        }));
    };

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/exam-conduction/${scheduledExamId}`);
    };

    const handleSubmit = () => {
        if (segments.length === 0 || criteria.length === 0) {
            toast.error(t('examConduction.missingConductData', 'Unable to build grading form. Please restart the exam.'));
            return;
        }

        const nextScoreErrors = {};

        const payload = {
            segments: segments.map((segment) => ({
                segment_id: getExamConductionSegmentPayloadId(segment),
                grades: criteria.map((criteriaItem) => {
                    const rawValue = scores[`${segment.id}-${criteriaItem.id}`];
                    const fieldKey = `${segment.id}-${criteriaItem.id}`;
                    const fieldError = validateGradeValue(rawValue, criteriaItem.degree, t);

                    if (fieldError) {
                        nextScoreErrors[fieldKey] = fieldError;
                    }

                    return {
                        criteria_id: criteriaItem.id,
                        grade: Number(rawValue)
                    };
                })
            }))
        };

        setScoreErrors(nextScoreErrors);

        if (Object.keys(nextScoreErrors).length > 0) {
            toast.error(t('examConduction.validation.allGradesRequired', 'Please fill all grades before submitting.'));
            return;
        }

        submitStudentExamMutation.mutate({
            scheduledExamId,
            studentId,
            payload
        }, {
            onSuccess: () => {
                toast.success(t('examConduction.submitSuccess', 'Exam grades submitted successfully.'));
                navigate(`/${lang || 'ar'}/exam-conduction/${scheduledExamId}/students/${studentId}/result`);
            },
            onError: (requestError) => {
                toast.error(getErrorMessage(requestError) || t('examConduction.submitError', 'Error submitting exam grades.'));
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !exam || !selectedStudent) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                        {t('examConduction.notFound', 'Exam conduction data not found.')}
                    </h2>
                    <p className="text-gray-600">
                        {error?.message || t('examConduction.loadDetailError', 'Error loading exam conduction details. Please try again.')}
                    </p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('examConduction.backToDetail', 'Back to Exam Details')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('examConduction.conductTitle', 'Conduct Exam')}
                subtitle={t('examConduction.conductSubtitle', 'Record grades for the selected student.')}
                breadcrumb={{
                    label: t('examConduction.backToDetail', 'Back to Exam Details'),
                    onClick: handleBack
                }}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="space-y-6 lg:col-span-1">
                    <div className={CARD_CLASS}>
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            {t('examConduction.studentInfo', 'Student Information')}
                        </h2>
                        <div className="space-y-3 text-sm text-gray-700">
                            <p><span className="font-medium text-gray-900">{t('examConduction.student', 'Student')}:</span> {selectedStudent?.name || '-'}</p>
                            <p><span className="font-medium text-gray-900">{t('examConduction.examType', 'Exam Type')}:</span> {t(`examConduction.types.${examType}`, examType || '-')}</p>
                            <p><span className="font-medium text-gray-900">{t('examConduction.evaluationTemplate', 'Evaluation Template')}:</span> {getLocalizedText(selectedTemplate?.name, currentLang, '-')}</p>
                            <p><span className="font-medium text-gray-900">{t('examConduction.status', 'Status')}:</span> {t(`examConduction.statuses.${sessionData?.status || 'started'}`, sessionData?.status || '-')}</p>
                            <p><span className="font-medium text-gray-900">{t('scheduledExams.table.date', 'Date')}:</span> {getDisplayDate(exam?.exam_date)}</p>
                            <p><span className="font-medium text-gray-900">{t('scheduledExams.table.time', 'Time')}:</span> {getTimeRange(exam)}</p>
                            <p><span className="font-medium text-gray-900">{t('examConduction.conductedBy', 'Conducted By')}:</span> {sessionData?.conducted_by?.name || '-'}</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6 lg:col-span-2">
                    <div className={`${CARD_CLASS} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {t('examConduction.mushafViewerTitle', 'Interactive Mushaf')}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('examConduction.mushafOpenHint', 'Open the Mushaf to preview the exact verses and pages for the selected segment.')}
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setIsMushafOpen(true)}
                            className="md:min-w-[180px]"
                        >
                            {t('examConduction.openMushaf', 'Open Mushaf')}
                        </Button>
                    </div>

                    {segments.map((segment) => (
                        <div
                            key={segment.id}
                            className={`${CARD_CLASS} transition-colors ${
                                String(segment.id) === String(activeSegmentId)
                                    ? 'border-primary-300 bg-primary-50/40'
                                    : ''
                            }`}
                        >
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {t('examConduction.segmentLabel', 'Segment')} #{segment.order}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {t('examConduction.juzLabel', 'Juz')} {segment.juz_number ?? '-'}
                                    </p>
                                    {segment.first_verse_key || segment.last_verse_key ? (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {segment.first_verse_key || '-'} {t('examConduction.to', 'to')} {segment.last_verse_key || '-'}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant={String(segment.id) === String(activeSegmentId) ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setActiveSegmentId(segment.id);
                                            setIsMushafOpen(true);
                                        }}
                                    >
                                        {String(segment.id) === String(activeSegmentId)
                                            ? t('examConduction.selectedInMushaf', 'Selected in Mushaf')
                                            : t('examConduction.showInMushaf', 'Show in Mushaf')}
                                    </Button>
                                    <div className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                                        {t('examConduction.columnTotal', 'Total')}: {segment.column_total ?? 0}
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                                        <BookOpenIcon width={18} height={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {criteria.map((criteriaItem) => (
                                    <div key={`${segment.id}-${criteriaItem.id}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <label className="mb-2 block text-sm font-medium text-gray-900">
                                            {criteriaItem.name}
                                        </label>
                                        <p className="mb-2 text-xs text-gray-500">
                                            {t('examConduction.maxDegree', 'Max Degree')}: {criteriaItem.degree}
                                        </p>
                                        <input
                                            type="number"
                                            min="0"
                                            max={criteriaItem.degree || undefined}
                                            value={scores[`${segment.id}-${criteriaItem.id}`] ?? ''}
                                            onChange={(event) => handleScoreChange(segment.id, criteriaItem.id, event.target.value)}
                                            className={`h-[48px] w-full rounded-lg bg-white px-3 text-sm outline-none focus:ring-1 ${
                                                scoreErrors[`${segment.id}-${criteriaItem.id}`]
                                                    ? 'border border-red-400 focus:border-red-500 focus:ring-red-500'
                                                    : 'border border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                            }`}
                                        />
                                        <p className="mt-2 min-h-4 text-xs text-red-600">
                                            {scoreErrors[`${segment.id}-${criteriaItem.id}`] ?? ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleBack} disabled={submitStudentExamMutation.isPending}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="button" variant="primary" onClick={handleSubmit} loading={submitStudentExamMutation.isPending}>
                            {t('examConduction.submitGrades', 'Submit Grades')}
                        </Button>
                    </div>
                </section>
            </div>

            {isMushafOpen ? (
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
                                    segments={segments}
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

export default ConductExamForm;
