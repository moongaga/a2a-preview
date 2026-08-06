export type RoleId = 'employee' | 'business' | 'trainer' | 'admin' | 'superadmin' | 'client';

export interface CompositeIdentity {
    tenantId: string;
    organizationId: string;
    organizationName: string;
    jobTitle: string;
    jobLevel: string;
    processRole: string;
    systemRole: RoleId;
    dataScope: 'self' | 'project' | 'department' | 'tenant' | 'platform' | 'all-tenants';
}
export type PageKind =
    | 'workspace'
    | 'list'
    | 'create'
    | 'detail'
    | 'process'
    | 'records'
    | 'result'
    | 'audit';

export interface VersionDefinition {
    id: string;
    label: string;
    date: string;
    goal: string;
    status: 'implementation' | 'enhancement' | 'planned';
    entryConditions: string[];
    exitConditions: string[];
}

export interface DomainDefinition {
    id: string;
    name: string;
    purpose: string;
}

export interface ModulePageDefinition {
    id: string;
    name: string;
    kind: PageKind;
    purpose: string;
    primaryActions: string[];
    requirementIds: string[];
}

export interface ModuleDefinition {
    id: string;
    code: string;
    name: string;
    domainId: string;
    versionId: string;
    maturity: 'implementation' | 'planned';
    primaryObject: string;
    roles: RoleId[];
    dependencies: string[];
    pages: ModulePageDefinition[];
}

export interface RequirementDefinition {
    id: string;
    moduleId: string;
    pageIds: string[];
    title: string;
    role: RoleId[];
    purpose: string;
    preconditions: string[];
    fields: Array<{ name: string; required: boolean; rule: string }>;
    actions: string[];
    rules: string[];
    stateChanges: string[];
    exceptions: string[];
    dataRequirements: string[];
    permissions: string[];
    relations: string[];
    acceptance: string[];
}

export interface EntityRelation {
    type: string;
    targetType: string;
    targetId: string;
}

export interface AuditEvent {
    id: string;
    action: string;
    actor: string;
    at: string;
    detail: string;
    fromStatus?: string;
    toStatus?: string;
}

export interface EntityRecord {
    id: string;
    type: string;
    name: string;
    status: string;
    ownerId: string;
    moduleId: string;
    fields: Record<string, string | number | boolean | string[]>;
    relations: EntityRelation[];
    events: AuditEvent[];
    revision?: number;
    archivedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type VersionId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7';

export interface ProductContext {
    versionId: VersionId;
    role: RoleId;
    currentUserId: string;
    currentUserName: string;
    identity?: CompositeIdentity;
}

export type PermissionDecision = {
    allowed: boolean;
    reason?: string;
};

export type CommandFailureCode =
    | 'VALIDATION'
    | 'PERMISSION'
    | 'CONFLICT'
    | 'REFERENCED'
    | 'NOT_FOUND'
    | 'ACTION_NOT_ALLOWED';

export type CommandResult =
    | { ok: true; entity: EntityRecord; audit: AuditEvent }
    | { ok: false; code: CommandFailureCode; message: string };
