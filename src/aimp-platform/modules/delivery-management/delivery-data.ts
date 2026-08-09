import type { AIProductReference, DeliveryContract, ProjectRecord } from './delivery-types';

export const deliveryProducts: AIProductReference[] = [
  { id:'PRODUCT-LEAD-AI', name:'线索智能运营套件', version:'v3.2', status:'已发布', capabilityScope:'线索清洗、评分、诊断与质量监控', tenantIds:['TENANT-DNDC'] },
  { id:'PRODUCT-AIMP-OPS', name:'Agent 生产运行保障', version:'v2.1', status:'已发布', capabilityScope:'运行观测、异常诊断、发布治理', tenantIds:['TENANT-AIMP'] },
  { id:'PRODUCT-CONTENT-AI', name:'智能内容生产套件', version:'v1.8', status:'已发布', capabilityScope:'内容生成、审核与渠道适配', tenantIds:['TENANT-BRAND-A'] },
];

export const deliveryContracts: DeliveryContract[] = [
  { id:'DNDC-RAAS-01', name:'DNDC 线索 AI RaaS 交付合同', customer:'DNDC', tenantId:'TENANT-DNDC', productIds:['PRODUCT-LEAD-AI'], sowId:'SOW-DNDC-LEAD-2026', sowScope:'线索评分、质量诊断、运行保障；不包含 CRM 客户跟进', period:'2026-06-15 ～ 2027-06-14', billingRef:'BILLING-CONTRACT-0021', owner:'赵岑', status:'生效' },
  { id:'BRAND-A-CONTENT-01', name:'品牌方 A 内容 Agent 试点合同', customer:'品牌方A', tenantId:'TENANT-BRAND-A', productIds:['PRODUCT-CONTENT-AI'], sowId:'SOW-CONTENT-2026-01', sowScope:'内容生成、审核与双渠道发布试点', period:'2026-08-01 ～ 2026-12-31', billingRef:'BILLING-CONTRACT-0036', owner:'李沐', status:'待审核' },
];

