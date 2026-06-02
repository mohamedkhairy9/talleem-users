import { AwardIcon } from '@/globals/icons';
/**
 * Table columns for Teacher Certificates (students) List
 */
export const createTeacherCertificatesListColumns = (params) => {
    const { t, getLocalizedText, onViewCertificates } = params;
    return [
        {
            header: t('certificates.studentName', 'Student'),
            accessor: (row) => getLocalizedText(row.name)
        },
        {
            header: t('certificates.nationalId', 'National ID'),
            accessor: (row) => row.national_id || '-'
        },
        {
            header: t('certificates.halaqas', 'Halaqas'),
            accessor: (row) => row.halaqas?.length
                ? row.halaqas.map((h) => getLocalizedText(h.name)).join(', ')
                : '-'
        },
        {
            header: t('common.actions', 'Actions'),
            accessor: (row) => (<button type="button" onClick={() => onViewCertificates(row)} className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium" aria-label={t('certificates.viewCertificates', 'View certificates')}>
                    <AwardIcon width={18} height={18}/>
                    {t('certificates.viewCertificates', 'Certificates')}
                </button>)
        }
    ];
};
