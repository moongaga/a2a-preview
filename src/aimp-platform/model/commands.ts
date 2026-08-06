import type {
    AuditEvent,
    CommandResult,
    EntityRecord,
} from '../types';

const now = () => new Date().toISOString();

const audit = (
    action: string,
    actor: string,
    detail: string,
    fromStatus?: string,
    toStatus?: string,
): AuditEvent => ({
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    actor,
    at: now(),
    detail,
    fromStatus,
    toStatus,
});

export function createEntityCommand(
    entities: EntityRecord[],
    input: Omit<EntityRecord, 'id' | 'events' | 'revision' | 'createdAt' | 'updatedAt'>,
    actor: string,
): CommandResult {
    if (!input.name.trim()) return { ok: false, code: 'VALIDATION', message: '名称不能为空' };
    if (entities.some((item) => item.moduleId === input.moduleId && item.name.trim() === input.name.trim() && !item.archivedAt)) {
        return { ok: false, code: 'VALIDATION', message: '当前模块已存在同名对象' };
    }
    const event = audit('created', actor, `创建${input.name}`);
    const entity: EntityRecord = {
        ...input,
        id: `${input.moduleId.toUpperCase().replace(/-/gu, '_')}-${Date.now()}`,
        revision: 1,
        createdAt: event.at,
        updatedAt: event.at,
        events: [event],
    };
    return { ok: true, entity, audit: event };
}

export function updateEntityCommand(
    entity: EntityRecord | undefined,
    patch: { name?: string; fields?: EntityRecord['fields']; expectedRevision?: number },
    actor: string,
): CommandResult {
    if (!entity) return { ok: false, code: 'NOT_FOUND', message: '对象不存在或已被删除' };
    if (patch.expectedRevision !== undefined && (entity.revision || 1) !== patch.expectedRevision) {
        return { ok: false, code: 'CONFLICT', message: '对象已被其他操作修改，请加载最新版本后重试' };
    }
    if (patch.name !== undefined && !patch.name.trim()) {
        return { ok: false, code: 'VALIDATION', message: '名称不能为空' };
    }
    const event = audit('updated', actor, `更新${entity.name}`);
    const next = {
        ...entity,
        name: patch.name?.trim() || entity.name,
        fields: patch.fields ? { ...entity.fields, ...patch.fields } : entity.fields,
        revision: (entity.revision || 1) + 1,
        updatedAt: event.at,
        events: [event, ...entity.events],
    };
    return { ok: true, entity: next, audit: event };
}

export function archiveEntityCommand(
    entity: EntityRecord | undefined,
    actor: string,
): CommandResult {
    if (!entity) return { ok: false, code: 'NOT_FOUND', message: '对象不存在' };
    if (entity.archivedAt) return { ok: false, code: 'VALIDATION', message: '对象已经归档' };
    const event = audit('archived', actor, `归档${entity.name}`, entity.status, 'archived');
    return {
        ok: true,
        entity: {
            ...entity,
            status: 'archived',
            archivedAt: event.at,
            updatedAt: event.at,
            revision: (entity.revision || 1) + 1,
            events: [event, ...entity.events],
        },
        audit: event,
    };
}

export function restoreEntityCommand(
    entity: EntityRecord | undefined,
    actor: string,
): CommandResult {
    if (!entity) return { ok: false, code: 'NOT_FOUND', message: '对象不存在' };
    if (!entity.archivedAt) return { ok: false, code: 'VALIDATION', message: '对象不在归档区' };
    const event = audit('restored', actor, `恢复${entity.name}`, 'archived', 'draft');
    return {
        ok: true,
        entity: {
            ...entity,
            status: 'draft',
            archivedAt: undefined,
            updatedAt: event.at,
            revision: (entity.revision || 1) + 1,
            events: [event, ...entity.events],
        },
        audit: event,
    };
}

export function transitionEntityCommand(
    entity: EntityRecord | undefined,
    action: string,
    nextStatus: string,
    actor: string,
): CommandResult {
    if (!entity) return { ok: false, code: 'NOT_FOUND', message: '对象不存在' };
    if (entity.archivedAt) return { ok: false, code: 'ACTION_NOT_ALLOWED', message: '归档对象不能执行状态动作，请先恢复' };
    const event = audit(action, actor, `${entity.name}：${entity.status} → ${nextStatus}`, entity.status, nextStatus);
    return {
        ok: true,
        entity: {
            ...entity,
            status: nextStatus,
            revision: (entity.revision || 1) + 1,
            updatedAt: event.at,
            events: [event, ...entity.events],
        },
        audit: event,
    };
}

export function query(leads: Array<{ name: string; status: string }>, keyword = '') {
    const normalized = keyword.trim().toLowerCase();
    return leads.filter((lead) => !normalized || lead.name.toLowerCase().includes(normalized) || lead.status.includes(normalized));
}

export function validateLeadForm(input: { name?: string; owner?: string }) {
    if (!input.name?.trim()) return { ok: false, message: '线索名称不能为空' };
    if (!input.owner?.trim()) return { ok: false, message: '负责人不能为空' };
    return { ok: true };
}

export function approveLead(status: string) { return status === 'pending_approval' ? 'approved' : undefined; }
export function rejectLead(status: string) { return status === 'pending_approval' ? 'rejected' : undefined; }
export function retryLead(status: string) { return status === 'failed' ? 'queued' : undefined; }
export function takeoverLead(status: string) { return ['in_progress', 'pending_approval'].includes(status) ? 'manual_takeover' : undefined; }
