import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes/AppRoutes';
import { ErrorBoundary } from './globals/components';
import { queryClient } from './api/queryClient';
import { useAuthStore } from './stores';
import { ConfirmationModalProvider } from './globals/hooks/useConfirmationModal';
import './i18n';

/**
 * Main App Component
 */
function App() {
    const { initializeAuth } = useAuthStore();

    useEffect(() => {
        // Initialize auth from cookie on app mount (only once)
        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <ConfirmationModalProvider>
                        <AppRoutes />
                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                    </ConfirmationModalProvider>
                </BrowserRouter>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
