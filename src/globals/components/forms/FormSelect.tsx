import React from 'react';
import { Controller, Control, FieldValues } from 'react-hook-form';
import ReactSelectComponent from '../ui/ReactSelect';
import { FormSelectProps } from '@/globals/types';

/**
 * Form Select Component
 * Wrapper for ReactSelect component with React Hook Form integration
 */
const FormSelect = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    options = [],
    error,
    placeholder,
    ...props
}: FormSelectProps<T>) => {
    return (
        <Controller
            name={name}
            control={control as Control<T>}
            render={({ field, fieldState }) => (
                <div>
                    {label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    )}
                    <ReactSelectComponent
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        options={options}
                        placeholder={placeholder}
                        error={fieldState.error?.message || error}
                        {...props}
                    />
                </div>
            )}
        />
    );
};

export default FormSelect;
