import type { RoleId } from '../../types';
import type { ProjectRecord } from '../delivery-management/delivery-types';
import { workspaceConversationScenarios } from './workspace-conversation-policy';

export type WorkspaceBindingKind = 'knowledge' | 'data' | 'content';
export type WorkspaceNavigateAction =
    | 'new-chat'
    | 'open-project'
    | 'open-evidence'
    | 'open-result-feedback'
    | 'open-repair-task';
export type WorkspaceActionId =
    | 'new-chat'
    | 'switch-thread'
    | 'switch-project'
    | 'send-message'
    | 'pick-agent'
    | 'pick-capability'
    | 'attach-file'
    | 'share-chat'
    | 'conversation-more'
    | 'view-evidence'
    | 'feedback-result'
    | 'create-repair-task'
    | 'view-project'
    | 'view-agent'
    | 'view-source'
    | 'view-plan'
    | 'global-search'
    | 'help'
    | 'notifications';

export interface WorkspaceRoleProfile {
    role: RoleId;
    identity: string;
    organization: string;
    jobTitle: string;
    dataScope: string;
    projectId?: string;
    defaultAgentId?: string;
    defaultQuestion?: string;
    answer: string;
    duty: string;
    permissionSummary: string;
    canCreateTask: boolean;
    canShare: boolean;
    destination?: 'client-portal';
}

export interface WorkspaceProject {
    id: string;
    name: string;
    goal: string;
    owner: string;
    period: string;
    stage: string;
    status: string;
    progress: number;
    milestoneSummary: string;
    taskCount: number;
    agentCount: number;
    memberCount: number;
    deliveryId: string;
}

export interface WorkspaceThread {
    id: string;
    projectId: string;
    title: string;
    agentId: string;
    updatedAt: string;
    summary: string;
    visibleRoles?: RoleId[];
    userPrompt?: string;
    traceId?: string;
}

export interface WorkspaceAgent {
    id: string;
    name: string;
    version: string;
    owner: string;
    status: string;
    capabilities: string[];
    permission: string;
}

export interface WorkspaceAgentRuntimeConfig {
    agentId: string;
    prompt: { id: string; name: string; version: string; status: string };
    model: { id: string; version: string; status: string };
    skills: string[];
    tools: string[];
}

export interface WorkspaceIncident {
    id: string;
    severity: string;
    status: string;
    owner: string;
    sla: string;
    trigger: string;
}

export interface WorkspaceRuntimeTrace {
    id: string;
    threadId: string;
    agentId: string;
    consumedSources: Array<{ bindingId: string; operation: string; result: string }>;
    incident?: WorkspaceIncident;
}

export interface WorkspaceBinding {
    kind: WorkspaceBindingKind;
    id: string;
    name: string;
    version: string;
    status: string;
    purpose: string;
    consumerAgentIds: string[];
    access: string;
    evidence: string;
}

export interface WorkspaceProjectRecord {
    id: string;
    title: string;
    meta: string;
    status: string;
    targetModuleId?: string;
    targetView?: string;
}

export interface WorkspaceNotice {
    id: string;
    title: string;
    summary: string;
    timestamp: string;
    threadId: string;
    projectId: string;
    action: Exclude<WorkspaceNavigateAction, 'new-chat' | 'open-repair-task'>;
    actionLabel: string;
}

export const M04_REQUIRED_ACTIONS: WorkspaceActionId[] = [
    'new-chat', 'switch-thread', 'switch-project', 'send-message', 'pick-agent',
    'pick-capability', 'attach-file', 'share-chat', 'conversation-more',
    'view-evidence', 'feedback-result', 'create-repair-task', 'view-project',
    'view-agent', 'view-source', 'view-plan', 'global-search',
    'help', 'notifications',
];

