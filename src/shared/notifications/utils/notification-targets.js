import { ROUTE_PATHS } from '@/config';

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const buildSources = (notification) => {
    const nestedData = notification?.data;
    const nestedPayload = notification?.payload;
    const nestedMeta = notification?.meta;

    return [
        nestedData,
        nestedPayload,
        nestedMeta,
        nestedData?.data,
        nestedPayload?.data,
        nestedData?.payload,
        nestedPayload?.payload,
        notification
    ].filter(Boolean);
};

const pickFirst = (sources, keys) => {
    for (const source of sources) {
        if (!isRecord(source)) {
            continue;
        }

        for (const key of keys) {
            const value = source[key];
            if (value !== undefined && value !== null && value !== '') {
                return value;
            }
        }
    }

    return null;
};

const getTargetType = (notification) => {
    const sources = buildSources(notification);
    const rawType = pickFirst(sources, [
        'target_type',
        'resource_type',
        'entity_type',
        'model_type',
        'notification_type',
        'screen',
        'module',
        'type'
    ]);

    return String(rawType ?? '').toLowerCase();
};

const getTargetId = (notification) => {
    const sources = buildSources(notification);

    const explicitId = pickFirst(sources, [
        'target_id',
        'resource_id',
        'entity_id',
        'reference_id',
        'item_id',
        'halaqa_id',
        'scheduled_exam_id',
        'exam_id',
        'join_request_id',
        'teacher_request_id',
        'request_id'
    ]);

    if (explicitId != null) {
        return explicitId;
    }

    const nestedRecords = [
        notification?.data?.halaqa,
        notification?.data?.scheduled_exam,
        notification?.data?.exam,
        notification?.data?.join_request,
        notification?.data?.teacher_request,
        notification?.data?.request,
        notification?.payload?.halaqa,
        notification?.payload?.scheduled_exam,
        notification?.payload?.exam,
        notification?.payload?.join_request,
        notification?.payload?.teacher_request,
        notification?.payload?.request
    ].filter(Boolean);

    return pickFirst(nestedRecords, ['id']);
};

export const extractNotificationTargetData = (notification) => {
    return (
        notification?.data?.join_request ??
        notification?.data?.teacher_request ??
        notification?.data?.request ??
        notification?.data?.scheduled_exam ??
        notification?.data?.exam ??
        notification?.data?.halaqa ??
        notification?.payload?.join_request ??
        notification?.payload?.teacher_request ??
        notification?.payload?.request ??
        notification?.payload?.scheduled_exam ??
        notification?.payload?.exam ??
        notification?.payload?.halaqa ??
        notification?.data?.data ??
        notification?.payload?.data ??
        null
    );
};

export const getNotificationDirectPath = (notification) => {
    const sources = buildSources(notification);

    const value = pickFirst(sources, [
        'path',
        'route',
        'url',
        'link',
        'action_url',
        'redirect_to',
        'target_url'
    ]);

    return typeof value === 'string' ? value : null;
};

const buildLocalizedPath = (lang, path) => `/${lang}/${path}`;

export const resolveNotificationTarget = ({ notification, lang, userRoles = [] }) => {
    const directPath = getNotificationDirectPath(notification);
    if (directPath) {
        return { path: directPath };
    }

    const targetType = getTargetType(notification);
    const targetId = getTargetId(notification);
    const hasTeacherRole = userRoles.includes('teacher');
    const hasEntityManagerRole = userRoles.includes('entity_manager');

    if (!targetType && targetId == null) {
        return null;
    }

    if ((targetType.includes('scheduled') && targetType.includes('exam')) || targetType === 'exam') {
        return targetId != null
            ? { path: buildLocalizedPath(lang, ROUTE_PATHS.SCHEDULED_EXAMS_DETAIL.replace(':id', String(targetId))) }
            : { path: buildLocalizedPath(lang, ROUTE_PATHS.SCHEDULED_EXAMS) };
    }

    if (targetType.includes('join') && targetType.includes('request')) {
        return targetId != null
            ? { path: `${buildLocalizedPath(lang, ROUTE_PATHS.JOIN_REQUESTS)}?requestId=${encodeURIComponent(String(targetId))}` }
            : { path: buildLocalizedPath(lang, ROUTE_PATHS.JOIN_REQUESTS) };
    }

    if (targetType.includes('teacher') && targetType.includes('request')) {
        return targetId != null
            ? { path: `${buildLocalizedPath(lang, ROUTE_PATHS.TEACHER_REQUESTS)}?requestId=${encodeURIComponent(String(targetId))}` }
            : { path: buildLocalizedPath(lang, ROUTE_PATHS.TEACHER_REQUESTS) };
    }

    if (targetType.includes('halaqa')) {
        if (hasEntityManagerRole) {
            return targetId != null
                ? { path: buildLocalizedPath(lang, ROUTE_PATHS.HALAQA_DETAIL.replace(':id', String(targetId))) }
                : { path: buildLocalizedPath(lang, ROUTE_PATHS.HALAQAS) };
        }

        if (hasTeacherRole) {
            return targetId != null
                ? { path: buildLocalizedPath(lang, ROUTE_PATHS.TEACHER_HALAQA_DETAIL.replace(':id', String(targetId))) }
                : { path: buildLocalizedPath(lang, ROUTE_PATHS.TEACHER_HALAQAS) };
        }
    }

    if (targetType.includes('warning')) {
        return {
            path: hasTeacherRole
                ? buildLocalizedPath(lang, ROUTE_PATHS.TEACHER_WARNINGS)
                : buildLocalizedPath(lang, ROUTE_PATHS.WARNINGS_MANAGEMENT)
        };
    }

    if (targetType.includes('license')) {
        return {
            path: hasTeacherRole
                ? buildLocalizedPath(lang, ROUTE_PATHS.TEACHER_LICENSES)
                : buildLocalizedPath(lang, ROUTE_PATHS.ENTITY_LICENSES)
        };
    }

    return null;
};
