import React, { useMemo, useState } from 'react';
import { Info, PanelRightOpen, Search } from 'lucide-react';
import { ModuleHeader } from '../../components/ModuleHeader';
import type { RouteState } from '../../model/router';
import type { DeepModuleProps } from '../types';
import { workspaceAgents, workspaceNotices, workspaceProjects, workspaceRoleProfiles, workspaceThreads, type WorkspaceNavigateAction, type WorkspaceNotice, type WorkspaceProject, type WorkspaceThread } from './workspace-contract';
import { WorkspaceNavigation } from './WorkspaceNavigation';
import { WorkspaceConversation } from './WorkspaceConversation';
import { WorkspaceContextPanel } from './WorkspaceContextPanel';
import { WorkspaceDialogHost, type WorkspaceDialogState, type WorkspaceFeedback } from './WorkspaceDialogHost';
import { WorkspaceProjectDrawer } from './WorkspaceProjectDrawer';
import './workspace.css';

export type WorkspacePageProps = DeepModuleProps & {
    navigate?: (patch: Partial<RouteState>, replace?: boolean) => void;
};

export function WorkspacePage({ role, permissionFor }: WorkspacePageProps) {
    const profile = workspaceRoleProfiles[role];
    const initialProjectId = profile.projectId || workspaceProjects[0].id;
    const initialThread = workspaceThreads.find((item) => item.projectId === initialProjectId);
    const [projectId, setProjectId] = useState(initialProjectId);
    const [threadId, setThreadId] = useState(initialThread?.id || 'new');
    const [agentId, setAgentId] = useState(profile.defaultAgentId || initialThread?.agentId || workspaceAgents[0].id);
    const [dialog, setDialog] = useState<WorkspaceDialogState | null>(null);
    const [projectOpen, setProjectOpen] = useState(false);
    const [contextOpen, setContextOpen] = useState(false);
    const [feedback, setFeedback] = useState<WorkspaceFeedback | null>(null);
    const [noticeReadIds, setNoticeReadIds] = useState<string[]>([]);
    const actor = profile.identity.split(' · ')[0];
    const currentProject = useMemo(() => workspaceProjects.find((item) => item.id === projectId) || workspaceProjects[0], [projectId]);

    if (role === 'client') return <section className="m04-client-gate">
        <Info size={30} /><h1>当前身份不使用内部工作空间</h1>
        <p>客户管理员不查看内部项目、Agent能力、运行证据和协作任务。</p>
    </section>;

    const selectProject = (project: WorkspaceProject) => {
        setProjectId(project.id);
        const firstThread = workspaceThreads.find((item) => item.projectId === project.id);
        setThreadId(firstThread?.id || 'new');
        setAgentId(profile.defaultAgentId || firstThread?.agentId || workspaceAgents[0].id);
        setProjectOpen(true);
    };
    const selectThread = (thread: WorkspaceThread) => {
        setThreadId(thread.id);
        setProjectId(thread.projectId);
        setAgentId(thread.agentId);
        setFeedback({ tone: 'info', message: `已载入会话“${thread.title}”及其运行证据。` });
    };
    const newChat = () => { setThreadId('new'); setFeedback({ tone: 'success', message: '已创建空白对话，选择快捷任务或直接描述目标。' }); };
    const navigateFromAssist = (action: WorkspaceNavigateAction, notice?: WorkspaceNotice) => {
        if (notice) {
            const thread = workspaceThreads.find((item) => item.id === notice.threadId);
            setProjectId(notice.projectId);
            setThreadId(notice.threadId);
            if (thread) setAgentId(thread.agentId);
        }
        setDialog(null);
        if (action === 'new-chat') return newChat();
        if (action === 'open-project') return setProjectOpen(true);
        if (action === 'open-evidence') return setDialog({ id: 'evidence', payload: notice?.threadId });
        if (action === 'open-result-feedback') return setDialog({ id: 'result-feedback' });
        setDialog({ id: 'repair-task' });
    };
    const markNoticeRead = (id?: string) => {
        setNoticeReadIds((current) => id
            ? Array.from(new Set([...current, id]))
            : workspaceNotices.map((notice) => notice.id));
    };
    const unreadNoticeCount = workspaceNotices.filter((notice) => !noticeReadIds.includes(notice.id)).length;

    return <section className="m04-surface">
        <ModuleHeader title="M04 工作空间" subtitle="与 Agent 协同完成项目任务、查看结果并追踪证据" actions={<><button type="button" onClick={() => setDialog({ id: 'search' })}><Search size={15} />搜索项目、对话或任务</button><button type="button" onClick={() => setDialog({ id: 'help' })}>帮助</button><button type="button" onClick={() => setDialog({ id: 'notifications' })}>通知 {unreadNoticeCount > 0 && <em>{unreadNoticeCount}</em>}</button><button type="button" className="m04-context-trigger" onClick={() => setContextOpen(true)}><PanelRightOpen size={16} />上下文</button></>} />
        {feedback && <div className={`m04-page-feedback is-${feedback.tone}`} role="status">
            <span>{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)}>关闭</button>
        </div>}
        <div className="m04-workspace" data-role={role}>
            <WorkspaceNavigation projectId={projectId} threadId={threadId} onProject={selectProject} onThread={selectThread} onNewChat={newChat} onPlan={() => setDialog({ id: 'plan-detail' })} />
            <WorkspaceConversation key={`${role}-${threadId}`} projectId={projectId} threadId={threadId} agentId={agentId} role={role} onNewChat={newChat} onAgent={setAgentId} onDialog={setDialog} permissionFor={permissionFor} />
            <WorkspaceContextPanel projectId={projectId} threadId={threadId} agentId={agentId} role={role} onDialog={setDialog} onProject={() => setProjectOpen(true)} />
        </div>
        {dialog && <WorkspaceDialogHost dialog={dialog} role={role} actor={actor} projectId={projectId} threadId={threadId} agentId={agentId} permissionFor={permissionFor} noticeReadIds={noticeReadIds} onMarkNoticeRead={markNoticeRead} onNavigate={navigateFromAssist} onClose={() => setDialog(null)} onAgent={setAgentId} onFeedback={setFeedback} />}
        {projectOpen && <WorkspaceProjectDrawer projectId={currentProject.id} role={role} onClose={() => setProjectOpen(false)} onDialog={(next) => { setProjectOpen(false); setDialog(next); }} />}
        {contextOpen && <div className="m04-mobile-context"><button type="button" className="m04-mobile-context-close" onClick={() => setContextOpen(false)}>关闭上下文</button><WorkspaceContextPanel drawer projectId={projectId} threadId={threadId} agentId={agentId} role={role} onDialog={(next) => { setContextOpen(false); setDialog(next); }} onProject={() => { setContextOpen(false); setProjectOpen(true); }} /></div>}
    </section>;
}
