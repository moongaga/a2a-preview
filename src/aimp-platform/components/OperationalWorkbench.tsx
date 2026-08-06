import React, { useMemo, useState } from 'react';
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Edit3,
    History,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { canPerformAction } from '../model/access-policy';
import { getOperationalDefinition } from '../model/operational-definition';
import { prototypeStore } from '../model/store';
import type {
    CommandResult,
    EntityRecord,
    ModuleDefinition,
    ProductContext,
} from '../types';
import { StatusPill, Timeline } from './ProductComponents';

type Feedback = { tone: 'success' | 'error'; message: string };

const readField = (entity: EntityRecord, key: string) => {
    if (key === 'name') return entity.name;
    if (key === 'status') return entity.status;
    if (key === 'ownerId') return entity.ownerId;
    if (key === 'updatedAt') return entity.updatedAt || entity.fields.updatedAt || '-';
    return entity.fields[key] ?? '-';
};

const resultFeedback = (result: CommandResult, success: string): Feedback =>
    result.ok
        ? { tone: 'success', message: success }
        : { tone: 'error', message: result.message };

export function OperationalWorkbench({
    module,
    context,
    entities,
}: {
    module: ModuleDefinition;
    context: ProductContext;
    entities: EntityRecord[];
}) {
    const definition = getOperationalDefinition(module.id);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [owner, setOwner] = useState('all');
    const [showArchived, setShowArchived] = useState(false);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
    const [selected, setSelected] = useState<EntityRecord | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<EntityRecord | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [name, setName] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    if (!definition) return null;

    const owners = [...new Set(entities.map((item) => item.ownerId))];
    const filtered = useMemo(() => entities
        .filter((item) => showArchived ? Boolean(item.archivedAt) : !item.archivedAt)
        .filter((item) => status === 'all' || item.status === status)
        .filter((item) => owner === 'all' || item.ownerId === owner)
        .filter((item) => {
            const needle = query.trim().toLowerCase();
            if (!needle) return true;
            return `${item.name} ${item.ownerId} ${Object.values(item.fields).join(' ')}`
                .toLowerCase()
                .includes(needle);
        })
        .sort((left, right) => {
            const value = left.name.localeCompare(right.name, 'zh-CN');
            return sortDirection === 'asc' ? value : -value;
        }), [entities, owner, query, showArchived, sortDirection, status]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    const createPermission = canPerformAction(context, module.id, 'create');
    const updatePermission = canPerformAction(context, module.id, 'update');
    const archivePermission = canPerformAction(context, module.id, 'archive');
    const restorePermission = canPerformAction(context, module.id, 'restore');

    const openCreate = () => {
        setName('');
        setFieldValues(Object.fromEntries(definition.fields.map((field) => [field.key, ''])));
        setEditorMode('create');
        setSelected(null);
        setFeedback(null);
    };
    const openEdit = (entity: EntityRecord) => {
        setName(entity.name);
        setFieldValues(Object.fromEntries(definition.fields.map((field) => [
            field.key,
            String(entity.fields[field.key] ?? ''),
        ])));
        setSelected(entity);
        setEditorMode('edit');
        setFeedback(null);
    };
    const save = () => {
        const missing = definition.fields.find((field) => field.required && !fieldValues[field.key]?.trim());
        if (!name.trim() || missing) {
            setFeedback({
                tone: 'error',
                message: !name.trim() ? '名称不能为空' : `${missing?.label}为必填项`,
            });
            return;
        }
        if (editorMode === 'create') {
            const result = prototypeStore.createEntity({
                type: module.primaryObject,
                name: name.trim(),
                status: 'draft',
                ownerId: context.currentUserName,
                moduleId: module.id,
                fields: {
                    ...fieldValues,
                    version: context.versionId,
                    maturity: module.maturity,
                    updatedAt: new Date().toLocaleString('zh-CN'),
                },
                relations: [],
            });
            setFeedback(resultFeedback(result, `${module.name}对象已创建并写入本地数据库`));
            if (result.ok) {
                setEditorMode(null);
                setSelected(result.entity);
            }
            return;
        }
        if (!selected) return;
        const result = prototypeStore.updateEntity(selected.id, {
            name: name.trim(),
            fields: fieldValues,
            expectedRevision: selected.revision || 1,
        });
        setFeedback(resultFeedback(result, `${selected.name}已更新，修订号自动递增`));
        if (result.ok) {
            setEditorMode(null);
            setSelected(result.entity);
        }
    };
    const confirmArchive = () => {
        if (!archiveTarget) return;
        const result = prototypeStore.archiveEntity(archiveTarget.id);
        setFeedback(resultFeedback(result, `${archiveTarget.name}已归档，可在归档视图恢复`));
        setArchiveTarget(null);
        if (result.ok) setSelected(result.entity);
    };
    const restore = (entity: EntityRecord) => {
        const result = prototypeStore.restoreEntity(entity.id);
        setFeedback(resultFeedback(result, `${entity.name}已恢复为草稿`));
        if (result.ok) setSelected(result.entity);
    };
    const runStateAction = (entity: EntityRecord, action: { action: string; label: string; to: string }) => {
        const result = prototypeStore.transitionOperational(
            entity.id,
            action.action,
            action.to,
            context.currentUserName,
        );
        setFeedback(resultFeedback(result, `${action.label}成功，状态已更新为 ${action.to}`));
        if (result.ok) setSelected(result.entity);
    };
    const deleteDraft = (entity: EntityRecord) => {
        const result = prototypeStore.deleteDraft(entity.id);
        setFeedback(resultFeedback(result, `${entity.name}草稿已彻底删除`));
        if (result.ok) setSelected(null);
    };

    return (
        <section className="content-panel operational-workbench" data-workbench={definition.workbench}>
            <div className="panel-heading">
                <div>
                    <h2>{module.name}操作台</h2>
                    <p>真实查询、新增、编辑、归档、恢复和审计；刷新后数据继续保留。</p>
                </div>
                <div className="action-row">
                    <button
                        className={showArchived ? 'secondary-button is-active' : 'secondary-button'}
                        type="button"
                        onClick={() => {
                            setShowArchived((value) => !value);
                            setPage(1);
                        }}
                    >
                        <Archive size={15} />{showArchived ? '返回当前数据' : '归档视图'}
                    </button>
                    <button
                        className="primary-button"
                        type="button"
                        disabled={!createPermission.allowed}
                        title={createPermission.reason}
                        onClick={openCreate}
                    >
                        <Plus size={15} />新增{module.name}对象
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`command-feedback is-${feedback.tone}`} role="status">
                    <span>{feedback.message}</span>
                    <button type="button" onClick={() => setFeedback(null)}><X size={14} /></button>
                </div>
            )}

            <div className="operational-context-grid">
                <article><span>核心流程</span>{definition.workflowSteps.slice(0, 4).map((item) => <strong key={item}>{item}</strong>)}</article>
                <article><span>结果指标</span>{definition.resultMetrics.slice(0, 4).map((item) => <strong key={item}>{item}</strong>)}</article>
                <article><span>异常与治理</span>{definition.exceptionCases.slice(0, 4).map((item) => <strong key={item}>{item}</strong>)}</article>
            </div>

            <div className="operational-filters">
                <label className="search-box">
                    <Search size={15} />
                    <input
                        aria-label={`搜索${module.name}`}
                        value={query}
                        placeholder={`搜索名称、责任人或${definition.fields[0]?.label}`}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setPage(1);
                        }}
                    />
                </label>
                <select aria-label="状态筛选" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                    <option value="all">全部状态</option>
                    {definition.statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select aria-label="责任人筛选" value={owner} onChange={(event) => { setOwner(event.target.value); setPage(1); }}>
                    <option value="all">全部责任人</option>
                    {owners.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button className="secondary-button" type="button" onClick={() => setSortDirection((value) => value === 'asc' ? 'desc' : 'asc')}>
                    名称{sortDirection === 'asc' ? '升序' : '降序'}
                </button>
                <span className="result-count">{filtered.length} 条结果</span>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>名称</th>
                            <th>状态</th>
                            {definition.fields.slice(0, 2).map((field) => <th key={field.key}>{field.label}</th>)}
                            <th>责任人</th>
                            <th>修订</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((entity) => (
                            <tr key={entity.id}>
                                <td><strong>{entity.name}</strong><small>{entity.id}</small></td>
                                <td><StatusPill status={entity.status} /></td>
                                {definition.fields.slice(0, 2).map((field) => <td key={field.key}>{String(readField(entity, field.key))}</td>)}
                                <td>{entity.ownerId}</td>
                                <td>r{entity.revision || 1}</td>
                                <td>
                                    <div className="row-actions">
                                        <button className="text-button" type="button" onClick={() => setSelected(entity)}>查看</button>
                                        {!entity.archivedAt && <button className="text-button" type="button" disabled={!updatePermission.allowed} title={updatePermission.reason} onClick={() => openEdit(entity)}>编辑</button>}
                                        {entity.archivedAt
                                            ? <button className="text-button" type="button" disabled={!restorePermission.allowed} title={restorePermission.reason} onClick={() => restore(entity)}>恢复</button>
                                            : <button className="text-button is-danger" type="button" disabled={!archivePermission.allowed} title={archivePermission.reason} onClick={() => setArchiveTarget(entity)}>归档</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!rows.length && (
                            <tr><td colSpan={7}><div className="operational-empty">没有符合当前条件的数据，请调整筛选或新增对象。</div></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <label>每页
                    <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                    </select>
                </label>
                <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /></button>
                <span>{safePage} / {totalPages}</span>
                <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={15} /></button>
            </div>

            {editorMode && (
                <div className="operational-overlay" role="dialog" aria-modal="true" aria-label={editorMode === 'create' ? `新增${module.name}` : `编辑${module.name}`}>
                    <div className="operational-dialog">
                        <header><div><span>{editorMode === 'create' ? 'CREATE' : 'EDIT'} · {definition.workbench}</span><h3>{editorMode === 'create' ? `新增${module.name}对象` : `编辑${selected?.name}`}</h3></div><button type="button" onClick={() => setEditorMode(null)}><X /></button></header>
                        <div className="operational-form">
                            <label className="span-two"><span>名称 *</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
                            {definition.fields.map((field) => (
                                <label key={field.key} className={field.type === 'textarea' ? 'span-two' : ''}>
                                    <span>{field.label}{field.required ? ' *' : ''}</span>
                                    {field.type === 'textarea'
                                        ? <textarea value={fieldValues[field.key] || ''} onChange={(event) => setFieldValues((values) => ({ ...values, [field.key]: event.target.value }))} />
                                        : field.type === 'select'
                                            ? <select value={fieldValues[field.key] || ''} onChange={(event) => setFieldValues((values) => ({ ...values, [field.key]: event.target.value }))}><option value="">请选择</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
                                            : <input value={fieldValues[field.key] || ''} onChange={(event) => setFieldValues((values) => ({ ...values, [field.key]: event.target.value }))} />}
                                </label>
                            ))}
                        </div>
                        <footer><span>保存后写入 IndexedDB，并生成审计记录</span><button className="secondary-button" type="button" onClick={() => setEditorMode(null)}>取消</button><button className="primary-button" type="button" onClick={save}>保存</button></footer>
                    </div>
                </div>
            )}

            {selected && !editorMode && (
                <div className="operational-overlay" role="dialog" aria-modal="true" aria-label={`${selected.name}详情`}>
                    <div className="operational-dialog detail-dialog">
                        <header><div><span>{module.code} · r{selected.revision || 1}</span><h3>{selected.name}</h3></div><button type="button" onClick={() => setSelected(null)}><X /></button></header>
                        <div className="detail-summary">
                            <article><span>状态</span><StatusPill status={selected.status} /></article>
                            <article><span>责任人</span><strong>{selected.ownerId}</strong></article>
                            <article><span>更新时间</span><strong>{String(readField(selected, 'updatedAt'))}</strong></article>
                            <article><span>关联对象</span><strong>{selected.relations.length}</strong></article>
                        </div>
                        <div className="operational-form readonly-form">
                            {definition.fields.map((field) => <label key={field.key}><span>{field.label}</span><strong>{String(selected.fields[field.key] ?? '-')}</strong></label>)}
                        </div>
                        <div className="state-action-panel">
                            <h4>当前可执行状态动作</h4>
                            <div className="action-row">
                                {definition.stateActions.filter((action) => action.from === selected.status).map((action) => {
                                    const permission = canPerformAction(
                                        context,
                                        module.id,
                                        ['approve', 'publish', 'handoff'].includes(action.action) ? action.action : 'update',
                                    );
                                    return <button className="secondary-button" type="button" key={action.action} disabled={!permission.allowed} title={permission.reason} onClick={() => runStateAction(selected, action)}>{action.label} → {action.to}</button>;
                                })}
                                {!definition.stateActions.some((action) => action.from === selected.status) && <span>当前状态没有可执行动作</span>}
                            </div>
                        </div>
                        <div className="audit-section"><h4><History size={15} />操作与审计</h4><Timeline entity={selected} /></div>
                        <footer>
                            <span>{selected.archivedAt ? `归档于 ${selected.archivedAt}` : '当前业务对象'}</span>
                            {selected.status === 'draft' && !selected.relations.length && <button className="secondary-button danger-button" type="button" onClick={() => deleteDraft(selected)}><Trash2 size={15} />删除草稿</button>}
                            {!selected.archivedAt && <button className="secondary-button" type="button" disabled={!updatePermission.allowed} title={updatePermission.reason} onClick={() => openEdit(selected)}><Edit3 size={15} />编辑</button>}
                            {selected.archivedAt
                                ? <button className="primary-button" type="button" disabled={!restorePermission.allowed} title={restorePermission.reason} onClick={() => restore(selected)}><RotateCcw size={15} />恢复</button>
                                : <button className="primary-button" type="button" disabled={!archivePermission.allowed} title={archivePermission.reason} onClick={() => setArchiveTarget(selected)}><Archive size={15} />归档</button>}
                        </footer>
                    </div>
                </div>
            )}

            {archiveTarget && (
                <div className="operational-overlay" role="dialog" aria-modal="true" aria-label="归档影响确认">
                    <div className="operational-dialog archive-dialog">
                        <header><div><span>IMPACT CHECK</span><h3>归档 {archiveTarget.name}</h3></div><button type="button" onClick={() => setArchiveTarget(null)}><X /></button></header>
                        <div className="archive-impact">
                            <p>该对象被 {archiveTarget.relations.length} 个上下游关系引用。归档后不再出现在当前业务列表，但审计记录和关系仍保留。</p>
                            {archiveTarget.relations.map((relation) => <article key={`${relation.type}-${relation.targetId}`}><Archive size={15} /><span>{relation.type}</span><strong>{relation.targetId}</strong></article>)}
                            {!archiveTarget.relations.length && <article><Archive size={15} /><span>影响分析</span><strong>没有下游引用，可安全归档</strong></article>}
                        </div>
                        <footer><span>归档后可从归档视图恢复</span><button className="secondary-button" type="button" onClick={() => setArchiveTarget(null)}>取消</button><button className="primary-button" type="button" onClick={confirmArchive}>确认归档</button></footer>
                    </div>
                </div>
            )}
        </section>
    );
}
