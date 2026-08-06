import type { RoleId } from '../types';

export type RoleQueueMode = 'approval' | 'training' | 'execution' | 'operations';

export interface RoleWorkspaceDefinition {
    role: RoleId;
    title: string;
    subtitle: string;
    queueLabel: string;
    queueMode: RoleQueueMode;
    primaryObject: string;
    primaryActions: string[];
    summaryLabels: string[];
    successCopy: string;
    emptyCopy: string;
    handoffCopy: string;
}

export const roleWorkspaces: Record<RoleId, RoleWorkspaceDefinition> = {
    business: {
        role: 'business',
        title: '今天先把关键业务决策做完',
        subtitle: 'Agent 已经完成诊断，你只需要确认策略、分派动作，并跟踪结果。',
        queueLabel: '待你决策',
        queueMode: 'approval',
        primaryObject: '业务策略',
        primaryActions: ['批准跟进策略', '驳回并说明原因', '分派给负责人'],
        summaryLabels: ['待审批策略', '异常线索', '本周已转化'],
        successCopy: '决策已提交，相关任务已进入执行队列。',
        emptyCopy: '当前没有需要你决策的业务事项。',
        handoffCopy: '需要业务负责人确认后，Agent 才会继续执行。',
    },
    trainer: {
        role: 'trainer',
        title: '把 Agent 的下一次回答训练得更好',
        subtitle: '从真实 Badcase 出发，修复知识或 Prompt，评估通过后再发布。',
        queueLabel: '待训练样本',
        queueMode: 'training',
        primaryObject: 'Agent 训练样本',
        primaryActions: ['标记为 Badcase', '修改 Prompt', '发起评估'],
        summaryLabels: ['待修复 Badcase', '知识缺口', '待发布版本'],
        successCopy: '训练变更已保存，评估任务已创建。',
        emptyCopy: '当前没有新的训练样本。',
        handoffCopy: '发布前需要评估结果达到通过标准。',
    },
    employee: {
        role: 'employee',
        title: '先完成你今天最重要的几项任务',
        subtitle: 'Agent 已经准备好建议，你负责补充现场信息并做最后确认。',
        queueLabel: '我的待办',
        queueMode: 'execution',
        primaryObject: '工作任务',
        primaryActions: ['接受 Agent 建议', '补充信息', '确认并提交'],
        summaryLabels: ['待处理任务', '等待我确认', '今天已完成'],
        successCopy: '结果已提交，相关业务记录已同步更新。',
        emptyCopy: '今天没有新的待办，可以查看最近完成的任务。',
        handoffCopy: 'Agent 无法代替你的现场判断，请补充信息后继续。',
    },
    admin: {
        role: 'admin',
        title: '保持平台稳定，及时处理高风险事项',
        subtitle: '优先处理运行告警、权限风险和 Agent 异常，避免影响业务团队。',
        queueLabel: '需要处理的风险',
        queueMode: 'operations',
        primaryObject: '平台风险',
        primaryActions: ['停用异常 Agent', '恢复服务', '调整权限'],
        summaryLabels: ['运行告警', '权限风险', '异常 Agent'],
        successCopy: '平台处置已完成，审计记录已写入。',
        emptyCopy: '当前没有高风险平台事项。',
        handoffCopy: '该处置会影响其他用户，需要保留审计并确认影响范围。',
    },
    superadmin: {
        role: 'superadmin', title: '治理全平台租户、风险与连续性', subtitle: '聚焦跨租户策略、安全、灾备和不可篡改审计。', queueLabel: '平台治理事项', queueMode: 'operations', primaryObject: '治理风险', primaryActions: ['查看影响范围', '审批治理策略', '发起应急处置'], summaryLabels: ['跨租户风险', '待审策略', '灾备事项'], successCopy: '治理动作已执行并生成全局审计。', emptyCopy: '当前没有高优先级治理事项。', handoffCopy: '高风险操作需要双人复核。',
    },
    client: {
        role: 'client', title: '查看本租户 AI 产品交付与效果', subtitle: '这里只展示品牌方 A 的产品、SLA、费用和服务事项。', queueLabel: '客户服务事项', queueMode: 'execution', primaryObject: '客户服务事项', primaryActions: ['查看交付进度', '确认结果', '提交服务事项'], summaryLabels: ['已购产品', 'SLA 状态', '待确认结果'], successCopy: '客户反馈已提交并进入服务队列。', emptyCopy: '当前没有待处理的客户事项。', handoffCopy: '服务事项已交由平台交付团队处理。',
    },
};
