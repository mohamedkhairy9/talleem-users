import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    loadMushafPages,
    loadJuzPages,
    loadSurahData,
    getSurahNumberForPage,
    getJuzForPage,
    getSurahNameForPage,
    type MushafPageEntry,
    type JuzPageEntry,
    type SurahDataMap
} from '@/utils/helpers/surahHelper';
import { ReactSelect } from '@/globals/components';
import { ChevronRightIcon } from '@/globals/icons';

interface MushafPageNavigatorProps {
    value: number;
    onChange: (page: number) => void;
    /** Optional: restrict options to these page numbers (e.g. plan pages). If not set, 1–604. */
    pageNumbers?: number[];
    className?: string;
    disabled?: boolean;
}

/**
 * Dropdown to select a mushaf page (1–604). Each option shows localized surah name and juz number.
 */
const MushafPageNavigator: React.FC<MushafPageNavigatorProps> = ({
    value,
    onChange,
    pageNumbers,
    className = '',
    disabled = false
}) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'ar';
    const isRtl = lang.startsWith('ar');
    const [mushafPages, setMushafPages] = useState<MushafPageEntry[]>([]);
    const [juzPages, setJuzPages] = useState<JuzPageEntry[]>([]);
    const [surahData, setSurahData] = useState<SurahDataMap | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([loadMushafPages(), loadJuzPages(), loadSurahData()])
            .then(([mPages, jPages, sData]) => {
                if (cancelled) return;
                setMushafPages(mPages);
                setJuzPages(jPages);
                setSurahData(sData);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const sortedPages = useMemo(() => {
        const list = pageNumbers?.length ? [...pageNumbers] : Array.from({ length: 604 }, (_, i) => i + 1);
        return [...new Set(list)].sort((a, b) => a - b);
    }, [pageNumbers]);

    const pageIndex = sortedPages.indexOf(value);
    const canGoPrev = pageIndex > 0;
    const canGoNext = pageIndex >= 0 && pageIndex < sortedPages.length - 1;

    const goPrev = () => {
        if (!canGoPrev) return;
        onChange(sortedPages[pageIndex - 1]);
    };
    const goNext = () => {
        if (!canGoNext) return;
        onChange(sortedPages[pageIndex + 1]);
    };

    const options = useMemo(() => {
        return sortedPages.map((pageNum) => {
            const surahNum = getSurahNumberForPage(pageNum, mushafPages);
            const juz = getJuzForPage(pageNum, juzPages);
            const surahName = getSurahNameForPage(surahNum, surahData, lang) || `Surah ${surahNum}`;
            const label = `${t('quran.page', 'Page')} ${pageNum} — ${surahName} — ${t('quran.juz', 'Juz')} ${juz}`;
            return { value: pageNum, label };
        });
    }, [mushafPages, juzPages, surahData, lang, sortedPages, t]);

    if (loading) {
        return (
            <span className={`text-sm text-gray-500 ${className}`}>
                {t('common.loading', 'Loading...')}
            </span>
        );
    }

    const navBtn =
        'flex items-center justify-center w-10 h-10 shrink-0 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors';

    return (
        <div className={`flex items-center gap-2 min-w-0 max-w-full ${isRtl ? 'flex-row-reverse' : ''} ${className}`}>
            <button
                type="button"
                onClick={goNext}
                disabled={disabled || !canGoNext}
                className={navBtn}
                aria-label={t('quran.nextPage', 'Next page')}
            >
                <ChevronRightIcon width={20} height={20} className={isRtl ? 'rotate-180' : ''} />
            </button>
            <div className="min-w-0 flex-1">
                <ReactSelect
                    value={value}
                    onChange={(val) => onChange(val != null ? Number(val) : value)}
                    options={options}
                    placeholder={t('quran.selectPage', 'Select page')}
                    isDisabled={disabled}
                />
            </div>
            <button
                type="button"
                onClick={goPrev}
                disabled={disabled || !canGoPrev}
                className={navBtn}
                aria-label={t('quran.previousPage', 'Previous page')}
            >
                <ChevronRightIcon width={20} height={20} className={isRtl ? '' : 'rotate-180'} />
            </button>
        </div>
    );
};

export default MushafPageNavigator;
