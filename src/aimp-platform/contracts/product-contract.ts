import type { RoleId } from '../types';

export const SYSTEM_ROLES: RoleId[] = ['employee', 'business', 'trainer', 'admin', 'superadmin', 'client'];

export const ROLE_LABELS: Record<RoleId, string> = {
    employee: '员工',
    business: '业务负责人',
    trainer: 'AI 训练师',
    admin: '平台管理员',
    superadmin: '超级管理员',
    client: '客户管理员',
};

export type WorkspaceArchetype =
    | 'personal'
    | 'board'
    | 'catalog'
    | 'canvas'
    | 'editor'
    | 'monitor'
    | 'delivery'
    | 'governance'
    | 'data-lab';

export type InteractionKind = 'navigate' | 'dialog' | 'transition' | 'download' | 'feedback';

export interface ActionContract {
    id: string;
    label: string;
    kind: InteractionKind;
    requiredAction: string;
    targetModuleId?: string;
    fields?: Array<{
        id: string;
        label: string;
        kind: 'select' | 'text' | 'textarea';
        required?: boolean;
        options?: string[];
    }>;
}

export interface RelationContract {
    label: string;
    targetModuleId: string;
    direction: 'reads' | 'writes' | 'binds' | 'governs';
}

export interface ModuleExperience {
    moduleId: string;
    objectLabel: string;
    archetype: WorkspaceArchetype;
    summary: string;
    keyFields: string[];
    workflowSteps: string[];
    resultMetrics: string[];
    exceptionCases: string[];
    actions: ActionContract[];
    relations: RelationContract[];
    levels: ['L0', 'L1', 'L2', 'L3', 'L4'];
}
