import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Table } from '@/globals/components';
import { TableColumn } from '@/globals/types';
import { Button } from '@/globals/components';
import { useHalaqas } from '../hooks/useHalaqas';
import { useDeleteHalaqa } from '../hooks/useHalaqas';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

interface Halaqa {
    id: number;
    name?: {
        en?: string;
        ar?: string;
    };
    teacher?: {
        id: number;
        name?: string;
        email?: string;
    };
    period?: string;
    start_date?: string;
    end_date?: string;
    activities?: string[];
    students_count?: number;
    session_time?: string;
    teaching_method?: string;
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

    const getLocalizedText = (obj: { en?: string; ar?: string } | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (obj && currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj && obj.en) return obj.en;
        return t('common.not_available', 'N/A');
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
            accessor: (row) => row.teacher?.name || row.teacher?.email || t('common.not_available', 'N/A')
        },
        {
            header: t('halaqa.period', 'Period'),
            accessor: (row) => row.period ? t(`halaqa.period.${row.period}`, row.period) : '-'
        },
        {
            header: t('halaqa.startDate', 'Start Date'),
            accessor: (row) => row.start_date ? new Date(row.start_date).toLocaleDateString() : '-'
        },
        {
            header: t('halaqa.endDate', 'End Date'),
            accessor: (row) => row.end_date ? new Date(row.end_date).toLocaleDateString() : '-'
        },
        {
            header: t('halaqa.students', 'Students'),
            accessor: (row) => row.students_count || row.students?.length || 0
        },
        {
            header: t('common.actions', 'Actions'),
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleView(row.id)}
                    >
                        {t('common.view', 'View')}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(row.id)}
                    >
                        {t('common.edit', 'Edit')}
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        disabled={deleteMutation.isPending}
                    >
                        {t('common.delete', 'Delete')}
                    </Button>
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

