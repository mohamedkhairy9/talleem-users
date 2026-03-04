import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Control, Controller, FieldValues, useWatch, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AsyncPaginate } from 'react-select-async-paginate';
import { JoinRequestFormField } from '../types/registration.types';
import { FormInput, FormSelect, FormAsyncPaginate, FormTextarea, FormFile, FormCheckbox, MapPicker } from '@/globals/components';
import type { AsyncPaginateOption } from '@/globals/components/forms/FormAsyncPaginate';
import { registrationService } from '../services/registration.service';
import { extractLabel } from '../utils/extractLabel';

const PER_PAGE = 20;

/** Transform API item to { value, label } using current lang for bilingual name */
function itemToOption(item: any, currentLang: string): AsyncPaginateOption {
    const value = item.id ?? item.value ?? '';
    let label = '';
    if (typeof item.name === 'object' && item.name !== null) {
        label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
    } else if (item.name) {
        label = String(item.name);
    } else if (item.label) {
        label = String(item.label);
    } else {
        label = String(value);
    }
    return { value, label };
}

function transformPaginatedResponse(data: any[] | undefined, currentLang: string): AsyncPaginateOption[] {
    if (!data) return [];
    return data.map((item) => itemToOption(item, currentLang));
}

/** Get form value by key, supporting nested path (prefix.key) and root */
function getFormValueByKey(formValues: Record<string, any> | undefined, key: string, prefix?: string): any {
    if (!formValues) return undefined;
    if (prefix) {
        const nested = formValues[prefix];
        if (nested && typeof nested === 'object' && key in nested) return nested[key];
    }
    return formValues[key];
}