export const workspaceRoleProfiles: Record<RoleId, WorkspaceRoleProfile> = {
    employee: {
        role: 'employee', identity: '陈屿 · 员工', organization: 'DNDC线索中心', jobTitle: '线索运营专员',
        dataScope: '项目成员范围', projectId: 'PJ-LEAD-Q3-02', defaultAgentId: 'AGENT-LEAD-03',
        defaultQuestion: '分析本周意向评分准确率下降原因，并给出是否创建修复任务的建议。',
        answer: '已在本人及项目授权范围内完成分析。你可以查看脱敏运行证据，并将结论转为任务或问题反馈。',
        duty: '业务样本复核、AI结果确认、问题反馈',
        permissionSummary: '可读取本人及参与项目、聚合指标、脱敏样本和授权知识；可创建本人任务与反馈。',
        canCreateTask: true, canShare: true,
    },
    business: {
        role: 'business', identity: '李沐 · 业务负责人', organization: 'DNDC线索中心', jobTitle: '线索中心经理',
        dataScope: '负责项目与部门', projectId: 'PJ-LEAD-Q3-02', defaultAgentId: 'AGENT-BIZ-08',
        defaultQuestion: '评估评分Agent恢复上线对转化率、人工复核量和SLA的影响。',
        answer: '已聚合业务效果投影、测试报告和风险窗口。你可以形成审批意见、调整灰度范围或创建业务验收任务。',
        duty: '业务目标、效果口径、灰度与验收审批',
        permissionSummary: '可读取本部门与业务域指标和项目；可审批业务风险和验收结果；不可直接修改Prompt、模型或执行生产发布。',
        canCreateTask: true, canShare: true,
    },
    trainer: {
        role: 'trainer', identity: '周芮 · AI 训练师', organization: 'AIMP能力运营组', jobTitle: 'AI训练师',
        dataScope: '能力维护范围', projectId: 'PJ-LEAD-Q3-02', defaultAgentId: 'AGENT-QUALITY-11',
        defaultQuestion: '结合失败样本、Prompt、知识和模型版本，定位评分偏差并生成候选修复方案。',
        answer: '已定位Prompt与知识版本不一致。你可以进入能力配置、创建实验并将候选版本提交M11组合测试。',
        duty: '质量诊断、能力修复、候选版本与测试',
        permissionSummary: '可读取授权运行样本和完整能力血缘；可编辑候选Prompt、知识与训练配置；不能直接部署生产。',
        canCreateTask: true, canShare: true,
    },
    admin: {
        role: 'admin', identity: '赵岑 · 平台管理员', organization: 'AIMP平台运营组', jobTitle: '平台运行管理员',
        dataScope: '平台运行范围', projectId: 'PJ-LEAD-OPS-01', defaultAgentId: 'AGENT-RUNTIME-06',
        defaultQuestion: '分析ALT-518告警、外部连接和运行实例，判断是否扩大降级范围。',
        answer: '生产保护已生效。你可以查看完整运行追踪、创建工单、调整授权范围内的运行策略并准备发布或回滚任务。',
        duty: '运行保护、异常处置、灰度发布与恢复',
        permissionSummary: '可读取生产运行、接口、告警和审计；可执行保护、发布与回滚；不能审批业务风险或修改CRM业务数据。',
        canCreateTask: true, canShare: true,
    },
    superadmin: {
        role: 'superadmin', identity: '顾川 · 超级管理员', organization: '平台治理委员会', jobTitle: '平台治理负责人',
        dataScope: '全租户审计范围', projectId: 'PJ-LEAD-OPS-01', defaultAgentId: 'AGENT-GOV-01',
        defaultQuestion: '评估本次模型路由变更的租户影响、数据风险和灾备要求。',
        answer: '已生成跨租户影响矩阵和治理证据。仅高风险变更进入你的审批队列，所有特权数据访问均记录理由和审计。',
        duty: '租户、权限、安全、伦理、灾备和重大变更治理',
        permissionSummary: '可读取平台元数据、治理指标与审计；可审批重大变更；业务明细仍受租户隔离和特权访问审批。',
        canCreateTask: true, canShare: true,
    },
    client: {
        role: 'client', identity: '王琳 · 客户管理员', organization: '品牌方A', jobTitle: '客户管理员',
        dataScope: '本租户交付范围', answer: '当前身份不使用内部工作空间。', duty: '查看本租户交付结果',
        permissionSummary: '当前原型不展示客户门户；客户管理员不读取内部项目、Agent和运行证据。',
        canCreateTask: false, canShare: false, destination: 'client-portal',
    },
};

export function toWorkspaceProject(project: ProjectRecord): WorkspaceProject {
    return {
        id: project.id,
        name: project.name,
        goal: project.goal,
        owner: project.owner,
        period: project.period,
        stage: project.stage,
        status: project.status,
        progress: project.progress,
        milestoneSummary: `${project.milestones.filter((item) => item.status === '已完成').length}/${project.milestones.length}`,
        taskCount: project.taskCount,
        agentCount: project.bindings.filter((item) => item.kind === 'Agent').length,
        memberCount: project.members.length,
        deliveryId: project.contractId || '内部立项',
    };
}

