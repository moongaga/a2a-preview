import type { RoleId } from '../types';

export type LeadCenterWorkspace = 'pool' | 'allocation' | 'nurture' | 'quality' | 'escalation' | 'weekly';

export interface LeadCenterLens {
    role: RoleId;
    label: string;
    organization: string;
    position: string;
    responsibility: string;
    reportingLine: string;
    cftResponsibility: string;
}

export const leadCenterLenses: Record<RoleId, LeadCenterLens> = {
    business: {
        role: 'business', label: '线索 CFT 负责人', organization: '营销总部 · 线索 CFT', position: '线索业务负责人', responsibility: '统一需求、目标、资源分配与转化结果', reportingLine: '营销总部：科员 → 科长 → 副部长/部长 → 副总部长/总部长', cftResponsibility: '牵头 MKT、ROD、DNDC 线索中心周双会',
    },
    employee: {
        role: 'employee', label: '客户培育室执行岗', organization: 'DNDC · 线索中心 · 客户培育室', position: '电销专员 / 线上产品顾问', responsibility: '执行分配的线索培育任务并回写跟进结果', reportingLine: 'DNDC：员工 → 经理 → 总监 → 副总经理 → 总经理', cftResponsibility: '按 CFT 策略执行触达，发现异常及时升级',
    },
    trainer: {
        role: 'trainer', label: '线索 AI 能力支持', organization: 'DNDC · 数字营销能力中台', position: '数据/AI 产品支持', responsibility: '维护评分、分级、培育建议和数据回流能力', reportingLine: 'DNDC：员工 → 经理 → 总监 → 副总经理 → 总经理', cftResponsibility: '为线索中心提供工具、数据和 Agent 能力支持',
    },
    admin: {
        role: 'admin', label: '线索运营管理', organization: 'DNDC · 线索中心', position: '中心经理 / 运营管理', responsibility: '管理线索质量、达成进度、主播与渠道资源', reportingLine: 'DNDC：员工 → 经理 → 总监 → 副总经理 → 总经理', cftResponsibility: '承接营销总部穿透指标，推动中心内部 ONE TEAM',
    },
    superadmin: {
        role: 'superadmin', label: '平台治理观察', organization: 'AIMP 平台治理', position: '超级管理员', responsibility: '审计跨组织 Agent 管控与权限边界', reportingLine: '平台治理线：平台管理员 → 超级管理员', cftResponsibility: '只观察管控证据，不介入线索业务执行',
    },
    client: {
        role: 'client', label: '客户租户观察', organization: '品牌方 A', position: '客户管理员', responsibility: '仅查看本租户交付效果', reportingLine: '客户组织内部汇报线', cftResponsibility: '通过 M17 查看，不进入内部线索操作',
    },
};

export const leadCenterActionPolicy: Record<RoleId, string[]> = {
    business: ['query', 'score', 'recommend', 'start', 'submit', 'approve', 'reject', 'retry', 'takeover', 'convert', 'nurture', 'lose'],
    employee: ['query', 'start', 'submit', 'takeover'],
    trainer: ['query', 'score', 'retry', 'takeover'],
    admin: ['query', 'retry', 'takeover'],
    superadmin: ['query'],
    client: ['query'],
};

export const leadCenterOperatingUnits = ['直播线索室', '客户培育室', '经销商支持室', '广告线索室'];

export const leadCenterWorkspaces: Array<{ id: LeadCenterWorkspace; label: string; description: string }> = [
    { id: 'pool', label: '线索池', description: '查看新增线索、来源和意向分布' },
    { id: 'allocation', label: '分级与分配', description: '将高意向线索分配给合适团队' },
    { id: 'nurture', label: '培育执行', description: '跟踪触达、跟进和培育进度' },
    { id: 'quality', label: '质量监督', description: '检查线索质量、评分和渠道效果' },
    { id: 'escalation', label: '异常升级', description: '处理低置信度、超时和资源冲突' },
    { id: 'weekly', label: '周双会复盘', description: '统一目标、进度、资源与结果回流' },
];

export const leadStages = [
    { id: 'new', label: '进入', description: '媒体/直播/广告线索进入' },
    { id: 'scored', label: '清洗分级', description: '去重、评分、意向分层' },
    { id: 'pending_followup', label: '资源分配', description: '匹配区域、团队和负责人' },
    { id: 'in_progress', label: '培育执行', description: '触达、跟进、补充现场信息' },
    { id: 'pending_approval', label: '质量监督', description: '异常、低置信度和策略确认' },
    { id: 'converted', label: '结果回流', description: '转化、继续培育或失联' },
];

export const leadCenterMetrics = [
    { label: '今日新增线索', value: '286', trend: '+18% vs 昨日' },
    { label: '高意向待分配', value: '42', trend: '需 2 小时内处理' },
    { label: '培育中线索', value: '1,284', trend: '3 个团队执行中' },
    { label: '本周转化率', value: '18.4%', trend: '+3.2pp vs 上周' },
];
