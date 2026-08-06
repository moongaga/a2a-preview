import type { ProductContext } from '../types';
import { canRoleAccessModule } from './access-policy';

const rules: Record<string, { read: string[]; write: string[] }> = {
    owner: { read: ['admin', 'business', 'trainer', 'employee'], write: ['admin', 'business'] },
    prompt: { read: ['admin', 'trainer'], write: ['admin', 'trainer'] },
    knowledgeContent: { read: ['admin', 'business', 'trainer'], write: ['admin', 'trainer'] },
    approvalReason: { read: ['admin', 'business', 'trainer'], write: ['admin', 'business'] },
    audit: { read: ['admin', 'business', 'trainer'], write: [] },
};

export function canReadField(moduleId: string, fieldId: string, context: ProductContext) {
    if (!canRoleAccessModule(moduleId, context.role)) return false;
    return rules[fieldId]?.read.includes(context.role) ?? context.role !== 'employee';
}

export function canWriteField(moduleId: string, fieldId: string, context: ProductContext) {
    if (!canRoleAccessModule(moduleId, context.role)) return false;
    return rules[fieldId]?.write.includes(context.role) ?? context.role !== 'employee';
}

export function getFieldPermission(moduleId: string, fieldId: string, context: ProductContext) {
    return { readable: canReadField(moduleId, fieldId, context), writable: canWriteField(moduleId, fieldId, context) };
}
