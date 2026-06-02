import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import { PlusIcon } from '@/globals/icons';
import HalaqaList from '@/features/entity-manager/halaqas/components/HalaqaList';
/**
 * Halaqas List Page
 * Displays all halaqas for entity managers
 */
const HalaqasListPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const handleCreate = () => {
        navigate(`/${lang || 'ar'}/create-halaqa`);
    };
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('halaqa.listTitle', 'Halaqas')} subtitle={t('halaqa.listDescription', 'Manage and view all halaqas')} actions={[
            {
                label: t('halaqa.create', 'Create Halaqa'),
                onClick: handleCreate,
                variant: 'primary',
                icon: <PlusIcon width={16} height={16} className="me-2"/>
            }
        ]}/>
            {/* List area: takes remaining height so table/cards can scroll inside */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm p-6">
                <HalaqaList />
            </div>
        </div>);
};
export default HalaqasListPage;
