import definitionsData from './module-view-definitions.json';
import modulesData from './modules.json';
import type { ModuleExperience, RelationContract, WorkspaceArchetype } from '../contracts/product-contract';

type Meta = {
    objectLabel: string;
    archetype: WorkspaceArchetype;
    summary: string;
    primaryAction: string;
};

const experienceMeta: Record<string, Meta> = {
    workspace: { objectLabel: '项目与协作会话', archetype: 'personal', summary: '围绕参与项目与授权上下文和 Agent 协作，不替代外部业务系统。', primaryAction: '发起 Agent 会话' },
    'task-center': { objectLabel: '任务', archetype: 'board', summary: '统一管理人类与 Agent 任务的状态、审批、接管和验收。', primaryAction: '创建任务' },
    agents: { objectLabel: 'Agent', archetype: 'catalog', summary: '管理 Agent 的注册、能力绑定、版本、实例与发布状态。', primaryAction: '注册 Agent' },
    orchestration: { objectLabel: '工作流', archetype: 'canvas', summary: '编排多 Agent、Tool、人工节点和异常恢复路径。', primaryAction: '新建工作流' },
    'dynamic-plan': { objectLabel: '动态计划', archetype: 'board', summary: '汇总目标、资源、任务和执行偏差，形成可控调整。', primaryAction: '创建计划' },
    skills: { objectLabel: 'Skill', archetype: 'editor', summary: '管理可复用技能的输入输出契约、版本与测试集。', primaryAction: '创建 Skill' },
    tools: { objectLabel: 'Tool', archetype: 'catalog', summary: '管理工具连接、授权、健康检查、调用与熔断。', primaryAction: '登记 Tool' },
    prompts: { objectLabel: 'Prompt', archetype: 'editor', summary: '管理 Prompt 模板、变量、评测、发布与回滚。', primaryAction: '创建 Prompt' },
    'knowledge-base': { objectLabel: '知识资产', archetype: 'editor', summary: '管理知识摄取、审核、发布、检索与引用证据。', primaryAction: '上传知识' },
    'ai-products': { objectLabel: 'AI 产品', archetype: 'catalog', summary: '把 Agent 与服务能力装配为可交付产品和套餐。', primaryAction: '创建 AI 产品' },
    delivery: { objectLabel: '交付项目', archetype: 'delivery', summary: '管理合同 SOW、租户开通、里程碑、验收和 SLA。', primaryAction: '新建交付项目' },
    'ai-org': { objectLabel: '数字组织', archetype: 'governance', summary: '管理组织单元、人类岗位、Agent 岗位与决策边界。', primaryAction: '配置组织版本' },
    'position-ai': { objectLabel: '岗位 AI 化机会', archetype: 'delivery', summary: '追踪岗位任务拆解、试点、培训、采用与人员影响。', primaryAction: '发起岗位评估' },
    admin: { objectLabel: '平台配置', archetype: 'governance', summary: '管理模型网关、路由、系统参数、计费和限流。', primaryAction: '新增接入配置' },
    permissions: { objectLabel: '权限策略', archetype: 'governance', summary: '管理角色、策略、账号、访问申请、冲突和定期复核。', primaryAction: '发起授权申请' },
    'client-portal': { objectLabel: '客户服务视图', archetype: 'delivery', summary: '客户仅查看本租户产品、交付、效果、SLA 与服务事项。', primaryAction: '提交服务事项' },
    'agent-testing': { objectLabel: '测试计划', archetype: 'data-lab', summary: '执行单元、集成、对抗测试并形成上线门禁。', primaryAction: '创建测试计划' },
    'ticket-system': { objectLabel: '异常工单', archetype: 'board', summary: '把运行异常转化为可分级、可诊断、可恢复的质量闭环。', primaryAction: '创建异常工单' },
    'mf-data-factory': { objectLabel: '训练数据集', archetype: 'data-lab', summary: '管理样本采集、脱敏、标注、质量、冻结与血缘。', primaryAction: '新建标注任务' },
    'mf-experiment': { objectLabel: '训练实验', archetype: 'data-lab', summary: '追踪实验参数、运行指标、基线比较与候选模型。', primaryAction: '发起实验' },
    'mf-model-registry': { objectLabel: '模型版本', archetype: 'catalog', summary: '管理模型血缘、安全评审、部署、灰度与回滚。', primaryAction: '注册模型' },
    'mf-feature-store': { objectLabel: '特征', archetype: 'data-lab', summary: '管理特征实体、计算逻辑、离在线同步与消费关系。', primaryAction: '注册特征' },
    'mf-model-monitor': { objectLabel: '模型监控项', archetype: 'monitor', summary: '观测漂移、性能衰减、影响范围与重训练处置。', primaryAction: '配置监控基线' },
    'mf-pipeline': { objectLabel: '数据管道', archetype: 'canvas', summary: '管理 DAG、调度、运行、重试和数据新鲜度。', primaryAction: '新建数据管道' },
    'data-methodology': { objectLabel: '数据方法', archetype: 'data-lab', summary: '把数据采集、治理、分析、应用和指标口径连成完整血缘。', primaryAction: '登记数据方法' },
    evolution: { objectLabel: '改进提案', archetype: 'board', summary: '把 Badcase、能力缺口和漏洞转化为可审批、可验证的改进。', primaryAction: '创建升级提案' },
    'mkt-agent-market': { objectLabel: 'Agent 商品', archetype: 'catalog', summary: '管理第三方 Agent 上架、安全审核、安装、评价与复审。', primaryAction: '提交上架申请' },
    'mkt-dr': { objectLabel: '灾备计划', archetype: 'monitor', summary: '管理关键链路、RPO/RTO、备用资源、演练和切换。', primaryAction: '发起灾备演练' },
    'mkt-ethics': { objectLabel: '伦理风险', archetype: 'governance', summary: '管理影响评估、解释证据、专家审查、整改和披露。', primaryAction: '登记伦理风险' },
    'mkt-tenant': { objectLabel: '租户', archetype: 'governance', summary: '管理租户隔离、资源配额、产品开通、续约和下线。', primaryAction: '创建租户' },
    analytics: { objectLabel: '效果指标', archetype: 'monitor', summary: '从各模块统计投影计算业务价值、Agent 效能、成本与 ROI。', primaryAction: '订阅指标' },
    security: { objectLabel: '安全风险', archetype: 'governance', summary: '管理资产、风险、控制、事件、整改和合规证据。', primaryAction: '发起风险评估' },
    knowledge: { objectLabel: '知识资产组合', archetype: 'catalog', summary: '汇聚知识库、工单和递归成长经验，管理图谱、权属和价值。', primaryAction: '创建资产组合' },
};

