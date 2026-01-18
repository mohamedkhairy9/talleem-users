import { Control, FieldValues } from 'react-hook-form';
import React from 'react';

/**
 * Global Type Definitions
 * Includes both component types and shared application types
 */

// Shared Application Types
export interface User {
    id: string | number;
    name?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    [key: string]: any;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null, token?: string) => void;
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
}

export interface TableProps<T = any> {
    columns?: TableColumn<T>[];
    data?: T[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
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
    icon?: string; // Icon name or component identifier
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
