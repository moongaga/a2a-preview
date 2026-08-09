import React, { useState } from 'react';
import { Activity, Bot, CheckCircle2, ChevronRight, Database, FileText, FolderKanban, LibraryBig, Milestone, ShieldCheck, Users, X } from 'lucide-react';
import type { RoleId } from '../../types';
import {
    workspaceActivities,
    workspaceAgents,
    workspaceRoleProfiles,
    workspaceTasks,
    toWorkspaceProject,
    type WorkspaceProjectRecord,
} from './workspace-contract';
import type { WorkspaceDialogState } from './WorkspaceDialogHost';
import { useDeliveryProjectRegistry } from '../delivery-management/delivery-registry-store';

export type ProjectTabId = 'overview' | 'milestones' | 'tasks' | 'members' | 'agents' | 'resources' | 'delivery' | 'activity';
export const projectTabs: Array<{ id: ProjectTabId; label: string }> = [
    { id: 'overview', label: '概览' },
    { id: 'milestones', label: '里程碑' },
    { id: 'tasks', label: '任务' },
    { id: 'members', label: '成员' },
    { id: 'agents', label: 'Agent' },
    { id: 'resources', label: '知识/数据/内容' },
    { id: 'delivery', label: '交付关联' },
    { id: 'activity', label: '动态' },
];

function RecordList({ records, onOpen }: { records: WorkspaceProjectRecord[]; onOpen?: (record: WorkspaceProjectRecord) => void }) {
    return <div className="m04-record-list">{records.map((record) => onOpen
        ? <button type="button" key={record.id} onClick={() => onOpen(record)}><span><strong>{record.id} · {record.title}</strong><small>{record.meta}</small></span><em>{record.status}</em><ChevronRight size={15} /></button>
        : <article key={record.id}><span><strong>{record.title}</strong><small>{record.meta}</small></span><em>{record.status}</em></article>)}</div>;
}

