import React, { createContext, useContext, useMemo, useState } from 'react';
import type { RoleId } from '../../types';
import { createToolDraft, isHighRiskTool, toolRecords, type ToolAuditEvent, type ToolDependency, type ToolRecord, type ToolTestRun } from './tools-data';

export type ToolLifecycleAction = 'submit' | 'withdraw' | 'reject' | 'publish' | 'disable' | 'restore' | 'archive' | 'restore-draft' | 'copy-draft';
export type ToolOperationResult = { ok: boolean; message: string; record?: ToolRecord };

type ToolRegistryValue = {
  records: ToolRecord[];
  upsert: (record: ToolRecord, audit?: Omit<ToolAuditEvent, 'id' | 'time'>) => void;
  createDraft: (type: ToolRecord['type'], name: string) => ToolRecord;
  remove: (id: string) => { ok: boolean; message: string };
  transition: (id: string, action: ToolLifecycleAction, actor: string, role: RoleId, reason?: string) => ToolOperationResult;
  addTestRun: (toolId: string, run: ToolTestRun, actor?: string) => ToolOperationResult;
  addDependency: (toolId: string, dependency: ToolDependency) => void;
  removeDependency: (toolId: string, dependencyId: string) => void;
  bindableTools: ToolRecord[];
};

const ToolRegistryContext = createContext<ToolRegistryValue | null>(null);

