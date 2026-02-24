import React from 'react';
import { useTranslation } from 'react-i18next';

interface JoinRequestStatusData {
    id: number;
    request_type: string;
    status: number;
    current_phase: {
        en: string;
        ar: string;
    };
    current_step: {
        id: number;
        name: {
            en: string;
            ar: string;
        };
        order: number;
        step_type: string;
        assigned_to_type: string;
        assigned_to_id: number;
        form_inputs: any;
    };
    submitted_logs: Array<{
        step_id: number;
        step_name: {
            en: string;
            ar: string;
        };
        status: number;
        notes: string | null;
        form_data: any;
        files: any[];
    }>;
}

interface JoinRequestStatusDisplayProps {
    data: JoinRequestStatusData;
}

/**
 * Join Request Status Display Component
 * Displays the join request status information
 */
const JoinRequestStatusDisplay: React.FC<JoinRequestStatusDisplayProps> = ({ data }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const getBilingualText = (obj: { en: string; ar: string }) => {
        return currentLang === 'ar' ? obj.ar : obj.en;
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">{t('status.pending', 'Pending')}</span>;
            case 1:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{t('status.approved', 'Approved')}</span>;
            case 2:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">{t('status.rejected', 'Rejected')}</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{t('status.unknown', 'Unknown')}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {t('status.request_info', 'Request Information')}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {data.id}</p>
                    </div>
                    {getStatusBadge(data.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            {t('status.request_type', 'Request Type')}
                        </p>
                        <p className="text-gray-900">{data.request_type}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            {t('status.current_phase', 'Current Phase')}
                        </p>
                        <p className="text-gray-900">{getBilingualText(data.current_phase)}</p>
                    </div>
                </div>
            </div>

            {/* Current Step */}
            {data.current_step && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('status.current_step', 'Current Step')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.step_name', 'Step Name')}
                            </p>
                            <p className="text-gray-900">{getBilingualText(data.current_step.name)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.step_type', 'Step Type')}
                            </p>
                            <p className="text-gray-900 capitalize">{data.current_step.step_type}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.order', 'Order')}
                            </p>
                            <p className="text-gray-900">{data.current_step.order}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.assigned_to', 'Assigned To')}
                            </p>
                            <p className="text-gray-900 capitalize">
                                {data.current_step.assigned_to_type} ({data.current_step.assigned_to_id})
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submitted Logs */}
            {data.submitted_logs && data.submitted_logs.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('status.submitted_logs', 'Submitted Logs')}
                    </h3>
                    <div className="space-y-4">
                        {data.submitted_logs.map((log, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800 mb-1">
                                            {getBilingualText(log.step_name)}
                                        </h4>
                                        <p className="text-sm text-gray-600">Step ID: {log.step_id}</p>
                                    </div>
                                    {getStatusBadge(log.status)}
                                </div>
                                {log.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                            {t('status.notes', 'Notes')}
                                        </p>
                                        <p className="text-gray-900 text-sm">{log.notes}</p>
                                    </div>
                                )}
                                {log.files && log.files.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            {t('status.files', 'Files')}
                                        </p>
                                        <div className="space-y-1">
                                            {log.files.map((file: any, fileIndex: number) => (
                                                <p key={fileIndex} className="text-sm text-gray-600">
                                                    {file.name || file.url || `File ${fileIndex + 1}`}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JoinRequestStatusDisplay;





