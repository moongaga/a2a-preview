export interface WorkspaceMessage {
    id: string;
    from: 'user' | 'agent';
    text: string;
    status: 'completed' | 'running' | 'failed';
    traceId?: string;
}

export interface WorkspaceConversationState {
    draft: string;
    messages: WorkspaceMessage[];
    feedback?: { tone: 'success' | 'error' | 'info'; message: string };
}

export type WorkspaceConversationAction =
    | { type: 'set-draft'; value: string }
    | { type: 'replace'; messages: WorkspaceMessage[] }
    | { type: 'send'; userMessage: WorkspaceMessage; agentMessage: WorkspaceMessage }
    | { type: 'complete'; messageId: string; text: string; traceId: string }
    | { type: 'fail'; messageId: string; reason: string }
    | { type: 'feedback'; tone: 'success' | 'error' | 'info'; message: string }
    | { type: 'clear-feedback' };

export function workspaceConversationReducer(
    state: WorkspaceConversationState,
    action: WorkspaceConversationAction,
): WorkspaceConversationState {
    if (action.type === 'set-draft') return { ...state, draft: action.value };
    if (action.type === 'replace') return { ...state, messages: action.messages, feedback: undefined };
    if (action.type === 'send') return { ...state, draft: '', messages: [...state.messages, action.userMessage, action.agentMessage] };
    if (action.type === 'complete') return {
        ...state,
        messages: state.messages.map((item) => item.id === action.messageId
            ? { ...item, status: 'completed', text: action.text, traceId: action.traceId }
            : item),
    };
    if (action.type === 'fail') return {
        ...state,
        messages: state.messages.map((item) => item.id === action.messageId
            ? { ...item, status: 'failed', text: action.reason }
            : item),
    };
    if (action.type === 'feedback') return { ...state, feedback: { tone: action.tone, message: action.message } };
    return { ...state, feedback: undefined };
}
