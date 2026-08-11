export type IncidentSeverity = 'P0' | 'P1' | 'P2' | 'P3';
export type IncidentStatus = '待确认' | '待指派' | '处理中' | '待验证' | '已解决' | '已关闭' | '误报' | '已归档';
export type IncidentSource = 'M03 Agent管理' | 'M04 工作空间' | 'M06 知识库' | 'M08 编排引擎' | 'M09 动态计划' | 'M11 测试沙箱' | 'M13 模型工厂' | '平台监控';
export type IncidentAction = '确认异常' | '标记误报' | '指派' | '升级' | '降级' | '添加处置' | '提交验证' | '验证通过' | '验证失败' | '确认恢复' | '解决' | '关闭' | '重开' | '归档';

export type Evidence = { id: string; type: 'Trace' | '测试报告' | '指标快照' | '日志' | '版本' | '告警规则'; title: string; detail: string; time: string };
export type RepairTaskRef = { id: string; title: string; status: '待处理' | '进行中' | '待审核' | '已完成'; owner: string; incidentId: string; sourceId: string; traceId: string };
export type VerificationRecord = { id: string; projectId: string; types: string[]; status: '待运行' | '验证通过' | '验证失败'; score: string; traceId: string; checks: string[]; time: string };
export type KnowledgeCandidate = { id: string; title: string; category: string; agents: string[]; status: '草稿' | '已提交M06' | '已发布'; sourceIncidentId: string; summary: string };
export type AuditRecord = { time: string; actor: string; action: string; note: string; from?: IncidentStatus; to?: IncidentStatus };

export type Incident = {
  id: string;
  title: string;
  description: string;
  sourceType: IncidentSource;
  sourceId: string;
  traceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  impactScope: string;
  impactObjects: string[];
  owner: string;
  responseTeam: string;
  createdAt: string;
  updatedAt: string;
  responseRemaining: string;
  resolutionRemaining: string;
  escalationLevel: number;
  rootCauseCategory: string;
  rootCause: string;
  containment: string;
  permanentFix: string;
  rollbackPlan: string;
  businessRecoveryConfirmed: boolean;
  evidence: Evidence[];
  repairTasks: RepairTaskRef[];
  verifications: VerificationRecord[];
  knowledgeCandidates: KnowledgeCandidate[];
  audit: AuditRecord[];
};

export const slaPolicies: Record<IncidentSeverity, { response: string; resolution: string; escalation: string }> = {
  P0: { response: '15分钟', resolution: '2小时', escalation: '5分钟通知平台管理员，10分钟升级超级管理员' },
  P1: { response: '1小时', resolution: '4小时', escalation: '剩余25%时升级责任团队负责人' },
  P2: { response: '4小时', resolution: '2个工作日', escalation: '响应超时升级平台管理员' },
  P3: { response: '1个工作日', resolution: '5个工作日', escalation: '解决超时升级责任团队负责人' },
};

const evidence = (id: string, type: Evidence['type'], title: string, detail: string, time: string): Evidence => ({ id, type, title, detail, time });
const audit = (time: string, actor: string, action: string, note: string): AuditRecord => ({ time, actor, action, note });

