import React from 'react';
import ReactSelect from 'react-select';
import { useTranslation } from 'react-i18next';
import { SelectOption } from '@/globals/types';

export interface ReactSelectProps {
    value?: string | number | null;
    onChange?: (value: string | number | null) => void;
    onBlur?: () => void;
    name?: string;
    options: SelectOption[];
    placeholder?: string;
    isMulti?: boolean;
    isDisabled?: boolean;
    error?: string;
    className?: string;
    /** Portal the menu to document.body so it isn't clipped by overflow:hidden parents (e.g. modals) */
    menuPortalTarget?: HTMLElement | null;
    /** Use with menuPortalTarget for correct positioning */
    menuPosition?: 'absolute' | 'fixed';
}

/**
 * ReactSelect Component
 * Wrapper for react-select with consistent styling for static options
 */
const ReactSelectComponent: React.FC<ReactSelectProps> = ({
    value,
    onChange,
    onBlur,
    name,
    options = [],
    placeholder,
    isMulti = false,
    isDisabled = false,
    error,
    className = '',
    menuPortalTarget,
    menuPosition = 'fixed'
}) => {
    const { t } = useTranslation();

    const customStyles = React.useMemo(() => ({
        control: (base: any, state: any) => ({
            ...base,
            borderColor: error ? '#ef4444' : state.isFocused ? '#004247' : '#d1d5db',
            boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #004247') : 'none',
            '&:hover': {
                borderColor: error ? '#ef4444' : '#004247'
            },
            minHeight: '48px',
            backgroundColor: isDisabled ? '#f3f4f6' : 'white'
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 9999
        }),
        ...(menuPortalTarget && {
            menuPortal: (base: any) => ({ ...base, zIndex: 100 })
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
                ? '#004247'
                : state.isFocused
                ? '#f0f9fa'
                : 'white',
            color: state.isSelected ? 'white' : '#374151',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: '#004247',
                color: 'white'
            }
        })
    }), [error, isDisabled, menuPortalTarget]);

    // Convert options to react-select format
    const reactSelectOptions = options.map(option => ({
        value: option.value,
        label: option.label
    }));

    // Handle value conversion
    let selectedOption: { value: string | number; label: string } | { value: string | number; label: string }[] | null = null;

    if (isMulti) {
        if (Array.isArray(value) && value.length > 0) {
            selectedOption = reactSelectOptions.filter(opt => value.includes(opt.value));
        } else {
            selectedOption = [];
        }
    } else {
        selectedOption = value !== null && value !== undefined
            ? reactSelectOptions.find(opt => opt.value === value) || null
            : null;
    }

    const handleChange = (newValue: any) => {
        if (!onChange) return;

        if (isMulti) {
            const values = Array.isArray(newValue) ? newValue.map(v => v.value) : [];
            onChange(values as any);
        } else {
            onChange(newValue ? newValue.value : null);
        }
    };

    return (
        <div className={className}>
            <ReactSelect
                value={selectedOption}
                options={reactSelectOptions}
                onChange={handleChange}
                onBlur={onBlur}
                name={name}
                isMulti={isMulti}
                isDisabled={isDisabled}
                isSearchable={false}
                placeholder={placeholder || t('common.select', 'Select an option')}
                styles={customStyles}
                classNamePrefix="react-select"
                noOptionsMessage={() => t('common.noOptions', 'No options found')}
                menuPortalTarget={menuPortalTarget}
                menuPosition={menuPortalTarget ? menuPosition : undefined}
            />
            {error && (
                <p className="mt-1 h-4 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
};

export default ReactSelectComponent;

