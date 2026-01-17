import React from 'react';
import { Controller, Control, FieldValues } from 'react-hook-form';
import Select from '../ui/Select';
import { FormSelectProps } from '@/globals/types';

/**
 * Form Select Component
 * Wrapper for Select component with React Hook Form integration
 */
const FormSelect = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    options = [],
    error,
    ...props
}: FormSelectProps<T>) => {
    return (
        <Controller
            name={name}
            control={control as Control<T>}
            render={({ field, fieldState }) => (
                <Select
                    {...field}
                    label={label}
                    required={required}
                    options={options}
                    error={fieldState.error?.message || error}
                    {...props}
                />
            )}
        />
    );
};

export default FormSelect;
