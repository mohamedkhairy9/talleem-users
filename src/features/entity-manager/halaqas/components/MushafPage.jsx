import React, { useMemo } from 'react';
import './MushafPage.css';

/**
 * MushafPage Component
 * Reusable component for displaying Quran pages with authentic mushaf layout.
 */
const MushafPage = ({
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
    const getWordsForLine = (firstWordId, lastWordId) => {
        if (!wordsDb || !firstWordId || !lastWordId) {
            return [];
        }

        try {
            const query = `SELECT id, text, location FROM words WHERE id >= ${firstWordId} AND id <= ${lastWordId} ORDER BY id`;
            const result = wordsDb.exec(query);

            if (result.length > 0 && result[0].values.length > 0) {
                return result[0].values.map((row) => ({
                    id: row[0],
                    text: row[1],
                    location: row[2]
                }));
            }
        } catch (error) {
            console.error('Error fetching words:', error);
        }

        return [];
    };

    const getSurahName = (surahNumber) => {
        if (!surahNumber || !surahData || !surahData[surahNumber]) {
            return '';
        }

        const surah = surahData[surahNumber];
        return surah.glyph || (surah.name_arabic ? `Ø³ÙÙˆØ±ÙŽØ©Ù ${surah.name_arabic}` : surah.name || '');
    };

    const getSurahNumberForSurahNameAt = (lineIndex) => {
        if (!wordsDb || !pageLines || lineIndex < 0 || lineIndex >= pageLines.length) {
            return null;
        }

        for (let i = lineIndex + 1; i < pageLines.length; i += 1) {
            const line = pageLines[i];

            if (line.line_type === 'ayah' && line.first_word_id) {
                try {
                    const query = `SELECT location FROM words WHERE id = ${line.first_word_id} LIMIT 1`;
                    const result = wordsDb.exec(query);

                    if (result.length > 0 && result[0].values.length > 0) {
                        const location = result[0].values[0][0];
                        const [surah] = location.split(':').map(Number);
                        return surah;
                    }
                } catch (error) {
                    console.error('Error getting surah for line:', error);
                }

                return null;
            }
        }

        return null;
    };

    const isWordSelected = (location) => {
        if (!location) {
            return false;
        }

        const [surah, ayah] = location.split(':');
        return selectedAyahs.has(`${surah}:${ayah}`);
    };

    const firstSurahOnPage = useMemo(() => {
        if (!wordsDb || !pageLines?.length) {
            return null;
        }

        const firstAyah = pageLines.find((line) => line.line_type === 'ayah' && line.first_word_id);

        if (!firstAyah?.first_word_id) {
            return null;
        }

        try {
            const result = wordsDb.exec(`SELECT location FROM words WHERE id = ${firstAyah.first_word_id} LIMIT 1`);

            if (result.length > 0 && result[0].values.length > 0) {
                const location = result[0].values[0][0];
                return Number(location.split(':')[0]) || null;
            }
        } catch (error) {
            console.error('Error deriving first surah on page:', error);
        }

        return null;
    }, [pageLines, wordsDb]);

    const renderLine = (line, lineIndex, pageSurahNumber) => {
        switch (line.line_type) {
            case 'surah_name': {
                const derivedSurah = getSurahNumberForSurahNameAt(lineIndex);
                const surahNumber = derivedSurah ?? line.surah_number ?? pageSurahNumber ?? undefined;

                return (
                    <div key={`${line.page_number}-${line.line_number}`} className={`line surah-name ${line.is_centered ? 'centered' : ''}`}>
                        {getSurahName(surahNumber)}
                    </div>
                );
            }

            case 'basmallah':
                return (
                    <div key={`${line.page_number}-${line.line_number}`} className={`line basmallah ${line.is_centered ? 'centered' : ''}`}>
                        ï·½
                    </div>
                );

            case 'ayah': {
                const words = getWordsForLine(line.first_word_id, line.last_word_id);

                return (
                    <div
                        key={`${line.page_number}-${line.line_number}`}
                        className={`line ayah centered ${line.is_centered ? 'centered' : ''}`}
                        ref={(element) => {
                            if (element) {
                                element.style.setProperty('font-family', `'QuranicFont-${currentPage}', Arial, sans-serif`, 'important');
                            }
                        }}
                    >
                        {words.map((word) => {
                            const isUsed = isVerseUsed ? isVerseUsed(word.location) : false;
                            const isSelected = isWordSelected(word.location);
                            const isEditable = editingSegment !== null;

                            return (
                                <span
                                    key={word.id}
                                    data-word-id={word.id}
                                    data-location={word.location}
                                    className={`word ${isSelected ? 'selected' : ''} ${isEditable ? 'editable' : ''} ${isUsed ? 'disabled' : ''}`}
                                    onClick={() => {
                                        if (!isUsed && onWordClick) {
                                            onWordClick(word.id, word.location);
                                        }
                                    }}
                                    style={{
                                        cursor: isUsed ? 'not-allowed' : (onWordClick || isEditable ? 'pointer' : 'default')
                                    }}
                                    ref={(element) => {
                                        if (element) {
                                            element.style.setProperty('font-family', 'inherit', 'important');
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
                        <p>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø®Ø·...</p>
                    </div>
                </div>
            </div>
        );
    }

    const isSpecialPage = currentPage === 1 || currentPage === 2;

    return (
        <div className="mushaf-page">
            <div className={`mushaf-border ${isSpecialPage ? 'mushaf-border-large' : ''}`}>
                <div
                    className="page-content"
                    ref={(element) => {
                        if (element) {
                            element.style.setProperty('font-family', `'QuranicFont-${currentPage}', Arial, sans-serif`, 'important');
                        }
                    }}
                >
                    {pageLines.length > 0 ? (
                        pageLines.map((line, index) => renderLine(line, index, firstSurahOnPage))
                    ) : (
                        <div className="no-content">
                            Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø­ØªÙˆÙ‰
                        </div>
                    )}
                </div>
                <div className="page-number-display">{currentPage}</div>
            </div>
        </div>
    );
};

export default MushafPage;
