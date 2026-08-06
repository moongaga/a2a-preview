import type { AuditEvent, EntityRecord } from '../types';

export type DomainEvent = {
    id: string;
    type: string;
    sourceId: string;
    targetModuleId: string;
    status: 'processed' | 'pending_retry';
    createdAt: string;
    detail: string;
};

const targetByAction: Record<string, { type: string; targetModuleId: string }> = {
    approve: { type: 'task.approved', targetModuleId: 'orchestration' },
    publish: { type: 'asset.published', targetModuleId: 'ai-products' },
    complete: { type: 'result.confirmed', targetModuleId: 'analytics' },
    handoff: { type: 'task.handoff', targetModuleId: 'ticket-system' },
    submit_test: { type: 'agent.test.requested', targetModuleId: 'agent-testing' },
    gate_pass: { type: 'agent.gate.passed', targetModuleId: 'agents' },
    release: { type: 'agent.released', targetModuleId: 'analytics' },
    fail: { type: 'runtime.failed', targetModuleId: 'ticket-system' },
    create_repair: { type: 'incident.repair.requested', targetModuleId: 'task-center' },
    retrain: { type: 'model.retrain.requested', targetModuleId: 'mf-experiment' },
    service_request: { type: 'client.service.requested', targetModuleId: 'ticket-system' },
};

export function buildDomainEvent(entity: EntityRecord, action: string): DomainEvent | undefined {
    const mapping = targetByAction[action];
    if (!mapping) return undefined;
    return {
        id: `OUTBOX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: mapping.type,
        sourceId: entity.id,
        targetModuleId: mapping.targetModuleId,
        status: 'processed',
        createdAt: new Date().toISOString(),
        detail: `${entity.name}触发${mapping.type}，同步至${mapping.targetModuleId}`,
    };
}

export function applyDomainEvent(
    entities: EntityRecord[],
    event: DomainEvent,
): EntityRecord[] {
    const target = entities.find((item) => item.moduleId === event.targetModuleId);
    if (!target) return entities;
    const audit: AuditEvent = {
        id: `EVT-${event.id}`,
        action: 'domain_event',
        actor: '跨模块事件处理器',
        at: event.createdAt,
        detail: event.detail,
    };
    return entities.map((item) => item.id === target.id
        ? {
            ...item,
            revision: (item.revision || 1) + 1,
            updatedAt: event.createdAt,
            events: [audit, ...item.events],
        }
        : item);
}
