import { Controller } from 'react-hook-form';
import ReactSelectComponent from '../ui/ReactSelect';
/**
 * Form Select Component
 * Wrapper for ReactSelect component with React Hook Form integration
 */
const FormSelect = ({ name, control, label, required = false, options = [], error, placeholder, ...props }) => {
    return (<Controller name={name} control={control} render={({ field, fieldState }) => (<div>
                    {label && (<label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </label>)}
                    <ReactSelectComponent value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} options={options} placeholder={placeholder} error={fieldState.error?.message || error} {...props}/>
                </div>)}/>);
};
export default FormSelect;
