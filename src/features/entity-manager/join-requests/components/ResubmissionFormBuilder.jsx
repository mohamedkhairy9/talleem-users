import React from 'react';

const FIELD_TYPES = ['file', 'text', 'textarea', 'email', 'tel', 'number', 'date'];

export const createDefaultResubmissionForm = () => ({
    name: { ar: 'نموذج استكمال الطلب', en: 'Request Resubmission Form' },
    description: { ar: 'ارفع المتطلبات الإضافية', en: 'Upload missing requirements' },
    data: {
        fields: [
            { key: 'missing_files', label: { ar: 'المرفقات المطلوبة', en: 'Required attachments' }, type: 'file', required: true, multiple: true },
            { key: 'resubmission_note', label: { ar: 'ملاحظات المستفيد', en: 'Applicant notes' }, type: 'text', required: false }
        ]
    }
});

const updateField = (form, index, patch) => ({
    ...form,
    data: { ...form.data, fields: form.data.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field) }
});

export default function ResubmissionFormBuilder({ value, onChange, error }) {
    const fields = value?.data?.fields || [];
    const updateLocalizedValue = (section, language, nextValue) => onChange({
        ...value,
        [section]: { ...value[section], [language]: nextValue }
    });
    const addField = () => onChange({
        ...value,
        data: { ...value.data, fields: [...fields, { key: '', label: { ar: '', en: '' }, type: 'text', required: false }] }
    });
    const removeField = index => onChange({
        ...value,
        data: { ...value.data, fields: fields.filter((_, fieldIndex) => fieldIndex !== index) }
    });

    return (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div>
                <h4 className="text-sm font-semibold text-amber-900">نموذج استكمال البيانات</h4>
                <p className="mt-1 text-xs text-amber-800">سيظهر هذا النموذج للمتقدم لاستكمال المتطلبات الناقصة.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-gray-700">اسم النموذج (العربية)<input value={value?.name?.ar || ''} onChange={event => updateLocalizedValue('name', 'ar', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
                <label className="text-sm text-gray-700">Form name (English)<input value={value?.name?.en || ''} onChange={event => updateLocalizedValue('name', 'en', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
                <label className="text-sm text-gray-700">وصف النموذج (العربية)<textarea value={value?.description?.ar || ''} onChange={event => updateLocalizedValue('description', 'ar', event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
                <label className="text-sm text-gray-700">Form description (English)<textarea value={value?.description?.en || ''} onChange={event => updateLocalizedValue('description', 'en', event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3"><h5 className="text-sm font-medium text-gray-800">الحقول المطلوبة من المتقدم</h5><button type="button" onClick={addField} className="rounded-lg border border-primary-600 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50">إضافة حقل</button></div>
                {fields.map((field, index) => (
                    <div key={`${field.key}-${index}`} className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                        <div className="flex justify-between gap-3"><span className="text-sm font-medium text-gray-700">الحقل {index + 1}</span><button type="button" onClick={() => removeField(index)} className="text-sm text-red-600 hover:underline">حذف</button></div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="text-xs text-gray-600">المفتاح<input value={field.key} onChange={event => onChange(updateField(value, index, { key: event.target.value.replace(/\s+/g, '_') }))} className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5" /></label>
                            <label className="text-xs text-gray-600">النوع<select value={field.type} onChange={event => onChange(updateField(value, index, { type: event.target.value, ...(event.target.value !== 'file' ? { multiple: false } : {}) }))} className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5">{FIELD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
                            <label className="text-xs text-gray-600">التسمية (العربية)<input value={field.label?.ar || ''} onChange={event => onChange(updateField(value, index, { label: { ...field.label, ar: event.target.value } }))} className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5" /></label>
                            <label className="text-xs text-gray-600">Label (English)<input value={field.label?.en || ''} onChange={event => onChange(updateField(value, index, { label: { ...field.label, en: event.target.value } }))} className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5" /></label>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(field.required)} onChange={event => onChange(updateField(value, index, { required: event.target.checked }))} /> مطلوب</label>{field.type === 'file' && <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(field.multiple)} onChange={event => onChange(updateField(value, index, { multiple: event.target.checked }))} /> يسمح بعدة مرفقات</label>}</div>
                    </div>
                ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
