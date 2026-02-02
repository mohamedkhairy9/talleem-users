import React from 'react';
import { Control, FieldValues, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { JoinRequestFormField } from '../types/registration.types';
import { FormInput, FormSelect, FormTextarea, FormFile, FormCheckbox } from '@/globals/components';
import { useRegistrationFormOptions, useNeighborhoodsOptions } from '../hooks/useRegistrationFormOptions';

interface DynamicFormRendererProps<T extends FieldValues = FieldValues> {
    fields: JoinRequestFormField[];
    control: Control<T>;
    errors: any;
}

/**
 * Dynamic Form Renderer
 * Renders form fields based on API response structure with dynamic options and dependencies
 * Follows the same approach as Tallem project's FormEntity
 */
const DynamicFormRenderer = <T extends FieldValues = FieldValues>({
    fields,
    control,
    errors
}: DynamicFormRendererProps<T>) => {
    const { t } = useTranslation();
    
    // Watch form values for dependencies
    const formValues = useWatch({ control });
    const branchId = formValues?.branch_id;
    const cityId = formValues?.city_id;
    const mainProgramId = formValues?.main_program_id;

    // Fetch all form options
    const options = useRegistrationFormOptions();
    
    // Get selected branch to extract city
    const selectedBranch = React.useMemo(() => {
        if (!branchId || !options.rawBranches) return null;
        return options.rawBranches.find((branch: any) => (branch.id || branch.value) == branchId);
    }, [branchId, options.rawBranches]);

    // Get city from selected branch
    const branchCity = React.useMemo(() => {
        return selectedBranch?.city || null;
    }, [selectedBranch]);

    // Fetch neighborhoods based on city_id
    const neighborhoodsOptions = useNeighborhoodsOptions(cityId);

    // Check if field should be visible based on visible_when conditions
    const isFieldVisible = (field: JoinRequestFormField, prefix = ''): boolean => {
        if (!field.visible_when) return true;

        for (const [depField, allowedValues] of Object.entries(field.visible_when)) {
            const currentValue = formValues?.[depField];
            
            if (!currentValue || !allowedValues.includes(String(currentValue))) {
                return false;
            }
        }
        return true;
    };

    // Check if field should be disabled
    const isFieldDisabled = (field: JoinRequestFormField, prefix = ''): boolean => {
        if (field.disabled) return true;

        // Disable city_id, neighborhood_id if branch_id is not selected
        if (field.key === 'city_id' || field.key === 'neighborhood_id') {
            return !branchId;
        }

        // Handle depends_on
        if (field.depends_on) {
            const depFieldName = field.depends_on.field;
            const depValue = formValues?.[depFieldName];
            return !depValue;
        }

        return false;
    };

    const renderField = (field: JoinRequestFormField, prefix = ''): React.ReactNode => {
        const fieldName = prefix ? `${prefix}.${field.key}` : field.key;
        const fieldError = prefix
            ? errors[prefix]?.[field.key]
            : errors[field.key];

        // Check visibility
        if (!isFieldVisible(field, prefix)) {
            return null;
        }

        const isDisabled = isFieldDisabled(field, prefix);

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
                // Special handling for city_id - show city name from branch (read-only)
                if (field.key === 'city_id' && branchCity) {
                    const cityName = typeof branchCity === 'object' 
                        ? (branchCity.ar || branchCity.en || branchCity.name?.ar || branchCity.name?.en || '')
                        : String(branchCity || '');
                    return (
                        <FormInput
                            key={field.key}
                            name={fieldName}
                            control={control}
                            label={field.label}
                            type="text"
                            required={field.required}
                            error={fieldError?.message}
                            disabled={true}
                            value={cityName}
                        />
                    );
                }
                return (
                    <FormInput
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={field.label}
                        type={field.type}
                        required={field.required}
                        error={fieldError?.message}
                        disabled={isDisabled}
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
                        disabled={isDisabled}
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
                        disabled={isDisabled}
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
                        accept={field.accept}
                        disabled={isDisabled}
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
                            disabled={isDisabled}
                        />
                        <FormInput
                            name={`${fieldName}.en`}
                            control={control}
                            label={`${field.label} (English)`}
                            required={field.required}
                            error={fieldError?.en?.message}
                            disabled={isDisabled}
                        />
                    </div>
                );

            case 'select':
            case 'multiselect':
                // Handle static options
                if (field.options) {
                    let staticOptions: Array<{ value: string | number; label: string }> = [];
                    
                    if (Array.isArray(field.options)) {
                        staticOptions = field.options.map((opt) => ({
                            value: opt,
                            label: t(`common.${opt}`, opt)
                        }));
                    } else if (typeof field.options === 'object') {
                        staticOptions = Object.entries(field.options).map(([key, value]) => ({
                            value: key,
                            label: String(value)
                        }));
                    }

                    return (
                        <FormSelect
                            key={field.key}
                            name={fieldName}
                            control={control}
                            label={field.label}
                            required={field.required}
                            options={staticOptions}
                            error={fieldError?.message}
                            isMulti={field.type === 'multiselect'}
                            isDisabled={isDisabled}
                        />
                    );
                }

                // Handle dynamic select with API call
                let dynamicOptions: Array<{ value: string | number; label: string }> = [];
                let isLoadingOptions = false;

                // Map field keys to options
                switch (field.key) {
                    case 'branch_id':
                        dynamicOptions = options.branch_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'main_program_id':
                        dynamicOptions = options.main_program_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'session_mode_id':
                        dynamicOptions = options.session_mode_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'nationality_id':
                        dynamicOptions = options.nationality_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'major_id':
                        dynamicOptions = options.major_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'academic_qualification_id':
                        dynamicOptions = options.academic_qualification_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'memorization_program_entity_type_id':
                        dynamicOptions = options.memorization_program_entity_type_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'neighborhood_id':
                        dynamicOptions = neighborhoodsOptions.neighborhood_id;
                        isLoadingOptions = neighborhoodsOptions.isLoading;
                        break;
                    default:
                        dynamicOptions = [];
                }

                return (
                    <FormSelect
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={field.label}
                        required={field.required}
                        options={dynamicOptions}
                        error={fieldError?.message}
                        isMulti={field.type === 'multiselect'}
                        isDisabled={isDisabled || isLoadingOptions}
                        placeholder={isLoadingOptions ? t('common.loading', 'Loading...') : undefined}
                    />
                );

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
                    {(field.note || field.notes) && (
                        <p className="mt-1 text-xs text-gray-500 italic">{field.note || field.notes}</p>
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
