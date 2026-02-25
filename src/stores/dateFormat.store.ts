import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateFormatPreference } from '@/globals/types';

interface DateFormatState {
    dateFormat: DateFormatPreference;
    setDateFormat: (format: DateFormatPreference) => void;
}

export const useDateFormatStore = create<DateFormatState>()(
    persist(
        (set) => ({
            dateFormat: 'gregorian',
            setDateFormat: (format: DateFormatPreference) => set({ dateFormat: format })
        }),
        {
            name: 'date-format-storage',
            partialize: (state) => ({ dateFormat: state.dateFormat })
        }
    )
);
