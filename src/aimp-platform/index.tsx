/**
 * @name AIMP 统一 AI 管控平台
 */
import React, { useSyncExternalStore } from 'react';
import { AppShell } from './components/AppShell';
import { prototypeStore } from './model/store';
import { useAimpRoute } from './model/router';
import { canPerformAction, filterEntitiesForContext, normalizeRole } from './model/access-policy';
import { getModule } from './model/registry';
import { getModuleEntities } from './model/queries';
import { WorkspacePage } from './modules/workspace/WorkspacePage';
import { M05TaskCenterPage } from './modules/task-center/M05TaskCenterPage';
import { M06KnowledgeBasePage } from './modules/knowledge-base/M06KnowledgeBasePage';
import { M07PromptEngineeringPage } from './modules/prompt-engineering/M07PromptEngineeringPage';
import { M03AgentManagementPage } from './modules/agent-management/M03AgentManagementPage';
import { M11AgentTestSandboxPage } from './modules/agent-testing/M11AgentTestSandboxPage';
import { M08AgentOrchestrationPage } from './modules/agent-orchestration/M08AgentOrchestrationPage';
import { M09DynamicPlanPage } from './modules/dynamic-plan/M09DynamicPlanPage';
import { M12IncidentCenterPage } from './modules/incident-center/M12IncidentCenterPage';
import { M15PlatformFoundationPage } from './modules/platform-management/M15PlatformFoundationPage';
import { M16AccessControlPage } from './modules/platform-management/M16AccessControlPage';
import { PlatformManagementProvider } from './modules/platform-management/platform-management-store';
import './style.css';
import './readability.css';
import './module-layout.css';
import type { EntityRecord, ProductContext, RoleId } from './types';

export default function AimpPrototype() {
    const { route, navigate } = useAimpRoute();
    const snapshot = useSyncExternalStore(prototypeStore.subscribe, prototypeStore.snapshot);
    const role = normalizeRole(route.role);
    const activeModule = route.module || 'workspace';
    const context: ProductContext = {
        versionId: 'v7',
        role,
        currentUserId: 'USER-001',
        currentUserName: '陈琳',
        identity: {
            tenantId: role === 'client' ? 'TENANT-BRAND-A' : 'TENANT-AIMP',
            organizationId: 'ORG-DNDC-LEAD',
            organizationName: role === 'client' ? '品牌方 A' : role === 'superadmin' ? 'AIMP 平台治理' : role === 'admin' ? 'AIMP 平台运营' : role === 'trainer' ? 'DNDC 数字营销能力中台' : 'DNDC 线索中心',
            jobTitle: role === 'business' ? '线索中心总监' : role === 'trainer' ? 'AI 训练师' : role === 'admin' ? '平台运维管理员' : role === 'superadmin' ? '平台治理负责人' : role === 'client' ? '客户管理员' : '线索中心员工',
            jobLevel: role === 'business' ? '总监' : role === 'superadmin' ? '平台最高权限' : role === 'admin' ? '管理员' : '员工',
            processRole: role === 'business' ? '线索 CFT 负责人' : role === 'trainer' ? 'AI 能力修复负责人' : role === 'admin' ? '平台运行责任人' : role === 'superadmin' ? '治理策略审批人' : role === 'client' ? '客户结果确认人' : '流程参与者',
            systemRole: role,
            dataScope: role === 'superadmin' ? 'all-tenants' : role === 'client' ? 'tenant' : 'project',
        },
    };
    const workspaceModule = getModule('workspace');
    const workspacePage = workspaceModule?.pages.find((page) => page.id === 'agent-chat') || workspaceModule?.pages[0];
    const contextualEntities = filterEntitiesForContext(snapshot.entities, context);
    const workspaceEntities = workspaceModule ? getModuleEntities(contextualEntities, workspaceModule.id) : [];
    const changeRole = (nextRole: RoleId) => {
        prototypeStore.setRole(nextRole);
        navigate({ role: nextRole }, true);
    };
    const executeTransition = (entity: EntityRecord, action: string, reason?: string) => {
        const permissionAction = entity.moduleId === 'agents' && action === 'approve' ? 'publish' : action;
        if (!canPerformAction(context, entity.moduleId, permissionAction).allowed) return;
        prototypeStore.transition({
            entityType: entity.type,
            entityId: entity.id,
            action,
            actor: context.currentUserName,
            reason,
            allowedRoles: ['employee', 'business', 'trainer', 'admin', 'superadmin', 'client'],
        });
    };

    if (!workspaceModule || !workspacePage) return null;
    return <PlatformManagementProvider><AppShell role={role} activeModule={activeModule} onRole={changeRole} onModule={(module) => navigate({ module, role }, true)}>
        {activeModule === 'task-center' ? <M05TaskCenterPage role={role} /> : activeModule === 'agent-management' ? <M03AgentManagementPage role={role} /> : activeModule === 'agent-testing' ? <M11AgentTestSandboxPage role={role} /> : activeModule === 'agent-orchestration' ? <M08AgentOrchestrationPage role={role} /> : activeModule === 'dynamic-plan' ? <M09DynamicPlanPage role={role} /> : activeModule === 'incident-center' ? <M12IncidentCenterPage role={role} /> : activeModule === 'knowledge-base' ? <M06KnowledgeBasePage role={role} /> : activeModule === 'prompt-engineering' ? <M07PromptEngineeringPage role={role} /> : activeModule === 'platform-foundation' ? <M15PlatformFoundationPage role={role} /> : activeModule === 'access-control' ? <M16AccessControlPage role={role} /> : <WorkspacePage
            key={`workspace-${role}`}
            module={workspaceModule}
            page={workspacePage}
            role={role}
            moduleEntities={workspaceEntities}
            allEntities={contextualEntities}
            openEntity={() => undefined}
            onAction={executeTransition}
            permissionFor={(action) => canPerformAction(context, workspaceModule.id, action)}
        />}
    </AppShell></PlatformManagementProvider>;
}
