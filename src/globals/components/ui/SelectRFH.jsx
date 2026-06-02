import { useState, useEffect } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { useTranslation } from 'react-i18next';
/** Primary color for control focus and option highlight (matches ReactSelect) */
const PRIMARY_COLOR = '#004247';
const PRIMARY_COLOR_LIGHT = '#f0f9fa';
/**
 * Resolve form value (id/value or array of) to react-select option(s).
 * Same logic as Tallem SelectRFH: store only primitives, display via options list.
 */
function getValue(valueToTransform, optionsList, isMulti) {
    const availableOptions = optionsList ?? [];
    if (valueToTransform === undefined || valueToTransform === null) {
        return null;
    }
    if (isMulti) {
        const valueArray = Array.isArray(valueToTransform)
            ? valueToTransform
            : [valueToTransform];
        const normalizedValues = valueArray.map((element) => {
            const optionLike = element;
            if (optionLike?.id !== undefined)
                return optionLike.id;
            if (optionLike?.value !== undefined)
                return optionLike.value;
            return element;
        });
        const matchedOptions = availableOptions.filter((option) => {
            const optionId = option.id !== undefined ? option.id : null;
            const optionValue = option.value !== undefined ? option.value : null;
            return normalizedValues.some((normalizedVal) => normalizedVal === optionId || normalizedVal === optionValue);
        });
        return matchedOptions.map((option) => ({
            value: option.value !== undefined ? option.value : option.id,
            label: option.label ?? option.name ?? ''
        }));
    }
    const singleValue = Array.isArray(valueToTransform)
        ? valueToTransform[0]
        : valueToTransform;
    const matchedOption = availableOptions.find((option) => {
        const optionId = option.id !== undefined ? option.id : null;
        const optionValue = option.value !== undefined ? option.value : null;
        return ((optionId !== null && optionId === singleValue) ||
            (optionValue !== null && optionValue === singleValue));
    });
    if (!matchedOption)
        return null;
    return {
        label: matchedOption.label ?? matchedOption.name ?? '',
        value: matchedOption.value !== undefined ? matchedOption.value : matchedOption.id
    };
}
/**
 * Select with React Hook Form (Controller).
 * Same API and logic as Tallem: options + loading at form level, store only primitive id/value.
 */
