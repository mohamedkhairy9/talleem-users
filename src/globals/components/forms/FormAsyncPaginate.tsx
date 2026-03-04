import { useEffect, useState } from 'react';
import { Controller, Control, FieldValues, Path, useWatch } from 'react-hook-form';
import { AsyncPaginate } from 'react-select-async-paginate';
import type { GroupBase } from 'react-select';
import { useTranslation } from 'react-i18next';

export interface AsyncPaginateOption {
    value: string | number;
    label: string;
}

export interface FormAsyncPaginateProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    error?: string;
    placeholder?: string;
    isDisabled?: boolean;
    isMulti?: boolean;
    /** loadOptions(search, loadedOptions, additional) => Promise<{ options, hasMore?, additional }> */
    loadOptions: (
        search: string,
        loadedOptions: unknown,
        additional?: { page?: number }
    ) => Promise<{ options: AsyncPaginateOption[]; hasMore?: boolean; additional?: { page: number } }>;
    defaultAdditional?: { page: number };
}

const PRIMARY_COLOR = '#004247';
const ERROR_COLOR = '#ef4444';

/**
 * Async select with pagination (same approach as booking-pro-dashboard-dev).
 * Integrates AsyncPaginate with React Hook Form.
 */
function FormAsyncPaginate<T extends FieldValues = FieldValues>(props: FormAsyncPaginateProps<T>) {
    const {
        name,
        control,
        label,
        required = false,
        error,
        placeholder,
        isDisabled = false,
        isMulti = false,
        loadOptions,
        defaultAdditional = { page: 1 }
    } = props;
    const { t } = useTranslation();
    const [cachedOption, setCachedOption] = useState<AsyncPaginateOption | null>(null);
    const [cachedOptionsMulti, setCachedOptionsMulti] = useState<Map<string | number, AsyncPaginateOption>>(new Map());
    const watchedValue = useWatch({ control, name: name as Path<T>, defaultValue: undefined });

    useEffect(() => {
        const value = watchedValue;
        if (isMulti) {
            if (!Array.isArray(value) || value.length === 0) {
                setCachedOptionsMulti(new Map());
            } else {
                setCachedOptionsMulti((prev) => {
                    const next = new Map<string | number, AsyncPaginateOption>();
                    value.forEach((v: string | number) => {
                        const o = prev.get(v);
                        if (o) next.set(v, o);
                    });
                    return next;
                });
            }
        } else {
            if (value == null || value === '') setCachedOption(null);
            else if (cachedOption && cachedOption.value !== value) setCachedOption(null);
        }
    }, [isMulti, watchedValue, cachedOption?.value]);

    const customStyles = {
        control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
            ...base,
            borderColor: error ? ERROR_COLOR : state.isFocused ? PRIMARY_COLOR : '#d1d5db',
            boxShadow: state.isFocused ? (error ? `0 0 0 1px ${ERROR_COLOR}` : `0 0 0 1px ${PRIMARY_COLOR}`) : 'none',
            minHeight: '48px',
            backgroundColor: isDisabled ? '#f3f4f6' : 'white'
        }),
        menu: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
        option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
            ...base,
            backgroundColor: state.isSelected ? PRIMARY_COLOR : state.isFocused ? '#f0f9fa' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            cursor: 'pointer'
        })
    };

    return (
        <Controller
            name={name as Path<T>}
            control={control as Control<T>}
            render={({ field }) => {
                const value = field.value;
                const resolvedValue: AsyncPaginateOption | AsyncPaginateOption[] | null = isMulti
                    ? Array.isArray(value) && value.length > 0
                        ? value.map((v: string | number) => cachedOptionsMulti.get(v) ?? { value: v, label: String(v) })
                        : null
                    : value != null && value !== ''
                        ? (cachedOption && cachedOption.value === value ? cachedOption : { value, label: String(value) })
                        : null;

                return (
                    <div>
                        {label && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}
                        <AsyncPaginate<AsyncPaginateOption, GroupBase<AsyncPaginateOption>, { page: number }, boolean>
                            value={resolvedValue}
                            loadOptions={loadOptions}
                            onChange={(option) => {
                                if (isMulti) {
                                    const arr = Array.isArray(option) ? option : [];
                                    setCachedOptionsMulti((prev) => {
                                        const next = new Map(prev);
                                        arr.forEach((o) => next.set(o.value, o));
                                        return next;
                                    });
                                    field.onChange(arr.map((o) => o.value));
                                } else {
                                    const single = option as AsyncPaginateOption | null;
                                    setCachedOption(single ?? null);
                                    field.onChange(single?.value ?? null);
                                }
                            }}
                            onBlur={field.onBlur}
                            additional={defaultAdditional}
                            defaultAdditional={defaultAdditional}
                            getOptionLabel={(o) => o.label}
                            getOptionValue={(o) => String(o.value)}
                            isClearable
                            isDisabled={isDisabled}
                            placeholder={placeholder !== undefined ? placeholder : t('common.select', 'Select an option')}
                            classNamePrefix="react-select"
                            styles={customStyles}
                            noOptionsMessage={() => t('common.noOptions', 'No options found')}
                            debounceTimeout={300}
                        />
                        {error && <p className="mt-1 h-4 text-xs text-red-600">{error}</p>}
                    </div>
                );
            }}
        />
    );
}

export default FormAsyncPaginate;
