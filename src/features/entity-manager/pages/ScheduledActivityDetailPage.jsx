import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangleIcon, CalendarIcon, EditIcon, TeacherIcon, TrashIcon, UsersIcon } from '@/shared/icons';
import { Button, PageHeader } from '@/shared/components';
import { useConfirmationModal } from '@/shared/hooks/useConfirmationModal';
import { getErrorMessage } from '@/shared/utils';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { useDeleteScheduledActivity, useScheduledActivity } from '@/features/entity-manager/scheduled-activities/hooks/useScheduledActivities';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

const DetailCard = ({ icon, title, children }) => {
    const IconComponent = icon;

    return (
        <section className={CARD_CLASS}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                    <IconComponent width={18} height={18} />
                </div>
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[170px_minmax(0,1fr)]">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
);

function getDateRange(activity) {
    const dateFrom = getDisplayDate(activity?.date_from ?? activity?.start_date);
    const dateTo = getDisplayDate(activity?.date_to ?? activity?.end_date);

    if (!dateFrom && !dateTo) {
        return '-';
    }

    if (dateFrom === dateTo) {
        return dateFrom;
    }

    return `${dateFrom} - ${dateTo}`;
}

function getTimeRange(activity) {
    const timeFrom = formatTimePart(activity?.time_from);
    const timeTo = formatTimePart(activity?.time_to);
    return `${timeFrom} - ${timeTo}`;
}

function getPersonLabel(person, fallbackPrefix, currentLang, t) {
    if (person == null) {
        return t('scheduledActivities.detail.none', 'None assigned');
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

const ScheduledActivityDetailPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    const { showConfirmation } = useConfirmationModal();
    const { activity, isLoading, error } = useScheduledActivity(id || '');
    const deleteScheduledActivityMutation = useDeleteScheduledActivity();

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/scheduled-activities`);
    };

    const handleEdit = () => {
        navigate(`/${lang || 'ar'}/scheduled-activities/${id}/edit`);
    };

    const handleDelete = () => {
        if (!id) {
            return;
        }

        showConfirmation({
            title: t('scheduledActivities.deleteTitle', 'Delete Scheduled Activity'),
            message: t('scheduledActivities.deleteMessage', 'Are you sure you want to delete this scheduled activity?'),
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger',
            onConfirm: () => {
                deleteScheduledActivityMutation.mutate(id, {
                    onSuccess: () => {
                        toast.success(t('scheduledActivities.deleteSuccess', 'Scheduled activity deleted successfully.'));
                        navigate(`/${lang || 'ar'}/scheduled-activities`);
                    },
                    onError: (requestError) => {
                        toast.error(getErrorMessage(requestError) || t('scheduledActivities.deleteError', 'Error deleting scheduled activity.'));
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

    if (error || !activity) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">{t('scheduledActivities.notFound', 'Scheduled activity not found.')}</h2>
                    <p className="text-gray-600">{error?.message || t('scheduledActivities.loadDetailError', 'Error loading scheduled activity details. Please try again.')}</p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('scheduledActivities.backToList', 'Back to Scheduled Activities')}
                </Button>
            </div>
        );
    }

    const teachers = Array.isArray(activity.teachers)
        ? activity.teachers
        : Array.isArray(activity.teacher_ids)
            ? activity.teacher_ids
            : [];
    const students = Array.isArray(activity.students)
        ? activity.students
        : Array.isArray(activity.student_ids)
            ? activity.student_ids
            : [];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('scheduledActivities.detailTitle', 'Scheduled Activity Details')}
                subtitle={t('scheduledActivities.detailSubtitle', 'Review the selected scheduled activity and its assignments.')}
                breadcrumb={{
                    label: t('scheduledActivities.backToList', 'Back to Scheduled Activities'),
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
                    <DetailCard icon={CalendarIcon} title={t('scheduledActivities.detail.schedule', 'Schedule')}>
                        <InfoRow label={t('scheduledActivities.name', 'Activity Name')} value={activity?.name ?? activity?.title ?? '-'} />
                        <InfoRow label={t('scheduledActivities.detail.dateRange', 'Date Range')} value={getDateRange(activity)} />
                        <InfoRow label={t('scheduledActivities.table.time', 'Time')} value={getTimeRange(activity)} />
                    </DetailCard>

                    <DetailCard icon={UsersIcon} title={t('scheduledActivities.detail.students', 'Students Coverage')}>
                        {students.length > 0 ? (
                            <div className="space-y-3">
                                {students.map((student, index) => (
                                    <div key={student?.id ?? student?.student_id ?? student ?? index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
                                        {getPersonLabel(student, t('scheduledActivities.detail.studentId', 'Student ID'), currentLang, t)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{t('scheduledActivities.detail.none', 'None assigned')}</p>
                        )}
                    </DetailCard>
                </div>

                <div className="space-y-6">
                    <DetailCard icon={TeacherIcon} title={t('scheduledActivities.detail.assignment', 'Assignment')}>
                        <InfoRow
                            label={t('scheduledActivities.responsible', 'Responsible Side')}
                            value={t(`scheduledActivities.responsibleOptions.${activity?.responsible === 'general_management' ? 'generalManagement' : activity?.responsible}`, activity?.responsible ?? '-')}
                        />
                        {activity?.created_by ? (
                            <InfoRow
                                label={t('scheduledActivities.detail.createdBy', 'Created By')}
                                value={getPersonLabel(activity.created_by, t('scheduledActivities.detail.teacherId', 'Teacher ID'), currentLang, t)}
                            />
                        ) : null}
                        {activity?.updated_by ? (
                            <InfoRow
                                label={t('scheduledActivities.detail.updatedBy', 'Updated By')}
                                value={getPersonLabel(activity.updated_by, t('scheduledActivities.detail.teacherId', 'Teacher ID'), currentLang, t)}
                            />
                        ) : null}
                    </DetailCard>

                    <DetailCard icon={TeacherIcon} title={t('scheduledActivities.detail.teachers', 'Teachers')}>
                        {teachers.length > 0 ? (
                            <div className="space-y-3">
                                {teachers.map((teacher, index) => (
                                    <div key={teacher?.id ?? teacher ?? index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
                                        {getPersonLabel(teacher, t('scheduledActivities.detail.teacherId', 'Teacher ID'), currentLang, t)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{t('scheduledActivities.detail.none', 'None assigned')}</p>
                        )}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

export default ScheduledActivityDetailPage;