/** Collect all field paths that have depends_on (including nested in groups) */
function collectDependsOnFields(
    fields: JoinRequestFormField[],
    prefix = ''
): Array<{ fieldPath: string; depFieldKey: string; prefix: string }> {
    const result: Array<{ fieldPath: string; depFieldKey: string; prefix: string }> = [];
    for (const field of fields) {
        const fieldPath = prefix ? `${prefix}.${field.key}` : field.key;
        if (field.depends_on) {
            result.push({ fieldPath, depFieldKey: field.depends_on.field, prefix });
        }
        if (field.type === 'group' && field.fields?.length) {
            result.push(...collectDependsOnFields(field.fields, fieldPath));
        }
    }
    return result;
}

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
    const branchId = formValues?.branch_id;
    const mainProgramId = formValues?.main_program_id;
    const latitude = formValues?.latitude;
    const longitude = formValues?.longitude;

    // Clear dependent fields when their dependency value changes (e.g. city_id -> neighborhood_id)
    const prevDepValuesRef = useRef<Record<string, any>>({});
    const dependsOnList = React.useMemo(() => collectDependsOnFields(fields), [fields]);
    useEffect(() => {
        if (!setValueFn || typeof setValueFn !== 'function') return;
        for (const { fieldPath, depFieldKey, prefix } of dependsOnList) {
            const depValue = getFormValueByKey(formValues, depFieldKey, prefix || undefined);
            const refKey = fieldPath;
            const prev = prevDepValuesRef.current[refKey];
            if (prev !== undefined && prev !== depValue) {
                setValueFn(fieldPath, null, { shouldValidate: true });
            }
            prevDepValuesRef.current[refKey] = depValue;
        }
        // Clear entity_id when branch_id or main_program_id changes (entity depends on both)
        const prevBranch = prevDepValuesRef.current['_branch_id'];
        const prevMainProgram = prevDepValuesRef.current['_main_program_id'];
        if (prevBranch !== undefined && (prevBranch !== branchId || prevMainProgram !== mainProgramId)) {
            setValueFn('entity_id', null, { shouldValidate: true });
        }
        prevDepValuesRef.current['_branch_id'] = branchId;
        prevDepValuesRef.current['_main_program_id'] = mainProgramId;
    }, [formValues, setValueFn, dependsOnList, branchId, mainProgramId]);

    // Show entity_id validation error only after user has opened (blurred) the entity select
    const [entityIdTouched, setEntityIdTouched] = useState(false);
    const setEntityIdTouchedTrue = useCallback(() => setEntityIdTouched(true), []);

    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    // Paginated loadOptions (same approach as booking-pro-dashboard-dev)
    const loadBranches = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getBranches({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadMainPrograms = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getMainPrograms({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadCities = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getCities({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadSessionModes = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getSessionModes({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadNationalities = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getNationalities({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadMajors = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getMajors({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadAcademicQualifications = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getAcademicQualifications({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadMemorizationProgramEntityTypes = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            const page = additional?.page ?? 1;
            const res = await registrationService.getMemorizationProgramEntityTypes({ page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang]
    );
    const loadNeighborhoods = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            if (!cityId) return { options: [], hasMore: false, additional: { page: 1 } };
            const page = additional?.page ?? 1;
            const res = await registrationService.getNeighborhoods({ city_id: cityId, page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang, cityId]
    );
    const loadEntities = useCallback(
        async (search: string, _loaded: unknown, additional?: { page?: number }) => {
            if (!branchId || !mainProgramId) return { options: [], hasMore: false, additional: { page: 1 } };
            const page = additional?.page ?? 1;
            const res = await registrationService.getEntities({ branch_id: branchId, main_program_id: mainProgramId, page, per_page: PER_PAGE, search: search || undefined });
            const options = transformPaginatedResponse(res.data, currentLang);
            const meta = res.meta;
            const hasMore = !!(meta?.current_page != null && meta?.last_page != null && meta.current_page < meta.last_page);
            return { options, hasMore, additional: { page: page + 1 } };
        },
        [currentLang, branchId, mainProgramId]
    );

    // Check if field should be visible based on visible_when conditions
    // visible_when: { "session_mode_id": ["5", "6"] } => show when session_mode_id is one of these values
    const isFieldVisible = (field: JoinRequestFormField, prefix?: string): boolean => {
        if (!field.visible_when) return true;

        const allowedValuesNormalized = (val: string[]) => (val || []).map((v) => String(v));
        for (const [depField, allowedValues] of Object.entries(field.visible_when)) {
            const currentValue = getFormValueByKey(formValues, depField, prefix);
            const allowed = allowedValuesNormalized(Array.isArray(allowedValues) ? allowedValues : []);
            if (currentValue === undefined || currentValue === null || currentValue === '') return false;
            if (!allowed.includes(String(currentValue))) return false;
        }
        return true;
    };

    // Check if field should be disabled
    // depends_on: { "field": "city_id" } => disabled until city_id is selected; options API uses city_id filter
    const isFieldDisabled = (field: JoinRequestFormField, prefix?: string): boolean => {
        if (field.disabled) return true;

        // Disable neighborhood_id when city_id is not selected (neighborhood depends on city)
        if (field.key === 'neighborhood_id') {
            const depVal = getFormValueByKey(formValues, 'city_id', prefix);
            return !depVal;
        }

        // Disable entity_id until branch_id and main_program_id are selected
        if (field.key === 'entity_id') {
            const branch = getFormValueByKey(formValues, 'branch_id', prefix);
            const mainProgram = getFormValueByKey(formValues, 'main_program_id', prefix);
            return !branch || !mainProgram;
        }

        if (field.depends_on) {
            const depFieldName = field.depends_on.field;
            const depValue = getFormValueByKey(formValues, depFieldName, prefix);
            return !depValue;
        }

        return false;
    };

    const renderField = (field: JoinRequestFormField, prefix = ''): React.ReactNode => {
        const fieldName = prefix ? `${prefix}.${field.key}` : field.key;
        const fieldError = prefix
            ? errors[prefix]?.[field.key]
            : errors[field.key];

        // Check visibility (e.g. visible_when: { session_mode_id: ["5","6"] })
        if (!isFieldVisible(field, prefix)) {
            return null;
        }

        const isDisabled = isFieldDisabled(field, prefix);

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

                // Handle dynamic select with paginated API (same approach as booking-pro-dashboard-dev)
                const loadOptionsMap: Record<string, typeof loadBranches> = {
                    branch_id: loadBranches,
                    main_program_id: loadMainPrograms,
                    city_id: loadCities,
                    session_mode_id: loadSessionModes,
                    nationality_id: loadNationalities,
                    major_id: loadMajors,
                    academic_qualification_id: loadAcademicQualifications,
                    memorization_program_entity_type_id: loadMemorizationProgramEntityTypes,
                    neighborhood_id: loadNeighborhoods,
                    entity_id: loadEntities
                };
                const loadOptions = loadOptionsMap[field.key];

                if (!loadOptions) {
                    return null;
                }

                // entity_id: show validation error only after user has opened the dropdown and blurred without selecting
                if (field.key === 'entity_id') {
                    return (
                        <Controller
                            key={field.key}
                            name={fieldName as any}
                            control={control}
                            render={({ field: f }) => {
                                const entityValue: AsyncPaginateOption | null =
                                    f.value != null && f.value !== ''
                                        ? { value: f.value, label: String(f.value) }
                                        : null;
                                return (
                                    <div>
                                        {extractLabel(field.label) && (
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {extractLabel(field.label)}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                        )}
                                        <AsyncPaginate<AsyncPaginateOption, import('react-select').GroupBase<AsyncPaginateOption>, { page: number }, false>
                                            value={entityValue}
                                            loadOptions={loadOptions}
                                            onChange={(option) => {
                                                const single = option as AsyncPaginateOption | null;
                                                f.onChange(single?.value ?? null);
                                            }}
                                            onBlur={() => {
                                                f.onBlur();
                                                setEntityIdTouchedTrue();
                                            }}
                                            additional={{ page: 1 }}
                                            defaultAdditional={{ page: 1 }}
                                            getOptionLabel={(o) => o.label}
                                            getOptionValue={(o) => String(o.value)}
                                            isClearable
                                            isDisabled={isDisabled}
                                            placeholder={t('common.select', 'Select an option')}
                                            classNamePrefix="react-select"
                                            debounceTimeout={300}
                                            styles={{
                                                control: (base: any, state: any) => ({
                                                    ...base,
                                                    borderColor: entityIdTouched && fieldError ? '#ef4444' : state.isFocused ? '#004247' : '#d1d5db',
                                                    minHeight: '48px',
                                                    backgroundColor: isDisabled ? '#f3f4f6' : 'white'
                                                }),
                                                menu: (base: any) => ({ ...base, zIndex: 9999 })
                                            }}
                                        />
                                        {entityIdTouched && (fieldError?.message) && (
                                            <p className="mt-1 h-4 text-xs text-red-600">{fieldError.message}</p>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    );
                }

                return (
                    <FormAsyncPaginate
                        key={field.key}
                        name={fieldName}
                        control={control}
                        label={extractLabel(field.label)}
                        required={field.required}
                        loadOptions={loadOptions}
                        error={fieldError?.message}
                        isDisabled={isDisabled}
                        isMulti={field.type === 'multiselect'}
                        placeholder={t('common.select', 'Select an option')}
                        defaultAdditional={{ page: 1 }}
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

    // Section order: entity first, then branch + main_program (before entity_id), then entity_id, then rest, then location (branch already shown), then manager
    const ENTITY_KEYS = ['name', 'registration_date', 'license_number', 'phone', 'email', 'address', 'area', 'status', 'activities'];
    const LOCATION_KEYS = ['branch_id', 'city_id', 'neighborhood_id', 'location_type', 'latitude', 'longitude'];
    const BRANCH_MAIN_PROGRAM_KEYS = ['branch_id', 'main_program_id']; // shown before entity_id for teacher join form
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
    // Branch and main_program before entity_id (teacher join form: entity_id depends on both)
    const branchMainProgramFields = BRANCH_MAIN_PROGRAM_KEYS.map((key) => fields.find((f) => f.key === key)).filter(Boolean) as JoinRequestFormField[];
    const entityIdFields = orderedFields.filter((f) => f.key === 'entity_id');
    const restFields = orderedFields.filter(
        (f) =>
            !ENTITY_KEYS.includes(f.key) &&
            !LOCATION_KEYS.includes(f.key) &&
            f.key !== 'manager' &&
            !BRANCH_MAIN_PROGRAM_KEYS.includes(f.key) &&
            f.key !== 'entity_id'
    );
    const locationFields = orderedFields.filter((f) => LOCATION_KEYS.includes(f.key) && f.key !== 'branch_id');
    const managerFields = orderedFields.filter((f) => f.key === 'manager');

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
                {branchMainProgramFields.map((field) => renderFieldWrapper(field))}
                {entityIdFields.map((field) => renderFieldWrapper(field))}
                {restFields.map((field) => renderFieldWrapper(field))}

                {locationFields.map((field) => renderFieldWrapper(field))}
                {mapPickerBlock}
                {managerFields.map((field) => renderFieldWrapper(field))}
            </div>
        </>
    );
};

export default DynamicFormRenderer;
