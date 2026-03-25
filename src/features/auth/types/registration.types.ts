/**
 * Registration Types
 */

export type UserRoleType = 1 | 3; // 1 = teacher, 3 = entity manager

export interface JoinRequestFormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'select' | 'date' | 'boolean' | 'textarea' | 'file' | 'object' | 'group' | 'number' | 'multiselect';
    required: boolean;
    options?: string[] | Record<string, string>;
    notes?: string;
    note?: string;
    multiple?: boolean;
    disabled?: boolean;
    accept?: string;
    fields?: JoinRequestFormField[]; // For group type
    depends_on?: {
        field: string;
    };
    visible_when?: {
        [key: string]: string[];
    };
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

/** GET /required-documents?type=&program= */
export interface RequiredDocumentsResponse {
    type: string;
    program: string;
    documents: string[];
}

