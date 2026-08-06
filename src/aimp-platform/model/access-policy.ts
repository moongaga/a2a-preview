import accessData from '../data/access-policies.json';
import { modules, versions } from './registry';
import type {
    EntityRecord,
    ModuleDefinition,
    PermissionDecision,
    ProductContext,
    RoleId,
    VersionId,
} from '../types';
import { isModuleVisibleAtVersion as isSnapshotModuleVisible } from './version-snapshot';
import { decideAccess } from '../modules/platform-management/access-decision';

type RolePolicy = {
    modules: string[];
    actions: string[];
    dataScope: 'all' | 'business' | 'trainer' | 'self' | 'tenant';
};

const policies = accessData.roles as Record<RoleId, RolePolicy>;
const versionIds = versions.map((item) => item.id) as VersionId[];
export const roleIds: RoleId[] = ['employee', 'business', 'trainer', 'admin', 'superadmin', 'client'];

export const normalizeVersion = (value?: string): VersionId =>
    versionIds.includes(value as VersionId) ? value as VersionId : 'v7';

export const normalizeRole = (value?: string): RoleId =>
    roleIds.includes(value as RoleId) ? value as RoleId : 'business';

export const isModuleAvailableAtVersion = (
    module: ModuleDefinition,
    versionId: VersionId,
) => isSnapshotModuleVisible(module.id, versionId);

export const canRoleAccessModule = (moduleId: string, role: RoleId) => {
    const allowed = policies[role].modules;
    return allowed.includes('*') || allowed.includes(moduleId);
};

export const getVisibleModules = (versionId: VersionId, role: RoleId) =>
    modules.filter((module) =>
        isModuleAvailableAtVersion(module, versionId)
        && canRoleAccessModule(module.id, role),
    );

export const canPerformAction = (
    context: ProductContext,
    moduleId: string,
    action: string,
): PermissionDecision => {
    if (moduleId === 'platform-foundation' || moduleId === 'access-control') {
        const actionNames: Record<string,string> = { read:'查看', create:'新增', update:'编辑', delete:'删除', approve:'审批', publish:'发布', archive:'归档', restore:'恢复', revoke:'回收' };
        const decision = decideAccess({ role:context.role, moduleId, action:actionNames[action] || action, requestedScope:context.identity?.dataScope === 'all-tenants' ? '全租户' : context.identity?.dataScope === 'platform' ? '平台' : context.identity?.dataScope === 'tenant' ? '租户' : context.identity?.dataScope === 'department' ? '部门' : context.identity?.dataScope === 'project' ? '项目' : '本人' });
        return { allowed:decision.allowed, reason:`${decision.reason}（${decision.auditId}）` };
    }
    if (!canRoleAccessModule(moduleId, context.role)) {
        return { allowed: false, reason: '当前角色无权访问该模块' };
    }
    const allowed = policies[context.role].actions;
    if (allowed.includes('*') || allowed.includes(action)) return { allowed: true };
    if (context.role === 'employee' && action === 'update') {
        return { allowed: true, reason: '仅允许修改本人负责的对象' };
    }
    return { allowed: false, reason: `当前角色无“${action}”操作权限` };
};

export function filterEntitiesForContext(
    entities: EntityRecord[],
    context: ProductContext,
) {
    const visibleIds = new Set(getVisibleModules(context.versionId, context.role).map((item) => item.id));
    const available = entities.filter((item) => visibleIds.has(item.moduleId));
    const scope = policies[context.role].dataScope;
    if (scope === 'all') return available;
    if (scope === 'tenant') {
        const tenantId = context.identity?.tenantId || 'TENANT-BRAND-A';
        return available.filter((item) =>
            item.moduleId === 'client-portal'
            && String(item.fields.tenantId || tenantId) === tenantId,
        );
    }
    if (scope === 'self') {
        return available.filter((item) =>
            item.ownerId === context.currentUserName
            || item.status === 'published'
            || item.status === 'active',
        );
    }
    if (scope === 'trainer') {
        return available.filter((item) =>
            policies.trainer.modules.includes(item.moduleId)
            || item.ownerId === context.currentUserName,
        );
    }
    return available.filter((item) =>
        policies.business.modules.includes(item.moduleId)
        || item.ownerId === context.currentUserName,
    );
}
