export type WorkflowStatus = '草稿' | '测试中' | '已发布' | '已归档';
export type NodeKind = '开始' | 'Agent' | 'Skill' | '人工审批' | '条件分支' | '工具' | '异常处理' | '结束';
export type EdgeKind = '默认' | '成功' | '失败' | '条件' | '审批';

export type NodePosition = { x: number; y: number };

export type WorkflowNode = {
  id: string;
  name: string;
  kind: NodeKind;
  position: NodePosition;
  agent?: string;
  version?: string;
  input: string;
  output: string;
  timeout: string;
  retry: string;
  approver?: string;
  expression?: string;
  toolContract?: string;
  skillContract?: string;
  modelContract?: string;
};

export type WorkflowEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  kind: EdgeKind;
  label: string;
  condition?: string;
  priority: number;
};

export type WorkflowRun = {
  id: string;
  time: string;
  trigger: string;
  duration: string;
  human: number;
  result: '成功' | '部分降级' | '失败';
  trace: string;
  path: string[];
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: string;
  owner: string;
  trigger: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  testGate: '未提交' | '通过' | '阻断';
  testReport?: string;
  audit: string[];
  runs: WorkflowRun[];
};

const leadNodes: WorkflowNode[] = [
  { id: 'N1', name: '开始：线索事件', kind: '开始', position: { x: 48, y: 246 }, input: '外部 CRM 脱敏事件', output: '标准化线索上下文', timeout: '—', retry: '—' },
  { id: 'N2', name: '营销策略 Agent', kind: 'Agent', position: { x: 250, y: 120 }, agent: '营销策略 Agent', version: 'v2.1.3', input: '线索上下文', output: '策略目标与人群分层', timeout: '30s', retry: '1次' },
  { id: 'N3', name: '线索诊断 Agent', kind: 'Agent', position: { x: 476, y: 120 }, agent: '线索诊断 Agent', version: 'v3.2.1', input: '策略目标、评分 Trace', output: '质量诊断与证据', timeout: '45s', retry: '2次' },
  { id: 'N4', name: '人工审批：高风险策略', kind: '人工审批', position: { x: 702, y: 120 }, input: '诊断证据', output: '批准 / 驳回 / 超时', timeout: '4h', retry: '—', approver: '业务负责人' },
  { id: 'N5', name: '内容生成 Agent', kind: 'Agent', position: { x: 928, y: 58 }, agent: '内容生成 Agent', version: 'v3.0.3', input: '批准的策略与受众', output: '合规素材包', timeout: '90s', retry: '1次' },
  { id: 'N6', name: '效果评估 Agent', kind: 'Agent', position: { x: 1150, y: 58 }, agent: '效果评估 Agent', version: 'v1.9.0', input: '执行回执', output: '效果指标与改进建议', timeout: '45s', retry: '1次' },
  { id: 'N7', name: '异常处理：人工接管', kind: '异常处理', position: { x: 928, y: 310 }, input: '失败节点与 Trace', output: 'M05 修复任务', timeout: '—', retry: '—' },
  { id: 'N8', name: '结束：回流运行指标', kind: '结束', position: { x: 1150, y: 242 }, input: '效果报告 / 修复回执', output: 'M09 可观测运行实例', timeout: '—', retry: '—' },
];

const leadEdges: WorkflowEdge[] = [
  { id: 'E1', sourceId: 'N1', targetId: 'N2', kind: '默认', label: '事件进入', priority: 1 },
  { id: 'E2', sourceId: 'N2', targetId: 'N3', kind: '成功', label: '策略完成', priority: 1 },
  { id: 'E3', sourceId: 'N2', targetId: 'N7', kind: '失败', label: '执行失败', priority: 2 },
  { id: 'E4', sourceId: 'N3', targetId: 'N4', kind: '成功', label: '诊断完成', priority: 1 },
  { id: 'E5', sourceId: 'N3', targetId: 'N7', kind: '失败', label: '诊断失败', priority: 2 },
  { id: 'E6', sourceId: 'N4', targetId: 'N5', kind: '审批', label: '通过', priority: 1 },
  { id: 'E7', sourceId: 'N4', targetId: 'N7', kind: '审批', label: '驳回', priority: 2 },
  { id: 'E8', sourceId: 'N4', targetId: 'N7', kind: '审批', label: '超时', priority: 3 },
  { id: 'E9', sourceId: 'N5', targetId: 'N6', kind: '成功', label: '生成完成', priority: 1 },
  { id: 'E10', sourceId: 'N5', targetId: 'N7', kind: '失败', label: '生成失败', priority: 2 },
  { id: 'E11', sourceId: 'N6', targetId: 'N8', kind: '成功', label: '评估完成', priority: 1 },
  { id: 'E12', sourceId: 'N6', targetId: 'N7', kind: '失败', label: '评估失败', priority: 2 },
  { id: 'E13', sourceId: 'N7', targetId: 'N8', kind: '默认', label: '人工处置回执', priority: 1 },
];

