/**
 * Registration Types
 */

export type UserRoleType = 1 | 3; // 1 = teacher, 3 = entity manager

export interface JoinRequestFormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'select' | 'date' | 'boolean' | 'textarea' | 'file' | 'object' | 'group' | 'number';
    required: boolean;
    options?: string[];
    notes?: string;
    multiple?: boolean;
    fields?: JoinRequestFormField[]; // For group type
}

export interface JoinRequestFormData {
    fields: JoinRequestFormField[];
}

export interface JoinRequestFormResponse {
    id: number;
    name: string;
    description: string | null;
    data: JoinRequestFormData;
    status: number;
    created_at: string;
}

export interface RegistrationFormData {
    [key: string]: any;
}


