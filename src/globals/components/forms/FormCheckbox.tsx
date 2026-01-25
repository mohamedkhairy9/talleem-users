import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormCheckboxProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    error?: string;
}

/**
 * Form Checkbox Component (for boolean fields)
 */
const FormCheckbox = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    error,
    ...props
}: FormCheckboxProps<T>) => {
    return (
        <Controller
            name={name as Path<T>}
            control={control as Control<T>}
            render={({ field, fieldState }) => (
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            {...field}
                            type="checkbox"
                            checked={field.value || false}
                            className={`w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary ${
                                error || fieldState.error ? 'border-red-500' : ''
                            }`}
                            {...props}
                        />
                        {label && (
                            <span className="text-sm font-medium text-gray-700">
                                {label}
                                {required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        )}
                    </label>
                    {(error || fieldState.error?.message) && (
                        <p className="mt-1 text-sm text-red-600">{error || fieldState.error?.message}</p>
                    )}
                </div>
            )}
        />
    );
};

export default FormCheckbox;


