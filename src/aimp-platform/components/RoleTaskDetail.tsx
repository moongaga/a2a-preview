import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Hand, Sparkles } from 'lucide-react';
import { getRoleObjectFields, getRoleWorkspace } from '../model/role-workspace';
import { StatusPill } from './ProductComponents';
import type { EntityRecord, RoleId } from '../types';

type RoleAction = { label: string; action: string; tone?: 'primary' | 'secondary' };

function actionsFor(role: RoleId, entity: EntityRecord): RoleAction[] {
    if (role === 'business') {
        if (entity.status === 'pending_approval') return [{ label: '批准跟进策略', action: 'approve', tone: 'primary' }, { label: '驳回并说明原因', action: 'reject' }];
        return [{ label: '交给人工处理', action: 'handoff', tone: 'primary' }, { label: '确认业务结果', action: 'complete' }];
    }
    if (role === 'trainer') {
        if (entity.type === 'agent' && entity.status === 'degraded') return [{ label: '恢复 Agent', action: 'recover', tone: 'primary' }, { label: '标记为 Badcase', action: 'degrade' }];
        if (entity.status === 'draft') return [{ label: '发起评估', action: 'submit', tone: 'primary' }, { label: '继续修改', action: 'update' }];
        return [{ label: '查看评估结果', action: 'test', tone: 'primary' }, { label: '下线版本', action: 'offline' }];
    }
    if (role === 'employee') {
        if (entity.status === 'queued') return [{ label: '接受 Agent 建议', action: 'start', tone: 'primary' }, { label: '请求人工接管', action: 'handoff' }];
        return [{ label: '确认并提交', action: 'complete', tone: 'primary' }, { label: '请求人工接管', action: 'handoff' }];
    }
    if (entity.type === 'agent' && entity.status === 'active') return [{ label: '停用异常 Agent', action: 'offline', tone: 'primary' }, { label: '查看运行日志', action: 'test' }];
    if (entity.type === 'agent' && entity.status === 'degraded') return [{ label: '恢复服务', action: 'recover', tone: 'primary' }, { label: '停用 Agent', action: 'offline' }];
    return [{ label: '查看影响范围', action: 'test', tone: 'primary' }, { label: '保留并转交处理', action: 'handoff' }];
}

export function RoleTaskDetail({ role, entity, onAction }: { role: RoleId; entity: EntityRecord; onAction: (entity: EntityRecord, action: string) => void }) {
    const workspace = getRoleWorkspace(role);
    const [feedback, setFeedback] = useState<string | null>(null);
    const actions = actionsFor(role, entity);
    return <section className="role-task-detail">
        <div className="role-task-summary"><div><span className="eyebrow">{workspace.primaryObject}</span><h2>{entity.name}</h2><p>{workspace.subtitle}</p></div><StatusPill status={entity.status} /></div>
        <div className="role-task-agent"><Sparkles size={17} /><div><strong>Agent 给你的建议</strong><p>{getRoleObjectFields(role, entity).find((field) => field.label === 'Agent 建议')?.value || workspace.handoffCopy}</p></div></div>
        <dl className="role-task-fields">{getRoleObjectFields(role, entity).map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
        <div className="role-task-actions"><div><strong>下一步怎么做</strong><small>选择后会写回任务状态，并通知相关负责人。</small></div><div className="action-row">{actions.map((item) => <button key={item.action} className={item.tone === 'primary' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => { onAction(entity, item.action); setFeedback(`${item.label}已提交。${workspace.successCopy}`); }}><Hand size={14} />{item.label}<ArrowRight size={14} /></button>)}</div></div>
        {feedback && <div className="role-task-feedback"><CheckCircle2 size={16} /><span>{feedback}</span></div>}
    </section>;
}

