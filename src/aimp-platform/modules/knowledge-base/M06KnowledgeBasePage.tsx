import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenText, ChevronRight, FilePlus2, FileUp, FolderTree, Pencil, Search, Trash2, X } from 'lucide-react';
import { ModuleHeader } from '../../components/ModuleHeader';
import type { RoleId } from '../../types';
import './m06.css';

type Status = '草稿' | '待审核' | '已发布' | '已驳回';
type Domain = '生产' | '存储' | '应用' | '进化';
type Asset = {
  id: string; name: string; category: string; department: string; topic: string; version: string; status: Status;
  author: string; reviewer: string; validUntil: string; agents: string[]; keywords: string; citations: string;
  chunks: number; description: string; body?: string; sourceName?: string; sourceType?: string; archived?: boolean; requiresBusinessApproval?: boolean; businessApprover?: string;
};
type Draft = { name: string; category: string; department: string; topic: string; agent: string; keywords: string; validUntil: string; author: string; reviewer: string; description: string; requiresBusinessApproval: boolean };

const topCategories = ['车型库', '故障库', '话术库', '素材库', '法规库'];
const taxonomySeed: Record<string, Array<{ department: string; topics: string[] }>> = {
  车型库: [{ department: 'DNDC 线索中心', topics: ['车型参数与配置', '线索判定规则'] }, { department: '营销总部', topics: ['区域上市资料'] }],
  故障库: [{ department: '用户服务中心（运营）', topics: ['智能驾驶故障', '交付异常处理'] }],
  话术库: [{ department: '内容中心', topics: ['售前直播话术', '品牌沟通规范'] }, { department: '用户服务中心（运营）', topics: ['售后 FAQ'] }],
  素材库: [{ department: '内容中心', topics: ['车型素材包', '活动内容模板'] }],
  法规库: [{ department: 'AIMP 平台运营', topics: ['数据安全与脱敏', '汽车销售政策'] }],
};
const agents = ['AGENT-LEAD-03 线索诊断 Agent', 'AGENT-QUALITY-11 质量诊断 Agent', 'AGENT-BIZ-08 业务运营 Agent'];
const seed: Asset[] = [
  { id: 'KB-LEAD-001', name: '线索判定与跟进规则', category: '车型库', department: 'DNDC 线索中心', topic: '线索判定规则', version: 'v3.2', status: '已发布', author: '李沐', reviewer: '赵岑', validUntil: '2026-09-30', agents: ['AGENT-LEAD-03', 'AGENT-QUALITY-11'], keywords: '车型标签、配置、线索评分', citations: '本周 1,284 次引用', chunks: 186, description: '车型标签、配置、政策与线索判定规则；供线索类 Agent 检索使用。', requiresBusinessApproval: true, businessApprover: '陈屿（线索中心经理）' },
  { id: 'KB-SERVICE-024', name: '售后异常处理知识包', category: '故障库', department: '用户服务中心（运营）', topic: '交付异常处理', version: 'v2.4', status: '待审核', author: '周芮', reviewer: '赵岑', validUntil: '2026-11-30', agents: ['AGENT-QUALITY-11'], keywords: '售后、异常分级、人工升级', citations: '待发布，暂无生产引用', chunks: 92, description: '售后异常分级、诊断路径与人工升级规则。' },
  { id: 'KB-BRAND-018', name: '品牌沟通与内容规范', category: '话术库', department: '内容中心', topic: '品牌沟通规范', version: 'v1.8', status: '已发布', author: '王珂', reviewer: '赵岑', validUntil: '2026-10-31', agents: ['AGENT-BIZ-08'], keywords: '品牌调性、禁用表达、审核标准', citations: '本周 746 次引用', chunks: 128, description: '品牌调性、禁用表达、审核标准与常用话术。' },
  { id: 'KB-GOV-006', name: '数据访问与脱敏规范', category: '法规库', department: 'AIMP 平台运营', topic: '数据安全与脱敏', version: 'v3.1', status: '已发布', author: '顾川', reviewer: '赵岑', validUntil: '2027-06-30', agents: ['AGENT-LEAD-03', 'AGENT-BIZ-08'], keywords: '数据范围、字段脱敏、审计', citations: '本周 362 次引用', chunks: 64, description: '项目数据范围、字段脱敏、特权访问与审计要求。' },
];
const rolePolicy: Record<RoleId, { scope: string; canCreate: boolean; canReview: boolean; canTaxonomy: boolean }> = {
  employee: { scope: '查看参与项目已授权知识及运行引用证据', canCreate: false, canReview: false, canTaxonomy: false },
  business: { scope: '查看负责项目知识并确认业务规则适用性', canCreate: false, canReview: false, canTaxonomy: false },
  trainer: { scope: '创建、维护知识草稿并提交审核', canCreate: true, canReview: false, canTaxonomy: false },
  admin: { scope: '审核、发布及治理租户内知识资产与分类', canCreate: true, canReview: true, canTaxonomy: true },
  superadmin: { scope: '查看全租户治理知识、分类与审计状态', canCreate: false, canReview: true, canTaxonomy: true },
  client: { scope: '客户管理员不访问内部知识资产', canCreate: false, canReview: false, canTaxonomy: false },
};
const emptyDraft: Draft = { name: '', category: '车型库', department: 'DNDC 线索中心', topic: '车型参数与配置', agent: agents[0], keywords: '', validUntil: '2026-12-31', author: '周芮', reviewer: '赵岑', description: '', requiresBusinessApproval: false };

