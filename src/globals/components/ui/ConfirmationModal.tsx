import React from 'react';
import { XIcon, AlertTriangleIcon } from '@/globals/icons';
import Button from './Button';

export interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

/**
 * Global Confirmation Modal Component
 * Reusable modal for confirmations throughout the application
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            confirmButton: 'danger',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        warning: {
            confirmButton: 'danger',
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        info: {
            confirmButton: 'primary',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black transition-opacity"
                style={{ opacity: 0.5 }}
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Close"
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 rounded-full p-3 ${styles.iconBg}`}>
                                <AlertTriangleIcon
                                    width={24}
                                    height={24}
                                    className={styles.iconColor}
                                />
                            </div>
                            <p className="flex-1 text-sm text-gray-600">{message}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={styles.confirmButton as 'primary' | 'danger'}
                            onClick={onConfirm}
                            loading={isLoading}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

