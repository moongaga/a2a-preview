import type { RoleId } from '../../types';

export type ProjectKind = '客户交付项目' | '内部运营项目' | '能力优化项目';
export type ProjectStatus = '草稿' | '待审批' | '进行中' | '已暂停' | '待验收' | '已完成' | '已归档';
export type ContractStatus = '草稿' | '待审核' | '生效' | '暂停' | '已完成' | '已终止' | '已归档';
export type BindingKind = 'Agent' | '知识' | '数据' | '内容' | 'Skill' | 'Tool';
export type ActionResult = { ok: boolean; message: string; id?: string };

export interface AIProductReference {
  id: string; name: string; version: string; status: '已发布' | '已停用'; capabilityScope: string; tenantIds: string[];
}
export interface DeliveryContract {
  id: string; name: string; customer: string; tenantId: string; productIds: string[]; sowId: string; sowScope: string;
  period: string; billingRef: string; owner: string; status: ContractStatus;
}
export interface ProjectMember {
  id: string; name: string; role: string; organization: string; responsibility: string; dataScope: string; validTo: string;
}
export interface ProjectMilestone {
  id: string; name: string; owner: string; dueAt: string; status: '未开始' | '进行中' | '已完成' | '逾期'; acceptance: string; result?: string;
}
export interface ProjectBinding {
  id: string; kind: BindingKind; name: string; version: string; status: '已绑定' | '变更中'; purpose: string; scope: string;
}
export interface AcceptanceRecord {
  id: string; item: string; owner: string; status: '待验收' | '通过' | '不通过'; evidence: string; conclusion: string;
}
export interface SLARecord {
  id: string; metric: string; target: string; actual: string; status: '达标' | '预警' | '违约'; handling: string;
}
export interface ProjectAuditEvent {
  id: string; time: string; actor: string; action: string; summary: string;
}
export interface ProjectRecord {
  id: string; name: string; kind: ProjectKind; goal: string; owner: string; organization: string; period: string; stage: string;
  status: ProjectStatus; progress: number; contractId?: string; sowId?: string; tenantId?: string; productIds: string[]; basis?: string;
  members: ProjectMember[]; milestones: ProjectMilestone[]; bindings: ProjectBinding[]; acceptance: AcceptanceRecord[]; slas: SLARecord[];
  taskCount: number; highPriorityOpen: number; openIncidentCount: number; audit: ProjectAuditEvent[];
}
export type ProjectDraft = Pick<ProjectRecord, 'name' | 'kind' | 'goal' | 'owner' | 'organization' | 'period' | 'stage' | 'contractId' | 'sowId' | 'tenantId' | 'productIds' | 'basis'>;
export type ProjectPatch = Partial<ProjectDraft>;
export type ProjectEvent = 'submit' | 'withdraw' | 'approve' | 'reject' | 'pause' | 'resume' | 'request-acceptance' | 'complete' | 'archive' | 'restore-draft';

export interface ProjectRegistry {
  projects: ProjectRecord[];
  contracts: DeliveryContract[];
  products: AIProductReference[];
  getVisibleProjects(role: RoleId, userName?: string): ProjectRecord[];
  getProject(projectId: string): ProjectRecord | undefined;
  createProject(input: ProjectDraft, actor: string): ActionResult;
  updateProject(projectId: string, patch: ProjectPatch, actor: string): ActionResult;
  deleteProject(projectId: string): ActionResult;
  transitionProject(projectId: string, event: ProjectEvent, actor: string): ActionResult;
  addMember(projectId: string, member: ProjectMember, actor: string): ActionResult;
  removeMember(projectId: string, memberId: string, actor: string): ActionResult;
  bindAsset(projectId: string, binding: ProjectBinding, actor: string): ActionResult;
  removeBinding(projectId: string, bindingId: string, actor: string): ActionResult;
  addMilestone(projectId: string, milestone: ProjectMilestone, actor: string): ActionResult;
  updateMilestone(projectId: string, milestoneId: string, status: ProjectMilestone['status'], actor: string): ActionResult;
  updateAcceptance(projectId: string, acceptanceId: string, status: AcceptanceRecord['status'], actor: string): ActionResult;
  createContract(input: Omit<DeliveryContract, 'id'>, actor: string): ActionResult;
  updateContract(contractId: string, patch: Partial<Omit<DeliveryContract, 'id'>>, actor: string): ActionResult;
  deleteContract(contractId: string): ActionResult;
  transitionContract(contractId: string, status: ContractStatus, actor: string): ActionResult;
}
