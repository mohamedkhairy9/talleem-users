import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formFieldsService } from '../services/form-fields.service';
import { AsyncSelectOption } from '@/globals/components/ui/AsyncSelect';

/**
 * Hook to load teachers as async select options
 */
export const useTeachersAsyncSelect = () => {
    const { t } = useTranslation();

    const loadTeachers = async (inputValue: string, page: number): Promise<{ options: AsyncSelectOption[]; hasMore: boolean }> => {
        try {
            const response = await formFieldsService.getTeachers({
                page,
                per_page: 20,
                search: inputValue
            });

            const data = response.data || response;
            const teachers = Array.isArray(data) ? data : data.data || [];
            const meta = Array.isArray(data) ? null : (data.meta || response.meta);

            const options: AsyncSelectOption[] = teachers.map((teacher: any) => ({
                value: teacher.id,
                label: teacher.name || teacher.email || `Teacher #${teacher.id}`
            }));

            const hasMore = meta ? (meta.current_page || page) < (meta.last_page || 1) : false;

            return { options, hasMore };
        } catch (error) {
            console.error('Error loading teachers:', error);
            return { options: [], hasMore: false };
        }
    };

    return { loadTeachers };
};

/**
 * Hook to load students as async select options
 * Used for selecting students in forms (e.g., halaqas)
 */
export const useStudentsAsyncSelect = () => {
    const { t } = useTranslation();

    const loadStudents = async (inputValue: string, page: number): Promise<{ options: AsyncSelectOption[]; hasMore: boolean }> => {
        try {
            const response = await formFieldsService.getStudents({
                page,
                per_page: 20,
                search: inputValue
            });

            const data = response.data || response;
            const students = Array.isArray(data) ? data : data.data || [];
            const meta = Array.isArray(data) ? null : (data.meta || response.meta);

            const options: AsyncSelectOption[] = students.map((student: any) => ({
                value: student.id,
                label: student.name || student.email || `Student #${student.id}`
            }));

            const hasMore = meta ? (meta.current_page || page) < (meta.last_page || 1) : false;

            return { options, hasMore };
        } catch (error) {
            console.error('Error loading students:', error);
            return { options: [], hasMore: false };
        }
    };

    return { loadStudents };
};

/**
 * Hook to load platforms as async select options
 */
export const usePlatformsAsyncSelect = () => {
    const { t } = useTranslation();

    const loadPlatforms = async (inputValue: string, page: number): Promise<{ options: AsyncSelectOption[]; hasMore: boolean }> => {
        try {
            const response = await formFieldsService.getPlatforms({
                page,
                per_page: 20,
                search: inputValue
            });

            const data = response.data || response;
            const platforms = Array.isArray(data) ? data : data.data || [];
            const meta = Array.isArray(data) ? null : (data.meta || response.meta);

            const options: AsyncSelectOption[] = platforms.map((platform: any) => ({
                value: platform.id,
                label: platform.name || `Platform #${platform.id}`
            }));

            const hasMore = meta ? (meta.current_page || page) < (meta.last_page || 1) : false;

            return { options, hasMore };
        } catch (error) {
            console.error('Error loading platforms:', error);
            return { options: [], hasMore: false };
        }
    };

    return { loadPlatforms };
};

/**
 * Hook to load memorization program entity types as async select options
 */
export const useMemorizationProgramEntityTypesAsyncSelect = () => {
    const { t } = useTranslation();

    const loadMemorizationProgramEntityTypes = async (inputValue: string, page: number): Promise<{ options: AsyncSelectOption[]; hasMore: boolean }> => {
        try {
            const response = await formFieldsService.getMemorizationProgramEntityTypes({
                page,
                per_page: 20,
                search: inputValue
            });

            const data = response.data || response;
            const types = Array.isArray(data) ? data : data.data || [];
            const meta = Array.isArray(data) ? null : (data.meta || response.meta);

            const options: AsyncSelectOption[] = types.map((type: any) => ({
                value: type.id,
                label: type.name || `Type #${type.id}`
            }));

            const hasMore = meta ? (meta.current_page || page) < (meta.last_page || 1) : false;

            return { options, hasMore };
        } catch (error) {
            console.error('Error loading memorization program entity types:', error);
            return { options: [], hasMore: false };
        }
    };

    return { loadMemorizationProgramEntityTypes };
};

