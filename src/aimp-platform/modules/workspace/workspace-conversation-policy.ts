import type { RoleId } from '../../types';

export type WorkspaceConversationActionId =
    | 'confirm-result'
    | 'submit-feedback'
    | 'create-task'
    | 'create-acceptance-task'
    | 'open-m11'
    | 'open-m12'
    | 'approve-change'
    | 'reject-change'
    | 'view-evidence';

export interface WorkspaceConversationScenario {
    id: string;
    projectId: string;
    title: string;
    agentId: string;
    updatedAt: string;
    visibleRoles: RoleId[];
    userPrompt: string;
    factSummary: string;
    traceId: string;
}

export interface WorkspaceRoleConversationPolicy {
    role: RoleId;
    defaultThreadId: string;
    quickPrompts: string[];
    resultFocus: string;
    allowedActionIds: WorkspaceConversationActionId[];
    intentKeywords: string[];
    matchedReply: string;
    boundaryReply: string;
}

export interface WorkspaceReplyTrace {
    id: string;
    agentId: string;
    consumedSources: Array<{ bindingId: string; operation: string; result: string }>;
}

export interface WorkspaceReply {
    matched: boolean;
    message: string;
    focus: string;
    nextActionIds: WorkspaceConversationActionId[];
    trace?: WorkspaceReplyTrace;
}

export interface WorkspaceActionContext {
    role: RoleId;
    actor: string;
    projectId: string;
    threadId: string;
    messageId: string;
    agentId: string;
    traceId: string;
    actionId: WorkspaceConversationActionId;
}

export const workspaceConversationScenarios: WorkspaceConversationScenario[] = [
    {
        id: 'CHAT-3088', projectId: 'PJ-LEAD-Q3-02', title: '确认本周评分偏差结果', agentId: 'AGENT-LEAD-03', updatedAt: '10分钟前',
        visibleRoles: ['employee', 'business', 'trainer'],
        userPrompt: '请核对本周意向评分准确率下降的原因，并指出我需要人工确认的样本。',
        factSummary: '126 条脱敏低置信样本中，38 条受新车型标签规则影响；需要业务人员确认 12 条边界样本，尚未形成生产变更。',
        traceId: 'trace-9ab8-73c',
    },
    {
        id: 'CHAT-3072', projectId: 'PJ-LEAD-Q3-02', title: '评估灰度恢复业务影响', agentId: 'AGENT-BIZ-08', updatedAt: '昨天',
        visibleRoles: ['employee', 'business'],
        userPrompt: '评估评分 Agent 恢复 10% 灰度对转化率、人工复核量和 SLA 的影响。',
        factSummary: '10% 灰度预计恢复 1.8 个百分点的有效线索识别率，人工复核量增加约 9%，连续 7 天达标后才可进入业务验收。',
        traceId: 'trace-biz-3072',
    },
    {
        id: 'CHAT-3051', projectId: 'PJ-LEAD-Q3-02', title: '定位能力版本偏差', agentId: 'AGENT-QUALITY-11', updatedAt: '周一',
        visibleRoles: ['trainer', 'admin'],
        userPrompt: '结合失败样本、Prompt、知识和模型版本，定位评分偏差并给出候选修复路径。',
        factSummary: '生产 Agent 仍绑定 Prompt v12 与知识 2026.07，候选知识已更新到 2026.08；应建立候选版本并通过 M11 组合测试，不能直接覆盖生产。',
        traceId: 'trace-quality-3051',
    },
    {
        id: 'CHAT-4012', projectId: 'PJ-LEAD-OPS-01', title: '处置 P1 告警与生产保护', agentId: 'AGENT-RUNTIME-06', updatedAt: '8分钟前',
        visibleRoles: ['business', 'trainer', 'admin', 'superadmin'],
        userPrompt: '分析 ALT-518 告警、外部连接和运行实例，判断当前保护范围与恢复条件。',
        factSummary: '生产保护已经生效，异常影响线索评分链路的 10% 灰度流量；应保留上一稳定版本并在 M12 建单后继续根因处置。',
        traceId: 'trace-ops-518',
    },
    {
        id: 'CHAT-5010', projectId: 'PJ-LEAD-OPS-01', title: '审批模型路由重大变更', agentId: 'AGENT-GOV-01', updatedAt: '今天 09:20',
        visibleRoles: ['admin', 'superadmin'],
        userPrompt: '评估本次模型路由变更的租户影响、数据风险、灾备要求和审批条件。',
        factSummary: '变更涉及 2 个租户和生产路由，需保留租户隔离验证、30 分钟灾备恢复证据及双人审批；当前证据完整，可批准受控灰度或驳回补充。',
        traceId: 'trace-gov-5010',
    },
];

