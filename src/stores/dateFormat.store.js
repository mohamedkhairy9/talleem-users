import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useDateFormatStore = create()(persist((set) => ({
    dateFormat: 'gregorian',
    setDateFormat: (format) => set({ dateFormat: format })
}), {
    name: 'date-format-storage',
    partialize: (state) => ({ dateFormat: state.dateFormat })
}));
