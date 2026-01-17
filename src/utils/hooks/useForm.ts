import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import * as yup from 'yup';

/**
 * Custom hook for React Hook Form with Yup validation
 */
export const useFormWithValidation = <T extends FieldValues = FieldValues>({
    schema,
    defaultValues
}: {
    schema?: yup.ObjectSchema<any>;
    defaultValues?: DefaultValues<T>;
}): UseFormReturn<T> => {
    const form = useForm<T>({
        resolver: schema ? yupResolver(schema) : undefined,
        defaultValues,
        mode: 'onChange' // Validate on change for better UX
    });

    return form;
};
