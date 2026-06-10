import React from 'react';
import { JoinRequestsList } from '@/features/entity-manager/join-requests';
/**
 * Join Requests Page (Entity Manager)
 * Lists pending join requests and allows viewing / processing (approve, reject, etc.)
 */
const JoinRequestsPage = () => {
    return (<div className="flex flex-col flex-1 min-h-0 p-4 md:p-6">
            <JoinRequestsList />
        </div>);
};
export default JoinRequestsPage;
