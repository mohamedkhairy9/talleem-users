import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/globals/components';
import { BookOpenIcon } from '@/globals/icons';
import { getVerseKeyDisplay, getJuzNumberForVerseKey } from '@/utils/helpers/surahHelper';
/**
 * Displays plan preview data (from API with save_or_not: 0): start/end verse with surah name, ayah, juz;
 * days info; overflow/empty-day warnings; Confirm & Save, Back to edit, View in Mushaf actions.
 */
const PlanPreviewCard = ({ planPreviewData, surahData, currentLang, isSaving, onConfirmSave, onBackToEdit, onViewInMushaf, planPreviewRef }) => {
    const { t } = useTranslation();
    const isStartEndPlan = planPreviewData.plan_type === 'start_end';
    const daysNeeded = planPreviewData.days_needed ?? 0;
    const availableDays = planPreviewData.available_study_days ?? 0;
    const isOverflow = isStartEndPlan && daysNeeded > availableDays;
    const hasEmptyDays = isStartEndPlan && daysNeeded < availableDays;
    const canConfirmSave = !isOverflow;
    const hasApiWarning = !!planPreviewData.warning;
    const totalSegments = planPreviewData.total_segments ?? 0;
    const formatVerseKeyForDisplay = (verseKey) => {
        if (!verseKey?.trim())
            return verseKey ?? '—';
        const display = getVerseKeyDisplay(verseKey.trim(), surahData, currentLang);
        const juz = getJuzNumberForVerseKey(verseKey);
        if (display)
            return `${display.surahName}, ${t('quran.ayah', 'Ayah')} ${display.ayahNumber} · ${t('quran.juzShort', { number: juz })}`;
        return verseKey;
    };
    const startDisplay = formatVerseKeyForDisplay(planPreviewData.start_verse_key ?? undefined);
    const endKey = planPreviewData.end_verse_key ?? planPreviewData.computed_last_verse_key ?? undefined;
    const endDisplay = formatVerseKeyForDisplay(endKey);
    return (<div ref={planPreviewRef} className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-primary-900">
                {t('plan.previewTitle', 'Plan preview (not created yet)')}
            </h3>
            <p className="text-sm text-primary-800">
                {t('plan.totalSegments', 'Total segments')}: <strong>{totalSegments}</strong>
            </p>
            {planPreviewData.plan_type === 'start_end' ? (<>
                    <p className="text-sm text-primary-800">
                        {t('quran.startSegment', 'Start')}: <strong>{startDisplay}</strong>
                    </p>
                    <p className="text-sm text-primary-800">
                        {t('quran.endSegment', 'End')}: <strong>{endDisplay}</strong>
                    </p>
                </>) : (<p className="text-sm text-primary-800">
                    {t('plan.computedEnd', 'Computed end')}: <strong>{endDisplay}</strong>
                </p>)}
            {planPreviewData.daily_schedule?.length > 0 && (<div className="text-xs text-primary-700">
                    <span className="font-medium">{t('plan.dailySchedule', 'Daily schedule')}:</span>{' '}
                    {planPreviewData.daily_schedule.length} {t('plan.days', 'days')}
                    {hasEmptyDays && (<span className="ml-2 text-amber-700">({t('plan.hasEmptyDays', 'Has empty days')})</span>)}
                </div>)}
            {isOverflow && (<div className="rounded-lg border border-red-300 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">
                        {t('plan.errorPlanDoesNotFit', { daysNeeded, availableDays })}
                    </p>
                    {hasApiWarning && (<p className="text-sm text-red-700 mt-1">{planPreviewData.warning}</p>)}
                </div>)}
            {hasEmptyDays && !isOverflow && (<div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800">
                        {t('plan.warningEmptyDays', 'There will be empty days. You can still submit the plan.')}
                    </p>
                    {hasApiWarning && (<p className="text-sm text-amber-700 mt-1">{planPreviewData.warning}</p>)}
                </div>)}
            {hasApiWarning && !isOverflow && !hasEmptyDays && (<p className="text-sm text-amber-700">{planPreviewData.warning}</p>)}
            <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button type="button" variant="primary" loading={isSaving} disabled={isSaving || !canConfirmSave} onClick={onConfirmSave}>
                    {isSaving ? t('common.loading', 'Loading...') : t('plan.confirmAndSave', 'Confirm & Save')}
                </Button>
                <Button type="button" variant="secondary" disabled={isSaving} onClick={onBackToEdit}>
                    {t('plan.backToEdit', 'Back to edit')}
                </Button>
                <button type="button" onClick={onViewInMushaf} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors">
                    <BookOpenIcon width={18} height={18}/>
                    {t('quran.viewFullPlan', 'View Full Plan in Mushaf')}
                </button>
            </div>
        </div>);
};
export default PlanPreviewCard;
