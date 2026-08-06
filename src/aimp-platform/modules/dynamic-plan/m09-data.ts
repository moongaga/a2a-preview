import { workflows, type WorkflowNode } from '../agent-orchestration/m08-data';

export type PlanStatus = '运行中' | '等待人工' | '已暂停' | '部分降级' | '已完成';
export type StepStatus = '已完成' | '执行中' | '等待审批' | '失败' | '待执行' | '已跳过';
export type DeviationType = '进度' | '质量' | '时延' | '依赖' | '人工等待' | '安全门禁';
export type PlanStep = { id: string; nodeId: string; name: string; kind: string; status: StepStatus; planned: string; actual?: string; estimate: string; duration?: string; owner: string; trace: string; route?: string; attempt: number };
export type PlanDeviation = { id: string; type: DeviationType; level: '低' | '中' | '高'; title: string; impact: string; evidence: string; status: '待处置' | '处置中' | '已缓解'; taskId?: string };
export type DynamicPlan = { id: string; workflowId: string; workflowName: string; runId: string; status: PlanStatus; trigger: string; startedAt: string; forecastEnd: string; actualEnd?: string; progress: number; steps: PlanStep[]; deviations: PlanDeviation[]; taskRefs: { id: string; title: string; status: string; nodeId: string }[]; audit: string[] };
export type HumanCapacity = { id: string; name: string; role: string; organization: string; availability: '在线' | '忙碌' | '离线'; capacity: number; occupied: number; humanSteps: number; taskRefs: string[]; current: string };
export type CollaborationEvent = { id: string; time: string; person: string; role: string; agent: string; action: string; output: string; token: number; planId: string };
export const shiftSnapshot = { name: '早班', range: '08:00–16:00', digital: { online: 8, total: 10, executing: 4, queued: 2, idle: 2 }, human: { online: 3, total: 4, busy: 1, idle: 2, offline: 1 }, refreshedAt: '2 秒前', target: '线索转化提升与异常处置' };
export const realtimeEvents = [{ time: '10:50:45', level: 'INFO', text: '用户洞察 Agent 完成增换购人群画像分析，已推送至策略节点' }, { time: '10:50:02', level: 'OK', text: 'KOC运营 Agent 接受分发任务，预计 11:30 前完成' }, { time: '10:49:23', level: 'INFO', text: '内容生成 Agent 生成第 130 条素材，完成平台适配校验' }, { time: '10:48:51', level: 'OK', text: '线索评分回流完成，高意向新增 1,240 条' }];

const leadWorkflow = workflows.find(workflow => workflow.id === 'WF-LEAD-001')!;
const node = (id: string) => leadWorkflow.nodes.find(item => item.id === id)!;
const step = (id: string, status: StepStatus, planned: string, owner: string, actual?: string, duration?: string, route?: string): PlanStep => { const item: WorkflowNode = node(id); return { id: `STEP-${id}`, nodeId: id, name: item.name, kind: item.kind, status, planned, actual, estimate: item.timeout, duration, owner, trace: `TRACE-WF-8821/${id}`, route, attempt: 1 }; };

