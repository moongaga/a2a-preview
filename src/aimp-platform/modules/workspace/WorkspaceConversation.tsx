import React, { useEffect, useMemo, useReducer } from 'react';
import { AtSign, Bot, CheckCircle2, ChevronDown, Clock3, FilePlus2, GitBranch, Paperclip, Send, Share2, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { PermissionDecision, RoleId } from '../../types';
import { workspaceAgents, workspaceProjects, workspaceRoleAgentIds, workspaceRoleProfiles, workspaceRuntimeTraces, workspaceThreads } from './workspace-contract';
import type { WorkspaceDialogState } from './WorkspaceDialogHost';
import { workspaceConversationReducer, type WorkspaceMessage } from './workspace-reducer';

function initialMessages(role: RoleId, threadId: string): WorkspaceMessage[] {
    const profile = workspaceRoleProfiles[role];
    const thread = workspaceThreads.find((item) => item.id === threadId);
    const trace = workspaceRuntimeTraces.find((item) => item.threadId === threadId);
    return [
        { id: `${threadId}-user`, from: 'user', text: profile.defaultQuestion || '请分析当前项目风险。', status: 'completed' },
        { id: `${threadId}-agent`, from: 'agent', text: thread?.summary || profile.answer, status: 'completed', traceId: trace?.id },
    ];
}

export function WorkspaceConversation({
    projectId,
    threadId,
    agentId,
    role,
    onNewChat,
    onAgent,
    onDialog,
    permissionFor,
}: {
    projectId: string;
    threadId: string;
    agentId: string;
    role: RoleId;
    onNewChat: () => void;
    onAgent: (agentId: string) => void;
    onDialog: (dialog: WorkspaceDialogState) => void;
    permissionFor: (action: string) => PermissionDecision;
}) {
    const profile = workspaceRoleProfiles[role];
    const project = workspaceProjects.find((item) => item.id === projectId) || workspaceProjects[0];
    const thread = workspaceThreads.find((item) => item.id === threadId);
    const agent = workspaceAgents.find((item) => item.id === agentId) || workspaceAgents[0];
    const [state, dispatch] = useReducer(workspaceConversationReducer, {
        draft: '', messages: threadId === 'new' ? [] : initialMessages(role, threadId),
    });
    useEffect(() => {
        dispatch({ type: 'replace', messages: threadId === 'new' ? [] : initialMessages(role, threadId) });
    }, [role, threadId]);
    const createDecision = permissionFor('create');
    const title = threadId === 'new' ? '新对话' : thread?.title || 'Agent 协作会话';
    const quickPrompts = useMemo(() => role === 'trainer'
        ? ['定位失败样本共同特征', '比较候选能力版本', '准备组合测试清单']
        : role === 'admin' || role === 'superadmin'
            ? ['分析生产告警影响', '检查权限与审计风险', '生成回滚准备清单']
            : ['分析本周AI质量变化', '生成项目进展摘要', '整理异常样本并分类'], [role]);

    const send = () => {
        if (!state.draft.trim()) {
            dispatch({ type: 'feedback', tone: 'error', message: '请输入问题，或先选择一个快捷任务。' });
            return;
        }
        const stamp = Date.now();
        const runningId = `agent-${stamp}`;
        dispatch({
            type: 'send',
            userMessage: { id: `user-${stamp}`, from: 'user', text: state.draft.trim(), status: 'completed' },
            agentMessage: { id: runningId, from: 'agent', text: '正在检查权限、读取授权上下文并生成结果……', status: 'running' },
        });
        window.setTimeout(() => dispatch({
            type: 'complete', messageId: runningId, text: `${profile.answer} 已保留输入、能力版本、运行证据和当前角色权限。`, traceId: 'trace-9ab8-73c',
        }), 650);
    };

    return <main className="workspace-conversation" aria-label="与 Agent 对话">
        <header className="m04-conversation-header">
            <div><h1>{title}</h1><p>项目：{project.name} · 对话自动保存 · {profile.dataScope}</p></div>
            <div>
                <button type="button" onClick={() => onDialog({ id: 'share' })} disabled={!profile.canShare}><Share2 size={15} />分享</button>
                <button type="button" aria-label="更多对话操作" onClick={() => onDialog({ id: 'conversation-more' })}>•••</button>
            </div>
        </header>
        {state.feedback && <div className={`m04-inline-feedback is-${state.feedback.tone}`} role="status">
            <span>{state.feedback.tone === 'success' ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}{state.feedback.message}</span>
            <button type="button" aria-label="关闭反馈" onClick={() => dispatch({ type: 'clear-feedback' })}><X size={15} /></button>
        </div>}
        <div className="m04-message-stream">
            {!state.messages.length && <section className="m04-empty-conversation">
                <Bot size={30} />
                <h2>今天想让 AI 协助什么？</h2>
                <p>选择 Agent 并描述目标；系统只会使用你有权限访问的项目上下文。</p>
                <div>{quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => dispatch({ type: 'set-draft', value: prompt })}>{prompt}</button>)}</div>
            </section>}
            {state.messages.map((message) => <article key={message.id} className={`m04-message is-${message.from} is-${message.status}`}>
                <span className="m04-avatar">{message.from === 'agent' ? 'AI' : '我'}</span>
                <div className="m04-bubble">
                    {message.from === 'agent' && <strong>{agent.name} · {message.status === 'running' ? '正在执行' : agent.version}</strong>}
                    <p>{message.text}</p>
                    {message.status === 'running' && <div className="m04-running"><i />读取授权上下文并校验证据</div>}
                    {message.from === 'agent' && message.status === 'completed' && <>
                        <button type="button" className="m04-trace-link" onClick={() => onDialog({ id: 'evidence' })}><GitBranch size={15} />执行过程 · 查看完整追踪</button>
                        <section className="m04-result-block">
                            <strong>下一步</strong>
                            <p>结果可追踪，可直接形成任务、问题反馈或进一步分析。</p>
                            <div>
                                <button type="button" className="m04-primary" disabled={!createDecision.allowed} title={createDecision.reason} onClick={() => onDialog({ id: 'repair-task' })}><FilePlus2 size={15} />创建修复任务</button>
                                <button type="button" onClick={() => onDialog({ id: 'evidence' })}>查看证据</button>
                                <button type="button" onClick={() => onDialog({ id: 'result-feedback' })}>反馈结果问题</button>
                            </div>
                        </section>
                    </>}
                </div>
            </article>)}
        </div>
        <footer className="m04-composer">
            <div className="m04-context-chips">
                <button type="button" onClick={() => onDialog({ id: 'agent-picker' })}><AtSign size={14} />{agent.name}<ChevronDown size={13} /></button>
                <button type="button" onClick={() => onDialog({ id: 'time-range' })}><Clock3 size={14} />近7天<ChevronDown size={13} /></button>
                <button type="button" onClick={() => onDialog({ id: 'data-scope' })}><ShieldCheck size={14} />{profile.dataScope}</button>
            </div>
            <textarea aria-label="与 Agent 对话" value={state.draft} onChange={(event) => dispatch({ type: 'set-draft', value: event.target.value })} placeholder="向 Agent 描述目标；使用 @ 选择 Agent，使用 / 添加工具或知识…" />
            <div className="m04-compose-actions">
                <div>
                    <button type="button" onClick={() => onDialog({ id: 'attachment' })}><Paperclip size={15} />添加附件</button>
                    <button type="button" onClick={() => onDialog({ id: 'agent-picker' })}><AtSign size={15} />选择参与 Agent</button>
                    <button type="button" onClick={() => onDialog({ id: 'capability-picker' })}><Sparkles size={15} />添加能力</button>
                    <button type="button" onClick={() => onDialog({ id: 'permission' })}><ShieldCheck size={15} />权限详情</button>
                </div>
                <button type="button" className="m04-send" onClick={send}><Send size={16} />发送</button>
            </div>
            <button type="button" className="m04-new-chat-link" onClick={onNewChat}>新建对话</button>
            <select className="m04-sr-only" aria-label="当前Agent" value={agentId} onChange={(event) => onAgent(event.target.value)}>{workspaceAgents.filter((item) => workspaceRoleAgentIds[role].includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        </footer>
    </main>;
}
