import React from 'react';
import { Control, FieldValues, useWatch, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { JoinRequestFormField } from '../types/registration.types';
import { FormInput, FormSelect, FormTextarea, FormFile, FormCheckbox, MapPicker } from '@/globals/components';
import { useRegistrationFormOptions, useNeighborhoodsOptions } from '../hooks/useRegistrationFormOptions';
import { extractLabel } from '../utils/extractLabel';

interface DynamicFormRendererProps<T extends FieldValues = FieldValues> {
    fields: JoinRequestFormField[];
    control: Control<T>;
    errors: any;
    setValue?: UseFormSetValue<T>;
}

/**
 * Dynamic Form Renderer
 * Renders form fields based on API response structure with dynamic options and dependencies
 * Follows the same approach as Tallem project's FormEntity
 */
const DynamicFormRenderer = <T extends FieldValues = FieldValues>({
    fields,
    control,
    errors,
    setValue
}: DynamicFormRendererProps<T>) => {
    const { t } = useTranslation();
    
    // Use setValue prop or fallback to any type for dynamic field names
    const setValueFn = (setValue as any) || (() => {});
    
    // Watch form values for dependencies
    const formValues = useWatch({ control });
    const cityId = formValues?.city_id;
    const latitude = formValues?.latitude;
    const longitude = formValues?.longitude;

    // Fetch all form options (nationalities, cities, etc.)
    const options = useRegistrationFormOptions();

    // Fetch neighborhoods based on city_id (city is independent from branch)
    const neighborhoodsOptions = useNeighborhoodsOptions(cityId);

    // Check if field should be visible based on visible_when conditions
    const isFieldVisible = (field: JoinRequestFormField) : boolean => {
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
    const isFieldDisabled = (field: JoinRequestFormField) : boolean => {
        if (field.disabled) return true;

        // Disable neighborhood_id when city_id is not selected (neighborhood depends on city, not branch)
        if (field.key === 'neighborhood_id') {
            return !cityId;
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
        if (!isFieldVisible(field)) {
            return null;
        }

        const isDisabled = isFieldDisabled(field);

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
                // Hide latitude and longitude fields - they will be handled by MapPicker
                if (field.key === 'latitude' || field.key === 'longitude') {
                    return null;
                }
                return (
                    <FormInput
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={extractLabel(field.label)}
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
                        label={extractLabel(field.label)}
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
                        label={extractLabel(field.label)}
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
                        label={extractLabel(field.label)}
                        required={field.required}
                        error={fieldError?.message}
                        multiple={field.multiple}
                        accept={field.accept}
                        disabled={isDisabled}
                    />
                );

            case 'object':
                // Multilingual object (name.ar, name.en)
                const objectLabel = extractLabel(field.label);
                return (
                    <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                            name={`${fieldName}.ar`}
                            control={control}
                            label={`${objectLabel} (Arabic)`}
                            required={field.required}
                            error={fieldError?.ar?.message}
                            disabled={isDisabled}
                        />
                        <FormInput
                            name={`${fieldName}.en`}
                            control={control}
                            label={`${objectLabel} (English)`}
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
                        // Use option value (e.g. "ذكر", "أنثى") as form value so it matches backend validation
                        staticOptions = Object.entries(field.options).map(([, val]) => ({
                            value: String(val),
                            label: String(val)
                        }));
                    }

                    return (
                        <FormSelect
                            key={field.key}
                            name={fieldName}
                            control={control}
                            label={extractLabel(field.label)}
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

                // Map field keys to options (works for top-level and nested group fields e.g. manager.nationality_id)
                switch (field.key) {
                    case 'branch_id':
                        dynamicOptions = options.branch_id;
                        isLoadingOptions = options.isLoading;
                        break;
                    case 'city_id':
                        dynamicOptions = options.city_id;
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
                        label={extractLabel(field.label)}
                        required={field.required}
                        options={dynamicOptions}
                        error={fieldError?.message}
                        isMulti={field.type === 'multiselect'}
                        isDisabled={isDisabled || isLoadingOptions}
                        placeholder={isLoadingOptions ? t('common.loading', 'Loading...') : undefined}
                    />
                );

            case 'group':
                // Manager group: fewer columns so fields are larger; other groups keep default grid
                const isManagerGroup = field.key === 'manager';
                const groupGridClass = isManagerGroup
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
                return (
                    <div key={field.key} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                        <h3 className="text-base font-semibold text-gray-800 mb-3">{extractLabel(field.label)}</h3>
                        <div className={groupGridClass}>
                            {field.fields?.map((subField) => renderField(subField, fieldName))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Section order: entity first, then location, then manager, then rest (program, facilities, etc.)
    const ENTITY_KEYS = ['name', 'registration_date', 'license_number', 'phone', 'email', 'address', 'area', 'status', 'activities'];
    const LOCATION_KEYS = ['branch_id', 'city_id', 'neighborhood_id', 'location_type', 'latitude', 'longitude'];
    const orderedFields = React.useMemo(() => {
        const entityFields: JoinRequestFormField[] = [];
        const locationFields: JoinRequestFormField[] = [];
        const managerField: JoinRequestFormField[] = [];
        const rest: JoinRequestFormField[] = [];
        fields.forEach((f) => {
            if (ENTITY_KEYS.includes(f.key)) entityFields.push(f);
            else if (LOCATION_KEYS.includes(f.key)) locationFields.push(f);
            else if (f.key === 'manager') managerField.push(f);
            else rest.push(f);
        });
        return [...entityFields, ...rest, ...locationFields, ...managerField];
    }, [fields]);

    // Check if latitude and longitude fields exist
    const hasLatitudeField = fields.some(f => f.key === 'latitude');
    const hasLongitudeField = fields.some(f => f.key === 'longitude');
    const hasMapFields = hasLatitudeField && hasLongitudeField;
    
    // Get latitude and longitude field labels
    const latitudeField = fields.find(f => f.key === 'latitude');
    const longitudeField = fields.find(f => f.key === 'longitude');
    const mapLabel = latitudeField?.label || longitudeField?.label || t('common.map_location', 'Map Location');

    // Render a single field wrapper (skip when content is null to avoid empty white space)
    const renderFieldWrapper = (field: JoinRequestFormField) => {
        const content = renderField(field);
        if (content == null) return null;
        const isFullWidth = ['textarea', 'file', 'object', 'group'].includes(field.type);
        return (
            <div
                key={field.key}
                className={isFullWidth ? 'col-span-full' : ''}
            >
                {content}
                {(field.note || field.notes) && (
                    <p className="mt-1 text-xs text-gray-500 italic">{extractLabel(field.note || field.notes)}</p>
                )}
            </div>
        );
    };

    const entityFields = orderedFields.filter((f) => ENTITY_KEYS.includes(f.key));
    const locationFields = orderedFields.filter((f) => LOCATION_KEYS.includes(f.key));
    const managerFields = orderedFields.filter((f) => f.key === 'manager');
    const restFields = orderedFields.filter(
        (f) => !ENTITY_KEYS.includes(f.key) && !LOCATION_KEYS.includes(f.key) && f.key !== 'manager'
    );

    const mapPickerBlock = hasMapFields ? (
        <div key="map-picker" className="col-span-full mt-6 space-y-3">
            <h4 className="text-md font-medium text-gray-700">
                {extractLabel(mapLabel)}
            </h4>
            <MapPicker
                onLocationSelect={({ lat, lng }) => {
                    setValueFn('latitude', lat.toString(), { shouldValidate: true });
                    setValueFn('longitude', lng.toString(), { shouldValidate: true });
                }}
                oldLocation={
                    latitude && longitude
                        ? { lat: parseFloat(latitude.toString()), lng: parseFloat(longitude.toString()) }
                        : null
                }
                disabled={false}
            />
            {(errors.latitude || errors.longitude) && (
                <div className="mt-1">
                    {errors.latitude && <p className="text-xs text-red-600">{errors.latitude.message}</p>}
                    {errors.longitude && <p className="text-xs text-red-600">{errors.longitude.message}</p>}
                </div>
            )}
        </div>
    ) : null;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entityFields.map((field) => renderFieldWrapper(field))}
                {restFields.map((field) => renderFieldWrapper(field))}

                {locationFields.map((field) => renderFieldWrapper(field))}
                {mapPickerBlock}
                {managerFields.map((field) => renderFieldWrapper(field))}
            </div>
        </>
    );
};

export default DynamicFormRenderer;
