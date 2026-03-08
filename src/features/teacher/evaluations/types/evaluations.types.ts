/**
 * Teacher Evaluations API types
 * GET /teacher/evaluations/received (evaluations others gave to the teacher)
 * GET /teacher/evaluations/given (teacher's evaluations of others) - later
 */

export interface BilingualText {
    ar?: string;
    en?: string;
}

export interface AppDateObject {
    gregorian?: string;
    hijri?: string;
    hijri_indic?: string;
}

/** Receiver or dashboard label */
export interface BilingualLabel {
    ar?: string;
    en?: string;
}

export interface EvaluationParameterRef {
    id: number;
    name: BilingualText;
    main_program_id: number;
    dashboards: BilingualLabel[];
    evaluation_for: BilingualText;
    evaluation_system: BilingualText;
    total_grade: number;
    receivers: BilingualLabel[];
    model_type: string;
    include_attachments: boolean;
    is_active: boolean;
    created_at?: AppDateObject;
    updated_at?: AppDateObject;
}

export interface PersonRef {
    id: number;
    name: BilingualText;
}

export interface EvaluatedRef {
    type: string;
    id: number;
    name: BilingualText;
}

export interface EntityRef {
    id: number;
    name: BilingualText;
}

export interface CriteriaScoreItem {
    id: number;
    criteria: {
        id: number;
        criteria_name: BilingualText;
        degree: number;
    };
    criteria_id: number;
    score: string;
    notes: string | null;
}

/** Single received evaluation (others evaluate the teacher) */
export interface ReceivedEvaluationItem {
    id: number;
    serial_no: number;
    evaluation_name: BilingualText;
    date: AppDateObject;
    evaluation_date: AppDateObject;
    evaluation_parameter: EvaluationParameterRef;
    submitted_by: PersonRef;
    evaluated: EvaluatedRef;
    entity: EntityRef;
    total_score: string;
    notes: string | null;
    criteria_scores: CriteriaScoreItem[];
    has_attachments: boolean;
    created_at: AppDateObject;
    updated_at: AppDateObject;
}

export interface ReceivedEvaluationsResponse {
    data: ReceivedEvaluationItem[];
}

// ----- Templates (for giving evaluations) -----

export interface TemplateCriteriaItem {
    id: number;
    criteria_name: BilingualText;
    degree: number;
}

/** Evaluation template from GET /teacher/evaluations/templates (list) */
export interface EvaluationTemplate {
    id: number;
    name: BilingualText;
    main_program_id: number;
    dashboards: BilingualLabel[];
    evaluation_for: BilingualText;
    evaluation_system: BilingualText;
    total_grade: number;
    receivers: BilingualLabel[];
    model_type: string;
    include_attachments: boolean;
    is_active: boolean;
    criteria: TemplateCriteriaItem[];
    created_at?: string;
    updated_at?: string;
}

export interface TemplatesListResponse {
    data: EvaluationTemplate[];
}

/** Available entity (student/teacher/entity) to evaluate - from template detail */
export interface AvailableEntity {
    id: number;
    name: BilingualText;
    type: 'student' | 'teacher' | 'entity';
}

/** GET /teacher/evaluations/templates/:id */
export interface TemplateDetailResponse {
    template: EvaluationTemplate;
    available_entities: AvailableEntity[];
    can_attach_files: boolean;
}

/** Given evaluation item - same shape as received (GET /teacher/evaluations returns list teacher submitted) */
export type GivenEvaluationItem = ReceivedEvaluationItem;

export interface GivenEvaluationsResponse {
    data: GivenEvaluationItem[];
}
