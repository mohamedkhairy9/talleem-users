import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';
/**
 * Local Database Loader for Quran data
 * Handles loading and initialization of SQLite databases
 */
class QuranDatabaseLoader {
    constructor() {
        this.SQL = null;
        this.linesDb = null;
        this.wordsDb = null;
        this.surahData = null;
        this.isInitialized = false;
    }
    /**
     * Initialize SQL.js and load all databases
     * @returns {Promise<Object>} Object containing all loaded data
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('ℹ️ Databases already initialized');
            return this.getAllData();
        }
        try {
            console.log('🔄 Initializing SQL.js...');
            // Initialize SQL.js with local wasm file
            this.SQL = await initSqlJs({
                locateFile: () => sqlWasm
            });
            console.log('✅ SQL.js initialized');
            // Load databases in parallel for faster loading
            console.log('🔄 Loading databases...');
            const [linesDb, wordsDb, surahData] = await Promise.all([
                this.loadDatabase('/data/q_lines.db', 'Lines DB'),
                this.loadDatabase('/data/q_glyph.db', 'Words DB'),
                this.loadSurahData()
            ]);
            this.linesDb = linesDb;
            this.wordsDb = wordsDb;
            this.surahData = surahData;
            this.isInitialized = true;
            console.log('✅ All databases loaded successfully!');
            return this.getAllData();
        }
        catch (error) {
            console.error('❌ Error initializing databases:', error);
            throw error;
        }
    }
    /**
     * Load a SQLite database from file
     * @param {string} path - Path to database file
     * @param {string} name - Friendly name for logging
     * @returns {Promise<Database>} SQL.js Database instance
     */
    async loadDatabase(path, name) {
        if (!this.SQL) {
            throw new Error('SQL.js not initialized');
        }
        try {
            console.log(`🔄 Fetching ${name}: ${path}`);
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                console.log(`📦 ${name} size: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const uInt8Array = new Uint8Array(arrayBuffer);
            console.log(`🔨 Creating ${name}...`);
            const db = new this.SQL.Database(uInt8Array);
            // Test query to verify database
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
            console.log(`✅ ${name} ready. Tables:`, tables[0]?.values.map((t) => t[0]));
            return db;
        }
        catch (error) {
            console.error(`❌ Error loading ${name}:`, error);
            throw error;
        }
    }
    /**
     * Load surah data from JSON file
     * @returns {Promise<Object>} Surah data object
     */
    async loadSurahData() {
        try {
            console.log('🔄 Loading surah data...');
            const response = await fetch('/data/surah_combined.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`✅ Surah data loaded (${Object.keys(data).length} surahs)`);
            return data;
        }
        catch (error) {
            console.error('❌ Error loading surah data:', error);
            throw error;
        }
    }
    /**
     * Get all loaded data
     * @returns {Object} Object containing all databases and data
     */
    getAllData() {
        if (!this.SQL || !this.linesDb || !this.wordsDb || !this.surahData) {
            throw new Error('Databases not initialized');
        }
        return {
            SQL: this.SQL,
            linesDb: this.linesDb,
            wordsDb: this.wordsDb,
            surahData: this.surahData,
            isInitialized: this.isInitialized
        };
    }
    /**
     * Check if databases are initialized
     * @returns {boolean} True if initialized
     */
    isReady() {
        return this.isInitialized &&
            this.linesDb !== null &&
            this.wordsDb !== null &&
            this.surahData !== null;
    }
    /**
     * Close database connections (cleanup)
     */
    cleanup() {
        if (this.linesDb) {
            this.linesDb.close();
            this.linesDb = null;
        }
        if (this.wordsDb) {
            this.wordsDb.close();
            this.wordsDb = null;
        }
        this.SQL = null;
        this.surahData = null;
        this.isInitialized = false;
        console.log('🗑️ Databases cleaned up');
    }
}
// Export singleton instance
export const dbLoader = new QuranDatabaseLoader();
// Also export the class
export default QuranDatabaseLoader;