export function ToolRegistryProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ToolRecord[]>(toolRecords);
  const upsert = (record: ToolRecord, event?: Omit<ToolAuditEvent, 'id' | 'time'>) => setRecords(current => {
    const next = event ? { ...record, audit: [{ ...event, id: `AUD-${Date.now()}`, time: '刚刚' }, ...record.audit] } : record;
    return current.some(item => item.id === record.id) ? current.map(item => item.id === record.id ? next : item) : [next, ...current];
  });
  const createDraft = (type: ToolRecord['type'], name: string) => {
    const draft = createToolDraft(type, name);
    setRecords(current => [draft, ...current]);
    return draft;
  };
  const remove = (id: string) => {
    const record = records.find(item => item.id === id);
    if (!record) return { ok: false, message: 'Tool 不存在或已被删除。' };
    if (record.lifecycle !== '草稿') return { ok: false, message: '只有草稿 Tool 可以删除；其他状态请使用停用或归档。' };
    if (record.dependencies.length) return { ok: false, message: `存在 ${record.dependencies.length} 项依赖，解除 Agent、工作流或 Skill 绑定后才能删除。` };
    setRecords(current => current.filter(item => item.id !== id));
    return { ok: true, message: `已删除草稿 ${record.name}。` };
  };
  const transition = (id: string, action: ToolLifecycleAction, actor: string, role: RoleId, reason = ''): ToolOperationResult => {
    const record = records.find(item => item.id === id);
    if (!record) return { ok: false, message: 'Tool 不存在或已被删除。' };
    const trainer = role === 'trainer' || role === 'admin' || role === 'superadmin';
    const admin = role === 'admin' || role === 'superadmin';
    const superadmin = role === 'superadmin';
    if (!trainer) return { ok: false, message: '当前身份仅可查看，不能变更 Tool 生命周期。' };
    let next: ToolRecord | null = null;
    let message = '';
    if (action === 'submit') {
      if (!['草稿', '测试中'].includes(record.lifecycle)) return { ok: false, message: '只有草稿或测试中的 Tool 可以提交审核。' };
      if (!record.lastTestPassed) return { ok: false, message: '发布门禁未通过：请先完成连通测试与契约校验。' };
      if (!record.environments.some(item => item.name === '测试' && item.secretRef.trim())) return { ok: false, message: '认证引用缺失：测试环境必须绑定 Secret ID。' };
      next = { ...record, lifecycle: '待审核' }; message = '已提交审核，等待管理员复核连接、安全和依赖范围。';
    } else if (action === 'withdraw') {
      if (record.lifecycle !== '待审核') return { ok: false, message: '只有待审核 Tool 可以撤回。' };
      next = { ...record, lifecycle: '测试中' }; message = '已撤回审核，Tool 返回测试中。';
    } else if (action === 'reject') {
      if (!admin || record.lifecycle !== '待审核') return { ok: false, message: '只有管理员可驳回待审核 Tool。' };
      next = { ...record, lifecycle: '测试中' }; message = `已驳回并返回测试中${reason ? `：${reason}` : '，请补充修复说明。'}`;
    } else if (action === 'publish') {
      if (!admin || record.lifecycle !== '待审核') return { ok: false, message: '只有管理员可发布待审核 Tool。' };
      if (isHighRiskTool(record) && !superadmin) return { ok: false, message: '高风险 Tool 仅超级管理员可发布。' };
      if (!record.lastTestPassed) return { ok: false, message: '测试门禁未通过，禁止发布。' };
      const versions = record.versions.map(item => item.status === '已发布' ? { ...item, status: '历史版本' as const } : item);
      next = { ...record, lifecycle: '已发布', health: '正常', versions: versions.map((item, index) => index === 0 ? { ...item, status: '已发布' as const } : item) };
      message = `已发布 ${record.currentVersion}，生产依赖可选择该不可变版本。`;
    } else if (action === 'disable') {
      if (!admin || record.lifecycle !== '已发布') return { ok: false, message: '只有管理员可停用已发布 Tool。' };
      next = { ...record, lifecycle: '已停用', health: '维护中' }; message = `已停用生产调用；${record.dependencies.length} 项依赖保持记录但调用被阻断。`;
    } else if (action === 'restore') {
      if (!admin || record.lifecycle !== '已停用') return { ok: false, message: '只有管理员可恢复已停用 Tool。' };
      if (!record.lastTestPassed) return { ok: false, message: '恢复前必须重新通过连通测试。' };
      next = { ...record, lifecycle: '已发布', health: '正常' }; message = 'Tool 已恢复生产调用。';
    } else if (action === 'archive') {
      if (!admin || record.lifecycle !== '已停用') return { ok: false, message: 'Tool 必须先停用才能归档。' };
      next = { ...record, lifecycle: '已归档', health: '维护中' }; message = 'Tool 已归档，依赖、版本与审计证据保留。';
    } else if (action === 'restore-draft' || action === 'copy-draft') {
      if (!trainer) return { ok: false, message: '当前身份无权创建草稿。' };
      const draft = { ...record, id: `${record.id}-D${Date.now().toString().slice(-4)}`, name: `${record.name}（新草稿）`, lifecycle: '草稿' as const, health: '故障' as const, currentVersion: bumpDraftVersion(record.currentVersion), dependencies: [], tests: [], calls: [], lastTestPassed: false, versions: [{ version: bumpDraftVersion(record.currentVersion), status: '草稿' as const, author: actor, time: '刚刚', change: action === 'restore-draft' ? `从归档版本 ${record.currentVersion} 恢复` : `复制自已发布版本 ${record.currentVersion}` }], audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor, action: action === 'restore-draft' ? '恢复为新草稿' : '复制为新草稿', evidence: `${record.id} · ${record.currentVersion}` }] };
      setRecords(current => [draft, ...current]);
      return { ok: true, message: `已生成新草稿 ${draft.currentVersion}，原版本保持不变。`, record: draft };
    }
    if (!next) return { ok: false, message: '当前状态不支持该操作。' };
    next = { ...next, audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor, action: message, evidence: reason || `${record.lifecycle} → ${next.lifecycle}` }, ...record.audit] };
    setRecords(current => current.map(item => item.id === id ? next! : item));
    return { ok: true, message, record: next };
  };
  const addTestRun = (toolId: string, run: ToolTestRun, actor = '当前用户'): ToolOperationResult => {
    const record = records.find(item => item.id === toolId);
    if (!record) return { ok: false, message: '未找到待测试 Tool。' };
    const passed = run.result === '通过';
    const next: ToolRecord = { ...record, tests: [run, ...record.tests], lastTestPassed: passed, lifecycle: record.lifecycle === '草稿' ? '测试中' : record.lifecycle, health: passed ? '正常' : run.result === '限流' ? '波动' : '故障', p95Latency: run.latency, audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor, action: passed ? '连通测试通过' : `连通测试${run.result}`, evidence: `${run.id} · ${run.environment} · ${run.latency}` }, ...record.audit] };
    setRecords(current => current.map(item => item.id === toolId ? next : item));
    return { ok: true, message: passed ? '连通测试与契约校验通过，已进入测试中。' : `测试${run.result}：${run.error || '请检查连接、认证和治理参数。'}`, record: next };
  };
  const addDependency = (toolId: string, dependency: ToolDependency) => setRecords(current => current.map(item => item.id === toolId && !item.dependencies.some(value => value.id === dependency.id) ? { ...item, dependencies: [...item.dependencies, dependency], audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor: '当前用户', action: `新增${dependency.type}依赖`, evidence: `${dependency.id} · ${dependency.name}` }, ...item.audit] } : item));
  const removeDependency = (toolId: string, dependencyId: string) => setRecords(current => current.map(item => item.id === toolId ? { ...item, dependencies: item.dependencies.filter(value => value.id !== dependencyId), audit: [{ id: `AUD-${Date.now()}`, time: '刚刚', actor: '当前用户', action: '解除依赖', evidence: dependencyId }, ...item.audit] } : item));
  const value = useMemo<ToolRegistryValue>(() => ({ records, upsert, createDraft, remove, transition, addTestRun, addDependency, removeDependency, bindableTools: records.filter(item => item.lifecycle === '已发布' && item.health === '正常') }), [records]);
  return <ToolRegistryContext.Provider value={value}>{children}</ToolRegistryContext.Provider>;
}

function bumpDraftVersion(version: string) {
  const match = version.match(/v(\d+)\.(\d+)\.(\d+)/);
  if (!match) return 'v0.1.0-draft';
  return `v${match[1]}.${Number(match[2]) + 1}.0-draft`;
}

export function useToolRegistry() {
  const context = useContext(ToolRegistryContext);
  if (!context) throw new Error('useToolRegistry must be used inside ToolRegistryProvider');
  return context;
}