export const incidentSeed: Incident[] = [
  {
    id: 'INC-2026-0710', title: '内容生成 Agent Prompt 注入漏洞暴露', description: '对抗测试发现恶意指令可绕过输出过滤并诱导返回受控数据片段。', sourceType: 'M11 测试沙箱', sourceId: 'ATK-003', traceId: 'TRACE-ATK-003', severity: 'P0', status: '待确认', impactScope: '品牌方A内容安全与生产发布门禁', impactObjects: ['内容生成 Agent v3.0.3-RC1', 'PROMPT-CONTENT-09 v3.0', '品牌方A租户'], owner: '未指派', responseTeam: 'AI安全响应组', createdAt: '10:42', updatedAt: '10:42', responseRemaining: '8分钟', resolutionRemaining: '1小时53分钟', escalationLevel: 1, rootCauseCategory: 'Prompt安全', rootCause: '', containment: '候选版本已被 M11 阻断，未进入生产流量。', permanentFix: '', rollbackPlan: '继续使用生产基线 v3.0.2', businessRecoveryConfirmed: false,
    evidence: [evidence('EV-710-1','测试报告','对抗测试 ATK-003','数据泄露攻击向量暴露；防御成功率 89.2%，低于90%门槛','10:42'), evidence('EV-710-2','Trace','攻击运行 Trace','恶意输入 → Prompt边界检测 → 输出过滤失效','10:42'), evidence('EV-710-3','版本','候选版本快照','Agent v3.0.3-RC1 / Prompt v3.0 / Toolset v2.1','10:41')], repairTasks: [], verifications: [], knowledgeCandidates: [], audit: [audit('10:42','M11 自动门禁','创建异常','对抗测试失败自动生成 P0 异常')]
  },
  {
    id: 'INC-2026-0709', title: '线索转化工作流人工审批节点超时', description: '高风险策略等待业务负责人审批超过节点 SLA，预测完成时间持续顺延。', sourceType: 'M09 动态计划', sourceId: 'PLAN-8821', traceId: 'TRACE-WF-8821/N4', severity: 'P1', status: '处理中', impactScope: 'DNDC线索中心华东区域策略发布', impactObjects: ['WF-LEAD-001', 'RUN-WF-8821', '人工审批节点 N4'], owner: '赵志强', responseTeam: '线索中心运行保障组', createdAt: '10:50', updatedAt: '11:02', responseRemaining: '已响应', resolutionRemaining: '3小时48分钟', escalationLevel: 1, rootCauseCategory: '人工等待', rootCause: '审批人同时处理区域异常复盘，缺少代理审批人。', containment: '工作流保持等待，未自动放行高风险策略。', permanentFix: '配置审批超时代理与升级路由。', rollbackPlan: '继续使用上一版已批准策略', businessRecoveryConfirmed: false,
    evidence: [evidence('EV-709-1','指标快照','M09 运行偏差','N4 已等待12分钟；节点SLA 10分钟；预测顺延8分钟','11:00'), evidence('EV-709-2','Trace','运行实例 Trace','N3完成 → N4等待审批 → N5未执行','10:50')], repairTasks: [{ id:'TASK-REPAIR-2031', title:'补充审批代理与超时升级路由', status:'进行中', owner:'周芮', incidentId:'INC-2026-0709', sourceId:'PLAN-8821', traceId:'TRACE-WF-8821/N4' }], verifications: [], knowledgeCandidates: [], audit: [audit('10:50','M09 动态计划','创建异常','人工节点超时自动升级'), audit('10:54','赵岑','确认并指派','指派赵志强与周芮联合处置')]
  },
  {
    id: 'INC-2026-0708', title: '舆情应急响应集成测试 3 个 P0 场景超时', description: '多 Agent 应急链路在复杂法规检索时无法满足 15 秒响应目标。', sourceType: 'M11 测试沙箱', sourceId: 'SCN-INT-042', traceId: 'TRACE-INT-042', severity: 'P1', status: '待验证', impactScope: '舆情应急响应上线门禁', impactObjects: ['舆情监控 Agent', '法务 Agent', '公关响应 Agent'], owner: '陈思敏', responseTeam: 'AI能力运营组', createdAt: '09:20', updatedAt: '10:30', responseRemaining: '已响应', resolutionRemaining: '2小时50分钟', escalationLevel: 0, rootCauseCategory: '知识检索性能', rootCause: '法务 Agent 在复杂法规条款检索中召回片段过多。', containment: '候选工作流继续阻断发布。', permanentFix: '法规知识索引增加地域与时效过滤，TopK 从 12 调整为 6。', rollbackPlan: '沿用现有人工法务审核链路', businessRecoveryConfirmed: false,
    evidence: [evidence('EV-708-1','测试报告','集成测试 #42','42/50通过；3个P0场景响应45秒，目标15秒','09:20')], repairTasks: [{ id:'TASK-REPAIR-2028', title:'优化法务 Agent 法规知识检索', status:'已完成', owner:'陈思敏', incidentId:'INC-2026-0708', sourceId:'SCN-INT-042', traceId:'TRACE-INT-042' }], verifications: [{ id:'VERIFY-0708-1', projectId:'TEST-INT-042-R2', types:['集成测试','上线门禁'], status:'待运行', score:'—', traceId:'待生成', checks:['P0场景≤15秒','数据一致性100%'], time:'10:30' }], knowledgeCandidates: [], audit: [audit('09:20','M11 测试沙箱','创建异常','集成测试 SLA 不达标'), audit('10:28','陈思敏','提交验证','修复任务完成并提交二次集成测试')]
  },
  {
    id: 'INC-2026-0707', title: '知识库索引过期率偏高（18%）', description: '季度健康审计发现车型与法规知识索引新鲜度低于治理阈值。', sourceType: 'M06 知识库', sourceId: 'KB-AUDIT-2026Q3', traceId: 'TRACE-KB-AUDIT-0707', severity: 'P2', status: '待指派', impactScope: '12 个生产 Agent 的 RAG 检索', impactObjects: ['车型库', '法规库', '12个消费Agent'], owner: '未指派', responseTeam: '知识治理组', createdAt: '08:56', updatedAt: '09:05', responseRemaining: '3小时51分钟', resolutionRemaining: '1个工作日22小时', escalationLevel: 0, rootCauseCategory: '知识新鲜度', rootCause: '', containment: '已自动触发高频知识重索引。', permanentFix: '', rollbackPlan: '过期文档检索降权', businessRecoveryConfirmed: false,
    evidence: [evidence('EV-707-1','指标快照','知识健康度审计','索引过期率18%，目标≤5%；检索命中率降至84.1%','08:56')], repairTasks: [], verifications: [], knowledgeCandidates: [], audit: [audit('08:56','M06 健康审计','创建异常','知识新鲜度阈值告警')]
  },
  {
    id: 'INC-2026-0706', title: '线索诊断模型 P99 推理延迟升高 42%', description: '早班高峰期模型服务 P99 从 428ms 上升至 608ms。', sourceType: 'M13 模型工厂', sourceId: 'MODEL-LEAD-v1.8', traceId: 'TRACE-MODEL-0706', severity: 'P2', status: '处理中', impactScope: '线索诊断 Agent 实时评分', impactObjects: ['LeadReasoner v1.8', '线索诊断 Agent v3.2.1'], owner: '赵岑', responseTeam: '模型平台组', createdAt: '08:20', updatedAt: '09:10', responseRemaining: '已响应', resolutionRemaining: '1个工作日20小时', escalationLevel: 0, rootCauseCategory: '模型性能', rootCause: '高峰期批处理与实时推理共享实例池。', containment: '实时推理池扩容至 3 实例。', permanentFix: '拆分实时与批处理资源池。', rollbackPlan: '回退 LeadReasoner v1.7', businessRecoveryConfirmed: false,
    evidence: [evidence('EV-706-1','指标快照','模型服务 P99','基线428ms，当前608ms；错误率0.2%','08:20'), evidence('EV-706-2','日志','自动扩容记录','实例数 2 → 3，P99回落至472ms','08:32')], repairTasks: [], verifications: [], knowledgeCandidates: [], audit: [audit('08:20','模型监控','创建异常','P99超过基线30%'), audit('08:25','赵岑','添加处置','执行实时池扩容')]
  },
  {
    id: 'INC-2026-0705', title: '客服 Agent 引用错误 FAQ', description: '客服 Agent 在 N7 充电问题中引用了旧版 N5 FAQ。', sourceType: 'M03 Agent管理', sourceId: 'AGENT-CS-02', traceId: 'TRACE-CS-45231', severity: 'P2', status: '已解决', impactScope: '1 次客服对话，未造成订单或安全影响', impactObjects: ['客服应答 Agent v2.3.1', 'KB-FAQ-CHARGE-v1.2'], owner: '陈思敏', responseTeam: '客服AI运营组', createdAt: '07:40', updatedAt: '09:40', responseRemaining: '已响应', resolutionRemaining: '已解决', escalationLevel: 0, rootCauseCategory: '知识版本绑定', rootCause: 'Agent 版本仍绑定已归档 FAQ 索引别名。', containment: '撤销错误回答并由人工客服补充正确说明。', permanentFix: '绑定 KB-FAQ-CHARGE-v1.3 并增加车型一致性校验。', rollbackPlan: '切换人工客服处理同类问题', businessRecoveryConfirmed: true,
    evidence: [evidence('EV-705-1','Trace','客服会话 Trace','车型N7 → 检索命中N5 FAQ → 输出错误充电说明','07:40'), evidence('EV-705-2','测试报告','M11 回归测试','50/50知识一致性用例通过','09:35')], repairTasks: [{ id:'TASK-REPAIR-2025', title:'修复客服 Agent FAQ 版本绑定', status:'已完成', owner:'陈思敏', incidentId:'INC-2026-0705', sourceId:'AGENT-CS-02', traceId:'TRACE-CS-45231' }], verifications: [{ id:'VERIFY-0705-1', projectId:'TEST-CS-FAQ-031', types:['单元测试','集成测试','上线门禁'], status:'验证通过', score:'100%', traceId:'TRACE-VERIFY-0705', checks:['车型一致性50/50','旧索引不可访问','门禁通过'], time:'09:35' }], knowledgeCandidates: [{ id:'KC-0705-1', title:'Agent 知识版本绑定一致性检查', category:'故障库 / Agent故障 / 知识绑定', agents:['客服应答 Agent'], status:'草稿', sourceIncidentId:'INC-2026-0705', summary:'发布前校验知识索引别名、资产状态和车型适用范围。' }], audit: [audit('07:40','客服质量监控','创建异常','用户反馈与Trace自动关联'), audit('08:10','陈思敏','添加处置','修复知识版本绑定'), audit('09:35','M11 测试沙箱','验证通过','知识一致性回归通过'), audit('09:40','赵岑','解决','技术指标与业务结果均恢复')]
  },
];

