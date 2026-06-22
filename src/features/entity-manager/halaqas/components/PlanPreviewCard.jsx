import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components';
import { BookOpenIcon, CheckIcon } from '@/shared/icons';
import { getJuzNumberForVerseKey, getVerseKeyDisplay } from '@/shared/utils/helpers/surahHelper';

const SummaryStat = ({ label, value, accent = false }) => (
    <div className={`rounded-[18px] border px-4 py-3 ${accent ? 'border-white/10 bg-white/10 text-white' : 'border-[#0f6c6a]/10 bg-[#0f6c6a]/15 text-white/90'}`}>
        <p className="text-xs text-white/70">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
);

/**
 * Displays plan preview data (from API with save_or_not: 0): start/end verse with surah name, ayah, juz;
 * days info; overflow/empty-day warnings; Confirm & Save, Back to edit, View in Mushaf actions.
 */
const PlanPreviewCard = ({ planPreviewData, surahData, currentLang, isSaving, onConfirmSave, onBackToEdit, onViewInMushaf, planPreviewRef, wizardMode = false, activityLabel = '' }) => {
    const { t, i18n } = useTranslation();
    const isArabic = (currentLang || i18n.language) === 'ar';
    const copy = (arabicText, englishText) => (isArabic ? arabicText : englishText);
    const isStartEndPlan = planPreviewData.plan_type === 'start_end';
    const daysNeeded = planPreviewData.days_needed ?? 0;
    const availableDays = planPreviewData.available_study_days ?? 0;
    const isOverflow = isStartEndPlan && daysNeeded > availableDays;
    const hasEmptyDays = isStartEndPlan && daysNeeded < availableDays;
    const canConfirmSave = !isOverflow;
    const hasApiWarning = Boolean(planPreviewData.warning);
    const totalSegments = planPreviewData.total_segments ?? 0;

    const formatVerseKeyForDisplay = (verseKey) => {
        if (!verseKey?.trim()) {
            return verseKey ?? '—';
        }

        const display = getVerseKeyDisplay(verseKey.trim(), surahData, currentLang);
        const juz = getJuzNumberForVerseKey(verseKey);

        if (display) {
            return `${display.surahName} • ${t('quran.ayah', 'Ayah')} ${display.ayahNumber} • ${t('quran.juzShort', { number: juz })}`;
        }

        return verseKey;
    };

    const startDisplay = formatVerseKeyForDisplay(planPreviewData.start_verse_key ?? undefined);
    const endKey = planPreviewData.end_verse_key ?? planPreviewData.computed_last_verse_key ?? undefined;
    const endDisplay = formatVerseKeyForDisplay(endKey);

    return (
        <div
            ref={planPreviewRef}
            className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#0e5557_0%,#063b3d_100%)] p-5 text-white shadow-[0_28px_60px_-35px_rgba(6,59,61,0.95)] md:p-6"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                        <CheckIcon width={12} height={12} />
                        <span>{t('plan.previewTitle', copy('ملخص الخطة', 'Plan Summary'))}</span>
                    </div>
                    {activityLabel ? (
                        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                            {activityLabel}
                        </div>
                    ) : null}
                    <h3 className="text-xl font-semibold">
                        {wizardMode
                            ? copy('مراجعة واعتماد الخطة', 'Review and Approve the Plan')
                            : copy('ملخص الخطة', 'Plan Summary')}
                    </h3>
                    <p className="max-w-2xl text-sm text-white/75">
                        {copy('راجع الملخص التالي قبل اعتماد الخطة النهائية للطلاب.', 'Review the following summary before confirming the final plan for the students.')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onViewInMushaf}
                    className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                    <BookOpenIcon width={16} height={16} />
                    <span>{t('quran.viewFullPlan', copy('عرض كامل الخطة في المصحف', 'View Full Plan in Mushaf'))}</span>
                </button>
            </div>

            <div className={`mt-5 grid gap-4 ${isStartEndPlan ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <p className="text-xs text-white/65">{t('quran.startSegment', copy('بداية الخطة', 'Plan Start'))}</p>
                    <p className="mt-2 text-base font-semibold leading-7">{startDisplay}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <p className="text-xs text-white/65">
                        {isStartEndPlan
                            ? t('quran.endSegment', copy('نهاية الخطة', 'Plan End'))
                            : t('plan.computedEnd', copy('نهاية الخطة المتوقعة', 'Computed Plan End'))}
                    </p>
                    <p className="mt-2 text-base font-semibold leading-7">{endDisplay}</p>
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
                <SummaryStat label={t('plan.totalSegments', copy('إجمالي المقاطع', 'Total Segments'))} value={String(totalSegments)} accent />
                <SummaryStat label={t('plan.days', copy('عدد الأيام', 'Days Needed'))} value={String(daysNeeded || planPreviewData.daily_schedule?.length || 0)} />
                <SummaryStat label={copy('الأيام المتاحة', 'Available Days')} value={String(availableDays || planPreviewData.daily_schedule?.length || 0)} />
                <SummaryStat
                    label={isStartEndPlan ? copy('نوع الخطة', 'Plan Type') : copy('المقدار اليومي', 'Daily Amount')}
                    value={isStartEndPlan
                        ? copy('البداية والنهاية', 'Start and End')
                        : String(planPreviewData.daily_amount ?? planPreviewData.requested_daily_amount ?? '—')}
                />
            </div>

            {planPreviewData.daily_schedule?.length > 0 ? (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <p className="text-sm font-medium text-white/80">
                        {t('plan.dailySchedule', copy('الجدول اليومي', 'Daily Schedule'))}: {planPreviewData.daily_schedule.length} {t('plan.days', copy('أيام', 'days'))}
                    </p>
                    {hasEmptyDays ? (
                        <p className="mt-2 text-xs text-amber-200">{t('plan.hasEmptyDays', copy('يوجد أيام فارغة داخل الخطة الحالية.', 'There are empty days in the current plan.'))}</p>
                    ) : null}
                </div>
            ) : null}

            {isOverflow ? (
                <div className="mt-5 rounded-[24px] border border-rose-300/40 bg-rose-500/12 p-4 text-rose-100">
                    <p className="text-sm font-semibold">
                        {t('plan.errorPlanDoesNotFit', { daysNeeded, availableDays })}
                    </p>
                    {hasApiWarning ? <p className="mt-2 text-sm text-rose-100/85">{planPreviewData.warning}</p> : null}
                </div>
            ) : null}

            {hasEmptyDays && !isOverflow ? (
                <div className="mt-5 rounded-[24px] border border-amber-300/40 bg-amber-500/12 p-4 text-amber-100">
                    <p className="text-sm font-semibold">{t('plan.warningEmptyDays', copy('يوجد أيام بدون مهام. يمكنك الحفظ رغم ذلك.', 'There will be empty days. You can still save the plan.'))}</p>
                    {hasApiWarning ? <p className="mt-2 text-sm text-amber-100/85">{planPreviewData.warning}</p> : null}
                </div>
            ) : null}

            {hasApiWarning && !isOverflow && !hasEmptyDays ? (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4 text-sm text-white/80">
                    {planPreviewData.warning}
                </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                    type="button"
                    variant="outline"
                    loading={isSaving}
                    disabled={isSaving || !canConfirmSave}
                    onClick={onConfirmSave}
                    className="rounded-[18px] border-white/20 bg-transparent px-5 py-3 text-white hover:bg-white/10"
                >
                    {isSaving
                        ? t('common.loading', copy('جارٍ الحفظ...', 'Saving...'))
                        : wizardMode
                            ? copy('اعتماد الخطة', 'Approve Plan')
                            : t('plan.confirmAndSave', copy('اعتماد الخطة وحفظها', 'Confirm and Save'))}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={onBackToEdit}
                    className="rounded-[18px] border-white/20 bg-transparent px-5 py-3 text-white hover:bg-white/10"
                >
                    {wizardMode
                        ? copy('العودة للتخصيص', 'Back to Customize')
                        : t('plan.backToEdit', copy('العودة للتعديل', 'Back to Edit'))}
                </Button>
            </div>
        </div>
    );
};

export default PlanPreviewCard;