export const deliveryProjects: ProjectRecord[] = [
  {
    id:'PJ-LEAD-Q3-02', name:'华东Q3线索AI优化', kind:'客户交付项目', goal:'提升线索AI评分稳定性、可解释性和异常恢复效率', owner:'李沐', organization:'DNDC线索中心', period:'2026-07-01 ～ 2026-09-30', stage:'质量优化与灰度验证', status:'进行中', progress:62,
    contractId:'DNDC-RAAS-01', sowId:'SOW-DNDC-LEAD-2026', tenantId:'TENANT-DNDC', productIds:['PRODUCT-LEAD-AI'],
    members:[
      { id:'USR-EMP-01', name:'陈屿', role:'项目成员', organization:'DNDC线索中心', responsibility:'业务样本复核与结果反馈', dataScope:'本人及项目脱敏数据', validTo:'2026-09-30' },
      { id:'USR-BIZ-01', name:'李沐', role:'项目负责人', organization:'DNDC线索中心', responsibility:'业务目标、风险与验收', dataScope:'项目全量业务指标', validTo:'2026-09-30' },
      { id:'USR-TRAINER-01', name:'周芮', role:'AI能力负责人', organization:'AIMP能力运营组', responsibility:'能力诊断、修复与测试', dataScope:'项目授权能力与脱敏样本', validTo:'2026-09-30' },
    ],
    milestones:[
      { id:'MS-LEAD-01', name:'现状基线冻结', owner:'陈屿', dueAt:'2026-07-10', status:'已完成', acceptance:'质量指标与样本基线归档', result:'已归档 2,480 条脱敏样本' },
      { id:'MS-LEAD-02', name:'候选能力版本完成', owner:'周芮', dueAt:'2026-08-20', status:'进行中', acceptance:'M11 单元、集成与对抗测试达标' },
      { id:'MS-LEAD-03', name:'业务灰度验收', owner:'李沐', dueAt:'2026-09-10', status:'未开始', acceptance:'10% 灰度连续 7 天满足 SLA' },
      { id:'MS-LEAD-04', name:'项目结项', owner:'李沐', dueAt:'2026-09-30', status:'未开始', acceptance:'交付范围、效果与审计证据完整' },
    ],
    bindings:[
      { id:'AGENT-LEAD-03', kind:'Agent', name:'线索分析 Agent', version:'v3.7', status:'已绑定', purpose:'评分偏差分析与证据生成', scope:'项目成员调用' },
      { id:'KB-LEAD-001', kind:'知识', name:'线索判定与跟进规则', version:'2026.08', status:'已绑定', purpose:'RAG 判定依据', scope:'项目只读' },
      { id:'DS-CRM-PROJECTION', kind:'数据', name:'CRM 脱敏指标投影', version:'schema-2.1', status:'已绑定', purpose:'质量指标与脱敏样本', scope:'字段级脱敏只读' },
      { id:'CONTENT-PACK-018', kind:'内容', name:'线索复盘摘要模板', version:'v4', status:'已绑定', purpose:'生成评审摘要', scope:'已审核内容只读' },
      { id:'SKILL-LEAD-DIAG', kind:'Skill', name:'线索质量诊断', version:'v2.0.0', status:'已绑定', purpose:'组合诊断流程', scope:'项目 Agent 使用' },
      { id:'TOOL-RUNTIME-TRACE', kind:'Tool', name:'运行追踪查询', version:'v1.6.0', status:'已绑定', purpose:'查询脱敏运行证据', scope:'项目审计读取' },
    ],
    acceptance:[{ id:'ACC-LEAD-01', item:'评分准确率与解释证据', owner:'李沐', status:'待验收', evidence:'等待灰度测试报告', conclusion:'—' }],
    slas:[{ id:'SLA-LEAD-01', metric:'评分服务可用性', target:'≥99.9%', actual:'99.96%', status:'达标', handling:'无需处置' },{ id:'SLA-LEAD-02', metric:'P95 响应时间', target:'≤800ms', actual:'720ms', status:'达标', handling:'持续观察' }],
    taskCount:5, highPriorityOpen:1, openIncidentCount:1,
    audit:[{ id:'AUD-PJ-1001', time:'今天 10:42', actor:'周芮', action:'更新能力绑定', summary:'线索质量诊断 Skill 固定到 v2.0.0' },{ id:'AUD-PJ-1000', time:'2026-07-01', actor:'赵岑', action:'启动项目', summary:'合同、SOW 与产品权益校验通过' }],
  },
  {
    id:'PJ-LEAD-OPS-01', name:'线索Agent生产运行保障', kind:'内部运营项目', goal:'保障线索Agent生产稳定性、SLA与跨租户安全', owner:'赵岑', organization:'AIMP平台运营组', period:'2026-08-01 ～ 2026-12-31', stage:'生产保护与发布治理', status:'进行中', progress:74, productIds:['PRODUCT-AIMP-OPS'], basis:'2026 年下半年 Agent 生产运行保障专项',
    members:[{ id:'USR-ADMIN-01', name:'赵岑', role:'项目负责人', organization:'AIMP平台运营组', responsibility:'运行保护、发布与恢复', dataScope:'平台运行范围', validTo:'2026-12-31' },{ id:'USR-SUPER-01', name:'顾川', role:'治理审批人', organization:'平台治理委员会', responsibility:'重大变更和跨租户风险审批', dataScope:'全租户治理元数据', validTo:'2026-12-31' }],
    milestones:[{ id:'MS-OPS-01', name:'告警分级策略上线', owner:'赵岑', dueAt:'2026-08-10', status:'已完成', acceptance:'P0-P2 告警路由验证通过', result:'已上线' },{ id:'MS-OPS-02', name:'灾备演练', owner:'顾川', dueAt:'2026-10-15', status:'进行中', acceptance:'故障恢复时间低于 30 分钟' }],
    bindings:[{ id:'AGENT-RUNTIME-06', kind:'Agent', name:'运行诊断 Agent', version:'v4.1', status:'已绑定', purpose:'运行异常诊断', scope:'平台运行范围' },{ id:'TOOL-ALERT-ROUTE', kind:'Tool', name:'告警路由工具', version:'v2.2.0', status:'已绑定', purpose:'告警分级和通知', scope:'平台管理员' }],
    acceptance:[{ id:'ACC-OPS-01', item:'季度灾备演练', owner:'顾川', status:'待验收', evidence:'演练计划已生成', conclusion:'—' }],
    slas:[{ id:'SLA-OPS-01', metric:'P1 响应时间', target:'≤30分钟', actual:'18分钟', status:'达标', handling:'无需处置' }],
    taskCount:8, highPriorityOpen:0, openIncidentCount:0,
    audit:[{ id:'AUD-PJ-2001', time:'今天 09:20', actor:'赵岑', action:'更新里程碑', summary:'灾备演练进入执行阶段' }],
  },
  {
    id:'PJ-CONTENT-PILOT-01', name:'品牌方A内容Agent试点', kind:'客户交付项目', goal:'验证已审核内容的多渠道生成与发布能力', owner:'李沐', organization:'内容事业部', period:'2026-08-15 ～ 2026-12-15', stage:'立项评审', status:'草稿', progress:8, contractId:'BRAND-A-CONTENT-01', sowId:'SOW-CONTENT-2026-01', tenantId:'TENANT-BRAND-A', productIds:['PRODUCT-CONTENT-AI'], members:[], milestones:[], bindings:[], acceptance:[], slas:[], taskCount:0, highPriorityOpen:0, openIncidentCount:0, audit:[{ id:'AUD-PJ-3001', time:'今天 11:02', actor:'李沐', action:'创建草稿', summary:'等待合同审核后提交立项' }],
  },
];

export const bindableAssets = [
  { id:'AGENT-QUALITY-11', kind:'Agent' as const, name:'质量诊断 Agent', version:'v1.8' },
  { id:'KB-QUALITY-011', kind:'知识' as const, name:'Agent 质量治理规范', version:'2026.08' },
  { id:'DS-RUNTIME-METRICS', kind:'数据' as const, name:'运行指标聚合数据源', version:'schema-1.4' },
  { id:'CONTENT-REPORT-06', kind:'内容' as const, name:'运营周报模板', version:'v6' },
  { id:'SKILL-ROOT-CAUSE', kind:'Skill' as const, name:'异常根因分析', version:'v1.3.0' },
  { id:'TOOL-EVIDENCE-EXPORT', kind:'Tool' as const, name:'审计证据导出', version:'v1.1.0' },
];
