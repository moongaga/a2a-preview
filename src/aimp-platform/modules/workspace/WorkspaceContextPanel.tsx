import React from 'react';
import { AlertTriangle, Bot, ChevronRight, FolderKanban, ShieldCheck } from 'lucide-react';
import type { RoleId } from '../../types';
import { workspaceAgents, workspaceProjects, workspaceRoleProfiles, workspaceRuntimeTraces } from './workspace-contract';
import type { WorkspaceDialogState } from './WorkspaceDialogHost';

export function WorkspaceContextPanel({
    projectId,
    threadId,
    agentId,
    role,
    onDialog,
    onProject,
    drawer = false,
}: {
    projectId: string;
    threadId: string;
    agentId: string;
    role: RoleId;
    onDialog: (dialog: WorkspaceDialogState) => void;
    onProject: () => void;
    drawer?: boolean;
}) {
    const project = workspaceProjects.find((item) => item.id === projectId) || workspaceProjects[0];
    const agent = workspaceAgents.find((item) => item.id === agentId) || workspaceAgents[0];
    const profile = workspaceRoleProfiles[role];
    const trace = workspaceRuntimeTraces.find((item) => item.threadId === threadId);
    return <aside className={`workspace-context-panel ${drawer ? 'is-drawer' : ''}`} aria-label="当前对话上下文">
        <header><span>当前对话上下文</span><small>{profile.dataScope}</small></header>
        <section>
            <div className="m04-section-title"><span>当前项目</span></div>
            <button type="button" className="m04-context-card" onClick={onProject}>
                <FolderKanban size={18} /><span><strong>{project.name}</strong><small>{project.id} · {project.status}</small></span><ChevronRight size={15} />
            </button>
        </section>
        <section>
            <div className="m04-section-title"><span>参与 Agent</span></div>
            <button type="button" className="m04-context-card" onClick={() => onDialog({ id: 'agent-detail', payload: agent.id })}>
                <Bot size={18} /><span><strong>{agent.name} · {agent.version}</strong><small>{agent.status} · {agent.owner}</small></span><ChevronRight size={15} />
            </button>
            <div className="m04-tags">{agent.capabilities.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
        <section>
            <div className="m04-section-title"><span>工具权限</span></div>
            <button type="button" className="m04-permission-button" onClick={() => onDialog({ id: 'permission' })}>
                <ShieldCheck size={17} /><span>{profile.permissionSummary}</span><ChevronRight size={15} />
            </button>
        </section>
        {trace?.incident && <section>
            <div className="m04-section-title"><span>异常处置</span><small>{trace.incident.severity}</small></div>
            <button type="button" className="m04-incident-button" onClick={() => onDialog({ id: 'incident-detail', payload: trace.id })}>
                <AlertTriangle size={17} />
                <span><strong>{trace.incident.id} · {trace.incident.status}</strong><small>{trace.incident.trigger}</small></span>
                <ChevronRight size={15} />
            </button>
        </section>}
    </aside>;
}
