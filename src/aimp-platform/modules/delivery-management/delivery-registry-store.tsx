import React, { createContext, useContext, useMemo, useState } from 'react';
import type { RoleId } from '../../types';
import { deliveryContracts, deliveryProducts, deliveryProjects } from './delivery-data';
import type { ActionResult, ContractStatus, DeliveryContract, ProjectAuditEvent, ProjectBinding, ProjectDraft, ProjectEvent, ProjectMember, ProjectMilestone, ProjectPatch, ProjectRecord, ProjectRegistry } from './delivery-types';

const RegistryContext = createContext<ProjectRegistry | null>(null);
const actorForRole: Record<RoleId, string> = { employee:'陈屿', business:'李沐', trainer:'周芮', admin:'赵岑', superadmin:'顾川', client:'王琳' };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const ok = (message: string, id?: string): ActionResult => ({ ok:true, message, id });
const fail = (message: string): ActionResult => ({ ok:false, message });
const audit = (actor: string, action: string, summary: string): ProjectAuditEvent => ({ id:`AUD-${Date.now()}`, time:'刚刚', actor, action, summary });

function validateDraft(input: ProjectDraft, contracts: DeliveryContract[]) {
  if (!input.name.trim()) return '请输入项目名称。';
  if (!input.goal.trim()) return '请输入项目目标。';
  if (!input.owner.trim() || !input.organization.trim() || !input.period.trim()) return '负责人、所属组织和项目周期均为必填项。';
  if (input.kind === '客户交付项目') {
    const contract = contracts.find(item => item.id === input.contractId);
    if (!contract) return '客户交付项目必须选择合同。';
    if (!input.sowId || !input.tenantId || input.productIds.length === 0) return '客户交付项目必须配置 SOW、租户和 AI 产品权益。';
  } else if (!input.basis?.trim()) return '内部运营或能力优化项目必须填写立项依据。';
  return '';
}

export function DeliveryProjectRegistryProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ProjectRecord[]>(() => clone(deliveryProjects));
  const [contracts, setContracts] = useState<DeliveryContract[]>(() => clone(deliveryContracts));
  const products = deliveryProducts;
  const update = (projectId: string, fn: (project: ProjectRecord) => ProjectRecord) => setProjects(current => current.map(item => item.id === projectId ? fn(item) : item));
  const registry = useMemo<ProjectRegistry>(() => ({
    projects, contracts, products,
    getVisibleProjects(role, userName = actorForRole[role]) {
      if (role === 'client') return [];
      if (role === 'admin' || role === 'superadmin') return projects;
      if (role === 'employee' || role === 'trainer') return projects.filter(project => project.members.some(member => member.name === userName));
      return projects.filter(project => project.owner === userName || project.organization.includes('线索') || project.members.some(member => member.name === userName));
    },
    getProject(projectId) { return projects.find(project => project.id === projectId); },
    createProject(input, actor) {
      const error = validateDraft(input, contracts); if (error) return fail(error);
      if (projects.some(item => item.name === input.name.trim())) return fail('项目名称已存在，请使用唯一名称。');
      const id = `PJ-${input.kind === '客户交付项目' ? 'DELIVERY' : input.kind === '内部运营项目' ? 'OPS' : 'CAP'}-${String(projects.length + 1).padStart(3,'0')}`;
      const record: ProjectRecord = { ...input, id, name:input.name.trim(), status:'草稿', progress:0, members:[], milestones:[], bindings:[], acceptance:[], slas:[], taskCount:0, highPriorityOpen:0, openIncidentCount:0, audit:[audit(actor,'创建项目草稿',`创建${input.kind}“${input.name.trim()}”`)] };
      setProjects(current => [record, ...current]); return ok(`项目“${record.name}”已保存为草稿。`, id);
    },
    updateProject(projectId, patch, actor) {
      const current = projects.find(item => item.id === projectId); if (!current) return fail('项目不存在。');
      if (current.status !== '草稿') return fail('只有草稿项目可直接编辑；运行中项目请发起变更。');
      const next = { ...current, ...patch }; const error = validateDraft(next, contracts); if (error) return fail(error);
      update(projectId, item => ({ ...item, ...patch, audit:[audit(actor,'编辑项目',`更新项目基础信息`), ...item.audit] })); return ok('项目草稿已更新。');
    },
    deleteProject(projectId) {
      const current = projects.find(item => item.id === projectId); if (!current) return fail('项目不存在。');
      if (current.status !== '草稿') return fail('只有草稿项目可以删除。');
      if (current.taskCount || current.bindings.length || current.members.length) return fail('项目已有任务、成员或能力依赖，不能删除。');
      setProjects(items => items.filter(item => item.id !== projectId)); return ok(`项目草稿“${current.name}”已删除。`);
    },
    transitionProject(projectId, event, actor) {
      const current = projects.find(item => item.id === projectId); if (!current) return fail('项目不存在。');
      const transitions: Partial<Record<ProjectRecord['status'], Partial<Record<ProjectEvent, ProjectRecord['status']>>>> = {
        草稿:{ submit:'待审批' }, 待审批:{ withdraw:'草稿', approve:'进行中', reject:'草稿' }, 进行中:{ pause:'已暂停', 'request-acceptance':'待验收' }, 已暂停:{ resume:'进行中' }, 待验收:{ complete:'已完成', reject:'进行中' }, 已完成:{ archive:'已归档' },
      };
      if (event === 'restore-draft' && current.status === '已归档') {
        const id = `${current.id}-R${projects.filter(item => item.id.startsWith(`${current.id}-R`)).length + 1}`;
        const restored = { ...clone(current), id, name:`${current.name}（恢复草稿）`, status:'草稿' as const, progress:0, audit:[audit(actor,'恢复为新草稿',`来源：${current.id}`)] };
        setProjects(items => [restored, ...items]); return ok('已从归档项目生成新草稿，原项目保持归档。', id);
      }
      const next = transitions[current.status]?.[event]; if (!next) return fail(`当前状态“${current.status}”不允许执行该操作。`);
      if (event === 'submit') { const error = validateDraft(current, contracts); if (error) return fail(error); }
      if (event === 'approve' && current.kind === '客户交付项目') {
        const contract = contracts.find(item => item.id === current.contractId);
        if (!contract || contract.status !== '生效') return fail('客户项目无法启动：关联合同尚未生效。');
      }
      if (event === 'complete') {
        const blockers = [];
        if (current.highPriorityOpen) blockers.push(`${current.highPriorityOpen} 个未完成 P0/P1 任务`);
        if (current.openIncidentCount) blockers.push(`${current.openIncidentCount} 个未关闭异常工单`);
        const pending = current.acceptance.filter(item => item.status !== '通过').length; if (pending) blockers.push(`${pending} 个未通过验收项`);
        if (blockers.length) return fail(`项目暂不能结项：${blockers.join('、')}。`);
      }
      update(projectId, item => ({ ...item, status:next, progress:next === '已完成' ? 100 : item.progress, audit:[audit(actor,`项目状态变更：${next}`,`由${item.status}变更为${next}`), ...item.audit] })); return ok(`项目已更新为“${next}”。`);
    },
    addMember(projectId, member, actor) {
      const current = projects.find(item => item.id === projectId); if (!current) return fail('项目不存在。');
      if (['已完成','已归档'].includes(current.status)) return fail('已关闭项目不能新增成员。');
      if (current.members.some(item => item.id === member.id)) return fail('该成员已在项目中。');
      update(projectId, item => ({ ...item, members:[...item.members, member], audit:[audit(actor,'新增项目成员',`${member.name} · ${member.role}`), ...item.audit] })); return ok(`已添加项目成员 ${member.name}。`);
    },
    removeMember(projectId, memberId, actor) {
      const current = projects.find(item => item.id === projectId); const member = current?.members.find(item => item.id === memberId); if (!current || !member) return fail('项目成员不存在。');
      if (member.name === current.owner) return fail('项目负责人不能直接移除，请先变更负责人。');
      update(projectId, item => ({ ...item, members:item.members.filter(value => value.id !== memberId), audit:[audit(actor,'移除项目成员',member.name), ...item.audit] })); return ok(`已移除项目成员 ${member.name}。`);
    },
    bindAsset(projectId, binding, actor) {
      const current = projects.find(item => item.id === projectId); if (!current) return fail('项目不存在。');
      if (['待验收','已完成','已归档'].includes(current.status)) return fail('项目已进入关闭阶段，不能新增能力绑定。');
      if (current.bindings.some(item => item.id === binding.id)) return fail('该资产版本已绑定。');
      update(projectId, item => ({ ...item, bindings:[...item.bindings, binding], audit:[audit(actor,'绑定项目资产',`${binding.kind} ${binding.id} · ${binding.version}`), ...item.audit] })); return ok(`已绑定${binding.kind}“${binding.name}”。`);
    },
    removeBinding(projectId, bindingId, actor) {
      const current = projects.find(item => item.id === projectId); const binding = current?.bindings.find(item => item.id === bindingId); if (!current || !binding) return fail('绑定关系不存在。');
      if (current.status === '进行中' && binding.status === '已绑定') return fail('运行中项目的已发布绑定不能直接移除，请先创建绑定变更。');
      update(projectId, item => ({ ...item, bindings:item.bindings.filter(value => value.id !== bindingId), audit:[audit(actor,'移除项目绑定',binding.id), ...item.audit] })); return ok('项目绑定已移除。');
    },
    addMilestone(projectId, milestone, actor) {
      const current = projects.find(item => item.id === projectId); if (!current) return fail('项目不存在。');
      if (['待验收','已完成','已归档'].includes(current.status)) return fail('项目已进入关闭阶段，不能新增里程碑。');
      if (!milestone.name.trim() || !milestone.owner.trim() || !milestone.dueAt || !milestone.acceptance.trim()) return fail('里程碑名称、负责人、截止日期和完成条件均为必填项。');
      if (current.milestones.some(item => item.name === milestone.name.trim())) return fail('同名里程碑已存在。');
      update(projectId, item => ({ ...item, milestones:[...item.milestones, { ...milestone, name:milestone.name.trim() }], audit:[audit(actor,'新增项目里程碑',`${milestone.name} · ${milestone.dueAt}`), ...item.audit] }));
      return ok(`里程碑“${milestone.name}”已加入项目计划。`);
    },
    updateMilestone(projectId, milestoneId, status, actor) {
      const current = projects.find(item => item.id === projectId); if (!current?.milestones.some(item => item.id === milestoneId)) return fail('里程碑不存在。');
      update(projectId, item => ({ ...item, milestones:item.milestones.map(value => value.id === milestoneId ? { ...value, status, result:status === '已完成' ? '已完成人工确认' : value.result } : value), audit:[audit(actor,'更新里程碑',`${milestoneId} → ${status}`), ...item.audit] })); return ok(`里程碑已更新为“${status}”。`);
    },
    updateAcceptance(projectId, acceptanceId, status, actor) {
      const current = projects.find(item => item.id === projectId); if (!current?.acceptance.some(item => item.id === acceptanceId)) return fail('验收项不存在。');
      update(projectId, item => ({ ...item, acceptance:item.acceptance.map(value => value.id === acceptanceId ? { ...value, status, conclusion:status === '通过' ? '业务验收通过' : status === '不通过' ? '需整改后重新验收' : '—' } : value), audit:[audit(actor,'更新验收结论',`${acceptanceId} → ${status}`), ...item.audit] })); return ok(`验收项已更新为“${status}”。`);
    },
    createContract(input, actor) {
      if (!input.name.trim() || !input.customer.trim() || !input.sowId.trim() || !input.period.trim()) return fail('合同名称、客户、SOW 和周期均为必填项。');
      const id = `CONTRACT-${String(contracts.length + 1).padStart(4,'0')}`;
      setContracts(items => [{ ...input, id }, ...items]); return ok(`合同“${input.name}”已创建，操作人：${actor}。`, id);
    },
    updateContract(contractId, patch) {
      const current = contracts.find(item => item.id === contractId); if (!current) return fail('合同不存在。');
      if (current.status !== '草稿') return fail('只有草稿合同可以直接编辑。');
      setContracts(items => items.map(item => item.id === contractId ? { ...item, ...patch } : item)); return ok('合同草稿已更新。');
    },
    deleteContract(contractId) {
      const current = contracts.find(item => item.id === contractId); if (!current) return fail('合同不存在。');
      if (current.status !== '草稿') return fail('只有草稿合同可以删除。');
      if (projects.some(item => item.contractId === contractId)) return fail('合同已被项目引用，不能删除。');
      setContracts(items => items.filter(item => item.id !== contractId)); return ok('合同草稿已删除。');
    },
    transitionContract(contractId, status) {
      const current = contracts.find(item => item.id === contractId); if (!current) return fail('合同不存在。');
      const legal: Record<ContractStatus, ContractStatus[]> = { 草稿:['待审核'], 待审核:['草稿','生效'], 生效:['暂停','已完成','已终止'], 暂停:['生效','已终止'], 已完成:['已归档'], 已终止:['已归档'], 已归档:[] };
      if (!legal[current.status].includes(status)) return fail(`合同不能从“${current.status}”变更为“${status}”。`);
      setContracts(items => items.map(item => item.id === contractId ? { ...item, status } : item)); return ok(`合同已更新为“${status}”。`);
    },
  }), [projects, contracts]);
  return <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>;
}

export function useDeliveryProjectRegistry() {
  const value = useContext(RegistryContext); if (!value) throw new Error('useDeliveryProjectRegistry must be used inside DeliveryProjectRegistryProvider'); return value;
}
