/**
 * Teacher Licenses API types
 * GET /teacher/licenses, GET /teacher/licenses/current
 */

export interface BilingualName {
    en?: string;
    ar?: string;
}

export interface LicenseableRef {
    id: number;
    name: BilingualName;
    type: string;
}

export interface CreatorRef {
    id: number;
    name: BilingualName;
}

/** Single license item from GET /teacher/licenses or GET /teacher/licenses/current */
export interface TeacherLicenseItem {
    id: number;
    licenseable_type: string;
    licenseable_id: number;
    licenseable: LicenseableRef;
    license_number: string;
    license_type: string;
    is_temporary: boolean;
    issue_date: string;
    expiration_date: string;
    status: string;
    is_expired: boolean;
    notes: string | null;
    creator: CreatorRef | null;
    created_at: string;
    updated_at: string;
}

export interface TeacherLicensesListResponse {
    data: TeacherLicenseItem[];
}

export interface TeacherCurrentLicenseResponse {
    data: TeacherLicenseItem;
}
