import { Controller } from 'react-hook-form';
/**
 * Form Textarea Component
 */
const FormTextarea = ({
    name,
    control,
    label,
    required = false,
    error,
    placeholder,
    rows = 4,
    disabled,
    className = '',
    containerClassName = '',
    ...props
}) => {
    return (<Controller name={name} control={control} render={({ field, fieldState }) => (<div>
                    <div className={containerClassName}>
                    {label && (<label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </label>)}
                    <textarea {...field} rows={rows} placeholder={placeholder} disabled={disabled} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${error || fieldState.error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''} resize-y ${className}`} {...props}/>
                    {(error || fieldState.error?.message) && (<p className="mt-1 text-sm text-red-600">{error || fieldState.error?.message}</p>)}
                    </div>
                </div>)}/>);
};
export default FormTextarea;
