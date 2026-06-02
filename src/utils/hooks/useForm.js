import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
/**
 * Custom hook for React Hook Form with Yup validation
 */
export const useFormWithValidation = ({ schema, defaultValues }) => {
    const form = useForm({
        resolver: schema ? yupResolver(schema) : undefined,
        defaultValues,
        mode: 'onChange' // Validate on change for better UX
    });
    return form;
};