const definitions = definitionsData as Array<{
    moduleId: string;
    keyFields: string[];
    workflowSteps: string[];
    resultMetrics: string[];
    exceptionCases: string[];
}>;

const specialDefinitions: Record<string, Omit<(typeof definitions)[number], 'moduleId'>> = {
    'task-center': { keyFields: ['任务类型', '优先级', '指派对象', '截止时间', '验收标准'], workflowSteps: ['待审批', '待执行', '执行中', '待验收', '已完成'], resultMetrics: ['任务完成率', 'Agent自主执行率', '人工接管率'], exceptionCases: ['执行超时', '指派对象不可用', '验收不通过'] },
    agents: { keyFields: ['Agent名称', '能力层级', '负责人', '版本', '运行状态'], workflowSteps: ['注册草稿', '能力绑定', '测试门禁', '灰度发布', '在线运行'], resultMetrics: ['在线Agent数', '调用成功率', '自主完成率'], exceptionCases: ['测试门禁失败', '运行准确率下降', '伦理策略拦截'] },
    'knowledge-base': { keyFields: ['知识空间', '文档版本', '审核状态', '消费Agent', '访问级别'], workflowSteps: ['内容摄取', '解析分段', '质量审核', '发布索引', '检索引用'], resultMetrics: ['检索命中率', '引用完整率', '过期资产数'], exceptionCases: ['解析失败', '知识冲突', '引用证据缺失'] },
};

