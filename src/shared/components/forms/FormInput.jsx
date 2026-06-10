import { Controller } from 'react-hook-form';
import Input from '../ui/Input';
/**
 * Form Input Component
 * Wrapper for Input component with React Hook Form integration
 */
const FormInput = ({ name, control, label, required = false, error, type, ...props }) => {
    return (<Controller name={name} control={control} render={({ field, fieldState }) => {
            // Handle number inputs: clear 0 on focus and prevent leading zeros
            const handleFocus = (e) => {
                if (type === 'number' && field.value === 0) {
                    // Clear the value if it's 0
                    field.onChange('');
                    e.target.value = '';
                }
                else if (type === 'number') {
                    // Select all text for easy replacement
                    e.target.select();
                }
                // Call any custom onFocus handler if provided
                if (props.onFocus) {
                    props.onFocus(e);
                }
            };
            const handleChange = (e) => {
                if (type === 'number') {
                    const value = e.target.value;
                    // If the value starts with 0 followed by a digit, remove the leading 0
                    // But allow 0 alone or empty string
                    if (value.length > 1 && value.startsWith('0') && /^\d+$/.test(value)) {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue)) {
                            // Create a new event with the corrected value
                            const syntheticEvent = {
                                ...e,
                                target: {
                                    ...e.target,
                                    value: numValue.toString()
                                }
                            };
                            field.onChange(numValue);
                            // Call any custom onChange handler if provided
                            if (props.onChange) {
                                props.onChange(syntheticEvent);
                            }
                            return;
                        }
                    }
                }
                // Use the default onChange handler
                field.onChange(e);
                // Call any custom onChange handler if provided
                if (props.onChange) {
                    props.onChange(e);
                }
            };
            return (<Input {...field} {...props} type={type} label={label} required={required} error={fieldState.error?.message || error} onFocus={handleFocus} onChange={handleChange}/>);
        }}/>);
};
export default FormInput;