export const dynamicPlans: DynamicPlan[] = [
  { id: 'PLAN-8821', workflowId: leadWorkflow.id, workflowName: leadWorkflow.name, runId: 'RUN-WF-8821', status: '等待人工', trigger: '事件触发', startedAt: '10:48', forecastEnd: '11:08', progress: 58, steps: [step('N1', '已完成', '10:48', '系统', '10:48', '2s', '事件进入'), step('N2', '已完成', '10:48', '营销策略 Agent', '10:49', '23s', '策略完成'), step('N3', '已完成', '10:49', '线索诊断 Agent', '10:50', '34s', '诊断完成'), step('N4', '等待审批', '10:50', '赵志强 / 业务负责人', undefined, undefined, '通过 / 驳回 / 超时'), step('N5', '待执行', '10:55', '内容生成 Agent'), step('N6', '待执行', '11:00', '效果评估 Agent'), step('N8', '待执行', '11:05', '系统')], deviations: [{ id: 'DEV-8821-1', type: '人工等待', level: '中', title: '高风险策略等待人工审批', impact: '预测完成时间顺延 8 分钟', evidence: 'N4 已等待 7 分钟；审批 SLA 为 10 分钟', status: '待处置', taskId: 'TASK-REVIEW-2031' }], taskRefs: [{ id: 'TASK-REVIEW-2031', title: '线索转化策略方案 v2 审核', status: '待审核', nodeId: 'N4' }], audit: ['10:50 运行实例创建动态计划', '10:50 N4 进入人工审批等待'] },
  { id: 'PLAN-8818', workflowId: leadWorkflow.id, workflowName: leadWorkflow.name, runId: 'RUN-WF-8818', status: '部分降级', trigger: '定时触发', startedAt: '09:15', forecastEnd: '09:19', actualEnd: '09:20', progress: 100, steps: [step('N1', '已完成', '09:15', '系统', '09:15', '1s'), step('N2', '已完成', '09:15', '营销策略 Agent', '09:16', '31s'), step('N3', '已完成', '09:16', '线索诊断 Agent', '09:17', '48s'), step('N4', '已完成', '09:17', '王晓芳 / 业务负责人', '09:18', '1m', '驳回'), step('N7', '已完成', '09:18', '陈思敏 / AI训练师', '09:20', '2m', '人工处置回执'), step('N8', '已完成', '09:20', '系统', '09:20', '1s')], deviations: [{ id: 'DEV-8818-1', type: '质量', level: '高', title: '策略置信度低于审批阈值', impact: '已走人工接管；计划延迟 1 分钟', evidence: '线索诊断证据置信度 0.61，低于 0.75', status: '已缓解', taskId: 'TASK-FIX-2031' }], taskRefs: [{ id: 'TASK-FIX-2031', title: '修复线索策略低置信度问题', status: '进行中', nodeId: 'N7' }], audit: ['09:18 审批驳回，按 M08 异常路由进入 N7', '09:20 人工处置完成并回流运行指标'] },
];

export const humanCapacity: HumanCapacity[] = [
  { id: 'USR-BIZ-01', name: '赵志强', role: '业务负责人', organization: 'DNDC线索中心', availability: '在线', capacity: 3, occupied: 2, humanSteps: 1, taskRefs: ['TASK-REVIEW-2031'], current: '审核线索转化策略方案 v2' },
  { id: 'USR-TRAINER-01', name: '陈思敏', role: 'AI训练师', organization: 'AIMP能力运营组', availability: '忙碌', capacity: 4, occupied: 4, humanSteps: 2, taskRefs: ['TASK-FIX-2031'], current: '处理内容 Agent 失败用例' },
  { id: 'USR-ADMIN-01', name: '赵岑', role: '平台管理员', organization: 'AIMP平台运营组', availability: '在线', capacity: 4, occupied: 1, humanSteps: 0, taskRefs: [], current: '监控平台运行与发布门禁' },
];

export const collaborationEvents: CollaborationEvent[] = [
  { id: 'EVT-1', time: '10:50', person: '赵志强', role: '业务负责人', agent: '线索诊断 Agent', action: '查看高风险策略的诊断证据', output: '待完成审批决策', token: 6200, planId: 'PLAN-8821' },
  { id: 'EVT-2', time: '10:20', person: '陈思敏', role: 'AI训练师', agent: '异常处理节点', action: '完成低置信度策略人工接管', output: '创建修复任务 TASK-FIX-2031', token: 2800, planId: 'PLAN-8818' },
  { id: 'EVT-3', time: '09:18', person: '王晓芳', role: '业务负责人', agent: '营销策略 Agent', action: '驳回高风险策略', output: '按异常路由进入人工接管', token: 1500, planId: 'PLAN-8818' },
];

export function createRepairTaskContext(plan: DynamicPlan, deviation: PlanDeviation) { return { workflowId: plan.workflowId, runId: plan.runId, deviationId: deviation.id, title: `修复：${deviation.title}`, source: 'M09 动态计划' }; }
