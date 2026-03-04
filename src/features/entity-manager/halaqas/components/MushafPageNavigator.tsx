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

    const options = useMemo(() => {
        const list = pageNumbers ?? Array.from({ length: 604 }, (_, i) => i + 1);
        return list.map((pageNum) => {
            const surahNum = getSurahNumberForPage(pageNum, mushafPages);
            const juz = getJuzForPage(pageNum, juzPages);
            const surahName = getSurahNameForPage(surahNum, surahData, lang) || `Surah ${surahNum}`;
            const label = `${t('quran.page', 'Page')} ${pageNum} — ${surahName} — ${t('quran.juz', 'Juz')} ${juz}`;
            return { value: pageNum, label };
        });
    }, [mushafPages, juzPages, surahData, lang, pageNumbers, t]);

    if (loading) {
        return (
            <span className={`text-sm text-gray-500 ${className}`}>
                {t('common.loading', 'Loading...')}
            </span>
        );
    }

    return (
        <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[12rem] max-w-full ${className}`}
            aria-label={t('quran.selectPage', 'Select page')}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

export default MushafPageNavigator;