export function M06KnowledgeBasePage({ role }: { role: RoleId }) {
  const [assets, setAssets] = useState(seed);
  const [domain, setDomain] = useState<Domain>('生产');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部分类');
  const [selected, setSelected] = useState<Asset | null>(null);
  const [editingDocument, setEditingDocument] = useState(false);
  const [documentBody, setDocumentBody] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceFileName, setSourceFileName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [taxonomyOpen, setTaxonomyOpen] = useState(false);
  const [taxonomy, setTaxonomy] = useState(taxonomySeed);
  const [taxonomyCategories, setTaxonomyCategories] = useState(topCategories);
  const [taxonomyCategory, setTaxonomyCategory] = useState('车型库');
  const [taxonomyDepartment, setTaxonomyDepartment] = useState('DNDC 线索中心');
  const [taxonomyTopic, setTaxonomyTopic] = useState('车型参数与配置');
  const [newTopCategory, setNewTopCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ level: '一级' | '二级' | '三级'; value: string; department?: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [notice, setNotice] = useState('');
  const [ragQuery, setRagQuery] = useState('线索评分异常时，应该先核对哪些规则？');
  const [ragRan, setRagRan] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const policy = rolePolicy[role];

  useEffect(() => { setSelected(null); setEditingDocument(false); setCreateOpen(false); setTaxonomyOpen(false); setDomain('生产'); }, [role]);
  const visible = useMemo(() => assets.filter((asset) => (category === '全部分类' || asset.category === category) && `${asset.name}${asset.id}${asset.department}${asset.topic}`.toLowerCase().includes(query.toLowerCase())), [assets, category, query]);
  const create = () => {
    const required = [draft.name, draft.category, draft.department, draft.topic, draft.agent, draft.keywords, draft.validUntil, draft.author, draft.reviewer];
    if (required.some((value) => !value.trim())) { setNotice('请补全入库必填信息：分类、适用 Agent、关键词、有效期、作者和审核人。'); return; }
    const asset: Asset = { id: `KB-NEW-${assets.length + 1}`, name: draft.name.trim(), category: draft.category, department: draft.department, topic: draft.topic, version: 'v0.1', status: '草稿', author: draft.author, reviewer: draft.reviewer, validUntil: draft.validUntil, agents: [draft.agent.split(' ')[0]], keywords: draft.keywords, citations: '尚未发布', chunks: 0, description: draft.description || '待补充知识范围、来源和验收标准。', requiresBusinessApproval: draft.requiresBusinessApproval, businessApprover: draft.requiresBusinessApproval ? '待指定业务负责人' : undefined };
    setAssets((current) => [asset, ...current]); setDraft(emptyDraft); setCreateOpen(false); setNotice(`已创建草稿“${asset.name}”；已进入自动分段、实体标注和审核队列。`);
  };
  const review = (status: Status) => {
    if (!selected || !policy.canReview) return;
    if (status === '已发布' && selected.requiresBusinessApproval && selected.businessApprover?.startsWith('待指定')) { setNotice('该业务 SOP 尚未完成业务负责人审批，不能发布。'); return; }
    const updated = { ...selected, status }; setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset)); setSelected(updated);
    setNotice(status === '已发布' ? `知识资产“${updated.name}”已发布，可由已绑定 Agent 检索。` : `知识资产“${updated.name}”已驳回，等待训练师修订。`);
  };
  const submit = () => {
    if (!selected || role !== 'trainer') return;
    const updated = { ...selected, status: '待审核' as Status }; setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset)); setSelected(updated); setNotice('知识资产已提交审核；历史版本与元数据将一并保留。');
  };
  const openDocument = (asset: Asset) => { setSelected(asset); setEditingDocument(false); setDocumentBody(asset.body || asset.description); };
  const saveDocument = () => {
    if (!selected || !documentBody.trim()) { setNotice('知识正文不能为空。'); return; }
    const nextVersion = `v${(Number(selected.version.replace(/^v/, '').split('.')[0]) || 0) + 1}.0`;
    const updated = { ...selected, body: documentBody.trim(), description: documentBody.trim().slice(0, 42), version: nextVersion };
    setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset)); setSelected(updated); setEditingDocument(false); setNotice(`已保存知识正文并创建 ${nextVersion} 版本。`);
  };
  const archiveDocument = () => { if (!selected) return; const updated = { ...selected, archived: !selected.archived }; setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset)); setSelected(updated); setNotice(updated.archived ? '文档已归档，将不再被新的 RAG 请求检索。' : '文档已恢复，可重新进入检索与引用范围。'); };
  const deleteDraft = () => { if (!selected || selected.status !== '草稿') return; setAssets((current) => current.filter((asset) => asset.id !== selected.id)); setSelected(null); setNotice('草稿文档已删除。'); };
  const updateSourceFile = () => { if (!selected || !sourceFileName) { setNotice('请选择 Markdown、PDF、Word、Excel 或 PPT 源文件。'); return; } const extension = sourceFileName.split('.').pop()?.toUpperCase() || 'FILE'; const updated = { ...selected, sourceName: sourceFileName, sourceType: extension, version: `v${(Number(selected.version.replace(/^v/, '').split('.')[0]) || 0) + 1}.0`, status: '待审核' as Status, chunks: selected.chunks + 12 }; setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset)); setSelected(updated); setSourceOpen(false); setNotice(`已替换源文件“${sourceFileName}”，完成解析：新增 12 个分段、3 张表格/幻灯片摘要，等待审核发布。`); };
  const addDepartment = () => {
    const name = newDepartment.trim();
    if (!name) { setNotice('请输入二级部门或业务域名称。'); return; }
    setTaxonomy((current) => ({ ...current, [taxonomyCategory]: [...current[taxonomyCategory], { department: name, topics: [] }] }));
    setTaxonomyDepartment(name); setTaxonomyTopic(''); setNewDepartment(''); setNotice(`已在“${taxonomyCategory}”下新增二级分类“${name}”。`);
  };
  const selectCategory = (name: string) => {
    setTaxonomyCategory(name); const firstDepartment = taxonomy[name]?.[0]?.department || ''; const firstTopic = taxonomy[name]?.[0]?.topics[0] || '';
    setTaxonomyDepartment(firstDepartment); setTaxonomyTopic(firstTopic);
  };
  const addTopCategory = () => {
    const name = newTopCategory.trim();
    if (!name) { setNotice('请输入一级分类名称。'); return; }
    if (taxonomyCategories.includes(name)) { setNotice(`一级分类“${name}”已存在。`); return; }
    setTaxonomyCategories((current) => [...current, name]); setTaxonomy((current) => ({ ...current, [name]: [] })); selectCategory(name); setNewTopCategory(''); setNotice(`已新增一级分类“${name}”。`);
  };
  const addTopic = () => {
    const name = newTopic.trim(); const branch = taxonomy[taxonomyCategory]?.find((item) => item.department === taxonomyDepartment);
    if (!name || !branch) { setNotice('请先选择二级分类，并输入三级分类名称。'); return; }
    if (branch.topics.includes(name)) { setNotice(`三级分类“${name}”已存在。`); return; }
    setTaxonomy((current) => ({ ...current, [taxonomyCategory]: current[taxonomyCategory].map((item) => item.department === taxonomyDepartment ? { ...item, topics: [...item.topics, name] } : item) })); setTaxonomyTopic(name); setNewTopic(''); setNotice(`已在“${taxonomyDepartment}”下新增三级分类“${name}”。`);
  };
  const startRename = (level: '一级' | '二级' | '三级', value: string, department?: string) => { setRenameTarget({ level, value, department }); setRenameValue(value); };
  const saveRename = () => {
    if (!renameTarget) return; const name = renameValue.trim(); const { level, value, department } = renameTarget;
    if (!name) { setNotice('分类名称不能为空。'); return; }
    if (name === value) { setRenameTarget(null); return; }
    if (level === '一级') {
      if (taxonomyCategories.includes(name)) { setNotice(`一级分类“${name}”已存在。`); return; }
      setTaxonomyCategories((current) => current.map((item) => item === value ? name : item)); setTaxonomy((current) => { const { [value]: moved, ...rest } = current; return { ...rest, [name]: moved }; }); setAssets((current) => current.map((asset) => asset.category === value ? { ...asset, category: name } : asset)); selectCategory(name);
    } else if (level === '二级') {
      if (taxonomy[taxonomyCategory].some((item) => item.department === name)) { setNotice(`二级分类“${name}”已存在。`); return; }
      setTaxonomy((current) => ({ ...current, [taxonomyCategory]: current[taxonomyCategory].map((item) => item.department === value ? { ...item, department: name } : item) })); setAssets((current) => current.map((asset) => asset.category === taxonomyCategory && asset.department === value ? { ...asset, department: name } : asset)); setTaxonomyDepartment(name);
    } else {
      if (!department) return;
      const branch = taxonomy[taxonomyCategory].find((item) => item.department === department);
      if (branch?.topics.includes(name)) { setNotice(`三级分类“${name}”已存在。`); return; }
      setTaxonomy((current) => ({ ...current, [taxonomyCategory]: current[taxonomyCategory].map((item) => item.department === department ? { ...item, topics: item.topics.map((topic) => topic === value ? name : topic) } : item) })); setAssets((current) => current.map((asset) => asset.category === taxonomyCategory && asset.department === department && asset.topic === value ? { ...asset, topic: name } : asset)); setTaxonomyTopic(name);
    }
    setRenameTarget(null); setNotice(`已重命名${level}分类“${value}”为“${name}”，相关知识资产已同步。`);
  };
  const removeTaxonomy = (level: '一级' | '二级' | '三级', value: string, department?: string) => {
    const dependentAssets = assets.filter((asset) => level === '一级' ? asset.category === value : level === '二级' ? asset.category === taxonomyCategory && asset.department === value : asset.category === taxonomyCategory && asset.department === department && asset.topic === value);
    const hasChildren = level === '一级' ? (taxonomy[value]?.length || 0) > 0 : level === '二级' ? (taxonomy[taxonomyCategory].find((item) => item.department === value)?.topics.length || 0) > 0 : false;
    if (dependentAssets.length || hasChildren) { setNotice(`不能删除“${value}”：${dependentAssets.length ? `仍有 ${dependentAssets.length} 项知识资产引用` : '仍包含下级分类'}。请先迁移或清理依赖。`); return; }
    if (level === '一级') { setTaxonomyCategories((current) => current.filter((item) => item !== value)); setTaxonomy((current) => { const { [value]: _, ...rest } = current; return rest; }); selectCategory(taxonomyCategories.find((item) => item !== value) || ''); }
    if (level === '二级') { setTaxonomy((current) => ({ ...current, [taxonomyCategory]: current[taxonomyCategory].filter((item) => item.department !== value) })); setTaxonomyDepartment(''); setTaxonomyTopic(''); }
    if (level === '三级' && department) { setTaxonomy((current) => ({ ...current, [taxonomyCategory]: current[taxonomyCategory].map((item) => item.department === department ? { ...item, topics: item.topics.filter((topic) => topic !== value) } : item) })); setTaxonomyTopic(''); }
    setNotice(`已删除${level}分类“${value}”。`);
  };
  if (role === 'client') return <section className="m06-gate"><h1>M06 知识库受限</h1><p>客户管理员仅在客户门户查看交付范围内的结果，不访问内部知识资产。</p></section>;

  const assetPanel = <section className="m06-assets"><header><div><strong>文档管理与版本控制</strong><small>支持 Markdown / Word / PDF；自动分段、版本 Diff、实体标注与多级审核。</small></div><label><Search size={15}/><input aria-label="搜索知识资产" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资产、部门或主题"/></label><select aria-label="知识分类" value={category} onChange={(event) => setCategory(event.target.value)}><option>全部分类</option>{taxonomyCategories.map((item) => <option key={item}>{item}</option>)}</select></header><div className="m06-list">{visible.map((asset) => <button key={asset.id} onClick={() => openDocument(asset)}><BookOpenText size={17}/><span><strong>{asset.name}</strong><small>{asset.id} · {asset.category} / {asset.department} / {asset.topic} · {asset.version}</small></span><em className={`m06-status is-${asset.status}`}>{asset.archived ? '已归档' : asset.status}</em><small>{asset.citations}</small><ChevronRight size={16}/></button>)}</div></section>;
  const taxonomyPanel = <section className="m06-taxonomy-card"><div><strong>知识分类体系</strong><small>统一一级分类，部门在二级管理，业务场景在三级管理；标签横向复用，不替代目录。</small></div><dl><dt>一级分类</dt><dd>车型库、故障库、话术库、素材库、法规库</dd><dt>二级分类</dt><dd>部门 / 业务域所有者，例如 DNDC 线索中心、内容中心、用户服务中心（运营）</dd><dt>三级分类</dt><dd>业务场景 / 主题，例如线索判定规则、售后 FAQ、数据安全与脱敏</dd><dt>横向标签</dt><dd>品牌、车型、区域、版本、密级等可跨目录复用的检索维度</dd></dl>{policy.canTaxonomy && <button onClick={() => setTaxonomyOpen(true)}><FolderTree size={15}/>进入分类管理</button>}</section>;

  return <section className="m06" data-module="knowledge-base"><ModuleHeader title="M06 知识库" subtitle="生产、治理、检索与评估组织知识资产" actions={<>{policy.canTaxonomy && <button onClick={() => setTaxonomyOpen(true)}><FolderTree size={15}/>分类管理</button>}{policy.canCreate && <button className="m06-primary" onClick={() => setCreateOpen(true)}><FileUp size={15}/>上传 / 新建知识</button>}</>} />{notice && <div className="m06-notice" role="status">{notice}<button onClick={() => setNotice('')}>关闭</button></div>}<main className="m06-content"><nav className="m06-tabs">{(['生产','存储','应用','进化'] as Domain[]).map((item) => <button key={item} className={domain === item ? 'active' : ''} onClick={() => setDomain(item)}>知识{item}</button>)}<small>{policy.scope}</small></nav>
    {domain === '生产' && <><section className="m06-summary"><article><span>待处理入库</span><b>12</b><small>文档解析、自动分段与向量化</small></article><article><span>待审核知识</span><b>{assets.filter((asset) => asset.status === '待审核').length}</b><small>多级审核与版本 Diff</small></article><article><span>自动提取候选</span><b>8</b><small>来自工单、Agent 对话与复盘</small></article><article><span>知识卡片</span><b>326</b><small>实体标注与 Q&A 对</small></article></section><section className="m06-action-grid"><article><strong>自动化知识提取</strong><p>从 INC-2031 解决方案、CHAT-3088 对话和本周复盘报告识别可沉淀知识点。</p><button onClick={() => setNotice('已生成 8 条知识候选，待 AI 训练师确认、标注和入库。')}>运行提取</button></article><article><strong>知识标注与审核</strong><p>提取车型、参数、故障、解决方案实体，并生成可审核 Q&A 知识卡。</p><button onClick={() => setNotice('已打开标注任务队列：3 个高优先级知识卡等待处理。')}>查看标注队列</button></article></section>{assetPanel}</>}
    {domain === '存储' && <><section className="m06-summary"><article><span>向量库</span><b>Milvus</b><small>768 / 1536 维向量 + 元数据</small></article><article><span>索引模式</span><b>混合</b><small>语义检索 + 关键词检索</small></article><article><span>多模态索引</span><b>1,482</b><small>图片 / 视频 / 音频自动转写</small></article><article><span>自定义标签</span><b>86</b><small>业务域、车型、版本、密级</small></article></section>{taxonomyPanel}<section className="m06-storage-grid"><article><h3>多模态知识存储</h3><p>文本 12,430 · 图片 846 · 视频 238 · 音频 398</p><div className="m06-media"><span>文本</span><span>图片</span><span>视频</span><span>音频</span></div><button onClick={() => setNotice('多模态索引健康检查完成：所有媒介索引可用。')}>运行索引健康检查</button></article><article><h3>知识图谱</h3><p>车型 → 参数 → 故障 → 解决方案，支持实体关系与语义推理。</p><div className="m06-graph"><b>N7</b><i>→</i><b>NOA</b><i>→</i><b>传感器异常</b><i>→</i><b>诊断方案</b></div><button onClick={() => setNotice('已定位知识图谱中的 3 条待确认实体关系。')}>查看待确认关系</button></article></section></>}
    {domain === '应用' && <><section className="m06-rag"><h2>RAG 检索增强生成</h2><p>Agent 任务上下文触发实时检索，经过权限过滤、混合召回和 Re-rank 后注入 Prompt。</p><div><input aria-label="RAG 查询" value={ragQuery} onChange={(event) => setRagQuery(event.target.value)}/><button className="m06-primary" onClick={() => setRagRan(true)}>运行检索</button></div>{ragRan && <article><strong>检索结果：线索判定与跟进规则 · 章节 3</strong><p>命中片段：当评分异常时，先核对 Prompt 版本、知识版本与字段脱敏策略。</p><small>语义 0.92 · 关键词 0.86 · Re-rank 1/5 · 预计延迟 126ms</small></article>}</section><section className="m06-action-grid"><article><strong>上下文知识推荐</strong><p>线索诊断 Agent 正在处理评分偏差，推荐《线索判定与跟进规则》《数据访问与脱敏规范》。</p><button onClick={() => setNotice('已向线索诊断 Agent 推送 2 项经授权知识，运行记录将保留引用证据。')}>推送推荐知识</button></article><article><strong>知识效果评估</strong><p>追踪每条知识的检索率、引用率、准确率贡献与负反馈。</p><button onClick={() => setNotice('已生成近 7 天知识效果评估：KB-LEAD-001 对准确率贡献 +4.2%。')}>生成效果报告</button></article></section></>}
    {domain === '进化' && <><section className="m06-evolution"><article><h3>车型参数月更</h3><p>随主机厂发布节奏月更；当前 8 月变更清单包含 N7 配置与选装包变更。</p><button onClick={() => setNotice('已生成车型参数月度更新清单，并分配给 DNDC 线索中心审核。')}>生成月度更新清单</button></article><article><h3>话术 FAQ 周更</h3><p>基于 Agent badcase 反馈周更；本周 14 条低置信问答待复审。</p><button onClick={() => setNotice('已按 badcase 生成 FAQ 复审清单，低质量片段暂停推荐。')}>生成 FAQ 复审清单</button></article><article><h3>法规更新与健康审计</h3><p>政策法规实时监控，48h内更新；每季度全量知识库健康度审计。</p><button onClick={() => setNotice('已生成法规 48h 更新告警与本季度全库健康度审计任务。')}>生成治理任务</button></article></section><section className="m06-governance"><strong>知识管理制度已生效</strong><span>入库必须具备：所属分类 · 适用 Agent · 关键词 · 有效期 · 作者 · 审核人</span><span>文档至少保留 3 个历史版本；业务 SOP 变更须业务负责人审批。</span></section><section className="m06-loop"><span>Agent 使用效果反馈</span><i>→</i><span>低质量自动标记</span><i>→</i><span>人工复审</span><i>→</i><span>更新 / 下架</span><i>→</i><span>知识质量回升</span></section></>}
  </main>
  {selected && <aside className="m06-drawer" aria-label="知识文档详情"><button className="m06-close" onClick={() => setSelected(null)}><X size={18}/></button><h2>{selected.name}</h2><p>{selected.id} · {selected.version} · <b>{selected.archived ? '已归档' : selected.status}</b></p><section><h3>知识正文</h3>{editingDocument ? <textarea aria-label="知识正文编辑器" rows={13} value={documentBody} onChange={(event) => setDocumentBody(event.target.value)}/> : <article className="m06-document-body">{selected.body || selected.description}</article>}{(policy.canCreate || policy.canReview) && <footer>{editingDocument ? <button className="m06-primary" onClick={saveDocument}>保存并创建版本</button> : <button className="m06-primary" onClick={() => setEditingDocument(true)}>编辑知识正文</button>}</footer>}</section><section><h3>历史版本（至少保留 3 个）</h3><div className="m06-version-history"><button>{selected.version} <small>当前正文版本</small></button><button>v3.1 <small>历史版本</small></button><button>v3.0 <small>基线版本</small></button></div></section><section><h3>源文件列表</h3><label><Search size={14}/><input aria-label="查询源文件" placeholder="查询文件名或格式"/></label><div className="m06-version-history"><button onClick={() => setNotice(`已打开源文件：${selected.sourceName || `${selected.name}.pdf`}`)}>{selected.sourceName || `${selected.name}.pdf`} <small>{selected.sourceType || 'PDF'} · 当前源文件</small></button><button onClick={() => setNotice('已打开上一版源文件。')}>历史源文件 v3.1 <small>可查询与下载</small></button></div>{(policy.canCreate || policy.canReview) && <footer><button className="m06-primary" onClick={() => { setSourceFileName(''); setSourceOpen(true); }}>更新源文件</button></footer>}</section><section><h3>入库元数据</h3><dl><dt>所属分类</dt><dd>{selected.category} / {selected.department} / {selected.topic}</dd><dt>适用 Agent</dt><dd>{selected.agents.join('、')}</dd><dt>关键词</dt><dd>{selected.keywords}</dd><dt>作者 / 审核人</dt><dd>{selected.author} / {selected.reviewer}</dd></dl></section>{(policy.canCreate || policy.canReview) && <footer>{selected.status === '草稿' ? <button onClick={deleteDraft}>删除草稿</button> : <button onClick={archiveDocument}>{selected.archived ? '恢复文档' : '归档文档'}</button>}</footer>}</aside>}
  {createOpen && <div className="m06-mask" onMouseDown={() => setCreateOpen(false)}><form onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); create(); }}><header><h2>上传 / 新建知识</h2><button type="button" onClick={() => setCreateOpen(false)}><X size={18}/></button></header><p className="m06-form-note">所有标“*”的字段均为知识入库标准；选择业务 SOP 时，发布还需业务负责人审批。</p><label>资产名称 *<input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：线索判定与跟进规则"/></label><div className="m06-form-grid"><label>所属一级分类 *<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value, department: taxonomy[event.target.value]?.[0]?.department || '', topic: taxonomy[event.target.value]?.[0]?.topics[0] || '' })}>{taxonomyCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label>所属部门 / 业务域 *<select value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value, topic: taxonomy[draft.category]?.find((item) => item.department === event.target.value)?.topics[0] || '' })}>{taxonomy[draft.category]?.map((item) => <option key={item.department}>{item.department}</option>)}</select></label><label>场景 / 主题 *<select value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value })}>{(taxonomy[draft.category]?.find((item) => item.department === draft.department)?.topics || []).map((item) => <option key={item}>{item}</option>)}</select></label><label>适用 Agent *<select value={draft.agent} onChange={(event) => setDraft({ ...draft, agent: event.target.value })}>{agents.map((item) => <option key={item}>{item}</option>)}</select></label><label>作者 *<select value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })}><option>周芮</option><option>李沐</option><option>王珂</option></select></label><label>审核人 *<select value={draft.reviewer} onChange={(event) => setDraft({ ...draft, reviewer: event.target.value })}><option>赵岑</option><option>顾川</option></select></label><label>有效期 *<input type="date" value={draft.validUntil} onChange={(event) => setDraft({ ...draft, validUntil: event.target.value })}/></label><label>关键词 *<input value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} placeholder="用逗号分隔，例如：NOA, 配置, 线索"/></label></div><label className="m06-check"><input type="checkbox" checked={draft.requiresBusinessApproval} onChange={(event) => setDraft({ ...draft, requiresBusinessApproval: event.target.checked })}/>业务 SOP：发布前需业务负责人审批</label><label>知识说明<textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="支持 Markdown / Word / PDF；填写来源、适用范围和验收要求"/></label><footer><button type="button" onClick={() => setCreateOpen(false)}>取消</button><button className="m06-primary">创建草稿并入库</button></footer></form></div>}
  {taxonomyOpen && <div className="m06-mask" onMouseDown={() => setTaxonomyOpen(false)}><section className="m06-taxonomy-dialog" onMouseDown={(event) => event.stopPropagation()}><header><div><h2>知识分类管理</h2><p>平台管理员维护一级目录及部门、场景分类；名称变更将同步更新引用资产，删除会先校验依赖。</p></div><button onClick={() => setTaxonomyOpen(false)}><X size={18}/></button></header><div className="m06-taxonomy-layout"><nav>{taxonomyCategories.map((item) => <button key={item} className={taxonomyCategory === item ? 'active' : ''} onClick={() => selectCategory(item)}>{item}<small>一级</small></button>)}<section className="m06-taxonomy-create"><label>新增一级分类<input aria-label="新增一级分类" value={newTopCategory} onChange={(event) => setNewTopCategory(event.target.value)} placeholder="例如：产品库"/></label><button className="m06-primary" onClick={addTopCategory}><FilePlus2 size={14}/>新增一级</button></section></nav><main><div className="m06-taxonomy-title"><strong>{taxonomyCategory}</strong><span>一级分类</span><button onClick={() => startRename('一级', taxonomyCategory)} aria-label="编辑一级分类"><Pencil size={14}/></button><button onClick={() => removeTaxonomy('一级', taxonomyCategory)} aria-label="删除一级分类"><Trash2 size={14}/></button></div>{taxonomy[taxonomyCategory]?.map((item) => <article key={item.department}><strong>{item.department}<small>二级 · 部门 / 业务域</small><span><button onClick={() => startRename('二级', item.department)} aria-label={`编辑二级分类 ${item.department}`}><Pencil size={14}/></button><button onClick={() => removeTaxonomy('二级', item.department)} aria-label={`删除二级分类 ${item.department}`}><Trash2 size={14}/></button></span></strong><div>{item.topics.map((topic) => <span key={topic}>{topic}<small>三级 · 场景 / 主题</small><i><button onClick={() => startRename('三级', topic, item.department)} aria-label={`编辑三级分类 ${topic}`}><Pencil size={13}/></button><button onClick={() => removeTaxonomy('三级', topic, item.department)} aria-label={`删除三级分类 ${topic}`}><Trash2 size={13}/></button></i></span>)}</div></article>)}<section className="m06-add-taxonomy"><label>新增二级分类<input aria-label="新增二级分类" value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} placeholder="例如：后市场中心"/></label><button className="m06-primary" onClick={addDepartment}><FilePlus2 size={15}/>新增二级</button></section><section className="m06-add-taxonomy"><label>归属二级分类<select aria-label="三级分类所属二级" value={taxonomyDepartment} onChange={(event) => { setTaxonomyDepartment(event.target.value); setTaxonomyTopic(taxonomy[taxonomyCategory].find((item) => item.department === event.target.value)?.topics[0] || ''); }}>{taxonomy[taxonomyCategory]?.map((item) => <option key={item.department}>{item.department}</option>)}</select></label><label>新增三级分类<input aria-label="新增三级分类" value={newTopic} onChange={(event) => setNewTopic(event.target.value)} placeholder="例如：场景主题"/></label><button className="m06-primary" onClick={addTopic}><FilePlus2 size={15}/>新增三级</button></section>{renameTarget && <section className="m06-rename-taxonomy"><strong>重命名{renameTarget.level}分类：{renameTarget.value}</strong><input aria-label="分类新名称" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)}/><button onClick={() => setRenameTarget(null)}>取消</button><button className="m06-primary" onClick={saveRename}>保存名称</button></section>}<p className="m06-taxonomy-rule">默认最多三级；确有监管或产品线分层需要时，平台管理员可在三级下增加一级。品牌、车型、区域、版本、密级应作为横向标签维护。</p></main></div></section></div>}
  {sourceOpen && <div className="m06-mask" onMouseDown={() => setSourceOpen(false)}><form onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); updateSourceFile(); }}><header><h2>更新源文件</h2><button type="button" onClick={() => setSourceOpen(false)}><X size={18}/></button></header><p className="m06-form-note">支持 Markdown、PDF、Word、Excel、PPT。上传后自动重新解析正文、分段、表格和幻灯片摘要，并创建待审核版本。</p><label>选择源文件 *<input aria-label="选择源文件" type="file" accept=".md,.markdown,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(event) => setSourceFileName(event.target.files?.[0]?.name || '')}/></label>{sourceFileName && <section className="m06-evidence"><strong>{sourceFileName}</strong><p>待解析：识别文件结构、提取正文与表格/幻灯片内容，生成知识分段。</p></section>}<footer><button type="button" onClick={() => setSourceOpen(false)}>取消</button><button className="m06-primary">替换并解析源文件</button></footer></form></div>}
  </section>;
}
