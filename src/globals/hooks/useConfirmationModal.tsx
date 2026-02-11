import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmationModal from '@/globals/components/ui/ConfirmationModal';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

interface ConfirmationModalContextType {
    showConfirmation: (options: ConfirmationOptions) => void;
}

const ConfirmationModalContext = createContext<ConfirmationModalContextType | undefined>(undefined);

export const ConfirmationModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        variant: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
        onCancel: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: () => {},
        onCancel: () => {}
    });

    const showConfirmation = useCallback((options: ConfirmationOptions) => {
        setModalState({
            isOpen: true,
            title: options.title,
            message: options.message,
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            variant: options.variant || 'danger',
            onConfirm: () => {
                options.onConfirm();
                setModalState((prev) => ({ ...prev, isOpen: false }));
            },
            onCancel: () => {
                if (options.onCancel) {
                    options.onCancel();
                }
                setModalState((prev) => ({ ...prev, isOpen: false }));
            }
        });
    }, []);

    return (
        <ConfirmationModalContext.Provider value={{ showConfirmation }}>
            {children}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                variant={modalState.variant}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
            />
        </ConfirmationModalContext.Provider>
    );
};

export const useConfirmationModal = () => {
    const context = useContext(ConfirmationModalContext);
    if (context === undefined) {
        throw new Error('useConfirmationModal must be used within a ConfirmationModalProvider');
    }
    return context;
};



