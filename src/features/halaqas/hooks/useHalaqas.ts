import { useMutation, useQuery } from '@tanstack/react-query';
import { halaqasService, CreateHalaqaPayload } from '../services/halaqas.service';

/**
 * Create halaqa mutation hook
 */
export const useCreateHalaqa = () => {
    return useMutation({
        mutationFn: (data: CreateHalaqaPayload) => halaqasService.createHalaqa(data)
    });
};

/**
 * Get halaqas query hook
 */
export const useHalaqas = (filters: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['halaqas', filters],
        queryFn: () => halaqasService.getHalaqas(filters),
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
};

/**
 * Get halaqa by ID query hook
 */
export const useHalaqa = (id: number | string) => {
    return useQuery({
        queryKey: ['halaqa', id],
        queryFn: () => halaqasService.getHalaqa(id),
        enabled: !!id
    });
};