const allDefinitions = (modulesData as Array<{ id: string }>).map((module) => {
    const definition = definitions.find((item) => item.moduleId === module.id);
    const special = specialDefinitions[module.id];
    if (!definition && !special) throw new Error(`缺少模块业务定义：${module.id}`);
    return definition || { moduleId: module.id, ...special };
});

const moduleIds = new Set((modulesData as Array<{ id: string }>).map((item) => item.id));

const writeTargetByModule: Record<string, string> = {
    workspace: 'task-center', 'task-center': 'agents', agents: 'agent-testing', orchestration: 'task-center', 'dynamic-plan': 'task-center', skills: 'agent-testing', tools: 'ticket-system', prompts: 'agent-testing', 'knowledge-base': 'knowledge', 'ai-products': 'delivery', delivery: 'workspace', 'ai-org': 'permissions', 'position-ai': 'analytics', admin: 'security', permissions: 'security', 'client-portal': 'ticket-system', 'agent-testing': 'agents', 'ticket-system': 'task-center', 'mf-data-factory': 'mf-experiment', 'mf-experiment': 'mf-model-registry', 'mf-model-registry': 'agents', 'mf-feature-store': 'ticket-system', 'mf-model-monitor': 'ticket-system', 'mf-pipeline': 'ticket-system', 'data-methodology': 'mf-data-factory', evolution: 'task-center', 'mkt-agent-market': 'agents', 'mkt-dr': 'ticket-system', 'mkt-ethics': 'ticket-system', 'mkt-tenant': 'client-portal', analytics: 'evolution', security: 'ticket-system', knowledge: 'analytics',
};

const relationFor = (moduleId: string): RelationContract[] => {
    const module = (modulesData as Array<{ id: string; dependencies: string[] }>).find((item) => item.id === moduleId);
    const writeTarget = writeTargetByModule[moduleId];
    const targets = [writeTarget, ...(module?.dependencies || [])].filter((id, index, items): id is string => Boolean(id) && moduleIds.has(id) && items.indexOf(id) === index);
    return targets.map((targetModuleId) => ({
        label: targetModuleId === writeTarget ? '主要业务写回' : '关联能力',
        targetModuleId,
        direction: targetModuleId === writeTarget ? 'writes' : 'reads',
    }));
};

export const moduleExperiences: ModuleExperience[] = allDefinitions.map((definition) => {
    const meta = experienceMeta[definition.moduleId];
    if (!meta) throw new Error(`缺少模块体验定义：${definition.moduleId}`);
    const relations = relationFor(definition.moduleId);
    return {
        moduleId: definition.moduleId,
        ...meta,
        keyFields: definition.keyFields,
        workflowSteps: definition.workflowSteps,
        resultMetrics: definition.resultMetrics,
        exceptionCases: definition.exceptionCases,
        actions: [
            {
                id: 'primary',
                label: meta.primaryAction,
                kind: 'dialog',
                requiredAction: 'create',
                fields: [
                    { id: 'type', label: '类型', kind: 'select', required: true, options: definition.workflowSteps.slice(0, 4) },
                    { id: 'owner', label: '责任人', kind: 'select', required: true, options: ['当前用户', '模块负责人', '所属项目负责人'] },
                    { id: 'description', label: '说明', kind: 'textarea', required: true },
                ],
            },
            ...(relations[0] ? [{ id: 'relation', label: `查看${relations[0].label}`, kind: 'navigate' as const, requiredAction: 'read', targetModuleId: relations[0].targetModuleId }] : []),
            { id: 'export', label: '导出当前视图', kind: 'download', requiredAction: 'read' },
        ],
        relations,
        levels: ['L0', 'L1', 'L2', 'L3', 'L4'],
    };
});

export const getModuleExperience = (moduleId: string) =>
    moduleExperiences.find((item) => item.moduleId === moduleId);
