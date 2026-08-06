import type { ProductContext } from '../types';
import { workspaceRoute, type RouteState } from './router';

export function resolveAccessibleRoute(
    route: RouteState,
    context: ProductContext,
): { allowed: boolean; route: RouteState; reason?: string } {
    return { allowed: true, route: workspaceRoute(context.role) };
}

export function canAccessRoute(route: RouteState, context: ProductContext) {
    return resolveAccessibleRoute(route, context).allowed;
}
