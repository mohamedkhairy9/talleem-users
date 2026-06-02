import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherLeavesService } from '../services/teacher-leaves.service';
/**
 * Get teacher leaves list
 */
export function useTeacherLeaves() {
    const query = useQuery({
        queryKey: ['teacher-leaves'],
        queryFn: () => teacherLeavesService.getTeacherLeaves(),
        staleTime: 2 * 60 * 1000
    });
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    return {
        ...query,
        list
    };
}
/**
 * Create leave mutation (builds FormData from payload)
 */
export function useCreateTeacherLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => {
            const formData = new FormData();
            formData.append('leave_type', payload.leave_type);
            if (payload.leave_type === 'leave') {
                formData.append('leave_sub_type', payload.leave_sub_type);
                formData.append('from_date', payload.from_date);
                formData.append('to_date', payload.to_date);
                formData.append('notes', payload.notes);
                const files = payload.medical_report;
                if (files && (Array.isArray(files) ? files.length > 0 : files.length > 0)) {
                    const file = Array.isArray(files) ? files[0] : files[0];
                    if (file instanceof File)
                        formData.append('medical_report', file);
                }
            }
            else {
                formData.append('date', payload.date);
                formData.append('from_time', payload.from_time);
                formData.append('to_time', payload.to_time);
                formData.append('notes', payload.notes);
            }
            return teacherLeavesService.createLeave(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-leaves'] });
        }
    });
}
/**
 * Cancel leave mutation
 */
export function useCancelTeacherLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => teacherLeavesService.cancelLeave(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-leaves'] });
        }
    });
}
