import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Beaker, CheckCircle2, ChevronRight, ClipboardCheck, Code2, FileDiff, FlaskConical, History, Play, Plus, Save, Search, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { ModuleHeader } from '../../components/ModuleHeader';
import type { RoleId } from '../../types';
import { agents, knowledgeStrategies, promptRecords, type PromptRecord, type PromptVersion } from './m07-data';
import './m07.css';

type WorkbenchTab = '配置' | '调试与测试' | '历史版本';
type TestResult = { score: number; latency: string; knowledgeHits: number; output: string; evidence: string[] } | null;

const roleCapabilities: Record<RoleId, { canEdit: boolean; canPublish: boolean; canRun: boolean }> = {
    employee: { canEdit: false, canPublish: false, canRun: true }, business: { canEdit: false, canPublish: false, canRun: true },
    trainer: { canEdit: true, canPublish: false, canRun: true }, admin: { canEdit: true, canPublish: true, canRun: true },
    superadmin: { canEdit: true, canPublish: true, canRun: true }, client: { canEdit: false, canPublish: false, canRun: false },
};
const defaultInput = '{\n  "lead_summary": "华南区域 N7 意向线索，近 7 日三次访问",\n  "score_trace": { "system": 62, "manual": 78 }\n}';
const nextVersion = (version: string) => `v${version.slice(1).split('.').map(Number).map((value, index) => index === 1 ? value + 1 : value).join('.')}`;

function scoreClass(score: number | null) { return score !== null && score >= 90 ? 'is-good' : score !== null && score >= 80 ? 'is-medium' : 'is-muted'; }

