import React from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/globals/icons';
import { ImageWithViewer } from '@/globals/components';
import { useStudentCertificates } from '../hooks/useCertificates';
import { getLocalizedText } from '@/utils/helpers/getLocalizedText';
import { getDisplayDate } from '@/utils';
import { getErrorMessage } from '@/utils/helpers/errorHandler';

interface StudentCertificatesModalProps {
    isOpen: boolean;
    studentId: number | null;
    onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-wrap gap-2 py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm font-medium text-gray-500 min-w-[100px]">{label}</dt>
            <dd className="text-sm text-gray-900 flex-1">{value ?? '—'}</dd>
        </div>
    );
}

const StudentCertificatesModal: React.FC<StudentCertificatesModalProps> = ({
    isOpen,
    studentId,
    onClose
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const { detail, isLoading, error, apiMessage } = useStudentCertificates(isOpen && studentId ? studentId : null);

    const getLocalized = (obj: { en?: string; ar?: string } | string | null | undefined) =>
        getLocalizedText(obj, currentLang, t('common.not_available', 'N/A'));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl z-10 max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('certificates.studentCertificates', 'Student Certificates')}
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label={t('common.closeAria')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    <div className="px-6 py-4 overflow-y-auto flex-1">
                        {isLoading && (
                            <p className="text-sm text-gray-500 py-4">{t('common.loading', 'Loading...')}</p>
                        )}
                        {error && !isLoading && (
                            <p className="text-sm text-red-600 py-4">
                                {getErrorMessage(error)}
                            </p>
                        )}
                        {apiMessage && !detail && !isLoading && !error && (
                            <p className="text-sm text-amber-700 py-4" role="alert">
                                {apiMessage}
                            </p>
                        )}
                        {detail && !isLoading && (
                            <>
                                <dl className="space-y-0 mb-6">
                                    <DetailRow label={t('certificates.studentName', 'Name')} value={getLocalized(detail.name)} />
                                    <DetailRow label={t('certificates.phone', 'Phone')} value={detail.phone} />
                                    <DetailRow label={t('certificates.identity', 'Identity')} value={getLocalized(detail.identity)} />
                                    <DetailRow
                                        label={t('certificates.mainProgram', 'Main Program')}
                                        value={getLocalized(detail.main_program?.name)}
                                    />
                                    <DetailRow
                                        label={t('certificates.branch', 'Branch')}
                                        value={typeof detail.branch === 'object' ? getLocalized(detail.branch) : detail.branch}
                                    />
                                </dl>

                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    {t('certificates.certificatesList', 'Certificates')} ({detail.certificates?.length ?? 0})
                                </h4>
                                {detail.certificates && detail.certificates.length > 0 ? (
                                    <ul className="space-y-4">
                                        {detail.certificates.map((cert) => (
                                            <li
                                                key={cert.id}
                                                className="p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                                            >
                                                <div className="flex flex-wrap gap-4 items-start">
                                                    {cert.image_url && (
                                                        <ImageWithViewer
                                                            src={cert.image_url}
                                                            alt={getLocalized(cert.certificate_name)}
                                                            imgClassName="w-20 h-20 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <DetailRow
                                                            label={t('certificates.certificateName', 'Certificate')}
                                                            value={getLocalized(cert.certificate_name)}
                                                        />
                                                        <DetailRow
                                                            label={t('certificates.issuedFrom', 'Issued From')}
                                                            value={cert.issued_from}
                                                        />
                                                        <DetailRow
                                                            label={t('certificates.issuedDate', 'Issued Date')}
                                                            value={getDisplayDate(cert.issued_date as any)}
                                                        />
                                                        <DetailRow
                                                            label={t('certificates.status', 'Status')}
                                                            value={
                                                                <span
                                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                        cert.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                                    }`}
                                                                >
                                                                    {cert.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                                                                </span>
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">{t('certificates.noCertificates', 'No certificates.')}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentCertificatesModal;
