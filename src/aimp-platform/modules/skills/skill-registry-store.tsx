import React, { createContext, useContext, useMemo, useState } from 'react';
import type { RoleId } from '../../types';
import { useToolRegistry } from '../tools/tool-registry-store';
import { createSkillDraft, isHighRiskSkill, skillRecords, type SkillAuditEvent, type SkillDependency, type SkillRecord, type SkillTestRun, type SkillType } from './skills-data';

export type SkillLifecycleAction = 'test' | 'submit' | 'withdraw' | 'reject' | 'publish' | 'copy-draft' | 'disable' | 'restore' | 'archive' | 'restore-draft';
export type SkillOperationResult = { ok: boolean; message: string; record?: SkillRecord };

type SkillRegistryValue = {
  records: SkillRecord[];
  upsert: (record: SkillRecord, audit?: Omit<SkillAuditEvent, 'id' | 'time'>) => void;
  createDraft: (type: SkillType, name: string) => SkillRecord;
  remove: (id: string) => SkillOperationResult;
  transition: (id: string, action: SkillLifecycleAction, actor: string, role: RoleId, reason?: string) => SkillOperationResult;
  addTestRun: (skillId: string, run: SkillTestRun, actor?: string) => SkillOperationResult;
  addDependency: (skillId: string, dependency: SkillDependency) => SkillOperationResult;
  removeDependency: (skillId: string, dependencyId: string) => SkillOperationResult;
  bindableSkills: SkillRecord[];
  bindableAtomicSkills: SkillRecord[];
};

const SkillRegistryContext = createContext<SkillRegistryValue | null>(null);
const consumerTypes = ['组合 Skill', 'Agent', '工作流', '部门', '岗位', '角色'];

