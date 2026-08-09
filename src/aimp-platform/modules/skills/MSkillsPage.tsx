import React, { useMemo, useState } from 'react';
import { ArrowRight, Filter, Plus, Puzzle, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { ModuleHeader } from '../../components/ModuleHeader';
import type { RoleId } from '../../types';
import { SkillWizard } from './SkillWizard';
import { SkillWorkbench } from './SkillWorkbench';
import { useSkillRegistry } from './skill-registry-store';
import type { SkillHealth, SkillLifecycle, SkillRecord, SkillRisk, SkillType } from './skills-data';
import './skills.css';

const manageRoles: RoleId[] = ['trainer', 'admin', 'superadmin'];
const visibleRoles: RoleId[] = ['business', 'trainer', 'admin', 'superadmin'];

export function MSkillsPage({ role }: { role: RoleId }) {
  const registry = useSkillRegistry();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'全部类型' | SkillType>('全部类型');
  const [lifecycle, setLifecycle] = useState<'全部状态' | SkillLifecycle>('全部状态');
  const [health, setHealth] = useState<'全部健康度' | SkillHealth>('全部健康度');
  const [department, setDepartment] = useState('全部部门');
  const [risk, setRisk] = useState<'全部风险' | SkillRisk>('全部风险');
  const [notice, setNotice] = useState('');
  const selected = registry.records.find(item => item.id === selectedId);
  const departments = useMemo(() => Array.from(new Set(registry.records.map(item => item.department))), [registry.records]);
  const rows = useMemo(() => registry.records.filter(item => {
    const businessScope = role !== 'business' || item.department === '线索事业部' || item.dependencies.some(dep => dep.name.includes('线索'));
    const text = `${item.name}${item.id}${item.description}${item.owner}`.toLowerCase();
    return businessScope && text.includes(query.toLowerCase()) && (type === '全部类型' || item.type === type) && (lifecycle === '全部状态' || item.lifecycle === lifecycle) && (health === '全部健康度' || item.health === health) && (department === '全部部门' || item.department === department) && (risk === '全部风险' || item.risk === risk);
  }), [registry.records, role, query, type, lifecycle, health, department, risk]);

  if (!visibleRoles.includes(role)) return <section className="tools-gate"><ShieldCheck /><h1>Skill 技能库不可访问</h1><p>{role === 'client' ? '客户管理员无权访问平台内部 Skill、能力依赖和发布治理。' : '员工不进入 Skill 管理模块，请通过已授权 Agent 使用可用 Skill。'}</p></section>;
  if (selected) return <SkillWorkbench role={role} skill={selected} onBack={() => setSelectedId(null)} onSelectSkill={setSelectedId} />;

  const remove = (record: SkillRecord) => { const result = registry.remove(record.id); setNotice(result.message); };
  return <section className="tools-page skills-page">
    <ModuleHeader title="Skill 技能库" subtitle="装配、测试、发布并治理 Agent 与工作流复用的声明式能力" actions={<span className="tools-header-summary">已发布 {registry.records.filter(item => item.lifecycle === '已发布').length} · 可绑定 {registry.bindableSkills.length}</span>} />
    <main className="tools-content">
      <section className="tools-catalog-card">
        <header className="tools-catalog-head">
          <div><h2>Skill 目录</h2><p>Skill 由指令、契约和已发布能力依赖组成；组合 Skill 最多一层。</p></div>
          <div className="tools-catalog-actions"><label className="tools-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索名称、ID、负责人" /></label>{manageRoles.includes(role) && <button className="tools-primary" onClick={() => setWizardOpen(true)}><Plus size={15} />新建 Skill</button>}</div>
        </header>
        <div className="tools-filters skills-filters"><Filter size={14} /><select value={type} onChange={event => setType(event.target.value as typeof type)}><option>全部类型</option><option>原子</option><option>组合</option></select><select value={lifecycle} onChange={event => setLifecycle(event.target.value as typeof lifecycle)}><option>全部状态</option>{['草稿', '测试中', '待审核', '已发布', '已停用', '已归档'].map(item => <option key={item}>{item}</option>)}</select><select value={health} onChange={event => setHealth(event.target.value as typeof health)}><option>全部健康度</option>{['正常', '波动', '故障', '维护中'].map(item => <option key={item}>{item}</option>)}</select><select value={department} onChange={event => setDepartment(event.target.value)}><option>全部部门</option>{departments.map(item => <option key={item}>{item}</option>)}</select><select value={risk} onChange={event => setRisk(event.target.value as typeof risk)}><option>全部风险</option><option>低</option><option>中</option><option>高</option></select><span>共 {rows.length} 个 Skill</span></div>
        <div className="tools-table skills-table" role="table" aria-label="Skill 目录">
          <div className="tools-table-row tools-table-head" role="row"><span>名称 / ID</span><span>类型 / 版本</span><span>负责人</span><span>能力依赖</span><span>测试 / 成功率</span><span>平均耗时</span><span>引用对象</span><span>生命周期</span><span>操作</span></div>
          {rows.map(item => <div className="tools-table-row" role="row" key={item.id}>
            <button className="tools-name" onClick={() => setSelectedId(item.id)}><Puzzle size={15} /><span><strong>{item.name}</strong><small>{item.id} · {item.description}</small></span></button>
            <span><b>{item.type} Skill</b><small>{item.currentVersion} · 风险 {item.risk}</small></span>
            <span><b>{item.owner}</b><small>{item.department}</small></span>
            <span><b>{assetDependencies(item).length}</b><small>{assetSummary(item)}</small></span>
            <span><b>{item.testPassRate}% / {item.successRate}%</b><small>门禁 / 运行</small></span>
            <span><b>{item.averageLatency}</b><small><i className={`tools-health is-${item.health}`}>● {item.health}</i></small></span>
            <span><b>{consumerDependencies(item).length}</b><small>{consumerSummary(item)}</small></span>
            <span><i className={`tools-life is-${item.lifecycle}`}>{item.lifecycle}</i><small>{item.lastTestPassed ? '门禁通过' : '待验证'}</small></span>
            <span className="tools-row-actions"><button onClick={() => setSelectedId(item.id)}>详情 <ArrowRight size={13} /></button>{manageRoles.includes(role) && item.lifecycle === '草稿' && <button className="danger" onClick={() => remove(item)} title={consumerDependencies(item).length ? '存在依赖，无法删除' : '删除草稿'}><Trash2 size={13} /></button>}</span>
          </div>)}
          {!rows.length && <div className="tools-empty"><Puzzle /><strong>没有符合条件的 Skill</strong><p>调整筛选条件，或由 AI训练师新建 Skill 草稿。</p></div>}
        </div>
      </section>
    </main>
    {wizardOpen && <SkillWizard existingNames={registry.records.map(item => item.name)} onClose={() => setWizardOpen(false)} onSave={record => { registry.upsert(record); setWizardOpen(false); setSelectedId(record.id); }} />}
    {notice && <div className="tools-notice">{notice}<button onClick={() => setNotice('')}>关闭</button></div>}
  </section>;
}

const assetTypes = ['Prompt', '知识策略', 'Tool', '原子 Skill'];
function assetDependencies(item: SkillRecord) { return item.dependencies.filter(dep => assetTypes.includes(dep.type)); }
function consumerDependencies(item: SkillRecord) { return item.dependencies.filter(dep => !assetTypes.includes(dep.type)); }
function assetSummary(item: SkillRecord) { const list = assetDependencies(item); return list.length ? list.map(dep => dep.type).join(' · ') : '尚未装配'; }
function consumerSummary(item: SkillRecord) { const list = consumerDependencies(item); return list.length ? list.map(dep => dep.type).join(' · ') : '暂无生产引用'; }
