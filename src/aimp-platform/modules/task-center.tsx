import React from 'react';
import { AlertTriangle, CheckCircle2, CircleUserRound, GitBranch, Play, UserCheck } from 'lucide-react';
import { EntityTable, FieldGrid, FilterBar, StatusPill, Timeline } from '../components/ProductComponents';
import type { DeepModuleProps } from './types';

const taskSteps = ['业务目标', '数据范围', 'Agent 推荐', '能力与知识授权', '审批路径', '确认提交'];

export function TaskCenterWorkspace({ page, moduleEntities, openEntity, onAction, permissionFor }: DeepModuleProps) {
    const leadTask = moduleEntities.find((item) => item.name.includes('华南新能源')) || moduleEntities[0];
    const approvalTask = moduleEntities.find((item) => item.status === 'pending_approval') || leadTask;
    if (page.id === 'pool') {
        return <section className="content-panel"><div className="panel-heading"><div><h2>任务池</h2><p>按业务场景、状态、优先级、Agent、SLA 和业务指标统一管理。</p></div><span>跨场景任务</span></div><FilterBar count={moduleEntities.length} /><EntityTable entities={moduleEntities} onOpen={openEntity} /></section>;
    }
    if (page.id === 'create') {
        return (
            <section className="content-panel">
                <div className="panel-heading"><div><h2>创建业务任务</h2><p>六步完成业务目标、数据范围、能力装配和审批路径确认。</p></div><span>草稿自动保存</span></div>
                <div className="stepper">{taskSteps.map((step, index) => <div className={index < 2 ? 'is-current' : ''} key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}</div>
                <div className="form-grid">
                    <label><span>任务名称 *</span><input defaultValue="华南新能源线索诊断与培育" /></label>
                    <label><span>业务场景 *</span><select defaultValue="leads"><option value="leads">线索转化</option><option value="content">内容生产</option><option value="commerce">商城运营</option><option value="koc">KOC运营</option></select></label>
                    <label className="span-two"><span>业务目标 *</span><textarea defaultValue="将有效线索转化率从 8.4% 提升至 11.0%，优先识别未来30天内高意向客户。" /></label>
                    <label><span>线索范围 *</span><input defaultValue="华南区域 · 近90天 · 1,286条" /></label>
                    <label><span>建议 Agent</span><input defaultValue="线索诊断 Agent v2.3" /></label>
                </div>
                <div className="form-footer"><span>已完成 8/8 项前置校验</span><button className="secondary-button" type="button" disabled={!permissionFor('create').allowed} title={permissionFor('create').reason}>保存草稿</button><button className="primary-button" type="button" disabled={!permissionFor('create').allowed} title={permissionFor('create').reason}>下一步：数据范围</button></div>
            </section>
        );
    }
    if (page.id === 'approvals') {
        return (
            <section className="content-panel">
                <div className="panel-heading"><div><h2>审批队列</h2><p>审批结论必须附带业务依据，驳回后返回任务配置节点。</p></div><span>3 项待处理</span></div>
                <div className="approval-card">
                    <div><strong>{approvalTask.name}</strong><p>目标：{String(approvalTask.fields.businessGoal || '')}</p><small>数据范围：386 条线索 · 风险：中 · 预计成本：¥1,160</small></div>
                    <div className="evidence-list"><span><CheckCircle2 />数据授权已通过</span><span><CheckCircle2 />Agent 测试通过率 97.2%</span><span><AlertTriangle />2 个高价值客户需人工确认</span></div>
                    <textarea aria-label="审批意见" defaultValue="同意按30%流量影子运行，观察24小时后进入正式培育。" />
                    <div className="action-row"><button className="secondary-button" type="button" disabled={!permissionFor('approve').allowed} title={permissionFor('approve').reason}>要求补充</button><button className="secondary-button" type="button" disabled={!permissionFor('approve').allowed} title={permissionFor('approve').reason}>驳回</button><button className="primary-button" type="button" disabled={!permissionFor('approve').allowed} title={permissionFor('approve').reason} onClick={() => onAction(approvalTask, 'approve', '业务负责人批准任务进入队列')}>通过并进入队列</button></div>
                </div>
            </section>
        );
    }
    if (page.id === 'runs') {
        return (
            <section className="content-panel">
                <div className="panel-heading"><div><h2>执行跟踪</h2><p>查看工作流节点、Agent版本、知识证据、Tool调用和异常。</p></div><StatusPill status={leadTask.status} /></div>
                <div className="run-flow">{['读取授权线索', '画像与意向评分', '知识检索', '生成诊断', '业务审批', '培育触达'].map((step, index) => <article className={index < 3 ? 'is-done' : index === 3 ? 'is-running' : ''} key={step}><span>{index < 3 ? <CheckCircle2 /> : index === 3 ? <Play /> : index + 1}</span><strong>{step}</strong><small>{index < 3 ? '已完成' : index === 3 ? '运行中 · 68%' : '等待上游'}</small></article>)}</div>
                <div className="two-column compact"><div className="evidence-panel"><h3>当前节点证据</h3><p>Prompt：线索诊断 Prompt v1.8</p><p>知识包：新能源销售授权知识包 v3.2</p><p>Tool：CRM 线索读写 · 只读范围</p></div><div className="evidence-panel"><h3>运行指标</h3><p>P95 延迟：4.2秒</p><p>当前成本：¥1,246 / 预算 ¥3,860</p><p>人工确认：2 条高风险结果</p></div></div>
            </section>
        );
    }
    if (page.id === 'handoffs') {
        return (
            <section className="content-panel">
                <div className="panel-heading"><div><h2>人工接管</h2><p>自动流程暂停后，由业务负责人处理高风险判断并恢复。</p></div><span>2 项接近 SLA</span></div>
                <div className="handoff-card"><UserCheck /><div><strong>高价值客户意向冲突</strong><p>模型评分 0.86，但近30天存在退订记录，需要人工确认是否进入培育。</p><small>剩余 SLA 36 分钟 · 责任人 周敏</small></div><button className="secondary-button" type="button" disabled={!permissionFor('handoff').allowed} title={permissionFor('handoff').reason} onClick={() => onAction(leadTask, 'handoff', '高价值线索转人工确认')}>接管处理</button></div>
                <div className="handoff-card"><CircleUserRound /><div><strong>企业客户归属冲突</strong><p>CRM 中存在两个销售团队归属，系统禁止自动触达。</p><small>剩余 SLA 1小时12分钟 · 责任人 李哲</small></div><button className="secondary-button" type="button">查看上下文</button></div>
            </section>
        );
    }
    if (page.id === 'acceptance') {
        return (
            <section className="content-panel">
                <div className="panel-heading"><div><h2>结果验收</h2><p>业务结论、指标变化、未解决问题和样本回流必须同时确认。</p></div><span>待业务负责人确认</span></div>
                <div className="acceptance-grid"><article><span>有效线索识别</span><strong>328 条</strong><small>较基线 +18.4%</small></article><article><span>预计转化率</span><strong>10.6%</strong><small>距离目标 0.4pp</small></article><article><span>需人工跟进</span><strong>27 条</strong><small>已分配销售顾问</small></article><article><span>Badcase</span><strong>8 条</strong><small>已回流递归成长</small></article></div>
                <div className="action-row"><button className="secondary-button" type="button" disabled={!permissionFor('complete').allowed} title={permissionFor('complete').reason}>退回补充</button><button className="primary-button" type="button" disabled={!permissionFor('complete').allowed} title={permissionFor('complete').reason} onClick={() => onAction(leadTask, 'complete', '业务负责人确认诊断结果并回流指标')}>确认结果并回流指标</button></div>
            </section>
        );
    }
    if (page.id === 'audit') return <section className="content-panel"><div className="panel-heading"><h2>任务审计</h2><span>不可编辑</span></div><Timeline entity={leadTask} /></section>;
    return <section className="content-panel"><div className="panel-heading"><h2>任务详情</h2><StatusPill status={leadTask.status} /></div><FieldGrid entity={leadTask} /><div className="action-row"><button className="secondary-button" type="button"><GitBranch />查看工作流</button><button className="primary-button" type="button" onClick={() => openEntity(leadTask)}>打开统一对象详情</button></div></section>;
}
