import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Table, Pagination } from '@/shared/components';
import { SearchIcon, SettingsIcon, XIcon } from '@/shared/icons';
import ReactSelectComponent from '@/shared/components/ui/ReactSelect';
import { useHalaqas, useDeleteHalaqa } from '../hooks/useHalaqas';
import { useHalaqasListState } from '../hooks/useHalaqasListState';
import { HalaqaListMobile } from './HalaqaListMobile';
import JoinHalaqaStudentModal from './JoinHalaqaStudentModal';
import { HALAQA_PERIODS, HALAQA_TEACHING_METHODS, createHalaqaListColumns } from '../config';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useConfirmationModal } from '@/shared/hooks/useConfirmationModal';
import { useDateFormatStore } from '@/app/stores';
import { PlusIcon } from '@/shared/icons';

const getHalaqaRowId = (row) =>
    row?.id ??
    row?.halaqa?.id ??
    row?.halaqa_id ??
    row?.memorization_halaqa_id ??
    row?.memorization_ring_id ??
    null;
/**
 * Halaqa List Component
 * Pagination and filters are synced with URL search params (?page=2&search=...&period=...).
 */
const HalaqaList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const { lang } = useParams();
    const queryClient = useQueryClient();
    const currentLang = i18n.language || lang || 'ar';
    const { showConfirmation } = useConfirmationModal();
    const listState = useHalaqasListState();
    const { params, page, perPage, search, period, teachingMethod, setPage, setSearch, setPeriod, setTeachingMethod, resetFilters } = listState;
    const { list, meta, isLoading, error } = useHalaqas(params);
    const deleteMutation = useDeleteHalaqa();
    // Pagination from API meta (current_page, per_page, total, last_page)
    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;
    const hasActiveFilters = !!(search.trim() || period || teachingMethod);
    const [localSearch, setLocalSearch] = useState(search);
    const [selectedJoinHalaqa, setSelectedJoinHalaqa] = useState(null);
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);
    useEffect(() => {
        if (localSearch.trim() === search.trim())
            return;
        const timer = setTimeout(() => {
            setSearch(localSearch);
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch, search, setSearch]);
    useEffect(() => {
        console.log('Halaqa pagination state debug:', {
            params,
            pageFromUrl: page,
            perPage,
            meta,
            currentPage,
            totalPages,
            total,
            listLength: list.length
        });
    }, [params, page, perPage, meta, currentPage, totalPages, total, list.length]);
    const periodOptions = [
        { value: '', label: t('common.all', 'All') },
        ...HALAQA_PERIODS.map((p) => ({ value: p.value, label: t(p.labelKey, p.value) }))
    ];
    const teachingMethodOptions = [
        { value: '', label: t('common.all', 'All') },
        ...HALAQA_TEACHING_METHODS.map((m) => ({ value: m.value, label: t(m.labelKey, m.value) }))
    ];
    const getLocalizedText = (obj) => {
        if (typeof obj === 'string')
            return obj;
        if (!obj)
            return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar)
            return obj.ar;
        if (obj.en)
            return obj.en;
        return t('common.not_available', 'N/A');
    };
    const formatActivities = (activities) => {
        if (!activities?.length)
            return '-';
        return activities.map((a) => t(`halaqa.activity.${a}`, a)).join(', ');
    };
    const handleView = (id) => {
        if (!id) {
            console.warn('Unable to navigate to halaqa detail: missing halaqa id');
            toast.error(t('halaqa.notFound', 'Halaqa not found'));
            return;
        }
        navigate(`/${lang || currentLang}/halaqas/${id}`);
    };
    const handleEdit = (id) => {
        if (!id) {
            console.warn('Unable to navigate to halaqa edit: missing halaqa id');
            toast.error(t('halaqa.notFound', 'Halaqa not found'));
            return;
        }
        navigate(`/${lang || currentLang}/halaqas/${id}/edit`);
    };
    
    const handleDelete = async (id) => {
        if (!id) {
            console.warn('Unable to delete halaqa: missing halaqa id');
            toast.error(t('halaqa.notFound', 'Halaqa not found'));
            return;
        }
        showConfirmation({
            title: t('halaqa.deleteTitle', 'Delete Halaqa'),
            message: t('halaqa.deleteConfirm', 'Are you sure you want to delete this halaqa?'),
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger',
            onConfirm: () => {
                deleteMutation.mutate(id, {
                    onSuccess: () => {
                        toast.success(t('halaqa.deleteSuccess', 'Halaqa deleted successfully'));
                        queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                    },
                    onError: (error) => {
                        toast.error(error?.message || t('halaqa.deleteError', 'Error deleting halaqa'));
                    }
                });
            }
        });
    };

    const handleJoinStudentAfterStart = (row) => {
        const id = getHalaqaRowId(row);

        if (!id) {
            toast.error(t('halaqa.notFound', 'Halaqa not found'));
            return;
        }

        setSelectedJoinHalaqa({
            id,
            name: row?.name
        });
    };

    const columns = createHalaqaListColumns({
        t,
        getLocalizedText,
        formatActivities
    });
    if (error) {
        return (<div className="text-center py-12 text-red-600">
                {t('halaqa.loadError', 'Error loading halaqas. Please try again.')}
            </div>);
    }
    
    return (<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Filters bar */}
            <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm mb-4">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500"/>
                    <span className="text-sm font-semibold text-gray-700">
                        {t('common.filters', 'Filters')}
                    </span>
                    {hasActiveFilters && (<span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {t('common.active', 'Active')}
                        </span>)}
                </div>
                {/* Shared filter control: min-h-[48px], bg-white, border-gray-300, rounded-lg */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                    {/* Search (debounced 400ms) */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('common.search', 'Search')}
                        </label>
                        <div className="relative min-h-[48px]">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                <SearchIcon width={18} height={18}/>
                            </span>
                            <input type="text" placeholder={t('common.searchPlaceholder', 'Search halaqas...')} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"/>
                        </div>
                    </div>
                    {/* Period */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('halaqa.period', 'Period')}
                        </label>
                        <ReactSelectComponent value={period} onChange={(v) => setPeriod(v !== null && v !== undefined ? String(v) : '')} options={periodOptions} placeholder={t('common.all', 'All')} className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"/>
                    </div>
                    {/* Teaching method */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('halaqa.teachingMethod', 'Teaching Method')}
                        </label>
                        <ReactSelectComponent value={teachingMethod} onChange={(v) => setTeachingMethod(v !== null && v !== undefined ? String(v) : '')} options={teachingMethodOptions} placeholder={t('common.all', 'All')} className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"/>
                    </div>
                    {/* Reset */}
                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                        <button type="button" onClick={resetFilters} disabled={!hasActiveFilters} className="h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white">
                            <XIcon width={16} height={16}/>
                            {t('common.resetFilters', 'Reset filters')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: cards - min-h-[280px] keeps area visible on small screens */}
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <HalaqaListMobile list={list} isLoading={isLoading} hasError={!!error} errorMessage={error ? t('halaqa.loadError', 'Error loading halaqas.') : undefined} emptyMessage={t('halaqa.noHalaqas', 'No halaqas found')} getLocalizedText={getLocalizedText} formatActivities={formatActivities} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onJoinStudentAfterStart={handleJoinStudentAfterStart} isDeleting={deleteMutation.isPending}/>
                </div>
                {totalPages > 1 && (<div className="flex-shrink-0 pt-3">
                        <Pagination currentPage={currentPage} totalPages={totalPages} perPage={meta?.per_page ?? perPage} total={total} onPageChange={setPage}/>
                    </div>)}
            </div>

            {/* Desktop: table with scroll */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table columns={columns} data={list} loading={isLoading} emptyMessage={t('halaqa.noHalaqas', 'No halaqas found')} scrollable actionButtons={{
            showView: true,
            showEdit: true,
            showDelete: true,
            customActions: [
                {
                    key: 'join-student-after-start',
                    // label: t('halaqa.joinStudentAfterStart', 'التحاق الطلاب بعد البداية'),
                    title: t('halaqa.joinStudentAfterStart', 'التحاق الطلاب بعد البداية'),
                    icon: PlusIcon,
                    onClick: handleJoinStudentAfterStart
                }
            ],
            onView: (row) => handleView(getHalaqaRowId(row)),
            onEdit: (row) => handleEdit(getHalaqaRowId(row)),
            onDelete: (row) => handleDelete(getHalaqaRowId(row)),
            isDeleting: deleteMutation.isPending,
            getRowId: (row) => getHalaqaRowId(row)
        }}/>
                </div>
                {totalPages > 1 && (<div className="flex-shrink-0 pt-3">
                        <Pagination currentPage={currentPage} totalPages={totalPages} perPage={meta?.per_page ?? perPage} total={total} onPageChange={setPage}/>
                    </div>)}
            </div>

            <JoinHalaqaStudentModal
                isOpen={Boolean(selectedJoinHalaqa?.id)}
                halaqaId={selectedJoinHalaqa?.id}
                halaqaName={getLocalizedText(selectedJoinHalaqa?.name)}
                onClose={() => setSelectedJoinHalaqa(null)}
            />
        </div>);
};
export default HalaqaList;
