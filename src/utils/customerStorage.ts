/**
 * Persist full login response (user + teacher) in localStorage.
 * Used for teacher profile so we render from stored data without an extra API call.
 */

const CUSTOMER_DATA_KEY = 'tallem_customer_data';

export interface StoredCustomerData {
    user: Record<string, unknown>;
    teacher: Record<string, unknown> | null;
}

export const customerStorage = {
    set: (data: StoredCustomerData | null): void => {
        if (!data) {
            try {
                localStorage.removeItem(CUSTOMER_DATA_KEY);
            } catch {
                // ignore
            }
            return;
        }
        try {
            localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to persist customer data to localStorage', e);
        }
    },

    get: (): StoredCustomerData | null => {
        try {
            const raw = localStorage.getItem(CUSTOMER_DATA_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as StoredCustomerData;
        } catch {
            return null;
        }
    },

    remove: (): void => {
        try {
            localStorage.removeItem(CUSTOMER_DATA_KEY);
        } catch {
            // ignore
        }
    }
};
