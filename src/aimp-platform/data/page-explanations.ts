import type { RouteState } from '../model/router';
import type { RoleId } from '../types';

export interface PageExplanation {
    title: string;
    purpose: string;
    inputs: string[];
    outputs: string[];
    actions: string[];
    states: string[];
    dataFlow: string;
}

export function getPageExplanation(route: RouteState, role: RoleId): PageExplanation {
    if (route.page === 'lead') return {
        title: '线索中心工作台', purpose: '让当前岗位在一条链路内完成线索清洗、分配、培育、质检、升级和结果回流。',
        inputs: ['线索来源与客户信息', 'AI 意向评分与建议', '区域与团队容量', '当前岗位和数据范围'],
        outputs: ['线索状态', '负责人和执行队列', '培育结果', '质量与转化指标'],
        actions: role === 'employee' ? ['开始跟进', '提交结果', '请求接管'] : ['生成分级建议', '批准策略', '异常升级'],
        states: ['待清洗', '已分级', '待分配', '培育中', '待确认', '已转化/继续培育/失联'],
        dataFlow: '渠道/直播/经销商 → 线索中心 → 执行岗位 → CFT/质量监督 → CRM 与指标回流',
    };
    if (route.page === 'cockpit') return {
        title: '角色工作台', purpose: '聚合当前岗位最需要处理的任务、决策和异常。', inputs: ['角色身份', '可见任务', '业务对象状态'], outputs: ['任务处理结果', '审批或反馈', '下一责任人'], actions: ['打开任务', '处理下一步', '查看结果'], states: ['正常', '空数据', '异常', '人工接管'], dataFlow: '统一状态仓 → 角色队列 → 用户动作 → 业务对象与审计',
    };
    if (route.page === 'module') return {
        title: '模块工作页面', purpose: '处理当前模块业务对象。评审信息仅在交付模式查看。', inputs: ['筛选条件', '业务字段', '角色权限'], outputs: ['对象变更', '状态结果', '审计事件'], actions: ['查询', '新建', '编辑', '业务状态动作'], states: ['加载', '空数据', '可操作', '只读', '无权限', '错误'], dataFlow: '用户输入 → 业务规则 → 对象状态仓 → 下游模块与审计',
    };
    return { title: '当前页面说明', purpose: '说明当前页面的用户目标和交互边界。', inputs: ['页面上下文', '角色与版本'], outputs: ['业务结果或导航结果'], actions: ['查看', '处理', '返回'], states: ['正常', '空数据', '异常'], dataFlow: '上游页面 → 当前操作 → 下游页面/业务对象' };
}
