import React, { useMemo, useState } from 'react';
import { ArrowRight, Filter, Plus, Search, ShieldCheck, Trash2, Wrench } from 'lucide-react';
import { ModuleHeader } from '../../components/ModuleHeader';
import type { RoleId } from '../../types';
import { ToolWizard } from './ToolWizard';
import { ToolWorkbench } from './ToolWorkbench';
import { useToolRegistry } from './tool-registry-store';
import type { ToolHealth, ToolLifecycle, ToolRecord, ToolType } from './tools-data';
import './tools.css';

const manageRoles: RoleId[] = ['trainer', 'admin', 'superadmin'];
const visibleRoles: RoleId[] = ['business', ...manageRoles];

export function MToolsPage({ role }: { role: RoleId }) {
  const registry = useToolRegistry();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'全部类型' | ToolType>('全部类型');
  const [lifecycle, setLifecycle] = useState<'全部状态' | ToolLifecycle>('全部状态');
  const [health, setHealth] = useState<'全部健康度' | ToolHealth>('全部健康度');
  const [department, setDepartment] = useState('全部部门');
  const [notice, setNotice] = useState('');
  const selected = registry.records.find(item => item.id === selectedId);
  const departments = useMemo(() => Array.from(new Set(registry.records.map(item => item.department))), [registry.records]);
  const rows = useMemo(() => registry.records.filter(item => {
    const businessScope = role !== 'business' || item.department === '线索事业部' || item.dependencies.some(dep => dep.scope.includes('线索') || dep.name.includes('线索'));
    const text = `${item.name}${item.id}${item.description}${item.owner}`.toLowerCase();
    return businessScope && text.includes(query.toLowerCase()) && (type === '全部类型' || item.type === type) && (lifecycle === '全部状态' || item.lifecycle === lifecycle) && (health === '全部健康度' || item.health === health) && (department === '全部部门' || item.department === department);
  }), [registry.records, role, query, type, lifecycle, health, department]);

  if (!visibleRoles.includes(role)) return <section className="tools-gate"><ShieldCheck /><h1>Tools 工具集不可访问</h1><p>{role === 'client' ? '客户管理员无权访问平台内部工具、凭据和调用治理。' : '员工不进入工具管理模块，请在已授权 Agent 或工作空间中使用可用工具。'}</p></section>;
  if (selected) return <ToolWorkbench role={role} tool={selected} onBack={() => setSelectedId(null)} onSelectTool={setSelectedId} />;

  const remove = (record: ToolRecord) => {
    const result = registry.remove(record.id);
    setNotice(result.message);
  };
  return <section className="tools-page">
    <ModuleHeader title="Tools 工具集" subtitle="注册、测试、发布并治理 Agent 与工作流调用的外部能力" actions={<span className="tools-header-summary">已发布 {registry.records.filter(item => item.lifecycle === '已发布').length} · 健康 {registry.bindableTools.length}</span>} />
    <main className="tools-content">
      <section className="tools-catalog-card">
        <header className="tools-catalog-head">
          <div><h2>Tool 目录</h2><p>已发布且健康正常的版本才能被 M03 Agent 和 M08 工作流绑定。</p></div>
          <div className="tools-catalog-actions"><label className="tools-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索名称、ID、负责人" /></label>{manageRoles.includes(role) && <button className="tools-primary" onClick={() => setWizardOpen(true)}><Plus size={15} />新建 Tool</button>}</div>
        </header>
        <div className="tools-filters"><Filter size={14} /><select value={type} onChange={event => setType(event.target.value as typeof type)}><option>全部类型</option>{['HTTP API', 'MCP Server', '数据库', '消息通道', '文件系统', '代码执行'].map(item => <option key={item}>{item}</option>)}</select><select value={lifecycle} onChange={event => setLifecycle(event.target.value as typeof lifecycle)}><option>全部状态</option>{['草稿', '测试中', '待审核', '已发布', '已停用', '已归档'].map(item => <option key={item}>{item}</option>)}</select><select value={health} onChange={event => setHealth(event.target.value as typeof health)}><option>全部健康度</option>{['正常', '波动', '故障', '维护中'].map(item => <option key={item}>{item}</option>)}</select><select value={department} onChange={event => setDepartment(event.target.value)}><option>全部部门</option>{departments.map(item => <option key={item}>{item}</option>)}</select><span>共 {rows.length} 个 Tool</span></div>
        <div className="tools-table" role="table" aria-label="Tool 目录">
          <div className="tools-table-row tools-table-head" role="row"><span>名称 / ID</span><span>类型 / 版本</span><span>负责人</span><span>健康 / 成功率</span><span>P95 / 今日调用</span><span>绑定对象</span><span>生命周期</span><span>操作</span></div>
          {rows.map(item => <div className="tools-table-row" role="row" key={item.id}>
            <button className="tools-name" onClick={() => setSelectedId(item.id)}><Wrench size={15} /><span><strong>{item.name}</strong><small>{item.id} · {item.description}</small></span></button>
            <span><b>{item.type}</b><small>{item.currentVersion} · 风险 {item.risk}</small></span>
            <span><b>{item.owner}</b><small>{item.department}</small></span>
            <span><i className={`tools-health is-${item.health}`}>● {item.health}</i><small>{item.successRate}%</small></span>
            <span><b>{item.p95Latency}</b><small>{item.dailyCalls.toLocaleString()} 次</small></span>
            <span><b>{item.dependencies.length}</b><small>{dependencySummary(item)}</small></span>
            <span><i className={`tools-life is-${item.lifecycle}`}>{item.lifecycle}</i><small>{item.lastTestPassed ? '门禁通过' : '待验证'}</small></span>
            <span className="tools-row-actions"><button onClick={() => setSelectedId(item.id)}>详情 <ArrowRight size={13} /></button>{manageRoles.includes(role) && item.lifecycle === '草稿' && <button className="danger" onClick={() => remove(item)} title={item.dependencies.length ? '存在依赖，无法删除' : '删除草稿'}><Trash2 size={13} /></button>}</span>
          </div>)}
          {!rows.length && <div className="tools-empty"><Wrench /><strong>没有符合条件的 Tool</strong><p>调整筛选条件，或由训练师新建工具草稿。</p></div>}
        </div>
      </section>
    </main>
    {wizardOpen && <ToolWizard existingNames={registry.records.map(item => item.name)} onClose={() => setWizardOpen(false)} onSave={record => { registry.upsert(record); setWizardOpen(false); setSelectedId(record.id); }} />}
    {notice && <div className="tools-notice">{notice}<button onClick={() => setNotice('')}>关闭</button></div>}
  </section>;
}

function dependencySummary(item: ToolRecord) {
  if (!item.dependencies.length) return '暂无生产依赖';
  const counts = item.dependencies.reduce<Record<string, number>>((acc, dep) => ({ ...acc, [dep.type]: (acc[dep.type] || 0) + 1 }), {});
  return Object.entries(counts).map(([key, value]) => `${key} ${value}`).join(' · ');
}
