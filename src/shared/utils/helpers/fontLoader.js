/**
 * Quran Font Loader Utility
 * Handles dynamic loading of page-specific Quran fonts
 */
class QuranFontLoader {
    constructor() {
        this.loadedFonts = new Set();
        this.fontBasePath = '/fonts'; // Vite serves from public/ automatically
        this.loadSpecialFonts();
    }
    /**
     * Load special fonts (Surah header and Basmallah)
     */
    loadSpecialFonts() {
        // Load Surah Header Font
        if (!document.getElementById('surah-header-font')) {
            const style = document.createElement('style');
            style.id = 'surah-header-font';
            style.textContent = `
                @font-face {
                    font-family: 'SurahHeaderFont';
                    src: url('${this.fontBasePath}/header_surah.ttf') format('truetype');
                    font-display: block;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Surah Header Font loaded');
            this.testFontFile(`${this.fontBasePath}/header_surah.ttf`, 'Surah Header');
        }
        // Load Basmallah Font
        if (!document.getElementById('basmallah-font')) {
            const style = document.createElement('style');
            style.id = 'basmallah-font';
            style.textContent = `
                @font-face {
                    font-family: 'BasmallahFont';
                    src: url('https://static-cdn.tarteel.ai/qul/fonts/bismillah/bismillah.woff2?v=3.3') format('woff2');
                    font-display: block;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Basmallah Font loaded from CDN');
        }
    }
    /**
     * Load font for a specific page
     * @param {number} pageNumber - Page number (1-604)
     */
    loadPageFont(pageNumber) {
        if (this.loadedFonts.has(pageNumber)) {
            console.log(`ℹ️ Font for page ${pageNumber} already loaded`);
            return;
        }
        const fontId = `font-page-${pageNumber}`;
        if (document.getElementById(fontId)) {
            console.log(`ℹ️ Font style for page ${pageNumber} already in DOM`);
            return;
        }
        // Try different path formats
        const fontPath = `${this.fontBasePath}/p${pageNumber}.ttf`;
        console.log(`🔄 Loading font for page ${pageNumber}`);
        console.log(`   Path: ${fontPath}`);
        console.log(`   Full URL: ${window.location.origin}${fontPath}`);
        const style = document.createElement('style');
        style.id = fontId;
        // Use local() first to check if already installed, then url()
        style.textContent = `
            @font-face {
                font-family: 'QuranicFont-${pageNumber}';
                src: local('QuranicFont-${pageNumber}'),
                     url('${fontPath}') format('truetype');
                font-display: swap;
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(style);
        this.loadedFonts.add(pageNumber);
        console.log(`✅ Font family 'QuranicFont-${pageNumber}' registered in DOM`);
        // Detailed file check
        this.testFontFile(fontPath, `Page ${pageNumber}`);
        // Force browser to load the font
        this.forceFontLoad(pageNumber);
    }
    /**
     * Test if font file exists and is accessible
     * @param {string} fontPath - Path to font file
     * @param {string} fontName - Friendly name for logging
     */
    testFontFile(fontPath, fontName) {
        fetch(fontPath, { method: 'HEAD' })
            .then(response => {
            if (response.ok) {
                const size = response.headers.get('content-length');
                console.log(`✅ ${fontName} file exists (${size ? Math.round(parseInt(size || '0') / 1024) + ' KB' : 'size unknown'})`);
            }
            else {
                console.error(`❌ ${fontName} file NOT FOUND!`);
                console.error(`   URL: ${fontPath}`);
                console.error(`   Status: ${response.status} ${response.statusText}`);
                console.error(`   Make sure the file exists in: public/fonts/`);
            }
        })
            .catch(error => {
            console.error(`❌ Error checking ${fontName} font:`, error);
        });
    }
    /**
     * Force browser to load the font using Font Loading API
     * @param {number} pageNumber - Page number
     */
    forceFontLoad(pageNumber) {
        if (!document.fonts) {
            console.warn('⚠️ Font Loading API not supported in this browser');
            return;
        }
        const fontFamily = `QuranicFont-${pageNumber}`;
        document.fonts.load(`1em ${fontFamily}`)
            .then(() => {
            console.log(`✅ Font '${fontFamily}' confirmed loaded by browser`);
        })
            .catch(error => {
            console.error(`❌ Font '${fontFamily}' failed to load:`, error);
            console.error(`   This usually means the font file is missing or corrupted`);
        });
    }
    /**
     * Preload fonts for nearby pages (performance optimization)
     * @param {number} currentPage - Current page number
     */
    preloadNearbyPages(currentPage) {
        const pagesToPreload = [
            currentPage - 1,
            currentPage,
            currentPage + 1
        ].filter(page => page >= 1 && page <= 604);
        console.log(`📦 Preloading fonts for pages: ${pagesToPreload.join(', ')}`);
        pagesToPreload.forEach(page => {
            this.loadPageFont(page);
        });
    }
    /**
     * Clear unused fonts to save memory
     * @param {number} currentPage - Current page number
     * @param {number} range - Range of pages to keep loaded (default: 5)
     */
    clearUnusedFonts(currentPage, range = 5) {
        let clearedCount = 0;
        this.loadedFonts.forEach(page => {
            if (Math.abs(page - currentPage) > range) {
                const fontId = `font-page-${page}`;
                const styleElement = document.getElementById(fontId);
                if (styleElement) {
                    styleElement.remove();
                    this.loadedFonts.delete(page);
                    clearedCount++;
                }
            }
        });
        if (clearedCount > 0) {
            console.log(`🗑️ Cleared ${clearedCount} unused font(s)`);
        }
    }
    /**
     * Get list of currently loaded fonts
     * @returns {Array<number>} Array of loaded page numbers
     */
    getLoadedFonts() {
        return Array.from(this.loadedFonts);
    }
    /**
     * Check if font is loaded for a specific page
     * @param {number} pageNumber - Page number
     * @returns {boolean} True if font is loaded
     */
    isFontLoaded(pageNumber) {
        return this.loadedFonts.has(pageNumber);
    }
}
// Export singleton instance
export const fontLoader = new QuranFontLoader();
// Also export the class for testing
export default QuranFontLoader;
