import seedData from '../data/seed.json';
import transitionData from '../data/transitions.json';
import {
    archiveEntityCommand,
    createEntityCommand,
    restoreEntityCommand,
    transitionEntityCommand,
    updateEntityCommand,
} from './commands';
import {
    clearOperationalSnapshot,
    loadOperationalSnapshot,
    saveOperationalSnapshot,
} from './operational-db';
import { applyDomainEvent, buildDomainEvent } from './domain-events';
import type { DomainEvent } from './domain-events';
import type {
    CommandResult,
    EntityRecord,
    RoleId,
} from '../types';

type TransitionTable = Record<string, Record<string, Record<string, string>>>;
type StoreSnapshot = {
    currentRole: RoleId;
    entities: EntityRecord[];
    revision: number;
    outbox: DomainEvent[];
};
export type TransitionCommand = {
    entityType: string;
    entityId: string;
    action: string;
    actor: string;
    reason?: string;
    allowedRoles?: RoleId[];
};
export type TransitionResult =
    | { ok: true; entity: EntityRecord }
    | { ok: false; code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'ACTION_NOT_ALLOWED'; entity?: EntityRecord };

const transitions = transitionData as TransitionTable;
const normalizeEntity = (entity: EntityRecord): EntityRecord => ({
    ...entity,
    revision: entity.revision || 1,
    createdAt: entity.createdAt || entity.events[entity.events.length - 1]?.at || '2026-07-26T02:30:00.000Z',
    updatedAt: entity.updatedAt || entity.events[0]?.at || '2026-07-26T02:30:00.000Z',
});
const cloneSeed = (): StoreSnapshot => ({
    currentRole: seedData.currentUser.role as RoleId,
    entities: (structuredClone(seedData.entities) as unknown as EntityRecord[]).map(normalizeEntity),
    revision: 0,
    outbox: [],
});

export function createPrototypeStore() {
    let state = cloneSeed();
    const listeners = new Set<() => void>();

    const persist = () => {
        void saveOperationalSnapshot(state);
        listeners.forEach((listener) => listener());
    };
    void loadOperationalSnapshot().then((stored) => {
        if (!stored) {
            persist();
            return;
        }
        state = {
            ...stored,
            entities: stored.entities.map(normalizeEntity),
            outbox: stored.outbox || [],
        };
        listeners.forEach((listener) => listener());
    });
    const snapshot = () => state;
    const list = (type?: string) => state.entities.filter((item) => !type || item.type === type);
    const get = (type: string, id: string) =>
        state.entities.find((item) => item.type === type && item.id === id)
        ?? state.entities.find((item) => item.id === id);

    const transition = (command: TransitionCommand): TransitionResult => {
        const entity = get(command.entityType, command.entityId);
        if (!entity) return { ok: false, code: 'NOT_FOUND' };
        if (command.allowedRoles && !command.allowedRoles.includes(state.currentRole)) {
            return { ok: false, code: 'PERMISSION_DENIED', entity };
        }
        const typeRules = transitions[entity.type] || transitions.generic;
        const nextStatus = typeRules?.[entity.status]?.[command.action];
        if (!nextStatus) return { ok: false, code: 'ACTION_NOT_ALLOWED', entity };
        const nextEntity: EntityRecord = {
            ...entity,
            status: nextStatus,
            events: [{
                id: `EVT-${Date.now()}`,
                action: command.action,
                actor: command.actor,
                at: new Date().toISOString(),
                detail: command.reason || `${command.action} 已执行`,
                fromStatus: entity.status,
                toStatus: nextStatus,
            }, ...entity.events],
        };
        state = {
            ...state,
            revision: state.revision + 1,
            entities: state.entities.map((item) => item.id === entity.id ? nextEntity : item),
        };
        const domainEvent = buildDomainEvent(nextEntity, command.action);
        if (domainEvent) {
            state = {
                ...state,
                entities: applyDomainEvent(state.entities, domainEvent),
                outbox: [domainEvent, ...state.outbox],
            };
        }
        persist();
        return { ok: true, entity: nextEntity };
    };
    const replaceEntity = (result: CommandResult): CommandResult => {
        if (!result.ok) return result;
        state = {
            ...state,
            revision: state.revision + 1,
            entities: state.entities.some((item) => item.id === result.entity.id)
                ? state.entities.map((item) => item.id === result.entity.id ? result.entity : item)
                : [result.entity, ...state.entities],
        };
        persist();
        return result;
    };

    return {
        snapshot,
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        list,
        get,
        getOutbox() {
            return state.outbox;
        },
        transition,
        createEntity(
            input: Omit<EntityRecord, 'id' | 'events' | 'revision' | 'createdAt' | 'updatedAt'>,
            actor = '当前用户',
        ) {
            return replaceEntity(createEntityCommand(state.entities, input, actor));
        },
        updateEntity(
            id: string,
            patch: { name?: string; fields?: EntityRecord['fields']; expectedRevision?: number },
            actor = '当前用户',
        ) {
            return replaceEntity(updateEntityCommand(state.entities.find((item) => item.id === id), patch, actor));
        },
        archiveEntity(id: string, actor = '当前用户') {
            return replaceEntity(archiveEntityCommand(state.entities.find((item) => item.id === id), actor));
        },
        restoreEntity(id: string, actor = '当前用户') {
            return replaceEntity(restoreEntityCommand(state.entities.find((item) => item.id === id), actor));
        },
        transitionOperational(id: string, action: string, nextStatus: string, actor = '当前用户') {
            const result = replaceEntity(transitionEntityCommand(
                state.entities.find((item) => item.id === id),
                action,
                nextStatus,
                actor,
            ));
            if (result.ok) {
                const event = buildDomainEvent(result.entity, action);
                if (event) {
                    state = {
                        ...state,
                        entities: applyDomainEvent(state.entities, event),
                        outbox: [event, ...state.outbox],
                    };
                    persist();
                }
            }
            return result;
        },
        deleteDraft(id: string): CommandResult {
            const entity = state.entities.find((item) => item.id === id);
            if (!entity) return { ok: false, code: 'NOT_FOUND', message: '对象不存在' };
            if (entity.status !== 'draft' || entity.relations.length > 0) {
                return { ok: false, code: 'REFERENCED', message: '仅未被引用的草稿可以彻底删除，请改用归档' };
            }
            state = {
                ...state,
                revision: state.revision + 1,
                entities: state.entities.filter((item) => item.id !== id),
            };
            persist();
            return {
                ok: true,
                entity,
                audit: {
                    id: `EVT-${Date.now()}`,
                    action: 'deleted',
                    actor: '当前用户',
                    at: new Date().toISOString(),
                    detail: `删除草稿${entity.name}`,
                },
            };
        },
        setRole(role: RoleId) {
            state = { ...state, currentRole: role, revision: state.revision + 1 };
            persist();
        },
        async reset() {
            await clearOperationalSnapshot();
            state = cloneSeed();
            persist();
        },
    };
}

export const prototypeStore = createPrototypeStore();