export const workflows: Workflow[] = [
  {
    id: 'WF-LEAD-001', name: '线索转化提升工作流', description: '对外部线索事件执行策略、诊断、人工审核、内容执行与效果回流。', status: '已发布', version: 'v2.4.0', owner: '李明远', trigger: '每日 09:15 / 事件触发', nodes: leadNodes, edges: leadEdges, testGate: '通过', testReport: 'M11-INT-087 · 多 Agent 协作场景', audit: ['10:20 赵岑 发布 v2.4.0', '09:45 周芮 M11 集成测试通过'], runs: [{ id: 'RUN-WF-8821', time: '10:48', trigger: '事件触发', duration: '3m24s', human: 1, result: '成功', trace: 'TRACE-WF-8821', path: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N8'] }, { id: 'RUN-WF-8818', time: '09:15', trigger: '定时触发', duration: '5m11s', human: 2, result: '部分降级', trace: 'TRACE-WF-8818', path: ['N1', 'N2', 'N3', 'N4', 'N7', 'N8'] }],
  },
  {
    id: 'WF-KOC-003', name: 'KOC 内容分发工作流', description: '将已审核素材分发至 KOC 并回收效果指标。', status: '草稿', version: 'v0.8.0', owner: '周芮', trigger: '手动触发', nodes: leadNodes.slice(0, 3).map((node, index) => ({ ...node, id: `K${index + 1}`, position: { x: 80 + index * 225, y: 180 } })), edges: [{ id: 'KE1', sourceId: 'K1', targetId: 'K2', kind: '默认', label: '事件进入', priority: 1 }, { id: 'KE2', sourceId: 'K2', targetId: 'K3', kind: '成功', label: '处理完成', priority: 1 }], testGate: '未提交', audit: ['09:30 周芮 创建草稿'], runs: [],
  },
];

export function createNode(kind: NodeKind, index: number): WorkflowNode {
  return { id: `N-${Date.now()}`, name: `${kind}节点`, kind, position: { x: 80 + (index % 4) * 215, y: 70 + Math.floor(index / 4) * 165 }, input: '上游节点输出', output: '待配置输出', timeout: kind === '人工审批' ? '4h' : '60s', retry: kind === 'Agent' || kind === 'Skill' || kind === '工具' ? '1次' : '—' };
}

export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];
  const ids = new Set(workflow.nodes.map(node => node.id));
  const starts = workflow.nodes.filter(node => node.kind === '开始');
  const ends = workflow.nodes.filter(node => node.kind === '结束');
  if (starts.length !== 1) errors.push('工作流必须且只能有一个开始节点。');
  if (ends.length < 1) errors.push('工作流至少需要一个结束节点。');
  workflow.edges.forEach(edge => { if (!ids.has(edge.sourceId) || !ids.has(edge.targetId)) errors.push(`路由 ${edge.id} 指向不存在的节点。`); });
  workflow.nodes.forEach(node => {
    const outbound = workflow.edges.filter(edge => edge.sourceId === node.id);
    if (node.kind === '结束' && outbound.length) errors.push(`结束节点「${node.name}」不能配置出边。`);
    if (node.kind !== '结束' && !outbound.length) errors.push(`节点「${node.name}」没有后续路由。`);
    if (node.kind === '条件分支' && !['满足', '不满足', '默认'].every(label => outbound.some(edge => edge.label === label))) errors.push(`条件节点「${node.name}」必须配置满足、不满足和默认路由。`);
    if (node.kind === '人工审批' && !['通过', '驳回', '超时'].every(label => outbound.some(edge => edge.label === label))) errors.push(`审批节点「${node.name}」必须配置通过、驳回和超时路由。`);
  });
  if (starts.length === 1) {
    const reached = new Set<string>(); const queue = [starts[0].id];
    while (queue.length) { const current = queue.shift()!; if (reached.has(current)) continue; reached.add(current); workflow.edges.filter(edge => edge.sourceId === current).forEach(edge => queue.push(edge.targetId)); }
    workflow.nodes.filter(node => !reached.has(node.id)).forEach(node => errors.push(`节点「${node.name}」无法从开始节点到达。`));
  }
  return [...new Set(errors)];
}
