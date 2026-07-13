import { getJuzFirstVerseKey, getJuzLastVerseKey } from '@/shared/utils/helpers/surahHelper';

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeExamType(examType) {
    return typeof examType === 'string' ? examType.trim().toLowerCase() : '';
}

function normalizeJuzNumber(value) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 30) {
        return null;
    }

    return parsedValue;
}

function normalizeJuzNumbers(values) {
    return [...new Set(
        normalizeArray(values)
            .map(normalizeJuzNumber)
            .filter(Boolean)
    )].sort((left, right) => left - right);
}

function getSubmissionSegmentId(segment, fallbackValue) {
    return segment?.id ??
        segment?.segment_id ??
        segment?.quran_exam_segment_item_id ??
        fallbackValue;
}

function normalizeDefaultSegments(rawSegments, fallbackJuzNumbers = []) {
    if (rawSegments.length > 0) {
        return rawSegments.map((segment, index) => ({
            id: segment?.id ?? segment?.segment_id ?? segment?.juz_number ?? index + 1,
            submissionSegmentId: getSubmissionSegmentId(segment, index + 1),
            order: segment?.order ?? index + 1,
            juz_number: segment?.juz_number ?? segment?.id ?? segment?.segment_id ?? index + 1,
            first_verse_key: segment?.first_verse_key ?? null,
            last_verse_key: segment?.last_verse_key || null,
            column_total: segment?.column_total ?? 0,
            quran_exam_segment_item_id: segment?.quran_exam_segment_item_id ?? null
        }));
    }

    return fallbackJuzNumbers.map((juzNumber, index) => ({
        id: juzNumber,
        submissionSegmentId: juzNumber,
        order: index + 1,
        juz_number: juzNumber,
        first_verse_key: null,
        last_verse_key: null,
        column_total: 0,
        quran_exam_segment_item_id: null
    }));
}

function normalizeRecitationSegments(rawSegments, juzNumbers) {
    return juzNumbers.map((juzNumber, index) => {
        const rawSegment = rawSegments[index] ?? null;

        return {
            id: rawSegment?.id ?? rawSegment?.segment_id ?? `juz-${juzNumber}`,
            submissionSegmentId: getSubmissionSegmentId(rawSegment, juzNumber),
            order: index + 1,
            juz_number: juzNumber,
            first_verse_key: getJuzFirstVerseKey(juzNumber),
            last_verse_key: getJuzLastVerseKey(juzNumber),
            column_total: rawSegment?.column_total ?? 0,
            quran_exam_segment_item_id: rawSegment?.quran_exam_segment_item_id ?? null
        };
    });
}

export function getExamConductionSegments({
    examType,
    rawSegments,
    studentJuzNumbers,
    fallbackJuzNumbers
}) {
    const normalizedRawSegments = normalizeArray(rawSegments);
    const normalizedFallbackJuzNumbers = normalizeJuzNumbers(fallbackJuzNumbers);
    const normalizedStudentJuzNumbers = normalizeJuzNumbers(studentJuzNumbers);
    const effectiveJuzNumbers = normalizedStudentJuzNumbers.length > 0
        ? normalizedStudentJuzNumbers
        : normalizedFallbackJuzNumbers;

    if (normalizeExamType(examType) === 'sard' && effectiveJuzNumbers.length > 0) {
        return normalizeRecitationSegments(normalizedRawSegments, effectiveJuzNumbers);
    }

    return normalizeDefaultSegments(normalizedRawSegments, effectiveJuzNumbers);
}

export function getExamConductionSegmentPayloadId(segment) {
    return segment?.submissionSegmentId ??
        segment?.id ??
        segment?.segment_id ??
        segment?.quran_exam_segment_item_id ??
        null;
}