export function createRepairTaskContext(incident: Incident): RepairTaskRef {
  return { id: `TASK-REPAIR-${incident.id.slice(-4)}`, title: `修复：${incident.title}`, status: '待处理', owner: incident.owner === '未指派' ? '待分配' : incident.owner, incidentId: incident.id, sourceId: incident.sourceId, traceId: incident.traceId };
}

export function submitVerification(incident: Incident, types: string[]): VerificationRecord {
  return { id: `VERIFY-${incident.id.slice(-4)}-${incident.verifications.length + 1}`, projectId: `TEST-${incident.sourceId}-R${incident.verifications.length + 1}`, types, status: '待运行', score: '—', traceId: '待生成', checks: types.map(type => `${type}门槛待运行`), time: '刚刚' };
}

export function confirmRecovery(incident: Incident): Incident {
  return { ...incident, businessRecoveryConfirmed: true, updatedAt: '刚刚', audit: [{ time:'刚刚', actor:'业务负责人', action:'确认恢复', note:'业务指标、用户影响与服务能力均已恢复' }, ...incident.audit] };
}

export function createKnowledgeCandidate(incident: Incident, title: string, category: string, agents: string[]): KnowledgeCandidate {
  return { id:`KC-${incident.id.slice(-4)}-${incident.knowledgeCandidates.length + 1}`, title, category, agents, status:'草稿', sourceIncidentId:incident.id, summary:`根因：${incident.rootCause || '待补充'}；永久修复：${incident.permanentFix || '待补充'}` };
}

