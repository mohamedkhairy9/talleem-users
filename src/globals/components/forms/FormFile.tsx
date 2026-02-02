import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormFileProps<T extends FieldValues = FieldValues> {
    name: string;
    control: Control<T>;
    label?: string;
    required?: boolean;
    error?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
}

/**
 * Form File Input Component
 */
const FormFile = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    required = false,
    error,
    accept,
    multiple = false,
    disabled,
    ...props
}: FormFileProps<T>) => {
    return (
        <Controller
            name={name as Path<T>}
            control={control as Control<T>}
            render={({ field: { onChange, value, ...field }, fieldState }) => {
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    if (files) {
                        onChange(multiple ? Array.from(files) : files[0]);
                    }
                };

                return (
                    <div>
                        {label && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}
                        <input
                            {...field}
                            type="file"
                            accept={accept}
                            multiple={multiple}
                            onChange={handleChange}
                            disabled={disabled}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                                error || fieldState.error ? 'border-red-500' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                            {...props}
                        />
                        {(error || fieldState.error?.message) && (
                            <p className="mt-1 text-sm text-red-600">{error || fieldState.error?.message}</p>
                        )}
                        {value && (
                            <p className="mt-1 text-sm text-gray-500">
                                {multiple && Array.isArray(value)
                                    ? `${value.length} file(s) selected`
                                    : typeof value === 'string'
                                    ? value
                                    : (value as File)?.name}
                            </p>
                        )}
                    </div>
                );
            }}
        />
    );
};

export default FormFile;


