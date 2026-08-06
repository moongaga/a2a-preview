import { prototypeStore } from '../../model/store';
import type { CommandResult, RoleId } from '../../types';

export interface RepairTaskInput {
    title: string;
    taskType: string;
    priority: string;
    assignee: string;
    completionGate: string;
    deadline: string;
    approver: string;
    sourceConversationId: string;
    sourceProjectId: string;
    sourceAgentId: string;
    traceId: string;
    actor: string;
    role: RoleId;
}

export interface ResultFeedbackInput {
    feedbackType: string;
    detail: string;
    sourceConversationId: string;
    sourceProjectId: string;
    sourceAgentId: string;
    traceId: string;
    actor: string;
    role: RoleId;
}

export interface ShareConversationInput {
    shareTarget: string;
    sharePermission: string;
    shareExpiry: string;
}

export function createRepairTask(input: RepairTaskInput): CommandResult {
    return prototypeStore.createEntity({
        type: 'task',
        name: input.title,
        status: 'draft',
        ownerId: input.assignee,
        moduleId: 'task-center',
        fields: { ...input, sourceModuleId: 'workspace' },
        relations: [
            { type: 'source-conversation', targetType: 'conversation', targetId: input.sourceConversationId },
            { type: 'project', targetType: 'project', targetId: input.sourceProjectId },
            { type: 'agent', targetType: 'agent', targetId: input.sourceAgentId },
            { type: 'trace', targetType: 'run-trace', targetId: input.traceId },
        ],
    }, input.actor);
}

export function createResultFeedback(input: ResultFeedbackInput): CommandResult {
    return prototypeStore.createEntity({
        type: 'feedback',
        name: `${input.feedbackType} · ${input.sourceConversationId} · ${Date.now()}`,
        status: 'open',
        ownerId: 'AI训练师队列',
        moduleId: 'ticket-system',
        fields: { ...input, sourceModuleId: 'workspace' },
        relations: [
            { type: 'source-conversation', targetType: 'conversation', targetId: input.sourceConversationId },
            { type: 'project', targetType: 'project', targetId: input.sourceProjectId },
            { type: 'agent', targetType: 'agent', targetId: input.sourceAgentId },
            { type: 'trace', targetType: 'run-trace', targetId: input.traceId },
        ],
    }, input.actor);
}

export function describeShare(input: ShareConversationInput) {
    return `分享链接已创建：${input.shareTarget} · ${input.sharePermission} · ${input.shareExpiry}`;
}