export const workspaceRoleConversationPolicies: Record<RoleId, WorkspaceRoleConversationPolicy> = {
    employee: {
        role: 'employee', defaultThreadId: 'CHAT-3088', resultFocus: '确认 AI 结论、边界样本和本人待办',
        quickPrompts: ['列出需要我确认的边界样本', '解释本周 AI 质量变化', '把确认项整理为本人任务'],
        allowedActionIds: ['confirm-result', 'submit-feedback', 'view-evidence'],
        intentKeywords: ['确认', '样本', '质量', '结果', '任务'],
        matchedReply: '已按本人及项目成员权限完成结果核对：优先确认边界样本，未发现需要绕过流程的生产操作。',
        boundaryReply: '当前工作空间可协助确认 AI 结果、核对脱敏样本和形成本人待办。请选择一个快捷问题继续。',
    },
    business: {
        role: 'business', defaultThreadId: 'CHAT-3072', resultFocus: '判断业务影响、灰度风险和验收条件',
        quickPrompts: ['评估 10% 灰度的业务收益与风险', '生成业务验收条件', '比较恢复与继续降级两种方案'],
        allowedActionIds: ['create-acceptance-task', 'view-evidence'],
        intentKeywords: ['业务', '灰度', '验收', '影响', '风险', '转化'],
        matchedReply: '已聚合业务效果、人工复核量和 SLA 投影：建议采用 10% 受控灰度，并以连续 7 天达标作为验收门槛。',
        boundaryReply: '当前角色可评估业务影响、灰度风险和验收条件，不直接修改 Prompt、模型或生产路由。请选择一个快捷问题继续。',
    },
    trainer: {
        role: 'trainer', defaultThreadId: 'CHAT-3051', resultFocus: '定位能力根因、候选版本和测试门禁',
        quickPrompts: ['比较 Prompt 与知识版本差异', '生成候选修复任务', '准备 M11 组合测试范围'],
        allowedActionIds: ['create-task', 'open-m11', 'view-evidence'],
        intentKeywords: ['Prompt', '知识', '模型', '版本', '修复', '测试', '根因'],
        matchedReply: '已定位能力版本偏差：先建立候选修复任务，再以当前 Trace 预填 M11 组合测试；测试通过前不得覆盖生产版本。',
        boundaryReply: '当前角色可处理能力根因、候选版本和测试门禁，不负责业务验收或生产审批。请选择一个快捷问题继续。',
    },
    admin: {
        role: 'admin', defaultThreadId: 'CHAT-4012', resultFocus: '控制影响范围、保护生产并准备恢复',
        quickPrompts: ['分析当前告警影响范围', '生成 M12 建单证据', '检查回滚与恢复条件'],
        allowedActionIds: ['open-m12', 'create-task', 'view-evidence'],
        intentKeywords: ['告警', '异常', '生产', '保护', '回滚', '恢复', '连接'],
        matchedReply: '生产保护已生效，影响限制在受控灰度范围；建议携带当前 Trace 在 M12 建单，并在恢复前完成根因、回滚和验证证据。',
        boundaryReply: '当前角色可处理运行告警、生产保护、回滚和恢复，不审批业务收益或修改 CRM 数据。请选择一个快捷问题继续。',
    },
    superadmin: {
        role: 'superadmin', defaultThreadId: 'CHAT-5010', resultFocus: '审查租户、安全、灾备与重大变更证据',
        quickPrompts: ['检查跨租户影响与隔离证据', '核对灾备恢复门槛', '生成重大变更审批意见'],
        allowedActionIds: ['approve-change', 'reject-change', 'view-evidence'],
        intentKeywords: ['租户', '治理', '审计', '灾备', '审批', '安全', '重大变更'],
        matchedReply: '已完成重大变更治理核对：租户隔离、特权访问与灾备证据齐备，可批准受控灰度；任一证据缺失则应驳回补充。',
        boundaryReply: '当前角色只处理重大变更、跨租户风险、灾备和审计，不替代日常业务或训练操作。请选择一个快捷问题继续。',
    },
    client: {
        role: 'client', defaultThreadId: '', resultFocus: '无内部工作空间', quickPrompts: [], allowedActionIds: [], intentKeywords: [],
        matchedReply: '当前身份不使用内部工作空间。', boundaryReply: '当前身份不使用内部工作空间。',
    },
};

const traceSources: Record<Exclude<RoleId, 'client'>, WorkspaceReplyTrace['consumedSources']> = {
    employee: [{ bindingId: 'DS-CRM-PROJECTION', operation: '读取本人及项目脱敏评分样本', result: '完成边界样本核对' }],
    business: [{ bindingId: 'DS-CRM-PROJECTION', operation: '读取聚合业务与质量指标', result: '生成灰度影响投影' }],
    trainer: [{ bindingId: 'KB-LEAD-001', operation: '比较 Prompt、知识和模型版本', result: '识别候选修复路径' }],
    admin: [{ bindingId: 'DS-RUNTIME-METRICS', operation: '读取告警窗口和运行实例', result: '确认保护范围与恢复条件' }],
    superadmin: [{ bindingId: 'AUDIT-CHANGE-LOG', operation: '读取租户影响、特权访问和灾备证据', result: '生成重大变更治理结论' }],
};

export function visibleWorkspaceScenarios(role: RoleId) {
    return workspaceConversationScenarios.filter((scenario) => scenario.visibleRoles.includes(role));
}

export function resolveWorkspaceReply(role: RoleId, prompt: string, agentId: string, now = Date.now()): WorkspaceReply {
    const policy = workspaceRoleConversationPolicies[role];
    const matched = policy.intentKeywords.some((keyword) => prompt.toLowerCase().includes(keyword.toLowerCase()));
    if (!matched || role === 'client') return { matched: false, message: policy.boundaryReply, focus: policy.resultFocus, nextActionIds: [] };
    return {
        matched: true,
        message: policy.matchedReply,
        focus: policy.resultFocus,
        nextActionIds: policy.allowedActionIds,
        trace: { id: `TRACE-M04-${role.toUpperCase()}-${now}`, agentId, consumedSources: traceSources[role] },
    };
}

export const workspaceActionLabels: Record<WorkspaceConversationActionId, string> = {
    'confirm-result': '确认 AI 结果',
    'submit-feedback': '反馈结果问题',
    'create-task': '创建修复任务',
    'create-acceptance-task': '创建验收任务',
    'open-m11': '进入 M11 测试',
    'open-m12': '进入 M12 建单',
    'approve-change': '批准受控灰度',
    'reject-change': '驳回并要求补充',
    'view-evidence': '查看证据',
};

