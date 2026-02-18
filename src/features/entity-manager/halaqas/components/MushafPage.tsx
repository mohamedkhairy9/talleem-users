import React, { useMemo } from 'react';
import type { Database, SqlValue } from 'sql.js';
import './MushafPage.css';

interface Word {
    id: number;
    text: string;
    location: string;
}

interface Line {
    page_number: number;
    line_number: number;
    line_type: 'surah_name' | 'basmallah' | 'ayah';
    surah_number?: number;
    first_word_id?: number;
    last_word_id?: number;
    is_centered?: boolean;
}

interface MushafPageProps {
    pageLines?: Line[];
    currentPage?: number;
    wordsDb?: Database | null;
    surahData?: Record<string, any> | null;
    selectedAyahs?: Set<string>;
    onWordClick?: (wordId: number, location: string) => void;
    isVerseUsed?: (location: string) => boolean;
    editingSegment?: { index: number; field: string } | null;
    isFontLoading?: boolean;
}

/**
 * MushafPage Component
 * Reusable component for displaying Quran pages with authentic mushaf layout
 */
const MushafPage: React.FC<MushafPageProps> = ({
    pageLines = [],
    currentPage = 1,
    wordsDb = null,
    surahData = null,
    selectedAyahs = new Set(),
    onWordClick = undefined,
    isVerseUsed = undefined,
    editingSegment = null,
    isFontLoading = false
}) => {
    /**
     * Get words for line
     */
    const getWordsForLine = (firstWordId?: number, lastWordId?: number): Word[] => {
        if (!wordsDb || !firstWordId || !lastWordId) return [];

        try {
            const query = `SELECT id, text, location FROM words WHERE id >= ${firstWordId} AND id <= ${lastWordId} ORDER BY id`;
            const result = wordsDb.exec(query);

            if (result.length > 0 && result[0].values.length > 0) {
                return result[0].values.map((row: SqlValue[]) => ({
                    id: row[0] as number,
                    text: row[1] as string,
                    location: row[2] as string
                }));
            }
        } catch (error) {
            console.error('Error fetching words:', error);
        }

        return [];
    };

    /**
     * Get surah name
     */
    const getSurahName = (surahNumber?: number): string => {
        if (!surahNumber || !surahData || !surahData[surahNumber]) return '';
        const surah = surahData[surahNumber];
        return surah.glyph || (surah.name_arabic ? `سُورَةُ ${surah.name_arabic}` : surah.name || '');
    };

    /**
     * Get surah number from the first verse on the page
     * This is more accurate than relying on surah_number in the surah_name line
     */
    const getSurahNumberFromPage = (): number | null => {
        if (!wordsDb || !pageLines || pageLines.length === 0) return null;
        
        // Find the first ayah line on the page
        const firstAyahLine = pageLines.find(line => line.line_type === 'ayah' && line.first_word_id && line.last_word_id);
        
        if (!firstAyahLine || !firstAyahLine.first_word_id) return null;
        
        try {
            // Get the first word from the first ayah line
            const query = `SELECT location FROM words WHERE id = ${firstAyahLine.first_word_id} LIMIT 1`;
            const result = wordsDb.exec(query);
            
            if (result.length > 0 && result[0].values.length > 0) {
                const location = result[0].values[0][0] as string;
                const [surah] = location.split(':').map(Number);
                return surah;
            }
        } catch (error) {
            console.error('Error getting surah number from page:', error);
        }
        
        return null;
    };

    /**
     * Check if word is selected
     */
    const isWordSelected = (location: string): boolean => {
        if (!location) return false;
        const [surah, ayah] = location.split(':');
        return selectedAyahs.has(`${surah}:${ayah}`);
    };

    /**
     * Render line
     */
    const renderLine = (line: Line, pageSurahNumber?: number | null) => {
        switch (line.line_type) {
            case 'surah_name':
                // Use surah number from actual verses on the page (more accurate) or fallback to line.surah_number
                const surahNumber = pageSurahNumber || line.surah_number;
                return (
                    <div 
                        key={`${line.page_number}-${line.line_number}`} 
                        className={`line surah-name ${line.is_centered ? 'centered' : ''}`}
                    >
                        {getSurahName(surahNumber)}
                    </div>
                );

            case 'basmallah':
                return (
                    <div 
                        key={`${line.page_number}-${line.line_number}`} 
                        className={`line basmallah ${line.is_centered ? 'centered' : ''}`}
                    >
                        ﷽
                    </div>
                );

            case 'ayah':
                { 
                const words = getWordsForLine(line.first_word_id, line.last_word_id);
                return (
                    <div 
                        key={`${line.page_number}-${line.line_number}`} 
                        className={`line ayah centered ${line.is_centered ? 'centered' : ''}`}
                        ref={el => {
                            if (el) {
                                el.style.setProperty('font-family', `'QuranicFont-${currentPage}', Arial, sans-serif`, 'important');
                            }
                        }}
                    >
                        {words.map(word => {
                            const isUsed = isVerseUsed ? isVerseUsed(word.location) : false;
                            const isSelected = isWordSelected(word.location);
                            const isEditable = editingSegment !== null;
                            
                            return (
                                <span
                                    key={word.id}
                                    data-word-id={word.id}
                                    data-location={word.location}
                                    className={`word 
                                        ${isSelected ? 'selected' : ''} 
                                        ${isEditable ? 'editable' : ''} 
                                        ${isUsed ? 'disabled' : ''}
                                    `}
                                    onClick={() => {
                                        if (!isUsed && onWordClick) {
                                            onWordClick(word.id, word.location);
                                        }
                                    }}
                                    style={{ 
                                        cursor: isUsed ? 'not-allowed' : (isEditable ? 'pointer' : 'default') 
                                    }}
                                    ref={el => {
                                        if (el) {
                                            el.style.setProperty('font-family', 'inherit', 'important');
                                        }
                                    }}
                                >
                                    {word.text}
                                </span>
                            );
                        })}
                    </div>
                ); 
                }

            default:
                return null;
        }
    };

    if (isFontLoading) {
        return (
            <div className="mushaf-page">
                <div className="mushaf-border">
                    <div className="font-loading">
                        <div className="spinner"></div>
                        <p>جاري تحميل الخط...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Determine if this is page 1 or 2 for larger sizing
    const isSpecialPage = currentPage === 1 || currentPage === 2;
    
    // Get the actual surah number from the first verse on the page (more accurate than database surah_number)
    const actualSurahNumber = useMemo(() => {
        return getSurahNumberFromPage();
    }, [pageLines, wordsDb]);
    
    return (
        <div className="mushaf-page">
            <div className={`mushaf-border ${isSpecialPage ? 'mushaf-border-large' : ''}`}>
                <div 
                    className="page-content"
                    ref={el => {
                        if (el) {
                            el.style.setProperty('font-family', `'QuranicFont-${currentPage}', Arial, sans-serif`, 'important');
                        }
                    }}
                >
                    {pageLines.length > 0 ? (
                        pageLines.map(line => renderLine(line, actualSurahNumber))
                    ) : (
                        <div className="no-content">
                            لا يوجد محتوى
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MushafPage;


