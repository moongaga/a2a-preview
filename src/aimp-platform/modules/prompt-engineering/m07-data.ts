export type PromptVersion = {
    version: string;
    status: '已发布' | '草稿' | '历史版本';
    author: string;
    time: string;
    change: string;
    body: string;
    score: number;
    latency: string;
    knowledgeHits: number;
};

export type PromptRecord = {
    id: string;
    name: string;
    agent: string;
    currentVersion: string;
    score: number | null;
    grade: string;
    status: '已发布' | '草稿' | '待审核';
    body: string;
    variables: string[];
    knowledgeId: string;
    knowledgeName: string;
    knowledgeScope: string;
    versions: PromptVersion[];
};

export const agents = ['线索诊断 Agent', '质量诊断 Agent', '线索清洗 Agent', '内容生成 Agent'];

export const knowledgeStrategies = [
    { id: 'KB-LEAD-001', name: '线索判定与跟进规则', scope: '仅注入线索评分、车型标签与分级规则片段' },
    { id: 'KB-GOV-006', name: '数据访问与脱敏规范', scope: '仅注入脱敏字段与输出边界规则' },
    { id: 'KB-QUALITY-011', name: '质量诊断处理手册', scope: '仅注入异常归因与人工复核标准' },
];

export const promptRecords: PromptRecord[] = [
    {
        id: 'PROMPT-LEAD-12', name: '线索评分偏差诊断', agent: '线索诊断 Agent', currentVersion: 'v2.3', score: 96, grade: 'A+', status: '已发布',
        body: '你是线索诊断 Agent。基于 {{lead_summary}}、{{score_trace}} 和检索知识，定位评分偏差，输出可核验的证据、归因和修复建议。不得输出客户原始敏感信息。',
        variables: ['lead_summary', 'score_trace'], knowledgeId: 'KB-LEAD-001', knowledgeName: '线索判定与跟进规则', knowledgeScope: '项目成员检索；仅注入授权规则片段',
        versions: [
            { version: 'v2.3', status: '已发布', author: '周芮', time: '2026-08-06 10:20', change: '补充评分追溯字段与敏感信息边界', body: '你是线索诊断 Agent。基于 {{lead_summary}}、{{score_trace}} 和检索知识，定位评分偏差，输出可核验的证据、归因和修复建议。不得输出客户原始敏感信息。', score: 96, latency: '1.4s', knowledgeHits: 3 },
            { version: 'v2.2', status: '历史版本', author: '周芮', time: '2026-07-30 16:40', change: '增加知识策略与结构化证据输出', body: '基于 {{lead_summary}} 与检索知识定位评分偏差，并输出证据和建议。', score: 92, latency: '1.2s', knowledgeHits: 2 },
            { version: 'v2.1', status: '历史版本', author: '陈屿', time: '2026-07-18 09:30', change: '建立线索评分初始诊断模板', body: '分析 {{lead_summary}} 的评分异常，给出结论。', score: 85, latency: '1.1s', knowledgeHits: 0 },
        ],
    },
    {
        id: 'PROMPT-QUALITY-07', name: '质量异常归因', agent: '质量诊断 Agent', currentVersion: 'v1.4', score: 93, grade: 'A', status: '待审核',
        body: '你是质量诊断 Agent。基于 {{run_trace}}、{{badcase_summary}} 和知识策略，输出可复现的异常归因、影响范围与修复优先级。',
        variables: ['run_trace', 'badcase_summary'], knowledgeId: 'KB-QUALITY-011', knowledgeName: '质量诊断处理手册', knowledgeScope: '质量运营组只读检索；引用需保留证据 ID',
        versions: [
            { version: 'v1.4', status: '草稿', author: '周芮', time: '2026-08-06 09:45', change: '待审核：增加影响范围判定', body: '你是质量诊断 Agent。基于 {{run_trace}}、{{badcase_summary}} 和知识策略，输出可复现的异常归因、影响范围与修复优先级。', score: 93, latency: '1.8s', knowledgeHits: 3 },
            { version: 'v1.3', status: '已发布', author: '赵岑', time: '2026-07-29 14:12', change: '发布质量异常归因基线', body: '基于 {{run_trace}} 与知识策略，输出异常归因和修复建议。', score: 89, latency: '1.6s', knowledgeHits: 2 },
        ],
    },
    {
        id: 'PROMPT-CLEAN-03', name: '线索清洗规则', agent: '线索清洗 Agent', currentVersion: 'v1.5', score: 91, grade: 'A', status: '已发布',
        body: '依据 {{lead_event}}、{{source_meta}} 和授权规则，输出清洗结果、命中规则及需人工复核字段。',
        variables: ['lead_event', 'source_meta'], knowledgeId: 'KB-GOV-006', knowledgeName: '数据访问与脱敏规范', knowledgeScope: '仅限字段级脱敏规则与来源质量阈值',
        versions: [{ version: 'v1.5', status: '已发布', author: '周芮', time: '2026-08-02 11:20', change: '更新来源质量阈值', body: '依据 {{lead_event}}、{{source_meta}} 和授权规则，输出清洗结果、命中规则及需人工复核字段。', score: 91, latency: '1.0s', knowledgeHits: 2 }],
    },
];
