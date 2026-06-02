import { Controller } from 'react-hook-form';
/**
 * Form File Input Component
 */
const FormFile = ({ name, control, label, required = false, error, accept, multiple = false, disabled, hint, ...props }) => {
    return (<Controller name={name} control={control} render={({ field: { onChange, value, ...field }, fieldState }) => {
            const handleChange = (e) => {
                const files = e.target.files;
                if (files) {
                    onChange(multiple ? Array.from(files) : files[0]);
                }
            };
            return (<div>
                        {label && (<label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {required && <span className="text-red-500 ml-1">*</span>}
                            </label>)}
                        {hint ? (<p className="mb-2 text-xs text-primary-600 leading-relaxed">{hint}</p>) : null}
                        <input {...field} type="file" accept={accept} multiple={multiple} onChange={handleChange} disabled={disabled} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${error || fieldState.error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`} {...props}/>
                        {(error || fieldState.error?.message) && (<p className="mt-1 text-sm text-red-600">{error || fieldState.error?.message}</p>)}
                        {value && (<p className="mt-1 text-sm text-gray-500">
                                {multiple && Array.isArray(value)
                        ? `${value.length} file(s) selected`
                        : typeof value === 'string'
                            ? value
                            : value?.name}
                            </p>)}
                    </div>);
        }}/>);
};
export default FormFile;
