import React from 'react';
import { CalendarClock, ChevronRight, FolderKanban, MessageSquareText, Plus } from 'lucide-react';
import { workspacePlan, workspaceProjects, workspaceThreads, type WorkspaceProject, type WorkspaceThread } from './workspace-contract';

export function WorkspaceNavigation({
    projectId,
    threadId,
    onProject,
    onThread,
    onNewChat,
    onPlan,
}: {
    projectId: string;
    threadId: string;
    onProject: (project: WorkspaceProject) => void;
    onThread: (thread: WorkspaceThread) => void;
    onNewChat: () => void;
    onPlan: () => void;
}) {
    const threads = workspaceThreads.filter((item) => item.projectId === projectId);
    return <aside className="workspace-navigation" aria-label="工作空间导航">
        <header>
            <button type="button" className="m04-primary" onClick={onNewChat}><Plus size={16} />新建对话</button>
        </header>
        <section>
            <div className="m04-section-title" title="选择项目后可查看项目详情与授权信息源"><span>项目</span><small>{workspaceProjects.length}</small></div>
            {workspaceProjects.map((project) => <button
                type="button"
                key={project.id}
                className={`m04-list-button ${project.id === projectId ? 'is-active' : ''}`}
                onClick={() => onProject(project)}
            >
                <FolderKanban size={17} />
                <span><strong>{project.name}</strong><small>{project.taskCount}个任务 · {project.agentCount}个Agent</small></span>
                <ChevronRight size={15} />
            </button>)}
        </section>
        <section className="m04-thread-section">
            <div className="m04-section-title" title="切换最近对话并查看对应运行证据"><span>最近对话</span><small>{threads.length}</small></div>
            {threads.map((thread) => <button
                type="button"
                key={thread.id}
                className={`m04-list-button ${thread.id === threadId ? 'is-active' : ''}`}
                onClick={() => onThread(thread)}
            >
                <MessageSquareText size={17} />
                <span><strong>{thread.title}</strong><small>{thread.updatedAt} · {thread.id}</small></span>
            </button>)}
        </section>
        <section className="m04-plan-section">
            <div className="m04-section-title" title="查看当前项目的计划任务与运行范围"><span>计划任务</span><small>1</small></div>
            <button type="button" className="m04-list-button" onClick={onPlan}>
                <CalendarClock size={17} />
                <span><strong>{workspacePlan.name}</strong><small>下次：{workspacePlan.nextRun}</small></span>
                <ChevronRight size={15} />
            </button>
        </section>
    </aside>;
}
