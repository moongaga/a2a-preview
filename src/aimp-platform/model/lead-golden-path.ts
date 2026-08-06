export type LeadWorkspaceId = 'pool' | 'detail' | 'strategy' | 'followup' | 'handoff' | 'result';
export type LeadAction = 'query' | 'score' | 'recommend' | 'start' | 'submit' | 'approve' | 'reject' | 'retry' | 'takeover' | 'convert' | 'nurture' | 'lose';
export const leadWorkspaceIds: LeadWorkspaceId[] = ['pool', 'detail', 'strategy', 'followup', 'handoff', 'result'];
export function nextLeadStatus(status: string, action: LeadAction) { const map: Record<string, Record<string, string>> = { new: { score: 'scored' }, scored: { recommend: 'pending_followup' }, pending_followup: { start: 'in_progress' }, in_progress: { submit: 'pending_approval', takeover: 'manual_takeover' }, pending_approval: { approve: 'approved', reject: 'rejected' }, approved: { convert: 'converted', nurture: 'nurtured', lose: 'lost' }, failed: { retry: 'queued' } }; return map[status]?.[action]; }
export function canLeadAction(role: string, action: LeadAction) { return role === 'business' || action === 'query'; }
