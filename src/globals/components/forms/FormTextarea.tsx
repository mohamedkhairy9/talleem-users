import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormTextareaProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    error?: string;
    placeholder?: string;
    rows?: number;
}

/**
 * Form Textarea Component
 */
const FormTextarea = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    error,
    placeholder,
    rows = 4,
    ...props
}: FormTextareaProps<T>) => {
    return (
        <Controller
            name={name as Path<T>}
            control={control as Control<T>}
            render={({ field, fieldState }) => (
                <div>
                    {label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    )}
                    <textarea
                        {...field}
                        rows={rows}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            error || fieldState.error ? 'border-red-500' : 'border-gray-300'
                        } resize-y`}
                        {...props}
                    />
                    {(error || fieldState.error?.message) && (
                        <p className="mt-1 text-sm text-red-600">{error || fieldState.error?.message}</p>
                    )}
                </div>
            )}
        />
    );
};

export default FormTextarea;