const nextStatus: Partial<Record<IncidentAction, IncidentStatus>> = {
  '确认异常':'待指派', '标记误报':'误报', '指派':'处理中', '提交验证':'待验证', '验证失败':'处理中', '验证通过':'待验证', '解决':'已解决', '关闭':'已关闭', '重开':'处理中', '归档':'已归档',
};

export function transitionIncident(incident: Incident, action: IncidentAction, actor: string, note: string): { incident: Incident; error?: string } {
  if (action === '解决' && !incident.repairTasks.some(item => item.status === '已完成')) return { incident, error:'必须先收到 M05 修复任务完成回执，才能解决异常。' };
  if (action === '解决' && !incident.verifications.some(item => item.status === '验证通过')) return { incident, error:'必须先完成 M11 验证并通过，才能解决异常。' };
  if (action === '解决' && (!incident.rootCause || !incident.permanentFix)) return { incident, error:'必须先记录根因结论与永久修复方案，才能解决异常。' };
  if (action === '关闭' && ['P0','P1'].includes(incident.severity) && !incident.businessRecoveryConfirmed) return { incident, error:'P0/P1 异常必须由业务负责人完成恢复确认后才能关闭。' };
  if (action === '指派' && incident.owner === '未指派') return { incident, error:'请先选择负责人。' };
  const from = incident.status;
  const to = nextStatus[action] ?? from;
  return { incident: { ...incident, status:to, updatedAt:'刚刚', escalationLevel:action === '升级' ? incident.escalationLevel + 1 : action === '降级' ? Math.max(0, incident.escalationLevel - 1) : incident.escalationLevel, audit:[{ time:'刚刚', actor, action, note, from, to }, ...incident.audit] } };
}
