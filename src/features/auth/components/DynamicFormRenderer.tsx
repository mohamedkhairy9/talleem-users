import React from 'react';
import { Control, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { JoinRequestFormField } from '../types/registration.types';
import { FormInput, FormSelect, FormTextarea, FormFile, FormCheckbox } from '@/globals/components';

interface DynamicFormRendererProps<T extends FieldValues = FieldValues> {
    fields: JoinRequestFormField[];
    control: Control<T>;
    errors: any;
}

/**
 * Dynamic Form Renderer
 * Renders form fields based on API response structure
 */
const DynamicFormRenderer = <T extends FieldValues = FieldValues>({
    fields,
    control,
    errors
}: DynamicFormRendererProps<T>) => {
    const { t } = useTranslation();

    const renderField = (field: JoinRequestFormField, prefix = ''): React.ReactNode => {
        const fieldName = prefix ? `${prefix}.${field.key}` : field.key;
        const fieldError = prefix
            ? errors[prefix]?.[field.key]
            : errors[field.key];

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
                return (
                    <FormInput
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={field.label}
                        type={field.type}
                        required={field.required}
                        error={fieldError?.message}
                    />
                );

            case 'textarea':
                return (
                    <FormTextarea
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={field.label}
                        required={field.required}
                        error={fieldError?.message}
                        rows={3}
                    />
                );

            case 'boolean':
                return (
                    <FormCheckbox
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={field.label}
                        required={field.required}
                        error={fieldError?.message}
                    />
                );

            case 'file':
                return (
                    <FormFile
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={field.label}
                        required={field.required}
                        error={fieldError?.message}
                        multiple={field.multiple}
                    />
                );

            case 'object':
                // Multilingual object (name.ar, name.en)
                return (
                    <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                            name={`${fieldName}.ar`}
                            control={control}
                            label={`${field.label} (Arabic)`}
                            required={field.required}
                            error={fieldError?.ar?.message}
                        />
                        <FormInput
                            name={`${fieldName}.en`}
                            control={control}
                            label={`${field.label} (English)`}
                            required={field.required}
                            error={fieldError?.en?.message}
                        />
                    </div>
                );

            case 'select':
                // If options are provided, use static select
                if (field.options && field.options.length > 0) {
                    const options = field.options.map((opt) => ({
                        value: opt,
                        label: t(`common.${opt}`, opt)
                    }));

                    return (
                        <FormSelect
                            key={field.key}
                            name={fieldName}
                            control={control}
                            label={field.label}
                            required={field.required}
                            options={options}
                            error={fieldError?.message}
                        />
                    );
                } else {
                    // For dynamic selects without options, we'll use a generic async select
                    // This is a placeholder - in production, you'd map field keys to API endpoints
                    return (
                        <FormInput
                            key={field.key}
                            name={fieldName}
                            control={control}
                            label={field.label}
                            type="text"
                            required={field.required}
                            error={fieldError?.message}
                        />
                    );
                }

            case 'group':
                return (
                    <div key={field.key} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                        <h3 className="text-base font-semibold text-gray-800 mb-3">{field.label}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {field.fields?.map((subField) => renderField(subField, fieldName))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Separate fields by type for better layout
    const renderFields = () => {
        return fields.map((field) => {
            const isFullWidth = ['textarea', 'file', 'object', 'group'].includes(field.type);
            
            return (
                <div 
                    key={field.key} 
                    className={isFullWidth ? 'col-span-full' : ''}
                >
                    {renderField(field)}
                    {field.notes && (
                        <p className="mt-1 text-xs text-gray-500 italic">{field.notes}</p>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderFields()}
        </div>
    );
};

export default DynamicFormRenderer;