export function SkillRegistryProvider({ children }: { children: React.ReactNode }) {
  const tools = useToolRegistry();
  const [records, setRecords] = useState<SkillRecord[]>(skillRecords);
  const upsert = (record: SkillRecord, event?: Omit<SkillAuditEvent, 'id' | 'time'>) => setRecords(current => {
    const next = event ? { ...record, audit: [{ ...event, id: `AUD-${Date.now()}`, time: '刚刚' }, ...record.audit] } : record;
    return current.some(item => item.id === record.id) ? current.map(item => item.id === record.id ? next : item) : [next, ...current];
  });
  const createDraft = (type: SkillType, name: string) => { const draft = createSkillDraft(type, name); setRecords(current => [draft, ...current]); return draft; };
  const remove = (id: string): SkillOperationResult => {
    const record = records.find(item => item.id === id);
    if (!record) return { ok: false, message: 'Skill 不存在或已被删除。' };
    if (record.lifecycle !== '草稿') return { ok: false, message: '只有草稿 Skill 可以删除；其他状态请使用停用或归档。' };
    const consumers = record.dependencies.filter(item => consumerTypes.includes(item.type));
    if (consumers.length) return { ok: false, message: `存在 ${consumers.length} 项生产依赖，解除 Agent、工作流或组合 Skill 绑定后才能删除。` };
    setRecords(current => current.filter(item => item.id !== id));
    return { ok: true, message: `已删除草稿 ${record.name}。` };
  };
  const dependenciesHealthy = (record: SkillRecord) => {
    if (!record.dependencies.length) return false;
    if (record.type === '组合') {
      const children = record.dependencies.filter(item => item.type === '原子 Skill');
      return children.length >= 2 && children.every(item => records.some(skill => skill.id === item.id && skill.type === '原子' && skill.lifecycle === '已发布' && skill.health === '正常'));
    }
    const assets = record.dependencies.filter(item => ['Prompt', '知识策略', 'Tool'].includes(item.type));
    return assets.length > 0 && assets.every(item => item.type !== 'Tool' || tools.bindableTools.some(tool => tool.id === item.id));
  };
  const contractValid = (record: SkillRecord) => { try { JSON.parse(record.contract.outputSchema); JSON.parse(record.contract.exampleInput); JSON.parse(record.contract.exampleOutput); return record.contract.inputs.length > 0; } catch { return false; } };
  const transition = (id: string, action: SkillLifecycleAction, actor: string, role: RoleId, reason = ''): SkillOperationResult => {
    const record = records.find(item => item.id === id);
    if (!record) return { ok: false, message: 'Skill 不存在或已被删除。' };
    const trainer = ['trainer', 'admin', 'superadmin'].includes(role); const admin = ['admin', 'superadmin'].includes(role); const superadmin = role === 'superadmin';
    if (!trainer) return { ok: false, message: '当前身份仅可查看，不能变更 Skill 生命周期。' };
    if (action === 'test') {
      if (!['草稿', '测试中'].includes(record.lifecycle)) return { ok: false, message: '只有草稿或测试中的 Skill 可以运行发布前测试。' };
      if (!contractValid(record)) return { ok: false, message: '契约校验失败：请修复输入参数和 JSON Schema。' };
      if (!dependenciesHealthy(record)) return { ok: false, message: record.type === '组合' ? '组合 Skill 至少需要两个已发布且健康的原子 Skill，组合 Skill 只能引用原子 Skill。' : '依赖校验失败：请绑定已发布 Prompt/知识和健康 Tool。' };
      const next = withAudit({ ...record, lifecycle: '测试中', health: '正常' }, actor, '进入测试中', '契约与依赖基础校验通过');
      setRecords(current => current.map(item => item.id === id ? next : item)); return { ok: true, message: '基础门禁通过，Skill 已进入测试中。', record: next };
    }
    if (action === 'copy-draft' || action === 'restore-draft') {
      if (!['已发布', '已归档'].includes(record.lifecycle)) return { ok: false, message: '只有已发布或已归档 Skill 可以复制为新草稿。' };
      const nextVersion = bumpDraftVersion(record.currentVersion); const draft: SkillRecord = { ...record, id: `${record.id}-D${Date.now().toString().slice(-4)}`, name: `${record.name}（新草稿）`, lifecycle: '草稿', health: '故障', currentVersion: nextVersion, dependencies: record.dependencies.filter(item => !consumerTypes.includes(item.type)), tests: [], lastTestPassed: false, versions: [{ version: nextVersion, status: '草稿', author: actor, time: '刚刚', change: action === 'restore-draft' ? `从归档版本 ${record.currentVersion} 恢复` : `复制自已发布版本 ${record.currentVersion}`, dependencySnapshot: record.versions[0]?.dependencySnapshot || '复制当前依赖快照' }], audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor, action: action === 'restore-draft' ? '恢复为新草稿' : '复制为新草稿', evidence: `${record.id} · ${record.currentVersion}` }] };
      setRecords(current => [draft, ...current]); return { ok: true, message: `已生成新草稿 ${nextVersion}，原版本保持不变。`, record: draft };
    }
    let next: SkillRecord | null = null; let message = '';
    if (action === 'submit') {
      if (record.lifecycle !== '测试中') return { ok: false, message: 'Skill 必须先进入测试中并完成测试，才能提交审核。' };
      if (!record.lastTestPassed || !contractValid(record) || !dependenciesHealthy(record)) return { ok: false, message: '发布门禁未通过：契约、依赖和核心测试必须全部通过。' };
      next = { ...record, lifecycle: '待审核' }; message = '已提交审核，等待管理员复核能力边界、依赖和测试证据。';
    } else if (action === 'withdraw') {
      if (record.lifecycle !== '待审核') return { ok: false, message: '只有待审核 Skill 可以撤回。' };
      next = { ...record, lifecycle: '测试中' }; message = '已撤回审核，Skill 返回测试中。';
    } else if (action === 'reject') {
      if (!admin || record.lifecycle !== '待审核') return { ok: false, message: '只有管理员可以驳回待审核 Skill。' };
      if (!reason.trim()) return { ok: false, message: '驳回必须填写明确原因。' };
      next = { ...record, lifecycle: '测试中' }; message = `已驳回并返回测试中：${reason}`;
    } else if (action === 'publish') {
      if (!admin || record.lifecycle !== '待审核') return { ok: false, message: '只有管理员可以发布待审核 Skill。' };
      if (isHighRiskSkill(record) && !superadmin) return { ok: false, message: '高风险、组合或跨部门 Skill 仅超级管理员可发布。' };
      if (!record.lastTestPassed || !dependenciesHealthy(record)) return { ok: false, message: '测试或依赖门禁未通过，禁止发布。' };
      next = { ...record, lifecycle: '已发布', health: '正常', versions: record.versions.map((item, index) => ({ ...item, status: index === 0 ? '已发布' as const : item.status === '已发布' ? '历史版本' as const : item.status })) }; message = `已发布 ${record.currentVersion}，M03 与 M08 可绑定该不可变版本。`;
    } else if (action === 'disable') {
      if (!admin || record.lifecycle !== '已发布') return { ok: false, message: '只有管理员可以停用已发布 Skill。' };
      next = { ...record, lifecycle: '已停用', health: '维护中' }; message = `已停用 Skill；${record.dependencies.filter(item => consumerTypes.includes(item.type)).length} 项生产依赖保留记录但执行被阻断。`;
    } else if (action === 'restore') {
      if (!admin || record.lifecycle !== '已停用') return { ok: false, message: '只有管理员可以恢复已停用 Skill。' };
      if (!record.lastTestPassed || !dependenciesHealthy(record)) return { ok: false, message: '恢复前必须重新通过依赖和测试门禁。' };
      next = { ...record, lifecycle: '已发布', health: '正常' }; message = 'Skill 已恢复生产使用。';
    } else if (action === 'archive') {
      if (!admin || record.lifecycle !== '已停用') return { ok: false, message: 'Skill 必须先停用才能归档。' };
      const activeRuns = record.dependencies.filter(item => item.status === '运行中' && ['Agent', '工作流'].includes(item.type));
      if (activeRuns.length) return { ok: false, message: `存在 ${activeRuns.length} 项运行依赖，停止或迁移后才能归档。` };
      next = { ...record, lifecycle: '已归档', health: '维护中' }; message = 'Skill 已归档，版本、依赖和审计证据保留。';
    }
    if (!next) return { ok: false, message: '当前状态不支持该操作。' };
    next = withAudit(next, actor, message, reason || `${record.lifecycle} → ${next.lifecycle}`); setRecords(current => current.map(item => item.id === id ? next! : item)); return { ok: true, message, record: next };
  };
  const addTestRun = (skillId: string, run: SkillTestRun, actor = '当前用户'): SkillOperationResult => {
    const record = records.find(item => item.id === skillId); if (!record) return { ok: false, message: '未找到待测试 Skill。' };
    const passed = run.result === '通过' && run.score >= 80; const total = record.tests.length + 1; const passedCount = record.tests.filter(item => item.result === '通过' && item.score >= 80).length + (passed ? 1 : 0);
    const next = withAudit({ ...record, tests: [run, ...record.tests], lastTestPassed: passed, lifecycle: record.lifecycle === '草稿' ? '测试中' : record.lifecycle, health: passed ? '正常' : '故障', testPassRate: Math.round(passedCount / total * 100), averageLatency: run.latency }, actor, passed ? 'Skill 测试通过' : 'Skill 测试失败', `${run.id} · ${run.traceId} · 评分 ${run.score}`);
    setRecords(current => current.map(item => item.id === skillId ? next : item)); return { ok: true, message: passed ? '测试通过，结果已写入发布门禁。' : `测试失败：${run.error || '评分未达到 80 分。'}`, record: next };
  };
  const addDependency = (skillId: string, dependency: SkillDependency): SkillOperationResult => {
    const record = records.find(item => item.id === skillId); if (!record) return { ok: false, message: 'Skill 不存在。' };
    const consumer = consumerTypes.includes(dependency.type);
    if (!consumer && record.lifecycle !== '草稿' && record.lifecycle !== '测试中') return { ok: false, message: '只有草稿或测试中的 Skill 可以调整能力依赖；生产授权请在适用范围页维护。' };
    if (record.dependencies.some(item => item.id === dependency.id)) return { ok: false, message: '该依赖已存在。' };
    if (record.type === '组合') {
      const child = records.find(item => item.id === dependency.id);
      if (dependency.type !== '原子 Skill' || !child || child.type !== '原子') return { ok: false, message: '组合 Skill 只能引用原子 Skill，禁止多层嵌套。' };
      if (child.id === record.id) return { ok: false, message: '禁止循环依赖：Skill 不能引用自身。' };
    } else if (dependency.type === '原子 Skill') return { ok: false, message: '原子 Skill 不引用其他 Skill；请绑定 Prompt、知识策略或 Tool。' };
    if (dependency.type === 'Tool' && !tools.bindableTools.some(item => item.id === dependency.id)) return { ok: false, message: '只能绑定已发布且健康正常的 Tool。' };
    const next = withAudit({ ...record, dependencies: [...record.dependencies, dependency], lastTestPassed: consumer ? record.lastTestPassed : false }, '当前用户', `新增${dependency.type}依赖`, `${dependency.id} · ${dependency.version || ''}`);
    setRecords(current => current.map(item => {
      if (item.id === skillId) return next;
      if (record.type === '组合' && dependency.type === '原子 Skill' && item.id === dependency.id && !item.dependencies.some(value => value.id === record.id)) return withAudit({ ...item, dependencies: [...item.dependencies, { id: record.id, type: '组合 Skill', name: record.name, version: record.currentVersion, status: record.lifecycle, scope: '被组合引用' }] }, '当前用户', '新增组合 Skill 引用', `${record.id} · ${record.currentVersion}`);
      return item;
    })); return { ok: true, message: `已添加${dependency.type}：${dependency.name}。`, record: next };
  };
  const removeDependency = (skillId: string, dependencyId: string): SkillOperationResult => {
    const record = records.find(item => item.id === skillId); if (!record) return { ok: false, message: 'Skill 不存在。' };
    const dependency = record.dependencies.find(item => item.id === dependencyId); if (!dependency) return { ok: false, message: '依赖不存在。' };
    const consumer = consumerTypes.includes(dependency.type);
    if (!consumer && !['草稿', '测试中'].includes(record.lifecycle)) return { ok: false, message: '已发布或审核中的能力依赖快照不可直接修改。' };
    const next = withAudit({ ...record, dependencies: record.dependencies.filter(item => item.id !== dependencyId), lastTestPassed: false }, '当前用户', '解除依赖', dependencyId);
    setRecords(current => current.map(item => {
      if (item.id === skillId) return { ...next, lastTestPassed: consumer ? record.lastTestPassed : false };
      if (record.type === '组合' && dependency.type === '原子 Skill' && item.id === dependency.id) return withAudit({ ...item, dependencies: item.dependencies.filter(value => value.id !== record.id) }, '当前用户', '解除组合 Skill 引用', record.id);
      return item;
    })); return { ok: true, message: `已移除${dependency.type}：${dependency.name}。`, record: next };
  };
  const bindableSkills = useMemo(() => records.filter(item => item.lifecycle === '已发布' && item.health === '正常' && dependenciesHealthy(item)), [records, tools.bindableTools]);
  const value = useMemo<SkillRegistryValue>(() => ({ records, upsert, createDraft, remove, transition, addTestRun, addDependency, removeDependency, bindableSkills, bindableAtomicSkills: bindableSkills.filter(item => item.type === '原子') }), [records, bindableSkills]);
  return <SkillRegistryContext.Provider value={value}>{children}</SkillRegistryContext.Provider>;
}

function withAudit(record: SkillRecord, actor: string, action: string, evidence: string): SkillRecord { return { ...record, audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor, action, evidence }, ...record.audit] }; }
function bumpDraftVersion(version: string) { const match = version.match(/v(\d+)\.(\d+)\.(\d+)/); return match ? `v${match[1]}.${Number(match[2]) + 1}.0-draft` : 'v0.1.0-draft'; }
export function useSkillRegistry() { const context = useContext(SkillRegistryContext); if (!context) throw new Error('useSkillRegistry must be used inside SkillRegistryProvider'); return context; }
