import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import Input from '../ui/Input';
import { FormInputProps } from '@/globals/types';

/**
 * Form Input Component
 * Wrapper for Input component with React Hook Form integration
 */
const FormInput = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    error,
    ...props
}: FormInputProps<T>) => {
    return (
        <Controller
            name={name as Path<T>}
            control={control as Control<T>}
            render={({ field, fieldState }) => (
                <Input
                    {...field}
                    label={label}
                    required={required}
                    error={fieldState.error?.message || error}
                    {...props}
                />
            )}
        />
    );
};

export default FormInput;