export function WorkspaceProjectDrawer({
    projectId,
    role,
    onClose,
    onDialog,
}: {
    projectId: string;
    role: RoleId;
    onClose: () => void;
    onDialog: (dialog: WorkspaceDialogState) => void;
}) {
    const registry = useDeliveryProjectRegistry();
    const [tab, setTab] = useState<ProjectTabId>('overview');
    const projectRecord = registry.getProject(projectId) || registry.projects[0];
    const project = toWorkspaceProject(projectRecord);
    const contract = registry.contracts.find((item) => item.id === projectRecord.contractId);
    const milestones: WorkspaceProjectRecord[] = projectRecord.milestones.map((item) => ({ id:item.id, title:item.name, meta:`负责人 ${item.owner} · 截止 ${item.dueAt} · 完成条件：${item.acceptance}`, status:item.status }));
    const members: WorkspaceProjectRecord[] = projectRecord.members.map((item) => ({ id:item.id, title:`${item.name} · ${item.role}`, meta:`${item.organization} · ${item.responsibility} · ${item.dataScope} · 至 ${item.validTo}`, status:'有效' }));
    const profile = workspaceRoleProfiles[role];
    return <div className="m04-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section className="m04-project-drawer" role="dialog" aria-modal="true" aria-label="项目详情">
            <header><div><span>项目详情 · {profile.identity}视图</span><h2>{project.name}</h2><p>{project.id} · {project.status} · 已按{profile.dataScope}过滤敏感字段</p></div><button type="button" aria-label="关闭项目详情" onClick={onClose}><X size={20} /></button></header>
            <div className="m04-project-hero">
                <FolderKanban size={24} />
                <div><strong>{project.goal}</strong><small>{project.stage} · {project.period}</small></div>
                <dl><div><dt>整体进度</dt><dd>{project.progress}%</dd></div><div><dt>里程碑</dt><dd>{project.milestoneSummary}</dd></div><div><dt>任务</dt><dd>{project.taskCount}</dd></div><div><dt>参与Agent</dt><dd>{project.agentCount}</dd></div></dl>
            </div>
            <nav className="m04-project-tabs" aria-label="项目详情页签">{projectTabs.map((item) => <button type="button" key={item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
            <div className="m04-project-content">
                {tab === 'overview' && <dl className="m04-project-fields"><div><dt>项目目标</dt><dd>{project.goal}</dd></div><div><dt>项目负责人</dt><dd>{project.owner}</dd></div><div><dt>项目周期</dt><dd>{project.period}</dd></div><div><dt>当前阶段</dt><dd>{project.stage}</dd></div><div><dt>当前职责</dt><dd>{profile.duty}</dd></div><div><dt>数据范围</dt><dd>{profile.dataScope}</dd></div></dl>}
                {tab === 'milestones' && <><div className="m04-tab-heading"><Milestone size={18} /><div><strong>项目里程碑</strong><small>展示计划节点、状态和前后依赖</small></div></div><RecordList records={milestones} /></>}
                {tab === 'tasks' && <><div className="m04-tab-heading"><CheckCircle2 size={18} /><div><strong>关联任务</strong><small>项目任务及来自对话的修复工作</small></div></div><RecordList records={workspaceTasks} /></>}
                {tab === 'members' && <><div className="m04-tab-heading"><Users size={18} /><div><strong>项目成员</strong><small>组织、岗位、流程职责与协作关系</small></div></div><RecordList records={members} /></>}
                {tab === 'agents' && <><div className="m04-tab-heading"><Bot size={18} /><div><strong>绑定 Agent</strong><small>当前版本、用途、状态和项目授权</small></div></div><div className="m04-record-list">{projectRecord.bindings.filter((item) => item.kind === 'Agent').map((binding) => { const agent=workspaceAgents.find((item)=>item.id===binding.id); return <button type="button" key={binding.id} onClick={() => onDialog({ id: 'agent-detail', payload: binding.id })}><span><strong>{binding.name} · {binding.version}</strong><small>{binding.status} · {binding.purpose} · {binding.scope}</small></span><em>{agent?'查看':'已绑定'}</em><ChevronRight size={15} /></button>; })}</div></>}
                {tab === 'resources' && <><div className="m04-lineage"><span>{project.id}</span><ChevronRight size={15} /><span>参与 Agent</span><ChevronRight size={15} /><span>知识 / 数据 / 内容</span><ChevronRight size={15} /><span>会话与任务证据</span></div><div className="m04-binding-groups">{(['knowledge', 'data', 'content'] as const).map((kind) => {
                    const Icon = kind === 'knowledge' ? LibraryBig : kind === 'data' ? Database : FileText;
                    const label = kind === 'knowledge' ? '知识库' : kind === 'data' ? '数据源' : '内容资产';
                    const bindingKind = kind === 'knowledge' ? '知识' : kind === 'data' ? '数据' : '内容';
                    return <section key={kind}><header><Icon size={18} /><div><strong>{label}</strong><small>{kind === 'knowledge' ? '经治理的事实、规则与RAG资产' : kind === 'data' ? '结构化指标、事件和脱敏样本' : '经内容中心审核的文案、话术和素材包'}</small></div></header>{projectRecord.bindings.filter((item) => item.kind === bindingKind).map((binding) => <button type="button" key={binding.id} onClick={() => onDialog({ id: 'source-detail', payload: binding.id })}><dl><div><dt>资产 ID</dt><dd>{binding.id}</dd></div><div><dt>版本</dt><dd>{binding.version}</dd></div><div><dt>状态</dt><dd>{binding.status}</dd></div><div><dt>用途</dt><dd>{binding.purpose}</dd></div><div><dt>消费 Agent</dt><dd>{projectRecord.bindings.filter((item)=>item.kind==='Agent').map((item)=>item.id).join('、')||'未绑定 Agent'}</dd></div><div><dt>授权范围</dt><dd>{binding.scope}</dd></div><div><dt>使用证据</dt><dd>来自 M10 固定版本绑定 · 可追溯</dd></div></dl><ChevronRight size={16} /></button>)}</section>;
                })}</div></>}
                {tab === 'delivery' && <div className="m04-delivery-summary"><ShieldCheck size={25} /><h3>{contract ? `项目关联交付合同 ${contract.id}` : '内部立项项目'}</h3><p>当前角色仅查看交付摘要；合同金额、计费规则和客户敏感字段按权限隐藏。</p><dl><div><dt>交付产品</dt><dd>{projectRecord.productIds.map((id)=>registry.products.find((item)=>item.id===id)?.name||id).join('、')||'无外部产品权益'}</dd></div><div><dt>SOW / 立项依据</dt><dd>{contract?.sowId||projectRecord.basis||'—'}</dd></div><div><dt>当前 SLA</dt><dd>{projectRecord.slas.map((item)=>`${item.metric} ${item.actual}/${item.target}`).join('；')||'无客户 SLA'}</dd></div><div><dt>项目关系</dt><dd>{contract?`同合同下 ${registry.projects.filter((item)=>item.contractId===contract.id).length} 个项目`:'独立内部治理项目'}</dd></div><div><dt>受限字段</dt><dd>合同金额、计费单价、客户联系人已隐藏</dd></div></dl></div>}
                {tab === 'activity' && <><div className="m04-tab-heading"><Activity size={18} /><div><strong>项目动态</strong><small>对话、任务、配置、发布和审计事件</small></div></div><RecordList records={workspaceActivities} /></>}
            </div>
            <footer><ShieldCheck size={17} /><span>{profile.permissionSummary}</span></footer>
        </section>
    </div>;
}
