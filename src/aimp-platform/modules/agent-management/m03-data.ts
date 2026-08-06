export type AgentStatus = '草稿' | '测试中' | '已发布' | '运行中' | '已挂起' | '已归档';
export type PromptBinding = { id: string; name: string; version: string; state: '生产' | '预发布' | '归档'; note: string };
export type KnowledgeBinding = { id: string; name: string; count: number; bound: boolean };
export type Automation = { id: string; name: string; schedule: string; detail: string; running: boolean };
export type AgentRecord = {
  id: string; name: string; description: string; version: string; level: string; creator: string;
  accuracy: number; calls: number; latency: string; status: AgentStatus; model: string;
  prompts: PromptBinding[]; knowledge: KnowledgeBinding[]; skills: string[]; tools: string[];
  positions: { name: string; scope: string; state: '默认启用' | '可选启用' | '未开放' }[];
  automations: Automation[]; rag: { topK: string; threshold: string; weight: string };
  risk: string; trace: string; audit: string[];
};

export const promptOptions = [
  { id: 'PROMPT-LEAD-12', name: '线索评分偏差诊断', version: 'v2.3' },
  { id: 'PROMPT-QUALITY-07', name: '质量异常归因', version: 'v1.4' },
  { id: 'PROMPT-CLEAN-03', name: '线索清洗与去重', version: 'v1.5' },
];
export const skillOptions = ['多轮对话管理', '意图识别', '情绪感知', '评分诊断', '证据归因', '异常路由'];
export const toolOptions = ['企业消息推送', '短信/5G消息通道', 'CDP用户数据平台', 'CRM 脱敏查询', '指标服务', 'Trace 检索'];
export const knowledgeCatalog: KnowledgeBinding[] = [
  { id: 'KB-CAR-001', name: '车型知识库', count: 420, bound: true },
  { id: 'KB-TALK-002', name: '客服话术库', count: 310, bound: true },
  { id: 'KB-FAULT-003', name: '故障诊断库', count: 1872, bound: true },
  { id: 'KB-POLICY-004', name: '政策法规库', count: 128, bound: false },
];
const basePositions: AgentRecord['positions'] = [
  { name: '客服坐席', scope: '客服事业部 · 18人', state: '默认启用' },
  { name: 'AI训练师', scope: '全部门 · 10人', state: '默认启用' },
  { name: '业务负责人', scope: '客服事业部 · 1人', state: '可选启用' },
  { name: '品牌方客户管理员', scope: '外部用户', state: '未开放' },
];
export const agentRecords: AgentRecord[] = [
  {
    id: 'AGENT-LEAD-03', name: '线索诊断 Agent', description: '定位评分偏差并输出可核验证据', version: 'v3.2.1', level: '执行层', creator: '周芮', accuracy: 96.2, calls: 45230, latency: '320ms', status: '运行中', model: 'LeadReasoner · v1.8',
    prompts: [{ id: 'PROMPT-LEAD-12', name: '线索评分偏差诊断', version: 'v2.3', state: '生产', note: '评分 A+ 96% · 调用占比 92%' }, { id: 'PROMPT-LEAD-12-RC', name: '线索评分偏差诊断', version: 'v2.4-RC', state: '预发布', note: 'A/B 测试中 · 灰度 10% 流量 · 评分 A 93%' }, { id: 'PROMPT-LEAD-12-OLD', name: '线索评分偏差诊断', version: 'v2.1', state: '归档', note: '已归档 · 2026-06-15' }],
    knowledge: knowledgeCatalog.map(x => ({ ...x })), skills: ['多轮对话管理', '意图识别', '情绪感知'], tools: ['企业消息推送', '短信/5G消息通道', 'CDP用户数据平台'], positions: basePositions, automations: [{ id: 'AUTO-01', name: '知识库增量学习', schedule: '每日 02:00', detail: '扫描知识库变更 → 自动增量训练 → 评估效果', running: true }, { id: 'AUTO-02', name: '对话质量日检', schedule: '每日 06:00', detail: '随机抽样100条昨日对话 → 质量评分 → 低于80分自动告警', running: true }, { id: 'AUTO-03', name: '周度效果报告', schedule: '每周一 08:00', detail: '汇总上周准确率/CSAT/调用量 → 推送至业务负责人', running: true }], rag: { topK: 'Top 8', threshold: '≥ 0.75', weight: '语义70% + 关键词30%' }, risk: '低风险 · 无阻断告警', trace: 'TRACE-LEAD-8821', audit: ['10:20 周芮 更新知识检索策略', '09:45 赵岑 审核发布 v3.2.1']
  },
  {
    id: 'AGENT-QUALITY-11', name: '质量诊断 Agent', description: '识别 badcase 并给出修复优先级', version: 'v1.4.0', level: '策略层', creator: '周芮', accuracy: 93.1, calls: 11860, latency: '480ms', status: '测试中', model: 'QualityGuard · v2.0',
    prompts: [{ id: 'PROMPT-QUALITY-07', name: '质量异常归因', version: 'v1.4', state: '预发布', note: '回归测试中 · 评分 A 93%' }], knowledge: knowledgeCatalog.map((x, i) => ({ ...x, bound: i === 2 })), skills: ['评分诊断', '证据归因'], tools: ['Trace 检索'], positions: basePositions, automations: [], rag: { topK: 'Top 6', threshold: '≥ 0.78', weight: '语义80% + 关键词20%' }, risk: '中风险 · 1 项回归用例失败', trace: 'TRACE-OPS-518', audit: ['09:45 周芮 提交 M11 测试']
  },
  {
    id: 'AGENT-CLEAN-08', name: '线索清洗 Agent', description: '对接入事件执行去重、脱敏与规则校验', version: 'v1.5.0', level: '执行层', creator: '陈屿', accuracy: 91.5, calls: 52180, latency: '390ms', status: '已挂起', model: 'DataClean · v1.2',
    prompts: [{ id: 'PROMPT-CLEAN-03', name: '线索清洗与去重', version: 'v1.5', state: '生产', note: '评分 A 91.5%' }], knowledge: knowledgeCatalog.map((x, i) => ({ ...x, bound: i === 3 })), skills: ['字段清洗'], tools: ['CDP用户数据平台'], positions: basePositions, automations: [], rag: { topK: 'Top 5', threshold: '≥ 0.80', weight: '语义60% + 关键词40%' }, risk: '等待数据源恢复验证', trace: 'TRACE-DATA-3104', audit: ['08:50 周芮 手动挂起']
  },
];
