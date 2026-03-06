import { TableColumn } from '@/globals/types';
import type { TeacherStudentListItem } from '../types/certificates.types';
import { AwardIcon } from '@/globals/icons';
import { useTranslation } from 'react-i18next';

/**
 * Table columns for Teacher Certificates (students) List
 */
export const createTeacherCertificatesListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
    onViewCertificates: (row: TeacherStudentListItem) => void;
}): TableColumn<TeacherStudentListItem>[] => {
    const { t, getLocalizedText, onViewCertificates } = params;

    return [
        {
            header: t('certificates.studentName', 'Student'),
            accessor: (row: TeacherStudentListItem) => getLocalizedText(row.name)
        },
        {
            header: t('certificates.nationalId', 'National ID'),
            accessor: (row: TeacherStudentListItem) => row.national_id || '-'
        },
        {
            header: t('certificates.halaqas', 'Halaqas'),
            accessor: (row: TeacherStudentListItem) =>
                row.halaqas?.length
                    ? row.halaqas.map((h) => getLocalizedText(h.name)).join(', ')
                    : '-'
        },
        {
            header: t('common.actions', 'Actions'),
            accessor: (row: TeacherStudentListItem) => (
                <button
                    type="button"
                    onClick={() => onViewCertificates(row)}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    aria-label={t('certificates.viewCertificates', 'View certificates')}
                >
                    <AwardIcon width={18} height={18} />
                    {t('certificates.viewCertificates', 'Certificates')}
                </button>
            )
        }
    ];
};
