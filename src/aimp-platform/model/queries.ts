import type { EntityRecord } from '../types';

export function getRelatedEntities(
    entities: EntityRecord[],
    source: EntityRecord,
): Array<{ relation: string; entity: EntityRecord }> {
    return source.relations.flatMap((relation) => {
        const target = entities.find((item) => item.id === relation.targetId);
        return target ? [{ relation: relation.type, entity: target }] : [];
    });
}

export function getModuleEntities(entities: EntityRecord[], moduleId: string) {
    return entities.filter((item) => item.moduleId === moduleId);
}

export function getPendingWork(entities: EntityRecord[]) {
    const pending = new Set(['draft', 'pending_approval', 'queued', 'running', 'needs_human', 'open', 'assigned', 'handling']);
    return entities.filter((item) => pending.has(item.status));
}

export function getMetricEntities(entities: EntityRecord[]) {
    return entities.filter((item) => item.type === 'metricSnapshot');
}
