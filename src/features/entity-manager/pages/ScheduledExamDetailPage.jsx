import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangleIcon, CalendarIcon, EditIcon, TeacherIcon, TrashIcon, UsersIcon } from '@/shared/icons';
import { Button, PageHeader } from '@/shared/components';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getErrorMessage } from '@/shared/utils';
import { useConfirmationModal } from '@/shared/hooks/useConfirmationModal';
import { useDeleteScheduledExam, useScheduledExam } from '@/features/entity-manager/scheduled-exams/hooks/useScheduledExams';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

const DetailCard = ({ icon: Icon, title, children }) => (
    <section className={CARD_CLASS}>
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                <Icon width={18} height={18} />
            </div>
        </div>
        <div className="space-y-4">{children}</div>
    </section>
);

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[170px_minmax(0,1fr)]">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
);

function getTimeRange(exam) {
    const timeFrom = formatTimePart(exam?.time_from);
    const timeTo = formatTimePart(exam?.time_to);
    return `${timeFrom} - ${timeTo}`;
}

function getSegmentLabel(exam, currentLang, t) {
    return exam?.exam_segment?.name
        ? getLocalizedText(exam.exam_segment.name, currentLang, t('common.not_available', 'N/A'))
        : String(exam?.exam_segment_id ?? t('common.not_available', 'N/A'));
}

function getEntityLabel(exam, currentLang, t) {
    if (!exam?.entity) {
        return t('common.not_available', 'N/A');
    }

    const entityName = getLocalizedText(exam.entity.name, currentLang, t('common.not_available', 'N/A'));
    return `${entityName} (#${exam.entity.id})`;
}

function getPersonLabel(person, fallbackPrefix, currentLang, t) {
    if (person == null) {
        return t('scheduledExams.detail.none', 'None assigned');
    }

    if (typeof person === 'number' || typeof person === 'string') {
        return `${fallbackPrefix} ${person}`;
    }

    return getLocalizedText(
        person?.name ?? person?.full_name ?? person?.label,
        currentLang,
        `${fallbackPrefix} ${person?.id ?? ''}`.trim()
    );
}

const ScheduledExamDetailPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    useDateFormatStore((state) => state.dateFormat);
    const { showConfirmation } = useConfirmationModal();
    const { exam, isLoading, error } = useScheduledExam(id || '');
    const deleteScheduledExamMutation = useDeleteScheduledExam();

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/scheduled-exams`);
    };

    const handleEdit = () => {
        navigate(`/${lang || 'ar'}/scheduled-exams/${id}/edit`);
    };

    const handleDelete = () => {
        if (!id) {
            return;
        }

        showConfirmation({
            title: t('scheduledExams.deleteTitle', 'Delete Scheduled Exam'),
            message: t('scheduledExams.deleteMessage', 'Are you sure you want to delete this scheduled exam?'),
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger',
            onConfirm: () => {
                deleteScheduledExamMutation.mutate(id, {
                    onSuccess: () => {
                        toast.success(t('scheduledExams.deleteSuccess', 'Scheduled exam deleted successfully.'));
                        navigate(`/${lang || 'ar'}/scheduled-exams`);
                    },
                    onError: (requestError) => {
                        toast.error(getErrorMessage(requestError) || t('scheduledExams.deleteError', 'Error deleting scheduled exam.'));
                    }
                });
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

    if (error || !exam) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">{t('scheduledExams.notFound', 'Scheduled exam not found.')}</h2>
                    <p className="text-gray-600">{error?.message || t('scheduledExams.loadDetailError', 'Error loading scheduled exam details. Please try again.')}</p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('scheduledExams.backToList', 'Back to Scheduled Exams')}
                </Button>
            </div>
        );
    }

    const teachers = Array.isArray(exam.teachers)
        ? exam.teachers
        : Array.isArray(exam.teacher_ids)
            ? exam.teacher_ids
            : [];
    const students = Array.isArray(exam.students) ? exam.students : [];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('scheduledExams.detailTitle', 'Scheduled Exam Details')}
                subtitle={t('scheduledExams.detailSubtitle', 'Review the selected scheduled exam and its assignments.')}
                breadcrumb={{
                    label: t('scheduledExams.backToList', 'Back to Scheduled Exams'),
                    onClick: handleBack
                }}
                actions={[
                    {
                        label: t('common.edit', 'Edit'),
                        onClick: handleEdit,
                        variant: 'primary',
                        icon: <EditIcon width={16} height={16} className="me-2" />
                    },
                    {
                        label: t('common.delete', 'Delete'),
                        onClick: handleDelete,
                        variant: 'danger',
                        icon: <TrashIcon width={16} height={16} className="me-2" />
                    }
                ]}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <DetailCard icon={CalendarIcon} title={t('scheduledExams.detail.schedule', 'Schedule')}>
                        <InfoRow label={t('scheduledExams.detail.entity', 'Entity')} value={getEntityLabel(exam, currentLang, t)} />
                        <InfoRow label={t('scheduledExams.table.segment', 'Segment')} value={getSegmentLabel(exam, currentLang, t)} />
                        <InfoRow label={t('scheduledExams.table.date', 'Date')} value={getDisplayDate(exam.exam_date)} />
                        <InfoRow label={t('scheduledExams.table.time', 'Time')} value={getTimeRange(exam)} />
                        <InfoRow label={t('scheduledExams.detail.partsCount', 'Parts Count')} value={exam?.exam_segment?.parts_count ?? '-'} />
                        <InfoRow label={t('scheduledExams.detail.segmentsRequired', 'Segments Required')} value={exam?.exam_segment?.segments_required ?? '-'} />
                    </DetailCard>

                    <DetailCard icon={UsersIcon} title={t('scheduledExams.detail.students', 'Students Coverage')}>
                        {students.length > 0 ? (
                            <div className="space-y-3">
                                {students.map((student, index) => (
                                    <div key={student?.id ?? student?.student_id ?? index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <InfoRow
                                                label={t('scheduledExams.student', 'Student')}
                                                value={getPersonLabel(student?.student ?? student, t('scheduledExams.detail.studentId', 'Student ID'), currentLang, t)}
                                            />
                                            <InfoRow
                                                label={t('scheduledExams.detail.juzNumbers', 'Juz Numbers')}
                                                value={Array.isArray(student?.juz_numbers) && student.juz_numbers.length > 0
                                                    ? student.juz_numbers.join(', ')
                                                    : '-'}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{t('scheduledExams.noData', 'No scheduled exams found.')}</p>
                        )}
                    </DetailCard>
                </div>

                <div className="space-y-6">
                    <DetailCard icon={TeacherIcon} title={t('scheduledExams.detail.delivery', 'Delivery')}>
                        <InfoRow
                            label={t('scheduledExams.table.responsible', 'Responsible')}
                            value={t(`scheduledExams.responsibleOptions.${exam?.responsible === 'general_management' ? 'generalManagement' : exam?.responsible}`, exam?.responsible ?? '-')}
                        />
                        <InfoRow
                            label={t('scheduledExams.table.method', 'Method')}
                            value={t(`scheduledExams.methodOptions.${exam?.method === 'in_person' ? 'inPerson' : exam?.method}`, exam?.method ?? '-')}
                        />
                        <InfoRow label={t('scheduledExams.table.location', 'Location')} value={exam.location || '-'} />
                        <InfoRow
                            label={t('scheduledExams.detail.createdBy', 'Created By')}
                            value={getPersonLabel(exam.created_by, t('scheduledExams.detail.teacherId', 'Teacher ID'), currentLang, t)}
                        />
                        <InfoRow
                            label={t('scheduledExams.detail.updatedBy', 'Updated By')}
                            value={getPersonLabel(exam.updated_by, t('scheduledExams.detail.teacherId', 'Teacher ID'), currentLang, t)}
                        />
                    </DetailCard>

                    <DetailCard icon={TeacherIcon} title={t('scheduledExams.detail.teachers', 'Teachers')}>
                        {teachers.length > 0 ? (
                            <div className="space-y-3">
                                {teachers.map((teacher, index) => (
                                    <div key={teacher?.id ?? teacher ?? index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
                                        {getPersonLabel(teacher, t('scheduledExams.detail.teacherId', 'Teacher ID'), currentLang, t)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{t('scheduledExams.detail.none', 'None assigned')}</p>
                        )}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

export default ScheduledExamDetailPage;
