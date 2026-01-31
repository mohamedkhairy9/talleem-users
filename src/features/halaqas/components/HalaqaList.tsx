import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Table } from '@/globals/components';
import { TableColumn } from '@/globals/types';
import { EyeIcon, EditIcon, TrashIcon } from '@/globals/icons';
import { useHalaqas } from '../hooks/useHalaqas';
import { useDeleteHalaqa } from '../hooks/useHalaqas';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

/** Bilingual name from API */
interface BilingualName {
    en?: string;
    ar?: string;
}

interface Halaqa {
    id: number;
    name?: BilingualName;
    memorization_program_entity_type?: {
        id: number;
        name?: BilingualName;
        code?: number;
    };
    period?: string;
    teacher?: {
        id: number;
        name?: BilingualName;
    };
    start_date?: string;
    end_date?: string;
    duration_in_days?: number;
    teaching_method?: string;
    platform?: {
        id: number;
        name?: BilingualName;
    };
    max_students?: number;
    current_students_count?: number;
    activities?: string[];
    session_time?: string;
    session_from?: string;
    session_to?: string;
    students?: Array<{ id: number; name?: BilingualName; joined_at?: string }>;
    [key: string]: any;
}

interface HalaqaListProps {
    filters?: Record<string, any>;
}

/**
 * Halaqa List Component
 * Displays halaqas in a table format
 */
const HalaqaList: React.FC<HalaqaListProps> = ({ filters = {} }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();
    const queryClient = useQueryClient();
    const currentLang = i18n.language || lang || 'en';
    
    const { data, isLoading, error } = useHalaqas(filters);
    const deleteMutation = useDeleteHalaqa();

    const halaqas: Halaqa[] = data?.data?.data || data?.data || data || [];

    const getLocalizedText = (obj: BilingualName | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (!obj) return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    const formatActivities = (activities: string[] | undefined): string => {
        if (!activities?.length) return '-';
        return activities.map((a) => t(`halaqa.activity.${a}`, a)).join(', ');
    };

    const handleView = (id: number) => {
        navigate(`/${lang || currentLang}/halaqas/${id}`);
    };

    const handleEdit = (id: number) => {
        navigate(`/${lang || currentLang}/halaqas/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('halaqa.deleteConfirm', 'Are you sure you want to delete this halaqa?'))) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    toast.success(t('halaqa.deleteSuccess', 'Halaqa deleted successfully'));
                    queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('halaqa.deleteError', 'Error deleting halaqa'));
                }
            });
        }
    };

    const columns: TableColumn<Halaqa>[] = [
        {
            header: t('halaqa.name', 'Name'),
            accessor: (row) => getLocalizedText(row.name)
        },
        {
            header: t('halaqa.teacher', 'Teacher'),
            accessor: (row) => getLocalizedText(row.teacher?.name)
        },
        {
            header: t('halaqa.period', 'Period'),
            accessor: (row) => (row.period ? t(`halaqa.period.${row.period}`, row.period) : '-')
        },
        {
            header: t('halaqa.startDate', 'Start Date'),
            accessor: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : '-')
        },
        {
            header: t('halaqa.endDate', 'End Date'),
            accessor: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : '-')
        },
        {
            header: t('halaqa.sessionTime', 'Session Time'),
            accessor: (row) => row.session_time || '-'
        },
        {
            header: t('halaqa.activities', 'Activities'),
            accessor: (row) => formatActivities(row.activities)
        },
        {
            header: t('halaqa.platform', 'Platform'),
            accessor: (row) => getLocalizedText(row.platform?.name)
        },
        {
            header: t('halaqa.teachingMethod', 'Teaching Method'),
            accessor: (row) => {
                if (!row.teaching_method) return '-';
                const keyMap: Record<string, string> = {
                    in_person: 'inPerson',
                    remote: 'remote',
                    hybrid: 'hybrid'
                };
                const labelKey = keyMap[row.teaching_method] ?? row.teaching_method;
                return t(`halaqa.teachingMethod.${labelKey}`, row.teaching_method);
            }
        },
        {
            header: t('halaqa.students', 'Students'),
            accessor: (row) =>
                row.current_students_count ?? row.students?.length ?? row.max_students ?? '-'
        },
        {
            header: t('common.actions', 'Actions'),
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleView(row.id)}
                        className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        aria-label={t('common.view', 'View')}
                        title={t('common.view', 'View')}
                    >
                        <EyeIcon width={18} height={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleEdit(row.id)}
                        className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        aria-label={t('common.edit', 'Edit')}
                        title={t('common.edit', 'Edit')}
                    >
                        <EditIcon width={18} height={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('common.delete', 'Delete')}
                        title={t('common.delete', 'Delete')}
                    >
                        <TrashIcon width={18} height={18} />
                    </button>
                </div>
            )
        }
    ];

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('halaqa.loadError', 'Error loading halaqas. Please try again.')}
            </div>
        );
    }

    return (
        <Table
            columns={columns}
            data={halaqas}
            loading={isLoading}
            emptyMessage={t('halaqa.noHalaqas', 'No halaqas found')}
        />
    );
};

export default HalaqaList;