export const workspaceThreads: WorkspaceThread[] = workspaceConversationScenarios.map((scenario) => ({
    id: scenario.id,
    projectId: scenario.projectId,
    title: scenario.title,
    agentId: scenario.agentId,
    updatedAt: scenario.updatedAt,
    summary: scenario.factSummary,
    visibleRoles: scenario.visibleRoles,
    userPrompt: scenario.userPrompt,
    traceId: scenario.traceId,
}));

export const workspaceAgents: WorkspaceAgent[] = [
    { id: 'AGENT-LEAD-03', name: '线索分析 Agent', version: 'v3.7', owner: 'AI能力运营组', status: '在线', capabilities: ['数据分析', '质量诊断'], permission: '项目数据只读' },
    { id: 'AGENT-BIZ-08', name: '业务决策 Agent', version: 'v2.4', owner: '线索中心CFT', status: '在线', capabilities: ['指标解释', '业务影响'], permission: '业务域只读' },
    { id: 'AGENT-QUALITY-11', name: '质量诊断 Agent', version: 'v1.8', owner: 'AI能力运营组', status: '在线', capabilities: ['样本整理', '能力诊断'], permission: '可创建修复草稿' },
    { id: 'AGENT-RUNTIME-06', name: '运行诊断 Agent', version: 'v4.1', owner: '平台运营组', status: '在线', capabilities: ['告警诊断', '发布保护'], permission: '生产运行只读' },
    { id: 'AGENT-GOV-01', name: '治理审计 Agent', version: 'v2.0', owner: '平台治理委员会', status: '在线', capabilities: ['租户影响', '治理审计'], permission: '受审计读取' },
];

export const workspaceRoleAgentIds: Record<RoleId, string[]> = {
    employee: ['AGENT-LEAD-03', 'AGENT-BIZ-08', 'AGENT-QUALITY-11'],
    business: ['AGENT-BIZ-08', 'AGENT-LEAD-03'],
    trainer: ['AGENT-QUALITY-11', 'AGENT-LEAD-03', 'AGENT-BIZ-08'],
    admin: ['AGENT-RUNTIME-06', 'AGENT-LEAD-03'],
    superadmin: workspaceAgents.map((agent) => agent.id),
    client: [],
};

export const workspaceAgentRuntimeConfigs: Record<string, WorkspaceAgentRuntimeConfig> = {
    'AGENT-LEAD-03': {
        agentId: 'AGENT-LEAD-03',
        prompt: { id: 'PROMPT-LEAD-12', name: '线索意向评分判定模板', version: 'v12', status: '生效中' },
        model: { id: 'MODEL-SCORE-05', version: 'score-v5', status: '生产' },
        skills: ['车型知识检索', '质量诊断'],
        tools: ['版本差异对比'],
    },
    'AGENT-BIZ-08': {
        agentId: 'AGENT-BIZ-08',
        prompt: { id: 'PROMPT-BIZ-07', name: '业务影响解释模板', version: 'v7', status: '生效中' },
        model: { id: 'MODEL-IMPACT-03', version: 'impact-v3', status: '生产' },
        skills: ['指标解释'],
        tools: ['效果投影'],
    },
    'AGENT-QUALITY-11': {
        agentId: 'AGENT-QUALITY-11',
        prompt: { id: 'PROMPT-QA-09', name: '失败样本诊断模板', version: 'v9', status: '生效中' },
        model: { id: 'MODEL-QA-04', version: 'qa-v4', status: '生产' },
        skills: ['样本聚类', '能力诊断'],
        tools: ['版本对比'],
    },
    'AGENT-RUNTIME-06': {
        agentId: 'AGENT-RUNTIME-06',
        prompt: { id: 'PROMPT-RUNTIME-15', name: '运行异常诊断模板', version: 'v15', status: '生效中' },
        model: { id: 'MODEL-RUNTIME-02', version: 'runtime-v2', status: '生产' },
        skills: ['告警诊断'],
        tools: ['运行追踪', '发布保护'],
    },
    'AGENT-GOV-01': {
        agentId: 'AGENT-GOV-01',
        prompt: { id: 'PROMPT-GOV-04', name: '治理影响审计模板', version: 'v4', status: '生效中' },
        model: { id: 'MODEL-GOV-01', version: 'gov-v1', status: '生产' },
        skills: ['租户影响分析'],
        tools: ['审计检索'],
    },
};

