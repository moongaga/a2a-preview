import React, { type ReactNode } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    LockKeyhole,
    Search,
    UserRoundCheck,
} from 'lucide-react';
import type { EntityRecord } from '../types';

export function StatusPill({ status }: { status: string }) {
    const tone = /active|published|succeeded|completed|resolved|closed/.test(status)
        ? 'success'
        : /failed|error|offline|blocked/.test(status)
            ? 'danger'
            : /running|review|approval|handling|human|paused/.test(status)
                ? 'warning'
                : 'neutral';
    return <span className={`status-pill is-${tone}`}>{status}</span>;
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    requirementBadges,
}: {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
    requirementBadges?: ReactNode;
}) {
    return (
        <header className="page-header">
            <div>
                <span className="eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                <p>{description}</p>
                {requirementBadges && <div className="fr-row">{requirementBadges}</div>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </header>
    );
}

export function MetricStrip({ items }: { items: Array<{ label: string; value: string; trend?: string }> }) {
    return (
        <section className="metric-strip">
            {items.map((item) => (
                <article className="metric-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    {item.trend && <small>{item.trend}</small>}
                </article>
            ))}
        </section>
    );
}

export function FilterBar({ count }: { count: number }) {
    return (
        <div className="filter-bar">
            <label className="search-box">
                <Search size={16} />
                <input aria-label="搜索" placeholder="搜索名称、负责人或业务对象" />
            </label>
            <button type="button" className="secondary-button">状态：全部</button>
            <button type="button" className="secondary-button">负责人：全部</button>
            <span className="result-count">{count} 条结果</span>
        </div>
    );
}

export function EntityTable({
    entities,
    onOpen,
}: {
    entities: EntityRecord[];
    onOpen: (entity: EntityRecord) => void;
}) {
    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>名称</th>
                        <th>状态</th>
                        <th>负责人</th>
                        <th>版本/优先级</th>
                        <th>更新时间</th>
                        <th aria-label="操作" />
                    </tr>
                </thead>
                <tbody>
                    {entities.map((entity) => (
                        <tr key={entity.id}>
                            <td><strong>{entity.name}</strong><small>{entity.id}</small></td>
                            <td><StatusPill status={entity.status} /></td>
                            <td>{entity.ownerId}</td>
                            <td>{String(entity.fields.version || entity.fields.priority || '—')}</td>
                            <td>{String(entity.fields.updatedAt || '—')}</td>
                            <td><button className="text-button" type="button" onClick={() => onOpen(entity)}>查看 <ArrowRight size={14} /></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function FieldGrid({ entity }: { entity: EntityRecord }) {
    return (
        <dl className="field-grid">
            <div><dt>对象编号</dt><dd>{entity.id}</dd></div>
            <div><dt>当前状态</dt><dd><StatusPill status={entity.status} /></dd></div>
            <div><dt>负责人</dt><dd>{entity.ownerId}</dd></div>
            <div><dt>所属模块</dt><dd>{entity.moduleId}</dd></div>
            {Object.entries(entity.fields).map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd>{Array.isArray(value) ? value.join('、') : String(value)}</dd></div>
            ))}
        </dl>
    );
}

export function Timeline({ entity }: { entity: EntityRecord }) {
    return (
        <div className="timeline">
            {entity.events.map((event) => (
                <article key={event.id}>
                    <span className="timeline-dot" />
                    <div><strong>{event.action}</strong><p>{event.detail}</p><small>{event.actor} · {new Date(event.at).toLocaleString('zh-CN')}</small></div>
                </article>
            ))}
        </div>
    );
}

export function RelationCards({
    related,
    onOpen,
}: {
    related: Array<{ relation: string; entity: EntityRecord }>;
    onOpen: (entity: EntityRecord) => void;
}) {
    if (!related.length) return <StatePanel state="empty" />;
    return (
        <div className="relation-grid">
            {related.map(({ relation, entity }) => (
                <button type="button" key={`${relation}-${entity.id}`} onClick={() => onOpen(entity)}>
                    <span>{relation}</span><strong>{entity.name}</strong><small>{entity.id} · {entity.status}</small>
                </button>
            ))}
        </div>
    );
}

export function StatePanel({ state, onAction }: { state: string; onAction?: () => void }) {
    const content: Record<string, { icon: ReactNode; title: string; text: string; action: string }> = {
        empty: { icon: <Clock3 />, title: '当前没有数据', text: '调整筛选条件，或创建本模块的第一个业务对象。', action: '创建对象' },
        error: { icon: <AlertTriangle />, title: '数据加载失败', text: '已保留当前筛选和业务上下文，可以安全重试。', action: '重新加载' },
        forbidden: { icon: <LockKeyhole />, title: '无权访问', text: '当前角色没有查看此对象的权限，可发起授权申请。', action: '申请权限' },
        readonly: { icon: <UserRoundCheck />, title: '当前为只读状态', text: '对象正在审核或已归档，暂不可修改。', action: '查看审核记录' },
        handoff: { icon: <UserRoundCheck />, title: '等待人工接管', text: '自动流程已暂停，责任人处理后可以恢复。', action: '进入接管工作台' },
        success: { icon: <CheckCircle2 />, title: '操作已完成', text: '状态、业务结果和审计记录已同步。', action: '查看结果' },
    };
    const selected = content[state] || content.error;
    return (
        <section className={`state-panel is-${state}`}>
            {selected.icon}<div><strong>{selected.title}</strong><p>{selected.text}</p></div>
            {onAction && <button type="button" className="secondary-button" onClick={onAction}>{selected.action}</button>}
        </section>
    );
}
