import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useLanguageStore = create()(persist((set) => ({
    language: 'ar',
    setLanguage: (lang) => set({ language: lang })
}), {
    name: 'language-storage',
    partialize: (state) => ({ language: state.language })
}));