export const workspaceRuntimeTraces: WorkspaceRuntimeTrace[] = [
    {
        id: 'trace-9ab8-73c',
        threadId: 'CHAT-3088',
        agentId: 'AGENT-LEAD-03',
        consumedSources: [
            { bindingId: 'KB-LEAD-001', operation: '检索车型标签与判定规则', result: '命中18条授权知识' },
            { bindingId: 'DS-CRM-PROJECTION', operation: '读取近7天脱敏评分样本', result: '读取126条脱敏样本' },
        ],
    },
    {
        id: 'trace-biz-3072',
        threadId: 'CHAT-3072',
        agentId: 'AGENT-BIZ-08',
        consumedSources: [
            { bindingId: 'DS-CRM-PROJECTION', operation: '读取近7天聚合质量指标', result: '生成业务影响投影' },
            { bindingId: 'CONTENT-PACK-018', operation: '读取已审核摘要模板', result: '生成项目进展摘要' },
        ],
    },
    {
        id: 'trace-quality-3051',
        threadId: 'CHAT-3051',
        agentId: 'AGENT-QUALITY-11',
        consumedSources: [
            { bindingId: 'DS-CRM-PROJECTION', operation: '读取脱敏低置信样本', result: '整理126条异常样本' },
            { bindingId: 'KB-LEAD-001', operation: '核对车型标签判定规则', result: '识别版本不一致' },
        ],
    },
    {
        id: 'trace-ops-518',
        threadId: 'CHAT-4012',
        agentId: 'AGENT-RUNTIME-06',
        consumedSources: [
            { bindingId: 'DS-CRM-PROJECTION', operation: '读取运行告警指标', result: '读取聚合告警窗口' },
        ],
        incident: {
            id: 'INC-2031',
            severity: 'P1',
            status: '处理中',
            owner: '周芮 · AI训练师',
            sla: '剩余1小时42分',
            trigger: 'ALT-518连续触发且生产保护已生效',
        },
    },
    {
        id: 'trace-gov-5010',
        threadId: 'CHAT-5010',
        agentId: 'AGENT-GOV-01',
        consumedSources: [
            { bindingId: 'AUDIT-CHANGE-LOG', operation: '核对租户影响、特权访问与灾备记录', result: '重大变更证据完整' },
            { bindingId: 'DS-RUNTIME-METRICS', operation: '读取路由变更与灾备恢复指标', result: '满足受控灰度门槛' },
        ],
    },
];

export const workspaceBindings: WorkspaceBinding[] = [
    { kind: 'knowledge', id: 'KB-LEAD-001', name: '车型与线索判定知识库', version: '2026.08', status: '已发布', purpose: '车型标签、配置、政策与线索判定规则', consumerAgentIds: ['AGENT-LEAD-03', 'AGENT-QUALITY-11'], access: '项目成员检索与只读引用', evidence: '本周引用1,284次 · 最近命中10分钟前' },
    { kind: 'data', id: 'DS-CRM-PROJECTION', name: 'CRM脱敏线索事件投影', version: 'schema-2.1', status: '健康', purpose: '聚合质量指标、脱敏评分特征与异常样本', consumerAgentIds: ['AGENT-LEAD-03', 'AGENT-BIZ-08'], access: '项目字段级脱敏只读', evidence: '最近同步4分钟前 · 本次读取126条样本' },
    { kind: 'content', id: 'CONTENT-PACK-018', name: '车型Z售前内容资产包', version: 'v5.0', status: '内容中心已审核', purpose: '车型卖点、活动信息、合规话术与摘要模板', consumerAgentIds: ['AGENT-LEAD-03', 'AGENT-BIZ-08'], access: '项目内预览、引用与反馈', evidence: '近7天36次运行引用 · 有效期至2026-08-31' },
    { kind: 'data', id: 'DS-RUNTIME-METRICS', name: '生产运行与告警指标', version: 'schema-3.4', status: '健康', purpose: '运行实例、告警窗口、灰度流量与恢复指标', consumerAgentIds: ['AGENT-RUNTIME-06', 'AGENT-GOV-01'], access: '平台运行范围只读', evidence: '最近同步1分钟前 · 告警窗口持续采集' },
    { kind: 'data', id: 'AUDIT-CHANGE-LOG', name: '重大变更审计记录', version: 'audit-2.6', status: '受审计', purpose: '租户影响、特权访问、审批与灾备证据', consumerAgentIds: ['AGENT-GOV-01'], access: '治理角色受审计读取', evidence: '访问理由与审批链完整记录' },
];