function SelectRFH({ label, name, control, error, options = [], isMulti = false, disabled = false, width, defaultValue, classes = '', placeholder = 'common.select', required = false, loading = false, loadOptions, defaultOptions = true, cacheOptions = true, isAsync = false }) {
    const { t } = useTranslation();
    const optionsList = options ?? [];
    // State to store loaded selected option for async selects (keyed by field value)
    const [loadedSelectedOptions, setLoadedSelectedOptions] = useState(new Map());
    // Watch the field value to load selected option (for async selects)
    const fieldValue = useWatch({ control, name });
    // Load selected option when value changes (for async selects)
    useEffect(() => {
        if (isAsync && loadOptions && fieldValue !== null && fieldValue !== undefined) {
            const loadSelectedOption = async () => {
                try {
                    // Load all options (empty search) to find the selected one
                    const allOptions = await loadOptions('');
                    if (isMulti) {
                        const valueArray = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
                        const newMap = new Map(loadedSelectedOptions);
                        valueArray.forEach(val => {
                            const matched = allOptions.find(opt => {
                                const optValue = opt.value !== undefined ? opt.value : opt.id;
                                return optValue === val;
                            });
                            if (matched) {
                                newMap.set(val, matched);
                            }
                        });
                        setLoadedSelectedOptions(newMap);
                    }
                    else {
                        const optValue = typeof fieldValue === 'number' ? fieldValue : (typeof fieldValue === 'string' ? parseInt(fieldValue, 10) : fieldValue);
                        const matched = allOptions.find(opt => {
                            const optionValue = opt.value !== undefined ? opt.value : opt.id;
                            return optionValue === optValue;
                        });
                        if (matched) {
                            const newMap = new Map(loadedSelectedOptions);
                            newMap.set(optValue, matched);
                            setLoadedSelectedOptions(newMap);
                        }
                    }
                }
                catch (error) {
                    console.error('Error loading selected option:', error);
                }
            };
            loadSelectedOption();
        }
    }, [fieldValue, isAsync, loadOptions, isMulti]);
    const commonStyles = {
        control: (base, state) => ({
            ...base,
            borderColor: error ? '#ef4444' : state.isFocused ? PRIMARY_COLOR : '#d1d5db',
            boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #004247') : 'none',
            '&:hover': {
                borderColor: error ? '#ef4444' : '#004247'
            },
            minHeight: '48px',
            backgroundColor: disabled ? '#f3f4f6' : 'white',
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
        })
    };
    const commonProps = {
        isMulti,
        className: `react-select ${width ?? 'w-full'} ${classes}`,
        classNamePrefix: 'react-select',
        isDisabled: disabled,
        placeholder: loading
            ? t('common.loading', 'Loading...')
            : t(placeholder, 'Please select ..'),
        menuPortalTarget: document.body,
        menuPosition: 'fixed',
        getOptionValue: (option) => String(option.value !== undefined ? option.value : option.id ?? ''),
        getOptionLabel: (option) => option.label ?? option.name ?? '',
        styles: commonStyles
    };
    return (<div>
            {label && (<label htmlFor={String(name)} className="block text-sm font-medium text-gray-700 mb-1">
                    {typeof label === 'string' && label.startsWith('common.') ? t(label) : label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>)}
            <Controller name={name} control={control} defaultValue={defaultValue} render={({ field }) => {
            // Determine selected value
            let selectedValue = null;
            if (isAsync && loadOptions) {
                // Use the loaded option if available, otherwise create a temporary one
                if (field.value !== null && field.value !== undefined) {
                    if (isMulti) {
                        const valueArray = Array.isArray(field.value) ? field.value : [field.value];
                        const loaded = valueArray.map(val => loadedSelectedOptions.get(val)).filter(Boolean);
                        if (loaded.length === valueArray.length) {
                            selectedValue = loaded;
                        }
                        else {
                            // Some options not loaded yet, create temporary ones
                            selectedValue = valueArray.map((val) => {
                                const loaded = loadedSelectedOptions.get(val);
                                return loaded || {
                                    value: val,
                                    id: val,
                                    label: `Loading...`,
                                    name: `Loading...`
                                };
                            });
                        }
                    }
                    else {
                        const optValue = typeof field.value === 'number' ? field.value : (typeof field.value === 'string' ? parseInt(field.value, 10) : field.value);
                        const loaded = loadedSelectedOptions.get(optValue);
                        if (loaded) {
                            selectedValue = loaded;
                        }
                        else {
                            // Create temporary option while loading
                            selectedValue = {
                                value: optValue,
                                id: optValue,
                                label: `Loading...`,
                                name: `Loading...`
                            };
                        }
                    }
                }
            }
            else {
                // For regular selects, use the normal getValue function
                selectedValue = getValue(field.value, optionsList, isMulti ?? false);
            }
            // Use AsyncSelect if loadOptions is provided
            if (isAsync && loadOptions) {
                return (<AsyncSelect {...commonProps} value={selectedValue} loadOptions={loadOptions} defaultOptions={defaultOptions} cacheOptions={cacheOptions} isLoading={loading} 
                // Ensure the selected value is properly formatted
                getOptionValue={(option) => String(option.value !== undefined ? option.value : option.id ?? '')} getOptionLabel={(option) => option.label ?? option.name ?? String(option.value ?? option.id ?? '')} onChange={(selectedOptionOrOptions) => {
                        if (isMulti) {
                            const selectedOptions = Array.isArray(selectedOptionOrOptions)
                                ? selectedOptionOrOptions
                                : [];
                            // Store selected options in cache
                            const newMap = new Map(loadedSelectedOptions);
                            selectedOptions.forEach(opt => {
                                const val = opt.value !== undefined ? opt.value : opt.id;
                                if (val !== undefined && val !== null) {
                                    newMap.set(val, opt);
                                }
                            });
                            setLoadedSelectedOptions(newMap);
                            const primitiveValues = selectedOptions.map((option) => option.value !== undefined
                                ? option.value
                                : option.id);
                            field.onChange(primitiveValues);
                        }
                        else {
                            const selectedOption = selectedOptionOrOptions;
                            if (selectedOption) {
                                // Store selected option in cache
                                const val = selectedOption.value !== undefined ? selectedOption.value : selectedOption.id;
                                if (val !== undefined && val !== null) {
                                    const newMap = new Map(loadedSelectedOptions);
                                    newMap.set(val, selectedOption);
                                    setLoadedSelectedOptions(newMap);
                                }
                            }
                            const primitiveValue = selectedOption?.value !== undefined
                                ? selectedOption.value
                                : selectedOption?.id;
                            field.onChange(primitiveValue ?? null);
                        }
                    }} onBlur={field.onBlur} name={field.name}/>);
            }
            // Regular Select for static options
            return (<Select {...commonProps} value={selectedValue} options={optionsList} isLoading={loading} onChange={(selectedOptionOrOptions) => {
                    if (isMulti) {
                        const selectedOptions = Array.isArray(selectedOptionOrOptions)
                            ? selectedOptionOrOptions
                            : [];
                        const primitiveValues = selectedOptions.map((option) => option.value !== undefined
                            ? option.value
                            : option.id);
                        field.onChange(primitiveValues);
                    }
                    else {
                        const selectedOption = selectedOptionOrOptions;
                        const primitiveValue = selectedOption?.value !== undefined
                            ? selectedOption.value
                            : selectedOption?.id;
                        field.onChange(primitiveValue ?? null);
                    }
                }} onBlur={field.onBlur} name={field.name}/>);
        }}/>
            <p className="mt-1 h-4 text-xs text-red-600" role="alert">
                {error ?? ''}
            </p>
        </div>);
}
export default SelectRFH;
