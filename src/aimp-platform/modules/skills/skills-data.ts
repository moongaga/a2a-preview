export type SkillType = '原子' | '组合';
export type SkillLifecycle = '草稿' | '测试中' | '待审核' | '已发布' | '已停用' | '已归档';
export type SkillHealth = '正常' | '波动' | '故障' | '维护中';
export type SkillRisk = '低' | '中' | '高';

export type SkillInstruction = { objective: string; instruction: string; scenarios: string; boundaries: string; forbidden: string };
export type SkillContractParameter = { id: string; name: string; type: 'string' | 'number' | 'boolean' | 'object' | 'array'; required: boolean; example: string; description: string };
export type SkillContract = { inputs: SkillContractParameter[]; outputSchema: string; errorCodes: string; exampleInput: string; exampleOutput: string; idempotency: string };
export type SkillExecutionPolicy = { mode: '顺序' | '并行'; timeoutMs: number; retries: number; concurrency: number; fallback: string; humanIntervention: string; mergeStrategy: string };
export type SkillDependency = { id: string; type: 'Prompt' | '知识策略' | 'Tool' | '原子 Skill' | '组合 Skill' | 'Agent' | '工作流' | '部门' | '岗位' | '角色'; name: string; version?: string; status: string; scope: string };
export type SkillVersion = { version: string; status: '草稿' | '待审核' | '已发布' | '历史版本' | '已归档'; author: string; time: string; change: string; dependencySnapshot: string };
export type SkillTestCase = { id: string; name: string; category: '正常' | '边界' | '异常' | '安全' | '组合'; input: string; expected: string; status: '草稿' | '已通过' | '失败' };
export type SkillTestRun = { id: string; time: string; result: '通过' | '失败'; score: number; latency: string; traceId: string; input: string; output: string; dependencyHits: string[]; retries: number; fallback: string; error?: string };
export type SkillAuditEvent = { id: string; time: string; actor: string; action: string; evidence: string };

export type SkillRecord = {
  id: string; name: string; description: string; type: SkillType; owner: string; department: string; purpose: string; risk: SkillRisk;
  lifecycle: SkillLifecycle; health: SkillHealth; currentVersion: string; successRate: number; testPassRate: number; averageLatency: string;
  instruction: SkillInstruction; contract: SkillContract; policy: SkillExecutionPolicy; dependencies: SkillDependency[]; versions: SkillVersion[];
  testCases: SkillTestCase[]; tests: SkillTestRun[]; audit: SkillAuditEvent[]; lastTestPassed: boolean;
};

const inputParameters: SkillContractParameter[] = [
  { id: 'IN-01', name: 'context', type: 'object', required: true, example: '{"project_id":"PJ-LEAD-01"}', description: '经权限过滤的业务上下文' },
  { id: 'IN-02', name: 'request', type: 'string', required: true, example: '分析评分偏差并给出证据', description: '当前能力请求' },
];
const contract = (): SkillContract => ({ inputs: inputParameters.map(item => ({ ...item })), outputSchema: '{\n  "type": "object",\n  "required": ["result", "evidence", "next_action"]\n}', errorCodes: 'SKILL-400 输入不合法 · SKILL-403 越权 · SKILL-424 依赖失败 · SKILL-504 超时', exampleInput: '{"context":{"project_id":"PJ-LEAD-01"},"request":"分析偏差"}', exampleOutput: '{"result":"存在评分偏差","evidence":["TRACE-8821"],"next_action":"创建修复任务"}', idempotency: '同一 request_id 在 30 分钟内返回同一执行结果' });
const instruction = (objective: string): SkillInstruction => ({ objective, instruction: `基于已授权上下文执行“${objective}”，输出结构化结论、证据和下一步，不得输出客户原始敏感信息。`, scenarios: 'Agent 对话、工作流节点、异常诊断与人工复核', boundaries: '仅使用已发布依赖；超出项目和租户范围时拒绝执行', forbidden: '不得绕过 Tool 权限、不得改变源业务系统、不得自行发布资产' });
const policy = (mode: '顺序' | '并行' = '顺序'): SkillExecutionPolicy => ({ mode, timeoutMs: 30000, retries: 2, concurrency: mode === '并行' ? 3 : 1, fallback: '返回已有证据并创建人工复核任务', humanIntervention: '评分低于 80 或依赖失败时转 AI训练师', mergeStrategy: mode === '并行' ? '按置信度加权合并并保留冲突项' : '以后一步输出作为下一步输入' });
const tests = (prefix: string): SkillTestRun[] => [{ id: `${prefix}-RUN-128`, time: '今天 10:15', result: '通过', score: 94, latency: '1.2s', traceId: `TRACE-${prefix}-128`, input: '{"context":{"project_id":"PJ-LEAD-01"},"request":"运行标准样例"}', output: '{"result":"通过","evidence":["KB-LEAD-001"],"next_action":"继续"}', dependencyHits: ['PROMPT-LEAD-12 v2.3', 'KB-LEAD-001 2026.08', 'TOOL-TRACE-01 v1.8.0'], retries: 0, fallback: '未触发' }];
const cases = (prefix: string): SkillTestCase[] => [
  { id: `${prefix}-CASE-01`, name: '标准业务输入', category: '正常', input: '{"context":{"project_id":"PJ-LEAD-01"},"request":"执行标准能力"}', expected: '返回 result、evidence 和 next_action', status: '已通过' },
  { id: `${prefix}-CASE-02`, name: '缺少权限上下文', category: '安全', input: '{"request":"读取其他租户数据"}', expected: '返回 SKILL-403 且不泄露对象信息', status: '已通过' },
];
const version = (value: string, author: string, deps: string): SkillVersion => ({ version: value, status: '已发布', author, time: '2026-08-08 10:20', change: '完成契约、依赖、测试与权限门禁审核', dependencySnapshot: deps });
const audit = (prefix: string): SkillAuditEvent[] => [{ id: `AUD-${prefix}-01`, time: '2026-08-08 10:20', actor: '赵岑', action: '发布生产版本', evidence: `REL-${prefix}-01 · M11 Skill 测试通过` }];

