import { roleWorkspaces, type RoleQueueMode, type RoleWorkspaceDefinition } from '../data/role-workspaces';
import type { EntityRecord, RoleId } from '../types';

export interface RoleQueueItem {
    entity: EntityRecord;
    displayName: string;
    urgency: 'high' | 'normal' | 'low';
    nextAction: string;
    reason: string;
}

const statusPriority: Record<string, number> = {
    needs_human: 4,
    pending_approval: 4,
    failed: 4,
    degraded: 3,
    running: 2,
    queued: 2,
    draft: 1,
    active: 1,
};

const modeModules: Record<RoleQueueMode, string[]> = {
    approval: ['task-center', 'dynamic-plan'],
    training: ['agents', 'knowledge-base', 'prompt-engineering', 'evaluation'],
    execution: ['task-center', 'workspace', 'orchestration'],
    operations: ['agents', 'orchestration', 'identity-access', 'audit'],
};

const actionByMode: Record<RoleQueueMode, Record<string, string>> = {
    approval: { pending_approval: '查看策略并审批', needs_human: '处理业务异常', running: '查看执行进展', draft: '补充业务目标' },
    training: { needs_human: '查看 Badcase', degraded: '检查 Agent 表现', draft: '继续训练样本', active: '查看评估结果' },
    execution: { needs_human: '补充信息并确认', pending_approval: '等待审批结果', running: '查看执行进展', queued: '接受 Agent 建议' },
    operations: { failed: '查看影响并处置', degraded: '检查运行健康', needs_human: '确认风险范围', active: '查看 Agent 状态' },
};

function displayName(role: RoleId, entity: EntityRecord) {
    if (!entity.name.includes('示例')) return entity.name;
    if (role === 'business') return '待审批业务策略 · 华南新能源';
    if (role === 'trainer') return '客服 Agent 回答 Badcase';
    if (role === 'employee') return '客户跟进任务 · 华南新能源';
    return 'Agent 运行异常 · 线索诊断';
}

export function getRoleWorkspace(role: RoleId): RoleWorkspaceDefinition {
    return roleWorkspaces[role];
}

export function getRoleQueue(role: RoleId, entities: EntityRecord[]): RoleQueueItem[] {
    const workspace = getRoleWorkspace(role);
    const allowedModules = new Set(modeModules[workspace.queueMode]);
    return entities
        .filter((entity) => allowedModules.has(entity.moduleId))
        .filter((entity) => workspace.queueMode === 'operations' ? ['failed', 'degraded', 'needs_human', 'active'].includes(entity.status) : true)
        .sort((left, right) => (statusPriority[right.status] || 0) - (statusPriority[left.status] || 0))
        .slice(0, 6)
        .map((entity) => ({
            entity,
            displayName: displayName(role, entity),
            urgency: (statusPriority[entity.status] || 0) >= 4 ? 'high' : (statusPriority[entity.status] || 0) >= 2 ? 'normal' : 'low',
            nextAction: actionByMode[workspace.queueMode][entity.status] || workspace.primaryActions[0],
            reason: entity.status === 'needs_human' ? workspace.handoffCopy : `${entity.name}需要你完成下一步处理。`,
        }));
}

export function getRoleObjectFields(role: RoleId, entity: EntityRecord) {
    const common = [
        { label: '当前状态', value: entity.status },
        { label: '负责人', value: entity.ownerId },
    ];
    const roleFields: Record<RoleId, Array<{ label: string; value: string }>> = {
        business: [{ label: 'Agent 建议', value: String(entity.fields.recommendation || '建议优先跟进高意向客户') }, { label: '预计影响', value: String(entity.fields.impact || '预计提升本周转化') }],
        trainer: [{ label: '问题类型', value: String(entity.fields.issueType || '回答不完整') }, { label: '评估标准', value: String(entity.fields.evaluation || '事实准确、引用完整') }],
        employee: [{ label: 'Agent 建议', value: String(entity.fields.recommendation || '请先确认客户当前意向') }, { label: '需要补充', value: String(entity.fields.nextStep || '补充现场沟通结果') }],
        admin: [{ label: '影响范围', value: String(entity.fields.impact || '2 个业务流程') }, { label: '风险等级', value: String(entity.fields.riskLevel || '需要关注') }],
        superadmin: [{ label: '租户影响', value: String(entity.fields.tenantImpact || '跨租户策略') }, { label: '审计等级', value: String(entity.fields.auditLevel || '全局审计') }],
        client: [{ label: '合同范围', value: String(entity.fields.contractScope || '本租户已购产品') }, { label: 'SLA 状态', value: String(entity.fields.sla || '达标') }],
    };
    return [...roleFields[role], ...common];
}
