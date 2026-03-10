import { Control, FieldValues } from 'react-hook-form';
import React from 'react';

/**
 * Global Type Definitions
 * Includes both component types and shared application types
 */

/** API date object: gregorian + hijri variants (used for start_date, end_date, joined_at, daily_schedule date, etc.) */
export interface AppDate {
    gregorian: string;
    hijri: string;
    hijri_indic: string;
}

/** User preference for how dates are displayed app-wide */
export type DateFormatPreference = 'gregorian' | 'hijri' | 'hijri_indic';

/** Bilingual name from API */
export interface BilingualName {
    en?: string;
    ar?: string;
}

/** Entity data from login (related entity); used app-wide and for halaqa payloads */
export interface Entity {
    id: number;
    name?: BilingualName;
    memorization_program_entity_type?: { id: number; name?: BilingualName };
    session_mode?: { id: number; name?: BilingualName };
    [key: string]: any;
}

export interface User {
    id: number;
    guid?: string | null;
    name?: string | BilingualName;
    email?: string;
    phone?: string;
    status?: boolean;
    locale?: string;
    current_app_locale?: string;
    user_type?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
    roles?: string[];
    permissions?: string[];
    entity?: Entity;
    [key: string]: any;
}

/** Teacher payload from login response (stored for profile without refetch) */
export type TeacherPayload = Record<string, unknown> | null;

export interface AuthState {
    user: User | null;
    teacher: TeacherPayload;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null, token?: string) => void;
    /** Store full login response (user + teacher) and persist for profile page */
    setLoginData: (user: User, teacher: TeacherPayload, token: string) => void;
    setLoading: (isLoading: boolean) => void;
    logout: () => void;
    updateUser: (updatedFields: Partial<User>) => void;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    initializeAuth: () => string | null;
}

export interface ApiError {
    status?: number;
    message?: string;
    data?: any;
    errors?: Record<string, string[]>;
}

export interface PaginationParams {
    page?: number;
    perPage?: number;
}

export interface RouteConfig {
    path?: string;
    element: React.ReactElement;
    index?: boolean;
    roles?: string[];
    permissions?: string[];
}

// Global Component Type Definitions

// UI Components
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    containerClassName?: string;
    className?: string;
}

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    options?: SelectOption[];
    placeholder?: string;
    containerClassName?: string;
    className?: string;
}

// Form Components
export interface FormInputProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    error?: string;
    type?: string;
    [key: string]: any;
}

export interface FormSelectProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    options?: SelectOption[];
    error?: string;
    placeholder?: string;
    [key: string]: any;
}

// Table Components
export interface TableColumn<T = any> {
    header: string;
    accessor?: string | ((row: T) => React.ReactNode);
    cell?: (row: T) => React.ReactNode;
    /** Optional class for the td (e.g. whitespace-normal for wrapping) */
    cellClassName?: string;
    /** Min width for the column (number = px, or string e.g. '8rem') so content doesn't overlap; enables horizontal scroll */
    minWidth?: number | string;
}

export interface TableActionButtons<T = any> {
    showView?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    isDeleting?: boolean;
    getRowId?: (row: T) => number | string;
}

export interface TableProps<T = any> {
    columns?: TableColumn<T>[];
    data?: T[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    /** When true, table body scrolls with sticky header (use inside flex container with min-h-0) */
    scrollable?: boolean;
    /** Action buttons configuration for dynamic action column */
    actionButtons?: TableActionButtons<T>;
}

export interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
    perPage?: number;
    total?: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    className?: string;
}

// Layout Components
export interface MenuItem {
    path: string;
    label?: string; // Direct label (deprecated - use labelKey instead)
    labelKey?: string; // Translation key for i18n
    roles?: string[];
    permissions?: string[];
    icon?: string; // Icon component name (e.g., 'HomeIcon', 'TeacherIcon')
    subItems?: MenuItem[]; // Submenu items for expandable menus
}

// Other Components
export interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// Icon Components
export interface IconBaseProps extends React.SVGProps<SVGSVGElement> {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    className?: string;
    children?: React.ReactNode;
}

export interface IconProps extends Omit<IconBaseProps, 'children'> {
    className?: string;
}
