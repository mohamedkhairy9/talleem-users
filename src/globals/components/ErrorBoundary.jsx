import React from 'react';
/**
 * Error Boundary Component
 * Catches and displays React errors
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            const errorMessage = this.state.error?.message || String(this.state.error || '');
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-gray-600 mb-4">
                            We're sorry, but something unexpected happened.
                        </p>
                        {import.meta.env.DEV && errorMessage ? (
                            <pre className="mx-auto mb-4 max-w-3xl overflow-auto rounded-lg bg-red-50 p-4 text-left text-xs text-red-700 whitespace-pre-wrap">
                                {errorMessage}
                            </pre>
                        ) : null}
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Reload Page
                        </button>
                    </div>
                </div>);
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
