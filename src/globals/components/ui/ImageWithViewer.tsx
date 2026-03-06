import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/globals/icons';

export interface ImageWithViewerProps {
    /** Image URL. When null/undefined/empty, nothing is rendered (use children or fallback for empty state). */
    src: string | null | undefined;
    /** Alt text for the thumbnail and viewer */
    alt?: string;
    /** Optional class for the thumbnail wrapper/button */
    className?: string;
    /** Optional class for the thumbnail img (default: w-10 h-10 object-cover rounded) */
    imgClassName?: string;
    /** Optional fallback when no src (e.g. '-' or placeholder) */
    fallback?: React.ReactNode;
}

/**
 * Reusable image thumbnail that opens a fullscreen-style viewer on click.
 * Use in tables or anywhere you need a small image with click-to-expand.
 */
const ImageWithViewer: React.FC<ImageWithViewerProps> = ({
    src,
    alt = '',
    className = '',
    imgClassName = 'w-10 h-10 object-cover rounded',
    fallback = null
}) => {
    const { t } = useTranslation();
    const [viewerOpen, setViewerOpen] = useState(false);

    const openViewer = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewerOpen(true);
    }, []);

    const closeViewer = useCallback(() => setViewerOpen(false), []);

    if (!src || src.trim() === '') {
        return <>{fallback}</>;
    }

    return (
        <>
            <button
                type="button"
                onClick={openViewer}
                className={`cursor-zoom-in inline-block focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded ${className}`}
                aria-label={t('common.viewImage', 'View image')}
            >
                <img
                    src={src}
                    alt={alt}
                    className={imgClassName}
                    loading="lazy"
                />
            </button>

            {viewerOpen && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={alt || t('common.viewImage', 'View image')}
                    onClick={closeViewer}
                >
                    <button
                        type="button"
                        onClick={closeViewer}
                        className="absolute top-4 right-4 p-2 rounded-lg text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label={t('common.closeAria')}
                    >
                        <XIcon width={24} height={24} />
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default ImageWithViewer;