export function M07PromptEngineeringPage({ role }: { role: RoleId }) {
    const capability = roleCapabilities[role];
    const [records, setRecords] = useState<PromptRecord[]>(promptRecords);
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tab, setTab] = useState<WorkbenchTab>('配置');
    const [notice, setNotice] = useState('');
    const [testInput, setTestInput] = useState(defaultInput);
    const [testResult, setTestResult] = useState<TestResult>(null);
    const [abOpen, setAbOpen] = useState(false);
    const [diffVersion, setDiffVersion] = useState<PromptVersion | null>(null);

    const selected = records.find((item) => item.id === selectedId) ?? null;
    const filtered = useMemo(() => records.filter((item) => `${item.name}${item.id}${item.agent}`.toLowerCase().includes(query.toLowerCase())), [query, records]);
    const published = selected?.versions.find((item) => item.status === '已发布') ?? null;
    const draft = selected?.versions.find((item) => item.status === '草稿') ?? null;

    useEffect(() => { setSelectedId(null); setTab('配置'); setNotice(''); setTestResult(null); setAbOpen(false); }, [role]);

    const updateSelected = (patch: Partial<PromptRecord>) => {
        if (!selected) return;
        setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
    };
    const openRecord = (record: PromptRecord) => { setSelectedId(record.id); setTab('配置'); setNotice(''); setTestResult(null); setAbOpen(false); };
    const createPrompt = () => {
        const id = `PROMPT-NEW-${String(records.length + 1).padStart(2, '0')}`;
        const record: PromptRecord = { id, name: '未命名 Prompt', agent: agents[0], currentVersion: 'v0.1', score: null, grade: '未评测', status: '草稿', body: '请定义 Agent 的角色、输入变量、边界与输出格式。', variables: ['input'], knowledgeId: knowledgeStrategies[0].id, knowledgeName: knowledgeStrategies[0].name, knowledgeScope: knowledgeStrategies[0].scope, versions: [{ version: 'v0.1', status: '草稿', author: '当前训练师', time: '刚刚', change: '新建 Prompt 草稿', body: '请定义 Agent 的角色、输入变量、边界与输出格式。', score: 0, latency: '—', knowledgeHits: 0 }] };
        setRecords((items) => [record, ...items]); openRecord(record); setNotice('已新建 Prompt 草稿，请完善配置后保存。');
    };
    const saveDraft = () => {
        if (!selected || !selected.name.trim() || !selected.body.trim()) { setNotice('Prompt 标题和模板正文不能为空。'); return; }
        const version = nextVersion(selected.currentVersion);
        const versionRecord: PromptVersion = { version, status: '草稿', author: '当前训练师', time: '刚刚', change: '更新模板配置、变量或知识策略', body: selected.body, score: testResult?.score ?? selected.score ?? 0, latency: testResult?.latency ?? '待测试', knowledgeHits: testResult?.knowledgeHits ?? 0 };
        updateSelected({ status: '草稿', versions: [versionRecord, ...selected.versions.filter((item) => item.status !== '草稿')] });
        setNotice(`已保存 ${version} 草稿，已发布基线未被改动。`);
    };
    const publishDraft = () => {
        if (!selected || !draft) { setNotice('请先保存一个草稿版本，再执行发布。'); return; }
        const released = { ...draft, status: '已发布' as const, author: '平台管理员', time: '刚刚', change: `审核发布：${draft.change}` };
        updateSelected({ currentVersion: released.version, status: '已发布', score: released.score || selected.score, grade: (released.score || 0) >= 90 ? 'A' : 'B', versions: [released, ...selected.versions.filter((item) => item !== draft).map((item) => item.status === '已发布' ? { ...item, status: '历史版本' as const } : item)] });
        setNotice(`${released.version} 已审核发布，后续运行将以该版本为基线。`);
    };
    const runTest = () => {
        if (!capability.canRun) { setNotice('当前身份没有运行 Prompt 测试的权限。'); return; }
        if (!testInput.trim()) { setNotice('请输入测试输入 JSON 后再运行。'); return; }
        try { JSON.parse(testInput); } catch { setNotice('测试输入不是合法 JSON，请修正后重新运行。'); return; }
        setTestResult({ score: 96, latency: '1.4s', knowledgeHits: 3, output: '诊断结论：评分偏差来自“车型意向”特征同步延迟；当前系统评分 62，人工复核 78。建议回填近 7 日访问行为并重新计算，未发现敏感字段泄露。', evidence: ['KB-LEAD-001 §3.2 评分特征', 'DS-CRM-PROJECTION 字段投影', 'TRACE-LEAD-8821'] });
        setNotice('测试运行完成，结果已关联知识命中与运行证据。');
    };
    const restoreVersion = (version: PromptVersion) => {
        if (!selected || !capability.canEdit) { setNotice('当前身份没有恢复历史版本的权限。'); return; }
        const restored: PromptVersion = { ...version, version: nextVersion(selected.currentVersion), status: '草稿', author: '当前训练师', time: '刚刚', change: `从 ${version.version} 恢复为新草稿` };
        updateSelected({ body: version.body, status: '草稿', versions: [restored, ...selected.versions.filter((item) => item.status !== '草稿')] });
        setTab('配置'); setDiffVersion(null); setNotice(`已将 ${version.version} 恢复为 ${restored.version} 草稿，发布基线保持不变。`);
    };

    if (role === 'client') return <section className="m07-gate"><ShieldCheck size={26} /><h1>M07 Prompt 工程受限</h1><p>客户管理员不访问内部 Agent 指令、测试输入与版本记录。</p></section>;

    if (!selected) return <section className="m07" data-module="prompt-engineering">
        <ModuleHeader title="M07 Prompt 工程" subtitle="管理 Agent 指令模板、变量、评测与版本发布" />
        {notice && <Notice value={notice} onClose={() => setNotice('')} />}
        <main className="m07-content"><section className="m07-library">
            <header className="m07-library-toolbar"><div><h1>Prompt 模板库</h1><p>已发布版本可被 M03 Agent 绑定；草稿需经测试与审核后发布。</p></div><div className="m07-toolbar-actions"><label className="m07-search"><Search size={15} /><input aria-label="搜索 Prompt" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板名称、ID 或 Agent" /></label>{capability.canEdit && <button className="m07-primary" onClick={createPrompt}><Plus size={15} />新建 Prompt</button>}</div></header>
            <div className="m07-table" role="table"><div className="m07-table-head" role="row"><span>模板名称</span><span>绑定 Agent</span><span>当前版本</span><span>评测评分</span><span>状态</span><span>操作</span></div>{filtered.map((record) => <div className="m07-table-row" role="row" key={record.id}><button className="m07-record-link" onClick={() => openRecord(record)}><strong>{record.name}</strong><small>{record.id}</small></button><span>{record.agent}</span><span>{record.currentVersion}</span><span><i className={`m07-score ${scoreClass(record.score)}`}>{record.score === null ? '未评测' : `${record.grade} ${record.score}%`}</i></span><span><i className={`m07-status is-${record.status}`}>{record.status}</i></span><button className="m07-open" onClick={() => openRecord(record)}>打开 <ChevronRight size={15} /></button></div>)}</div>
            {!filtered.length && <div className="m07-empty">未找到匹配的 Prompt 模板。</div>}
        </section></main>
    </section>;

    const editable = capability.canEdit;
    return <section className="m07" data-module="prompt-engineering">
        <ModuleHeader title="M07 Prompt 工程" subtitle="管理 Agent 指令模板、变量、评测与版本发布" actions={<><button className="m07-back" onClick={() => setSelectedId(null)}><ArrowLeft size={16} />返回模板库</button>{capability.canPublish && <button className="m07-secondary" onClick={publishDraft}><CheckCircle2 size={15} />审核发布</button>}{editable && <button className="m07-primary" onClick={saveDraft}><Save size={15} />保存草稿</button>}</>} />
        {notice && <Notice value={notice} onClose={() => setNotice('')} />}
        <main className="m07-workbench"><header className="m07-object-head"><div><h1>{selected.name}</h1><p>{selected.id} · 绑定 {selected.agent} · {selected.status}</p></div></header><nav className="m07-tabs" aria-label="Prompt 工作台">
            {(['配置', '调试与测试', '历史版本'] as WorkbenchTab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setNotice(''); }}>{item === '配置' ? <Code2 size={15} /> : item === '调试与测试' ? <FlaskConical size={15} /> : <History size={15} />}{item}</button>)}
            <span>已发布基线：{published?.version ?? '暂无'} · 当前草稿：{draft?.version ?? '未保存'}</span>
        </nav>
        {tab === '配置' && <Configuration record={selected} editable={editable} onChange={updateSelected} />}
        {tab === '调试与测试' && <Testing record={selected} testInput={testInput} setTestInput={setTestInput} result={testResult} onRun={runTest} abOpen={abOpen} setAbOpen={setAbOpen} published={published} draft={draft} />}
        {tab === '历史版本' && <HistoryPanel versions={selected.versions} editable={editable} onDiff={setDiffVersion} onRestore={restoreVersion} />}
        </main>
        {diffVersion && <DiffDialog current={draft ?? selected.versions[0]} target={diffVersion} onClose={() => setDiffVersion(null)} />}
    </section>;
}

