import React, { useEffect, useReducer } from 'react';
import { AtSign, Bot, CheckCircle2, ChevronDown, Clock3, GitBranch, Paperclip, Send, Share2, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { PermissionDecision, RoleId } from '../../types';
import { workspaceAgents, workspaceRoleAgentIds, workspaceRoleProfiles, workspaceRuntimeTraces, workspaceThreads, toWorkspaceProject } from './workspace-contract';
import { useDeliveryProjectRegistry } from '../delivery-management/delivery-registry-store';
import type { WorkspaceDialogState } from './WorkspaceDialogHost';
import { workspaceConversationReducer, type WorkspaceMessage } from './workspace-reducer';
import { prototypeStore } from '../../model/store';
import { resolveWorkspaceReply, workspaceActionLabels, workspaceConversationScenarios, workspaceRoleConversationPolicies, type WorkspaceConversationActionId } from './workspace-conversation-policy';

function initialMessages(role: RoleId, threadId: string): WorkspaceMessage[] {
    const scenario = workspaceConversationScenarios.find((item) => item.id === threadId);
    const trace = workspaceRuntimeTraces.find((item) => item.id === scenario?.traceId);
    const policy = workspaceRoleConversationPolicies[role];
    if (!scenario) return [];
    return [
        { id: `${threadId}-user`, from: 'user', text: scenario.userPrompt, status: 'completed' },
        { id: `${threadId}-agent`, from: 'agent', text: scenario.factSummary, status: 'completed', traceId: trace?.id, focus: policy.resultFocus, nextActionIds: policy.allowedActionIds },
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
    onAction,
    permissionFor,
}: {
    projectId: string;
    threadId: string;
    agentId: string;
    role: RoleId;
    onNewChat: () => void;
    onAgent: (agentId: string) => void;
    onDialog: (dialog: WorkspaceDialogState) => void;
    onAction: (message: WorkspaceMessage, actionId: WorkspaceConversationActionId) => void;
    permissionFor: (action: string) => PermissionDecision;
}) {
    const profile = workspaceRoleProfiles[role];
    const registry = useDeliveryProjectRegistry();
    const project = toWorkspaceProject(registry.getProject(projectId) || registry.getVisibleProjects(role)[0]);
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
    const policy = workspaceRoleConversationPolicies[role];
    const quickPrompts = policy.quickPrompts;

    const send = () => {
        if (!state.draft.trim()) {
            dispatch({ type: 'feedback', tone: 'error', message: '请输入问题，或先选择一个快捷任务。' });
            return;
        }
        const prompt = state.draft.trim();
        const stamp = Date.now();
        const runningId = `agent-${stamp}`;
        dispatch({
            type: 'send',
            userMessage: { id: `user-${stamp}`, from: 'user', text: prompt, status: 'completed' },
            agentMessage: { id: runningId, from: 'agent', text: '正在检查权限、读取授权上下文并生成结果……', status: 'running' },
        });
        const reply = resolveWorkspaceReply(role, prompt, agentId, stamp);
        prototypeStore.createEntity({
            type: 'conversation-message', name: prompt, status: 'completed', ownerId: profile.identity,
            moduleId: 'workspace', fields: { projectId, threadId, messageId: `user-${stamp}`, agentId, role, content: prompt },
            relations: [{ type: 'conversation', targetType: 'conversation', targetId: threadId }],
        }, profile.identity);
        if (reply.trace) prototypeStore.createEntity({
            type: 'run-trace', name: reply.trace.id, status: 'completed', ownerId: agentId, moduleId: 'workspace',
            fields: {
                traceId: reply.trace.id, projectId, threadId, agentId,
                consumedSourceIds: reply.trace.consumedSources.map((item) => item.bindingId),
                consumedSources: reply.trace.consumedSources.map((item) => `${item.bindingId}|${item.operation}|${item.result}`),
            },
            relations: [{ type: 'conversation', targetType: 'conversation', targetId: threadId }],
        }, profile.identity);
        prototypeStore.createEntity({
            type: 'conversation-message', name: reply.message, status: 'completed', ownerId: agentId,
            moduleId: 'workspace', fields: { projectId, threadId, messageId: runningId, agentId, role, content: reply.message, focus: reply.focus, traceId: reply.trace?.id || '' },
            relations: [
                { type: 'conversation', targetType: 'conversation', targetId: threadId },
                ...(reply.trace ? [{ type: 'trace', targetType: 'run-trace', targetId: reply.trace.id }] : []),
            ],
        }, profile.identity);
        window.setTimeout(() => dispatch({
            type: 'complete', messageId: runningId, text: reply.message, traceId: reply.trace?.id, focus: reply.focus, nextActionIds: reply.nextActionIds,
        }), 650);
    };

    const runAction = (message: WorkspaceMessage, actionId: WorkspaceConversationActionId) => {
        if (actionId === 'view-evidence') return onDialog({ id: 'evidence', payload: message.traceId });
        if (!message.traceId) {
            dispatch({ type: 'feedback', tone: 'error', message: '当前回答没有真实 Trace，不能创建任务、反馈、测试或工单。' });
            return;
        }
        if (actionId === 'submit-feedback') return onDialog({ id: 'result-feedback', payload: message.traceId });
        if (actionId === 'create-task') return onDialog({ id: 'repair-task', payload: message.traceId });
        onAction(message, actionId);
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
                        <button type="button" className="m04-trace-link" onClick={() => onDialog({ id: 'evidence', payload: message.traceId })}><GitBranch size={15} />{message.traceId ? '执行过程 · 查看完整追踪' : '证据缺失 · 查看限制说明'}</button>
                        <section className="m04-result-block">
                            <strong>{message.focus || '职责边界'}</strong>
                            <p>{message.traceId ? '结果已关联真实运行证据；后续动作会保留项目、会话、Agent 与 Trace。' : '本问题超出当前角色职责或无法匹配；请选择下方快捷问题，不生成虚假结论。'}</p>
                            <div>
                                {(message.nextActionIds || []).map((actionId, index) => <button type="button" key={actionId} className={index === 0 ? 'm04-primary' : ''} disabled={actionId.includes('task') && !createDecision.allowed} title={actionId.includes('task') ? createDecision.reason : undefined} onClick={() => runAction(message, actionId)}>{workspaceActionLabels[actionId]}</button>)}
                                {!message.traceId && quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => dispatch({ type: 'set-draft', value: prompt })}>{prompt}</button>)}
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