export const skillRecords: SkillRecord[] = [
  { id: 'SKILL-LEAD-DIAG-01', name: '线索评分偏差诊断', description: '定位线索评分偏差并输出可核验的证据、根因与修复建议', type: '原子', owner: '周芮', department: '线索事业部', purpose: '线索 Agent 质量诊断与异常修复', risk: '中', lifecycle: '已发布', health: '正常', currentVersion: 'v2.4.0', successRate: 96.2, testPassRate: 100, averageLatency: '1.2s', instruction: instruction('线索评分偏差诊断'), contract: contract(), policy: policy(), dependencies: [
    { id: 'PROMPT-LEAD-12', type: 'Prompt', name: '线索评分偏差诊断', version: 'v2.3', status: '已发布', scope: '生产指令' },
    { id: 'KB-LEAD-001', type: '知识策略', name: '线索判定与跟进规则', version: '2026.08', status: '已发布', scope: '只读检索' },
    { id: 'TOOL-TRACE-01', type: 'Tool', name: 'Trace 检索', version: 'v1.8.0', status: '正常', scope: '运行证据' },
    { id: 'AGENT-LEAD-03', type: 'Agent', name: '线索诊断 Agent', version: 'v3.2.1', status: '运行中', scope: '生产依赖' },
  ], versions: [version('v2.4.0', '赵岑', 'Prompt v2.3 · KB 2026.08 · Trace v1.8.0'), { version: 'v2.3.0', status: '历史版本', author: '周芮', time: '2026-07-18 09:20', change: '增加评分轨迹证据', dependencySnapshot: 'Prompt v2.2 · KB 2026.07' }], testCases: cases('LEAD'), tests: tests('LEAD'), audit: audit('LEAD'), lastTestPassed: true },
  { id: 'SKILL-KNOWLEDGE-QA-01', name: '知识检索与证据回答', description: '依据知识策略检索、重排并输出带来源的回答', type: '原子', owner: '周芮', department: 'AIMP能力运营组', purpose: '为多类 Agent 提供统一 RAG 能力', risk: '低', lifecycle: '已发布', health: '正常', currentVersion: 'v1.9.0', successRate: 97.4, testPassRate: 98, averageLatency: '980ms', instruction: instruction('知识检索与证据回答'), contract: contract(), policy: policy(), dependencies: [
    { id: 'PROMPT-RAG-08', type: 'Prompt', name: '证据回答模板', version: 'v1.8', status: '已发布', scope: '生产指令' },
    { id: 'KB-GOV-006', type: '知识策略', name: '治理知识与法规', version: '2026.08', status: '已发布', scope: '混合检索' },
    { id: 'TOOL-TRACE-01', type: 'Tool', name: 'Trace 检索', version: 'v1.8.0', status: '正常', scope: '引用证据' },
  ], versions: [version('v1.9.0', '赵岑', 'Prompt v1.8 · KB 2026.08 · Trace v1.8.0')], testCases: cases('RAG'), tests: tests('RAG'), audit: audit('RAG'), lastTestPassed: true },
  { id: 'SKILL-LEAD-CLOSED-LOOP-01', name: '线索诊断闭环', description: '组合评分诊断、知识回答与异常反馈，形成可追踪处理闭环', type: '组合', owner: '周芮', department: '线索事业部', purpose: '线索 Agent 与工作流的复合诊断能力', risk: '高', lifecycle: '已发布', health: '正常', currentVersion: 'v1.3.0', successRate: 94.8, testPassRate: 96, averageLatency: '3.4s', instruction: instruction('线索诊断闭环'), contract: contract(), policy: policy('顺序'), dependencies: [
    { id: 'SKILL-LEAD-DIAG-01', type: '原子 Skill', name: '线索评分偏差诊断', version: 'v2.4.0', status: '已发布', scope: '步骤 1：诊断' },
    { id: 'SKILL-KNOWLEDGE-QA-01', type: '原子 Skill', name: '知识检索与证据回答', version: 'v1.9.0', status: '已发布', scope: '步骤 2：证据补充' },
    { id: 'WF-LEAD-01', type: '工作流', name: '线索转化提升工作流', version: 'v2.1', status: '运行中', scope: '诊断节点' },
  ], versions: [version('v1.3.0', '顾川', '诊断 Skill v2.4.0 · RAG Skill v1.9.0')], testCases: [...cases('CLOSE'), { id: 'CLOSE-CASE-03', name: '子 Skill 超时降级', category: '组合', input: '{"request":"模拟知识检索超时"}', expected: '保留诊断结果并转人工复核', status: '已通过' }], tests: tests('CLOSE'), audit: audit('CLOSE'), lastTestPassed: true },
  { id: 'SKILL-CONTENT-CHECK-01', name: '内容合规检查', description: '检查内容敏感项、品牌规范与渠道约束', type: '原子', owner: '韩莹', department: '内容事业部', purpose: '内容发布前合规门禁', risk: '高', lifecycle: '待审核', health: '波动', currentVersion: 'v1.2.0-RC', successRate: 91.5, testPassRate: 92, averageLatency: '1.8s', instruction: instruction('内容合规检查'), contract: contract(), policy: policy(), dependencies: [
    { id: 'PROMPT-CONTENT-07', type: 'Prompt', name: '内容合规归因', version: 'v1.4', status: '已发布', scope: '审核指令' },
    { id: 'TOOL-MCP-CONTENT-01', type: 'Tool', name: '内容资产 MCP', version: 'v1.2.0-RC', status: '波动', scope: '素材证据' },
  ], versions: [{ version: 'v1.2.0-RC', status: '待审核', author: '韩莹', time: '今天 09:42', change: '补充多平台规范检查', dependencySnapshot: 'Prompt v1.4 · 内容 MCP v1.2.0-RC' }], testCases: cases('CONTENT'), tests: [{ ...tests('CONTENT')[0], result: '失败', score: 76, error: '内容资产 MCP 未发布且健康波动' }], audit: [{ id: 'AUD-CONTENT-01', time: '今天 09:42', actor: '韩莹', action: '提交审核', evidence: '依赖健康门禁待复核' }], lastTestPassed: false },
  { id: 'SKILL-REPORT-DRAFT-01', name: '运营报告摘要', description: '汇总运行指标并生成运营摘要草稿', type: '原子', owner: '周芮', department: 'AIMP能力运营组', purpose: '运营日报与周报辅助', risk: '低', lifecycle: '草稿', health: '故障', currentVersion: 'v0.1.0', successRate: 0, testPassRate: 0, averageLatency: '—', instruction: instruction('运营报告摘要'), contract: contract(), policy: policy(), dependencies: [], versions: [{ version: 'v0.1.0', status: '草稿', author: '周芮', time: '刚刚', change: '创建 Skill 草稿', dependencySnapshot: '尚未装配依赖' }], testCases: [], tests: [], audit: [{ id: 'AUD-REPORT-01', time: '刚刚', actor: '周芮', action: '新建草稿', evidence: '等待指令、契约和依赖配置' }], lastTestPassed: false },
];

export const isHighRiskSkill = (skill: SkillRecord) => skill.risk === '高' || skill.type === '组合' || new Set(skill.dependencies.filter(item => ['Tool', '原子 Skill'].includes(item.type)).map(item => item.scope.split('：')[0])).size > 1;

export function createSkillDraft(type: SkillType, name: string): SkillRecord {
  const stamp = Date.now().toString().slice(-6);
  return { id: `SKILL-${stamp}`, name, description: '', type, owner: '周芮', department: 'AIMP能力运营组', purpose: '', risk: type === '组合' ? '高' : '中', lifecycle: '草稿', health: '故障', currentVersion: 'v0.1.0', successRate: 0, testPassRate: 0, averageLatency: '—', instruction: instruction('待配置能力目标'), contract: contract(), policy: policy(), dependencies: [], versions: [{ version: 'v0.1.0', status: '草稿', author: '周芮', time: '刚刚', change: '创建 Skill 草稿', dependencySnapshot: '尚未装配依赖' }], testCases: [], tests: [], audit: [{ id: `AUD-${stamp}`, time: '刚刚', actor: '周芮', action: '新建 Skill 草稿', evidence: '等待指令、契约、依赖和测试配置' }], lastTestPassed: false };
}
