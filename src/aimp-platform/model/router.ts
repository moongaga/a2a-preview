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
    version?: VersionId;
    role?: RoleId;
    notice?: string;
    mode?: 'use' | 'review';
};

export function workspaceRoute(role?: RoleId): RouteState {
    return { page: 'module', module: 'workspace', view: 'agent-chat', role: normalizeRole(role) };
}
export const runtimeModules = ['workspace', 'task-center', 'delivery-management', 'agent-management', 'agent-testing', 'agent-orchestration', 'dynamic-plan', 'incident-center', 'knowledge-base', 'prompt-engineering', 'skills', 'tools', 'platform-foundation', 'access-control'] as const;
function runtime(route: Partial<RouteState>): RouteState {
    const module: typeof runtimeModules[number] = runtimeModules.includes(route.module as typeof runtimeModules[number])
        ? route.module as typeof runtimeModules[number]
        : 'workspace';
    return { page: 'module', module, view: module === 'workspace' ? 'agent-chat' : module === 'task-center' ? 'kanban' : module === 'delivery-management' ? 'projects' : module === 'agent-management' ? 'registry' : module === 'agent-testing' ? 'projects' : module === 'agent-orchestration' ? 'workflows' : module === 'dynamic-plan' ? 'digital-workforce' : module === 'incident-center' ? 'overview' : module === 'prompt-engineering' ? 'templates' : module === 'skills' ? 'catalog' : module === 'tools' ? 'catalog' : module === 'platform-foundation' ? 'organizations' : module === 'access-control' ? 'roles' : 'assets', role: normalizeRole(route.role) };
}

export function readRoute(): RouteState {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return runtime({module:params.get('module')||undefined,role:(params.get('role')||undefined)as RoleId|undefined});
}

function writeRoute(route: RouteState) {
    const params = new URLSearchParams();
    for (const key of ['page', 'module', 'view', 'role'] as const) {
        const value = route[key];
        if (value) params.set(key, value);
    }
    window.location.hash = params.toString();
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
        const expected = `#page=${normalized.page}&module=${normalized.module}&view=${normalized.view}&role=${normalized.role}`;
        if (window.location.hash !== expected) writeRoute(normalized);
    }, [route]);
    const navigate = useCallback((patch: Partial<RouteState>, replace = false) => {
        const current = readRoute();
        writeRoute(runtime({...current,...patch}));
    }, []);
    return { route, navigate };
}

export function annotationPageId(_route?: RouteState) { return 'module-workspace-agent-chat'; }