function Notice({ value, onClose }: { value: string; onClose: () => void }) { return <div className="m07-notice" role="status"><span>{value}</span><button onClick={onClose}>关闭</button></div>; }

function Configuration({ record, editable, onChange }: { record: PromptRecord; editable: boolean; onChange: (patch: Partial<PromptRecord>) => void }) {
    const strategy = knowledgeStrategies.find((item) => item.id === record.knowledgeId) ?? knowledgeStrategies[0];
    return <div className="m07-pane m07-config"><section className="m07-card"><header><div><h2>模板配置</h2><p>定义 Agent 指令、运行变量与受控知识策略。</p></div><span className="m07-readonly">{editable ? '可编辑，保存后产生草稿版本' : '当前身份仅查看'}</span></header><div className="m07-form-grid"><label>Prompt 标题 *<input aria-label="Prompt 标题" disabled={!editable} value={record.name} onChange={(event) => onChange({ name: event.target.value })} /></label><label>绑定 Agent<select aria-label="绑定 Agent" disabled={!editable} value={record.agent} onChange={(event) => onChange({ agent: event.target.value })}>{agents.map((agent) => <option key={agent}>{agent}</option>)}</select></label></div><label>模板正文 *<textarea aria-label="Prompt 模板正文" disabled={!editable} value={record.body} rows={11} onChange={(event) => onChange({ body: event.target.value })} /></label></section>
        <section className="m07-card"><header><div><h2>运行变量</h2><p>变量由 M03 Agent 运行上下文注入；模板内必须以双花括号引用。</p></div></header><div className="m07-variable-list">{record.variables.map((item) => <code key={item}>{`{{${item}}}`}</code>)}</div></section>
        <section className="m07-card"><header><div><h2>知识策略</h2><p>关联 M06 已发布知识资产；记录实际检索范围，避免无边界注入。</p></div></header><label>关联知识资产<select aria-label="关联知识资产" disabled={!editable} value={record.knowledgeId} onChange={(event) => { const next = knowledgeStrategies.find((item) => item.id === event.target.value)!; onChange({ knowledgeId: next.id, knowledgeName: next.name, knowledgeScope: next.scope }); }}>{knowledgeStrategies.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label><dl className="m07-definition"><dt>知识资产</dt><dd>{strategy.id} · {record.knowledgeName}</dd><dt>注入范围</dt><dd>{record.knowledgeScope}</dd><dt>运行约束</dt><dd>仅使用已发布版本；每次引用均写入运行 Trace。</dd></dl></section></div>;
}

function Testing({ record, testInput, setTestInput, result, onRun, abOpen, setAbOpen, published, draft }: { record: PromptRecord; testInput: string; setTestInput: (value: string) => void; result: TestResult; onRun: () => void; abOpen: boolean; setAbOpen: (value: boolean) => void; published: PromptVersion | null; draft: PromptVersion | null }) {
    const candidate = draft ?? { version: '未保存草稿', score: result?.score ?? record.score ?? 0, latency: result?.latency ?? '待运行', knowledgeHits: result?.knowledgeHits ?? 0, body: record.body };
    return <div className="m07-pane m07-testing"><section className="m07-test-card"><header><div><h2>Prompt 调试与测试</h2><p>使用脱敏测试输入运行绑定 Agent，并保留知识命中与运行证据。</p></div><div><button className="m07-secondary" onClick={() => setAbOpen(!abOpen)}><Beaker size={15} />A/B 测试</button><button className="m07-primary" onClick={onRun}><Play size={15} />运行测试</button></div></header><label>Prompt 模板正文<textarea aria-label="测试 Prompt 模板正文" value={record.body} readOnly rows={7} /></label><label>测试输入（JSON）<textarea aria-label="测试输入 JSON" value={testInput} rows={7} onChange={(event) => setTestInput(event.target.value)} /></label></section>
        <section className="m07-result-card"><header><h2>Agent 输出结果</h2>{result && <i className="m07-status is-已发布">测试通过</i>}</header>{result ? <><p className="m07-output">{result.output}</p><div className="m07-result-metrics"><span><b>{result.score}%</b><small>评测评分</small></span><span><b>{result.latency}</b><small>运行耗时</small></span><span><b>{result.knowledgeHits}</b><small>知识命中</small></span></div><div className="m07-evidence"><strong>运行证据</strong>{result.evidence.map((item) => <span key={item}>{item}</span>)}</div></> : <div className="m07-result-empty">Prompt 已加载。填写合法 JSON 后点击“运行测试”查看 Agent 输出。</div>}</section>
        {abOpen && <section className="m07-ab-card"><header><div><h2>A/B 测试：当前草稿 vs 已发布基线</h2><p>发布前固定对比当前候选与生产基线，不支持任意版本配对。</p></div><button onClick={() => setAbOpen(false)}>收起</button></header><div className="m07-ab-grid"><article><span>已发布基线</span><strong>{published?.version ?? '暂无已发布版本'}</strong><dl><dt>评分</dt><dd>{published ? `${published.score}%` : '—'}</dd><dt>耗时</dt><dd>{published?.latency ?? '—'}</dd><dt>知识命中</dt><dd>{published?.knowledgeHits ?? '—'}</dd></dl></article><article className="candidate"><span>当前草稿</span><strong>{candidate.version}</strong><dl><dt>评分</dt><dd>{candidate.score || '待运行'}{candidate.score ? '%' : ''}</dd><dt>耗时</dt><dd>{candidate.latency}</dd><dt>知识命中</dt><dd>{candidate.knowledgeHits}</dd></dl></article></div><footer><CheckCircle2 size={15} />{published && candidate.score >= published.score ? `候选评分较基线提升 ${candidate.score - published.score} 分；可提交审核。` : '候选尚未超过基线，请先完善模板或运行测试。'}</footer></section>}</div>;
}

function HistoryPanel({ versions, editable, onDiff, onRestore }: { versions: PromptVersion[]; editable: boolean; onDiff: (version: PromptVersion) => void; onRestore: (version: PromptVersion) => void }) { return <div className="m07-pane"><section className="m07-history-card"><header><div><h2>版本历史</h2><p>保留发布、草稿与历史版本；恢复操作只生成新草稿，不改写生产基线。</p></div></header><div className="m07-history-table"><div><span>版本</span><span>状态</span><span>作者与时间</span><span>变更摘要</span><span>操作</span></div>{versions.map((version) => <div key={`${version.version}-${version.status}`}><strong>{version.version}</strong><span><i className={`m07-status is-${version.status}`}>{version.status}</i></span><span>{version.author}<small>{version.time}</small></span><span>{version.change}</span><span className="m07-row-actions"><button onClick={() => onDiff(version)}><FileDiff size={14} />查看差异</button>{editable && version.status !== '草稿' && <button onClick={() => onRestore(version)}><Upload size={14} />恢复为草稿</button>}</span></div>)}</div></section></div>; }

function DiffDialog({ current, target, onClose }: { current: PromptVersion; target: PromptVersion; onClose: () => void }) { return <div className="m07-mask" onMouseDown={onClose}><section onMouseDown={(event) => event.stopPropagation()}><header><div><h2>版本差异</h2><p>{target.version} 与 {current.version} 的模板正文对比</p></div><button onClick={onClose}>关闭</button></header><div className="m07-diff"><article><strong>{target.version}</strong><pre>{target.body}</pre></article><article><strong>{current.version}</strong><pre>{current.body}</pre></article></div><footer><button className="m07-primary" onClick={onClose}>已查看</button></footer></section></div>; }
