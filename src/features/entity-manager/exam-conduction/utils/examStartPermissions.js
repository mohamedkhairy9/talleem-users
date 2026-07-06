function normalizeValue(value) {
    if (Array.isArray(value)) {
        return normalizeValue(value[0]);
    }

    if (typeof value === 'string') {
        return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    }

    if (value && typeof value === 'object') {
        return normalizeValue(value.name ?? value.slug ?? value.code ?? value.role ?? value.type ?? '');
    }

    return '';
}

function matchesResponsibleScope(role, responsible) {
    if (!role || !responsible) {
        return false;
    }

    if (responsible === 'entity') {
        return role.includes('entity') && !role.includes('branch') && !role.includes('general');
    }

    if (responsible === 'branch') {
        return role.includes('branch');
    }

    if (responsible === 'general_management') {
        return role.includes('general_management') || (role.includes('general') && role.includes('management'));
    }

    return false;
}

export function getExamStartPermission(responsible, actingRole) {
    const normalizedResponsible = normalizeValue(responsible);
    const normalizedRole = normalizeValue(actingRole);

    return {
        responsible: normalizedResponsible,
        actingRole: normalizedRole,
        canStart: matchesResponsibleScope(normalizedRole, normalizedResponsible)
    };
}
