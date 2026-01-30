import React from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';

/** Primary color for control focus and option highlight (matches ReactSelect) */
const PRIMARY_COLOR = '#004247';
const PRIMARY_COLOR_LIGHT = '#f0f9fa';

/** Option shape supported by SelectRFH (id or value as primitive, label/name for display) */
export interface SelectRFHOption {
    id?: number | string;
    value?: number | string;
    label?: string;
    name?: string;
}

export interface SelectRFHProps<T extends FieldValues = FieldValues> {
    name: Path<T>;
    control: Control<T>;
    label?: string;
    error?: string;
    options?: SelectRFHOption[] | null;
    isMulti?: boolean;
    disabled?: boolean;
    width?: string;
    defaultValue?: unknown;
    classes?: string;
    placeholder?: string;
    info?: string;
    required?: boolean;
    loading?: boolean;
}

/**
 * Resolve form value (id/value or array of) to react-select option(s).
 * Same logic as Tallem SelectRFH: store only primitives, display via options list.
 */
function getValue(
    valueToTransform: unknown,
    optionsList: SelectRFHOption[] | null | undefined,
    isMulti: boolean
): SelectRFHOption | SelectRFHOption[] | null {
    const availableOptions = optionsList ?? [];

    if (valueToTransform === undefined || valueToTransform === null) {
        return null;
    }

    if (isMulti) {
        const valueArray = Array.isArray(valueToTransform)
            ? valueToTransform
            : [valueToTransform];

        const normalizedValues = valueArray.map((element: unknown) => {
            const optionLike = element as { id?: number | string; value?: number | string } | null | undefined;
            if (optionLike?.id !== undefined) return optionLike.id;
            if (optionLike?.value !== undefined) return optionLike.value;
            return element;
        });

        const matchedOptions = availableOptions.filter((option) => {
            const optionId = option.id !== undefined ? option.id : null;
            const optionValue = option.value !== undefined ? option.value : null;
            return normalizedValues.some(
                (normalizedVal) => normalizedVal === optionId || normalizedVal === optionValue
            );
        });

        return matchedOptions.map((option) => ({
            value: option.value !== undefined ? option.value : option.id,
            label: option.label ?? option.name ?? ''
        })) as SelectRFHOption[];
    }

    const singleValue = Array.isArray(valueToTransform)
        ? valueToTransform[0]
        : valueToTransform;

    const matchedOption = availableOptions.find((option) => {
        const optionId = option.id !== undefined ? option.id : null;
        const optionValue = option.value !== undefined ? option.value : null;
        return (
            (optionId !== null && optionId === singleValue) ||
            (optionValue !== null && optionValue === singleValue)
        );
    });

    if (!matchedOption) return null;
    return {
        label: matchedOption.label ?? matchedOption.name ?? '',
        value: matchedOption.value !== undefined ? matchedOption.value : matchedOption.id
    } as SelectRFHOption;
}

/**
 * Select with React Hook Form (Controller).
 * Same API and logic as Tallem: options + loading at form level, store only primitive id/value.
 */
function SelectRFH<T extends FieldValues = FieldValues>({
    label,
    name,
    control,
    error,
    options = [],
    isMulti = false,
    disabled = false,
    width,
    defaultValue,
    classes = '',
    placeholder = 'common.select',
    info = '',
    required = false,
    loading = false
}: SelectRFHProps<T>) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const optionsList = options ?? [];

    return (
        <div className="flex flex-col gap-px">
            {label && (
                <label
                    htmlFor={String(name)}
                    className="flex items-center gap-2 font-medium text-gray-700 mb-1"
                >
                    <span>
                        {typeof label === 'string' && label.startsWith('common.') ? t(label) : label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                </label>
            )}
            <Controller
                name={name}
                control={control}
                defaultValue={defaultValue}
                render={({ field }) => {
                    const selectedValue = getValue(
                        field.value,
                        optionsList,
                        isMulti ?? false
                    );

                    return (
                        <Select<SelectRFHOption, boolean>
                            value={selectedValue as any}
                            isMulti={isMulti}
                            className={`react-select ${width ?? 'w-full min-w-[300px]'} ${classes}`}
                            classNamePrefix="react-select"
                            options={optionsList}
                            isDisabled={disabled}
                            isLoading={loading}
                            placeholder={
                                loading
                                    ? t('common.loading', 'Loading...')
                                    : t(placeholder, 'Please select ..')
                            }
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            getOptionValue={(option) =>
                                String(option.value !== undefined ? option.value : option.id ?? '')
                            }
                            getOptionLabel={(option) =>
                                option.label ?? option.name ?? ''
                            }
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    padding: !isRTL
                                        ? '6px 0px 6px 16px'
                                        : '6px 16px 6px 0px',
                                    minHeight: '44px',
                                    borderRadius: '8px',
                                    boxShadow: state.isFocused
                                        ? (error ? '0 0 0 1px #ef4444' : `0 0 0 1px ${PRIMARY_COLOR}`)
                                        : 'none',
                                    borderColor: error ? '#ef4444' : state.isFocused ? PRIMARY_COLOR : '#d1d5db',
                                    '&:hover': {
                                        borderColor: error ? '#ef4444' : PRIMARY_COLOR
                                    }
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '0'
                                }),
                                input: (base) => ({
                                    ...base,
                                    margin: '0',
                                    padding: '0'
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    margin: '0',
                                    color: '#9ca3af'
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected
                                        ? PRIMARY_COLOR
                                        : state.isFocused
                                        ? PRIMARY_COLOR_LIGHT
                                        : 'white',
                                    color: state.isSelected ? 'white' : '#374151',
                                    cursor: 'pointer',
                                    '&:active': {
                                        backgroundColor: PRIMARY_COLOR,
                                        color: 'white'
                                    }
                                }),
                                singleValue: (base, state) => ({
                                    ...base,
                                    color: state.isDisabled
                                        ? '#000000'
                                        : base.color
                                })
                            }}
                            onChange={(selectedOptionOrOptions) => {
                                if (isMulti) {
                                    const selectedOptions = Array.isArray(selectedOptionOrOptions)
                                        ? selectedOptionOrOptions
                                        : [];
                                    const primitiveValues = selectedOptions.map(
                                        (option) =>
                                            option.value !== undefined
                                                ? option.value
                                                : option.id
                                    );
                                    field.onChange(primitiveValues as any);
                                } else {
                                    const primitiveValue =
                                        selectedOptionOrOptions?.value !== undefined
                                            ? selectedOptionOrOptions.value
                                            : (selectedOptionOrOptions as SelectRFHOption)?.id;
                                    field.onChange(primitiveValue ?? null);
                                }
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                        />
                    );
                }}
            />
            <p
                className="mt-1 h-4 text-xs text-red-600"
                role="alert"
            >
                {error ?? ''}
            </p>
        </div>
    );
}

export default SelectRFH;
