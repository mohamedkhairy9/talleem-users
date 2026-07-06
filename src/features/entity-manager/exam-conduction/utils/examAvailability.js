function getGregorianExamDateValue(examDate) {
    if (!examDate) {
        return '';
    }

    if (typeof examDate === 'string') {
        return examDate.trim().slice(0, 10);
    }

    if (typeof examDate === 'object') {
        const gregorianValue = examDate.gregorian ?? examDate.date ?? examDate.value ?? '';
        return typeof gregorianValue === 'string' ? gregorianValue.trim().slice(0, 10) : '';
    }

    return '';
}

function parseTimeValue(timeValue) {
    if (typeof timeValue !== 'string' || !timeValue.trim()) {
        return null;
    }

    const [hoursString = '0', minutesString = '0', secondsString = '0'] = timeValue.trim().split(':');
    const hours = Number(hoursString);
    const minutes = Number(minutesString);
    const seconds = Number(secondsString);

    if (![hours, minutes, seconds].every(Number.isFinite)) {
        return null;
    }

    return { hours, minutes, seconds };
}

function buildLocalDateTime(dateValue, timeValue) {
    const normalizedDate = getGregorianExamDateValue(dateValue);
    const parsedTime = parseTimeValue(timeValue);

    if (!normalizedDate || !parsedTime) {
        return null;
    }

    const [yearString, monthString, dayString] = normalizedDate.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);

    if (![year, month, day].every(Number.isFinite)) {
        return null;
    }

    return new Date(
        year,
        month - 1,
        day,
        parsedTime.hours,
        parsedTime.minutes,
        parsedTime.seconds
    );
}

function normalizeMinutes(value) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function isSameCalendarDay(left, right) {
    return left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate();
}

function formatWindowDateTime(date, lang, includeDate = false) {
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
        ...(includeDate ? { year: 'numeric', month: '2-digit', day: '2-digit' } : {}),
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
}

export function getExamConductionWindow(exam, options = {}) {
    const beforeMinutes = normalizeMinutes(options.beforeMinutes);
    const afterMinutes = normalizeMinutes(options.afterMinutes);
    const scheduledStart = buildLocalDateTime(exam?.exam_date, exam?.time_from);
    const scheduledEnd = buildLocalDateTime(exam?.exam_date, exam?.time_to);

    if (!scheduledStart || !scheduledEnd) {
        return null;
    }

    return {
        scheduledStart,
        scheduledEnd,
        allowedStart: new Date(scheduledStart.getTime() - (beforeMinutes * 60 * 1000)),
        allowedEnd: new Date(scheduledEnd.getTime() + (afterMinutes * 60 * 1000)),
        beforeMinutes,
        afterMinutes
    };
}

export function getExamConductionAvailability(exam, options = {}) {
    const fallbackAvailability = Boolean(exam?.available);
    const window = getExamConductionWindow(exam, options);

    if (!window) {
        return {
            isAvailable: fallbackAvailability,
            source: 'fallback',
            window: null
        };
    }

    const now = options.now instanceof Date ? options.now : new Date();

    return {
        isAvailable: now >= window.allowedStart && now <= window.allowedEnd,
        source: 'configuration',
        window
    };
}

export function formatExamConductionWindow(window, lang = 'ar') {
    if (!window?.allowedStart || !window?.allowedEnd) {
        return '-';
    }

    const includeDate = !isSameCalendarDay(window.allowedStart, window.allowedEnd);

    return `${formatWindowDateTime(window.allowedStart, lang, includeDate)} - ${formatWindowDateTime(window.allowedEnd, lang, includeDate)}`;
}
