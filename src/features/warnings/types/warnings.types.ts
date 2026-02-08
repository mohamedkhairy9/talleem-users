import type { WarningResponse, WarningsListParams, WarningsListResponse } from '../services/warnings.service';

export type { WarningResponse, WarningsListParams, WarningsListResponse };

export interface BilingualName {
    en?: string;
    ar?: string;
}

export type WarningType = 'student' | 'teacher' | 'entity';

