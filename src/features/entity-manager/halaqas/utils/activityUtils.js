export const getActivityValue = (activity) => {
    if (typeof activity === 'string') {
        return activity;
    }

    if (!activity || typeof activity !== 'object') {
        return '';
    }

    return activity.activity ?? activity.value ?? activity.name ?? '';
};

export const normalizeActivityValues = (activities) => (
    (Array.isArray(activities) ? activities : [])
        .map(getActivityValue)
        .filter(Boolean)
);
