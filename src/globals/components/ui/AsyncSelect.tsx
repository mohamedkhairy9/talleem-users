import React, { useCallback, useMemo } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import ReactSelect from 'react-select';
import { useTranslation } from 'react-i18next';

export interface AsyncSelectOption {
    value: string | number;
    label: string;
}

export interface AsyncSelectProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    error?: string;
    placeholder?: string;
    loadOptions: (inputValue: string, page: number) => Promise<{ options: AsyncSelectOption[]; hasMore: boolean }>;
    isMulti?: boolean;
    containerClassName?: string;
    className?: string;
    isLoading?: boolean;
}

/**
 * AsyncSelect Component with Pagination
 * Wrapper for react-select with async loading and pagination support
 */
const AsyncSelect = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    error,
    placeholder,
    loadOptions,
    isMulti = false,
    containerClassName = '',
    className = '',
    isLoading: externalLoading = false
}: AsyncSelectProps<T>) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<AsyncSelectOption[]>([]);
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);

    const loadInitialOptions = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await loadOptions('', 1);
            setOptions(result.options);
            setHasMore(result.hasMore);
            setPage(1);
        } catch (err) {
            console.error('Error loading options:', err);
        } finally {
            setIsLoading(false);
        }
    }, [loadOptions]);

    React.useEffect(() => {
        loadInitialOptions();
    }, [loadInitialOptions]);

    const handleInputChange = useCallback(async (newValue: string) => {
        setInputValue(newValue);
        setIsLoading(true);
        try {
            const result = await loadOptions(newValue, 1);
            setOptions(result.options);
            setHasMore(result.hasMore);
            setPage(1);
        } catch (err) {
            console.error('Error loading options:', err);
        } finally {
            setIsLoading(false);
        }
    }, [loadOptions]);

    const handleMenuScrollToBottom = useCallback(async () => {
        if (!hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const result = await loadOptions(inputValue, nextPage);
            setOptions(prev => [...prev, ...result.options]);
            setHasMore(result.hasMore);
            setPage(nextPage);
        } catch (err) {
            console.error('Error loading more options:', err);
        } finally {
            setIsLoading(false);
        }
    }, [hasMore, isLoading, page, inputValue, loadOptions]);

    const customStyles = useMemo(() => ({
        control: (base: any, state: any) => ({
            ...base,
            borderColor: error ? '#ef4444' : state.isFocused ? '#004247' : '#d1d5db',
            boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #004247') : 'none',
            '&:hover': {
                borderColor: error ? '#ef4444' : '#004247'
            },
            minHeight: '48px'
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 9999
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
    }), [error]);

    return (
        <Controller
            name={name as Path<T>}
            control={control as Control<T>}
            render={({ field }) => {
                const value = field.value;
                let selectedOption: AsyncSelectOption | AsyncSelectOption[] | null = null;

                if (isMulti) {
                    selectedOption = Array.isArray(value) && value.length > 0
                        ? options.filter(opt => value.includes(opt.value))
                        : [];
                } else {
                    selectedOption = value ? options.find(opt => opt.value === value) || null : null;
                }

                return (
                    <div className={containerClassName}>
                        {label && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}
                        <ReactSelect
                            value={selectedOption}
                            options={options}
                            isMulti={isMulti}
                            isSearchable
                            isLoading={isLoading || externalLoading}
                            placeholder={placeholder || t('common.select', 'Select an option')}
                            onInputChange={handleInputChange}
                            onMenuScrollToBottom={handleMenuScrollToBottom}
                            onChange={(newValue) => {
                                if (isMulti) {
                                    const values = Array.isArray(newValue) ? newValue.map(v => v.value) : [];
                                    field.onChange(values);
                                } else {
                                    field.onChange(newValue ? (newValue as AsyncSelectOption).value : null);
                                }
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            styles={customStyles}
                            className={className}
                            classNamePrefix="react-select"
                            noOptionsMessage={() => t('common.noOptions', 'No options found')}
                            loadingMessage={() => t('common.loading', 'Loading...')}
                        />
                        {error && (
                            <p className="mt-1 h-4 text-xs text-red-600">{error}</p>
                        )}
                    </div>
                );
            }}
        />
    );
};

export default AsyncSelect;