export const workspaceMilestones: WorkspaceProjectRecord[] = [
    { id: 'MS-01', title: '完成Agent基线评估', meta: '7月15日完成 · 准确率90.2%', status: '已完成' },
    { id: 'MS-02', title: '修复新车型标签偏差', meta: '目标8月8日 · 当前完成62%', status: '进行中' },
    { id: 'MS-03', title: '华东区域10%灰度', meta: '计划8月12日 · 依赖TR-991与REL-406', status: '待开始' },
    { id: 'MS-04', title: '项目效果验收', meta: '计划9月25日 · 业务负责人验收', status: '未开始' },
];

export const workspaceTasks: WorkspaceProjectRecord[] = [
    { id: 'TK-1052', title: '修复新车型标签偏差', meta: 'AI训练师队列 · P1 · 今天18:00', status: '进行中', targetModuleId: 'task-center', targetView: 'pool' },
    { id: 'TK-1048', title: '确认AI分析结果', meta: '负责人：陈屿（我） · 今天16:00', status: '待确认', targetModuleId: 'task-center', targetView: 'mine' },
    { id: 'TK-1039', title: '整理异常样本', meta: '质量助手 + 陈屿 · 8月6日', status: '待处理', targetModuleId: 'task-center', targetView: 'mine' },
];

export const workspaceNotices: WorkspaceNotice[] = [
    { id: 'NTF-1048', title: 'AI 分析结果等待确认', summary: 'TK-1048 关联的运行结论已生成，请核对本次 Trace 的授权来源与版本。', timestamp: '今天 15:02', threadId: 'CHAT-3088', projectId: 'PJ-LEAD-Q3-02', action: 'open-evidence', actionLabel: '查看执行证据' },
    { id: 'NTF-2031', title: '异常处置已受理', summary: 'INC-2031 已进入平台保护处置，当前项目的质量优化计划需要同步核对。', timestamp: '今天 14:26', threadId: 'CHAT-4012', projectId: 'PJ-LEAD-OPS-01', action: 'open-project', actionLabel: '查看项目详情' },
    { id: 'NTF-3096', title: '请补充 AI 结果反馈', summary: '当前项目的质量样本需要补充结果问题分类，便于后续训练复核。', timestamp: '今天 13:48', threadId: 'CHAT-3088', projectId: 'PJ-LEAD-Q3-02', action: 'open-result-feedback', actionLabel: '反馈 AI 结果' },
];

export const workspaceMembers: WorkspaceProjectRecord[] = [
    { id: 'USER-LEAD-01', title: '李沐 · 项目负责人', meta: '线索中心经理 · 业务决策与验收', status: '负责人' },
    { id: 'USER-LEAD-02', title: '陈屿 · 项目成员', meta: '线索运营专员 · 样本复核与结果确认', status: '我' },
    { id: 'USER-AI-07', title: '周芮 · AI能力负责人', meta: 'AI训练师 · 质量诊断与修复', status: '协作' },
    { id: 'USER-OPS-03', title: '赵岑 · 平台运行负责人', meta: '平台管理员 · 生产保护与发布', status: '协作' },
];

export const workspaceActivities: WorkspaceProjectRecord[] = [
    { id: 'ACT-904', title: '创建修复任务 TK-1052', meta: '陈屿 · 今天14:42 · 来源CHAT-3088', status: '任务' },
    { id: 'ACT-901', title: '生产保护策略生效', meta: '赵岑 · 今天14:26 · 关联INC-2031', status: '运行' },
    { id: 'ACT-896', title: '更新车型知识版本', meta: '周芮 · 昨天17:18 · M06知识库', status: '能力' },
    { id: 'ACT-882', title: '完成周度项目复盘', meta: '李沐 · 周一10:30 · 决策记录已归档', status: '复盘' },
];

export const workspacePlan = {
    id: 'PLAN-028', name: '每周一生成质量周报', schedule: '每周一 09:00',
    nextRun: '2026-08-10 09:00', agentId: 'AGENT-BIZ-08', scope: '上周聚合质量指标', status: '已启用',
};
