import { useCallback, useEffect, useState } from 'react';
import { normalizeRole } from './access-policy';
import type { RoleId, VersionId } from '../types';

export type RouteState = {
    page: 'identity' | 'cockpit' | 'dashboard' | 'scenario' | 'platform-flow' | 'module' | 'object' | 'lead' | 'delivery-review';
    workspace?: string;
    module?: string;
    view?: string;
    scenario?: string;
    flow?: string;
    type?: string;
    id?: string;
    source?: string;
    projectId?: string;
    threadId?: string;
    messageId?: string;
    agentId?: string;
    traceId?: string;
    action?: string;
    version?: VersionId;
    role?: RoleId;
    notice?: string;
    mode?: 'use' | 'review';
};

export type WorkspaceHandoff = Required<Pick<RouteState, 'source' | 'projectId' | 'threadId' | 'messageId' | 'agentId' | 'traceId' | 'action'>>;

export function workspaceRoute(role?: RoleId): RouteState {
    return { page: 'module', module: 'workspace', view: 'agent-chat', role: normalizeRole(role) };
}
export const runtimeModules = ['workspace', 'task-center', 'delivery-management', 'agent-management', 'agent-testing', 'agent-orchestration', 'dynamic-plan', 'incident-center', 'knowledge-base', 'prompt-engineering', 'skills', 'tools', 'platform-foundation', 'access-control'] as const;
function runtime(route: Partial<RouteState>): RouteState {
    const module: typeof runtimeModules[number] = runtimeModules.includes(route.module as typeof runtimeModules[number])
        ? route.module as typeof runtimeModules[number]
        : 'workspace';
    return { ...route, page: 'module', module, view: route.view || (module === 'workspace' ? 'agent-chat' : module === 'task-center' ? 'kanban' : module === 'delivery-management' ? 'projects' : module === 'agent-management' ? 'registry' : module === 'agent-testing' ? 'projects' : module === 'agent-orchestration' ? 'workflows' : module === 'dynamic-plan' ? 'digital-workforce' : module === 'incident-center' ? 'overview' : module === 'prompt-engineering' ? 'templates' : module === 'skills' ? 'catalog' : module === 'tools' ? 'catalog' : module === 'platform-foundation' ? 'organizations' : module === 'access-control' ? 'roles' : 'assets'), role: normalizeRole(route.role) };
}

export function readRoute(): RouteState {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const value = (key: string) => params.get(key) || undefined;
    return runtime({
        module: value('module'), view: value('view'), role: value('role') as RoleId | undefined,
        source: value('source'), projectId: value('projectId'), threadId: value('threadId'), messageId: value('messageId'),
        agentId: value('agentId'), traceId: value('traceId'), action: value('action'),
    });
}

function routeHash(route: RouteState) {
    const params = new URLSearchParams();
    for (const key of ['page', 'module', 'view', 'role', 'source', 'projectId', 'threadId', 'messageId', 'agentId', 'traceId', 'action'] as const) {
        const value = route[key];
        if (value) params.set(key, value);
    }
    return `#${params.toString()}`;
}

function writeRoute(route: RouteState, replace = false) {
    const hash = routeHash(route);
    if (replace) window.history.replaceState(null, '', hash);
    else window.location.hash = hash.slice(1);
}

export function useAimpRoute() {
    const [route, setRoute] = useState<RouteState>(() => readRoute());
    useEffect(() => {
        const onHashChange = () => setRoute(readRoute());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);
    useEffect(() => {
        const normalized = runtime(route);
        const expected = routeHash(normalized);
        if (window.location.hash !== expected) writeRoute(normalized);
    }, [route]);
    const navigate = useCallback((patch: Partial<RouteState>, replace = false) => {
        const current = readRoute();
        const next = runtime({ ...current, ...patch });
        writeRoute(next, replace);
        if (replace) setRoute(next);
    }, []);
    return { route, navigate };
}

export function annotationPageId(_route?: RouteState) { return 'module-workspace-agent-chat'; }
