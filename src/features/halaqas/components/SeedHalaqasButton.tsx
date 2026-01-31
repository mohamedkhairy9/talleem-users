import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores';
import { Button } from '@/globals/components';
import { formFieldsService } from '../services/form-fields.service';
import { halaqasService } from '../services/halaqas.service';
import { HALAQA_FORM_QUERY_KEYS } from '../hooks/useCreateHalaqaFormQueries';

const SEED_COUNT = 20;
const ITEMS_PER_PAGE = 10;

/**
 * Button that creates 20 test halaqas for table testing.
 * Fetches first teacher, first few students, first platform for the current entity and seeds.
 */
const SeedHalaqasButton: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const entity = useAuthStore((s) => s.user?.entity);
    const entityId = entity?.id;
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        if (!entityId) {
            return;
        }
        setIsSeeding(true);
        try {
            const [teachersRes, studentsRes, platformsRes] = await Promise.all([
                formFieldsService.getTeachers({ page: 1, per_page: ITEMS_PER_PAGE, entity_id: entityId }),
                formFieldsService.getStudents({ page: 1, per_page: ITEMS_PER_PAGE, entity_id: entityId }),
                formFieldsService.getRemotelyAttendancePlatforms({ page: 1, per_page: 5 })
            ]);

            const teachers = (teachersRes as { data?: { data?: { id: number }[] } })?.data?.data ?? (teachersRes as { data?: { id: number }[] })?.data ?? [];
            const students = (studentsRes as { data?: { data?: { id: number }[] } })?.data?.data ?? (studentsRes as { data?: { id: number }[] })?.data ?? [];
            const platforms = (platformsRes as { data?: { data?: { id: number }[] } })?.data?.data ?? (platformsRes as { data?: { id: number }[] })?.data ?? [];

            const teacherId = Array.isArray(teachers) && teachers.length > 0 ? (teachers[1] as { id: number }).id : 0;
            const studentIds = Array.isArray(students) ? (students as { id: number }[]).slice(0, 5).map((s) => s.id) : [];
            const platformId = Array.isArray(platforms) && platforms.length > 0 ? (platforms[0] as { id: number }).id : 0;

            if (!teacherId || studentIds.length === 0 || !platformId) {
                toast.warning(t('halaqa.seedNeedData', 'Need at least one teacher, one student, and one platform for your entity.'));
                setIsSeeding(false);
                return;
            }

            const memorization_program_entity_type_id = entity?.memorization_program_entity_type?.id ?? 0;
            const session_mode_id = entity?.session_mode?.id;

            // Different session times so teacher has at most one halaqa per (date, time)
            const sessionTimeSlots = [
                    '12:30-14:30',
                    '15:00-17:00',
                    '17:30-19:30',
                    '20:00-22:00',
                    '22:30-00:30',
                    '00:00-02:00',
                    '02:30-04:30',
                    '05:00-07:00',
                    '07:30-09:30',
                    '10:00-12:00',
                    '12:30-14:30',
                    '15:00-17:00',
                    '17:30-19:30',
                    '20:00-22:00',
                    '22:30-00:30'
            ];

            let created = 0;
            for (let i = 1; i <= SEED_COUNT; i++) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + (i - 1));
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 2);

                const payload = {
                    teacher_id: teacherId,
                    memorization_program_entity_type_id,
                    ...(session_mode_id != null && { session_mode_id }),
                    period: (i % 2 === 1 ? 'morning' : 'evening') as const,
                    start_date: startDate.toISOString().slice(0, 10),
                    end_date: endDate.toISOString().slice(0, 10),
                    activities: ['tasbit'] as const,
                    student_ids: studentIds,
                    session_time: sessionTimeSlots[(i - 1) % sessionTimeSlots.length],
                    platform_id: platformId,
                    teaching_method: 'in_person' as const,
                    name: { en: `Test Halaqa ${i}`, ar: `حلقة اختبار ${i}` }
                };

                try {
                    await halaqasService.createHalaqa(payload);
                    created++;
                } catch (err) {
                    console.error(`Seed halaqa ${i} failed:`, err);
                }
            }

            await queryClient.invalidateQueries({ queryKey: ['halaqas'] });
            queryClient.invalidateQueries({ queryKey: HALAQA_FORM_QUERY_KEYS.teachers });
            queryClient.invalidateQueries({ queryKey: HALAQA_FORM_QUERY_KEYS.students });
            toast.success(t('halaqa.seedSuccess', 'Created {{count}} test halaqas.', { count: created }));
        } catch (err) {
            toast.error(t('halaqa.seedError', 'Seed failed. Check console.'));
        } finally {
            setIsSeeding(false);
        }
    };

    if (entityId == null) return null;

    return (
        <Button
            type="button"
            variant="secondary"
            onClick={handleSeed}
            disabled={isSeeding}
            loading={isSeeding}
        >
            {isSeeding ? t('halaqa.seeding', 'Seeding...') : t('halaqa.seed20', 'Seed 20 test halaqas')}
        </Button>
    );
};

export default SeedHalaqasButton;
