import React from 'react';
import { XIcon } from '@/shared/icons';
import CreatePlanForm from './CreatePlanForm';

/** Uses the same builder, preview, and Mushaf picker as creating a plan. */
export default function EditStudentPlanModal({ halaqaId, student, plan, activities, onClose }) {
    if (!student) return null;

    return <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
        <div className="relative flex min-h-full items-start justify-center p-4 py-10">
            <div className="relative z-10 w-full max-w-6xl rounded-[28px] bg-slate-50 p-4 shadow-2xl md:p-6">
                <div className="mb-5 flex items-start justify-between gap-4 px-2">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">تعديل خطة الطالب</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {student?.name?.ar || student?.name?.en || student?.name || `#${student.id}`}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label="إغلاق">
                        <XIcon width={22} height={22} />
                    </button>
                </div>
                <CreatePlanForm
                    halaqaId={halaqaId}
                    students={[student]}
                    activities={activities}
                    editStudent={student}
                    initialPlan={plan}
                    onSuccess={onClose}
                    onCancel={onClose}
                />
            </div>
        </div>
    </div>;
}
