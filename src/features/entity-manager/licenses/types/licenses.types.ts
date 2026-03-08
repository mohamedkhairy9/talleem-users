/**
 * Entity Manager Licenses API types
 * GET /entity/licenses, GET /entity/licenses/current
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

/** Single license item from GET /entity/licenses or GET /entity/licenses/current */
export interface EntityLicenseItem {
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

export interface EntityLicensesListResponse {
    data: EntityLicenseItem[];
}

export interface EntityCurrentLicenseResponse {
    data: EntityLicenseItem;
}
