import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '@/shared/components/ui/ConfirmationModal';
const ConfirmationModalContext = createContext(undefined);
export const ConfirmationModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: () => { },
        onCancel: () => { }
    });
    const showConfirmation = useCallback((options) => {
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
    return (<ConfirmationModalContext.Provider value={{ showConfirmation }}>
            {children}
            <ConfirmationModal isOpen={modalState.isOpen} title={modalState.title} message={modalState.message} confirmText={modalState.confirmText} cancelText={modalState.cancelText} variant={modalState.variant} onConfirm={modalState.onConfirm} onCancel={modalState.onCancel}/>
        </ConfirmationModalContext.Provider>);
};
export const useConfirmationModal = () => {
    const context = useContext(ConfirmationModalContext);
    if (context === undefined) {
        throw new Error('useConfirmationModal must be used within a ConfirmationModalProvider');
    }
    return context;
};
