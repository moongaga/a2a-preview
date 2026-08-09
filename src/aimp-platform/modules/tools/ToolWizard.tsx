import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, PlugZap, X } from 'lucide-react';
import { createToolDraft, type ToolRecord, type ToolType } from './tools-data';

const steps = ['类型与基本信息', '接口连接配置', '请求/响应契约', '认证引用与环境', '运行治理策略', '连通测试与保存'];
const types: ToolType[] = ['HTTP API', 'MCP Server', '数据库', '消息通道', '文件系统', '代码执行'];

export function ToolWizard({ existingNames, onClose, onSave }: { existingNames: string[]; onClose: () => void; onSave: (record: ToolRecord) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ToolRecord>(() => createToolDraft('HTTP API', ''));
  const [requestSchema, setRequestSchema] = useState(draft.contract.requestSchema);
  const [responseSchema, setResponseSchema] = useState(draft.contract.responseSchema);
  const [testState, setTestState] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [error, setError] = useState('');
  const set = <K extends keyof ToolRecord>(key: K, value: ToolRecord[K]) => setDraft(current => ({ ...current, [key]: value }));
  const setConnection = (key: string, value: string) => setDraft(current => ({ ...current, connection: { ...current.connection, [key]: value } }));
  const duplicate = existingNames.some(name => name.trim().toLowerCase() === draft.name.trim().toLowerCase());
  const connectionFields = useMemo(() => fieldsForType(draft.type), [draft.type]);
  const validate = () => {
    if (step === 0 && (!draft.name.trim() || !draft.description.trim() || duplicate)) return duplicate ? 'Tool 名称已存在，请使用唯一名称。' : '请填写 Tool 名称和能力说明。';
    if (step === 1 && connectionFields.some(field => !String(draft.connection[field.key] || '').trim())) return '请完成当前类型的必填连接字段。';
    if (step === 2) { try { JSON.parse(requestSchema); JSON.parse(responseSchema); } catch { return '请求或响应 Schema 不是合法 JSON。'; } }
    if (step === 3 && !draft.environments.find(item => item.name === '测试')?.secretRef.trim()) return '测试环境必须选择 Secret 引用。';
    if (step === 4 && (!draft.timeoutMs || !draft.qpsLimit || draft.retries < 0 || !draft.circuitBreaker.trim())) return '请完整配置超时、重试、限流和熔断策略。';
    if (step === 5 && testState !== 'passed') return '请先通过连通测试和契约校验。';
    return '';
  };
  const next = () => { const message = validate(); if (message) return setError(message); setError(''); setStep(value => Math.min(value + 1, steps.length - 1)); };
  const runTest = () => {
    const message = validateBeforeTest(draft, requestSchema, responseSchema);
    if (message) { setError(message); setTestState('failed'); return; }
    setError(''); setTestState('running');
    window.setTimeout(() => setTestState('passed'), 450);
  };
  const save = () => {
    const message = validate(); if (message) return setError(message);
    const now = Date.now();
    onSave({ ...draft, contract: { ...draft.contract, requestSchema, responseSchema }, lifecycle: '测试中', health: '正常', lastTestPassed: true, tests: [{ id: `TOOL-TEST-${now}`, time: '刚刚', environment: '测试', result: '通过', latency: '96ms', retries: 0, request: '{"sample":true}', response: '{"success":true,"trace_id":"TRACE-WIZARD"}' }], audit: [{ id: `AUD-${now}`, time: '刚刚', actor: '当前用户', action: '完成接入向导并保存草稿', evidence: '连接、契约与测试环境验证通过' }, ...draft.audit] });
  };
  return <div className="tools-modal-mask"><section className="tools-wizard" role="dialog" aria-modal="true">
    <header><div><h2>新建 Tool</h2><p>第 {step + 1} 步，共 {steps.length} 步 · {steps[step]}</p></div><button onClick={onClose} aria-label="关闭"><X /></button></header>
    <ol className="tools-stepper">{steps.map((label, index) => <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}><span>{index < step ? <Check size={13} /> : index + 1}</span><b>{label}</b></li>)}</ol>
    <div className="tools-wizard-body">
      {step === 0 && <div className="tools-form-grid"><label>Tool 类型 *<select value={draft.type} onChange={event => { const nextType = event.target.value as ToolType; setDraft(createToolDraft(nextType, draft.name)); setTestState('idle'); }} >{types.map(item => <option key={item}>{item}</option>)}</select></label><label>Tool 名称 *<input value={draft.name} onChange={event => set('name', event.target.value)} placeholder="例如：CRM 脱敏查询" /></label><label>负责人 *<input value={draft.owner} onChange={event => set('owner', event.target.value)} /></label><label>所属部门 *<select value={draft.department} onChange={event => set('department', event.target.value)}><option>AIMP能力运营组</option><option>线索事业部</option><option>数据部</option><option>内容事业部</option><option>用户服务中心</option></select></label><label className="span-2">能力说明 *<textarea value={draft.description} onChange={event => set('description', event.target.value)} placeholder="说明该工具提供什么能力、给谁使用" /></label><label className="span-2">用途与边界 *<textarea value={draft.purpose} onChange={event => set('purpose', event.target.value)} placeholder="说明允许的业务用途和禁止范围" /></label><label>风险等级<select value={draft.risk} onChange={event => set('risk', event.target.value as ToolRecord['risk'])}><option>低</option><option>中</option><option>高</option></select></label></div>}
      {step === 1 && <div><div className="tools-type-tip"><PlugZap size={18} /><span><strong>{draft.type} 连接配置</strong><small>只配置模拟连接信息，不会发起真实网络请求。</small></span></div><div className="tools-form-grid">{connectionFields.map(field => <label key={field.key} className={field.wide ? 'span-2' : ''}>{field.label} *{field.options ? <select value={draft.connection[field.key] || ''} onChange={event => setConnection(field.key, event.target.value)}><option value="">请选择</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input value={draft.connection[field.key] || ''} onChange={event => setConnection(field.key, event.target.value)} placeholder={field.placeholder} />}</label>)}</div></div>}
      {step === 2 && <div className="tools-contract-editor"><div className="tools-form-grid"><label>操作名称 *<input value={draft.contract.operation} onChange={event => setDraft(current => ({ ...current, contract: { ...current.contract, operation: event.target.value } }))} /></label><label>幂等策略<select value={draft.contract.idempotency} onChange={event => setDraft(current => ({ ...current, contract: { ...current.contract, idempotency: event.target.value } }))}><option>使用 X-Idempotency-Key，24小时内去重</option><option>查询类请求天然幂等</option><option>不支持幂等，必须人工审批</option></select></label><label>请求 Schema(JSON) *<textarea value={requestSchema} onChange={event => setRequestSchema(event.target.value)} /></label><label>响应 Schema(JSON) *<textarea value={responseSchema} onChange={event => setResponseSchema(event.target.value)} /></label><label className="span-2">错误码与处置<input value={draft.contract.errorCodes} onChange={event => setDraft(current => ({ ...current, contract: { ...current.contract, errorCodes: event.target.value } }))} /></label></div></div>}
      {step === 3 && <div className="tools-environment-list">{draft.environments.map((environment, index) => <article key={environment.name}><header><strong>{environment.name}环境</strong><label className="tools-switch"><input type="checkbox" checked={environment.enabled} onChange={event => set('environments', draft.environments.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item))} />启用</label></header><div className="tools-form-grid"><label>Endpoint<input value={environment.endpoint} onChange={event => set('environments', draft.environments.map((item, itemIndex) => itemIndex === index ? { ...item, endpoint: event.target.value } : item))} /></label><label>Secret 引用 ID {environment.name === '测试' ? '*' : ''}<input value={environment.secretRef} onChange={event => set('environments', draft.environments.map((item, itemIndex) => itemIndex === index ? { ...item, secretRef: event.target.value } : item))} placeholder="SECRET-TEST-TOOL-01" /></label><label className="span-2">网络范围<input value={environment.networkScope} onChange={event => set('environments', draft.environments.map((item, itemIndex) => itemIndex === index ? { ...item, networkScope: event.target.value } : item))} /></label></div></article>)}</div>}
      {step === 4 && <div className="tools-form-grid"><label>超时时间（ms）*<input type="number" value={draft.timeoutMs} onChange={event => set('timeoutMs', Number(event.target.value))} /></label><label>最大重试次数 *<input type="number" min="0" value={draft.retries} onChange={event => set('retries', Number(event.target.value))} /></label><label>QPS 限流 *<input type="number" min="1" value={draft.qpsLimit} onChange={event => set('qpsLimit', Number(event.target.value))} /></label><label>失败重试退避<select><option>指数退避</option><option>固定间隔 500ms</option><option>不重试</option></select></label><label className="span-2">熔断条件 *<textarea value={draft.circuitBreaker} onChange={event => set('circuitBreaker', event.target.value)} /></label><label>健康检查周期<select><option>每 1 分钟</option><option>每 5 分钟</option><option>每 15 分钟</option></select></label><label>降级策略<select><option>阻断并创建异常工单</option><option>返回缓存结果</option><option>转人工处理</option></select></label></div>}
      {step === 5 && <div className="tools-test-summary"><h3>接入检查</h3><dl><div><dt>基础信息</dt><dd>✓ {draft.name} · {draft.type}</dd></div><div><dt>连接</dt><dd>{Object.keys(draft.connection).length ? '✓ 已配置' : '✕ 未配置'}</dd></div><div><dt>契约</dt><dd>✓ 请求 / 响应 Schema</dd></div><div><dt>认证</dt><dd>{draft.environments.find(item => item.name === '测试')?.secretRef ? '✓ Secret 引用已绑定' : '✕ 缺少测试 Secret'}</dd></div><div><dt>治理</dt><dd>✓ {draft.timeoutMs}ms · {draft.qpsLimit} QPS · 重试 {draft.retries} 次</dd></div></dl><button className="tools-test-button" onClick={runTest} disabled={testState === 'running'}><PlugZap size={15} />{testState === 'running' ? '测试中…' : '运行连通测试与契约校验'}</button>{testState === 'passed' && <p className="tools-success">✓ 连接成功 · 96ms · Schema 校验通过 · Secret 权限有效</p>}{testState === 'failed' && <p className="tools-error">✕ {error}</p>}</div>}
      {error && step !== 5 && <p className="tools-error">{error}</p>}
    </div>
    <footer><button onClick={onClose}>取消</button><span />{step > 0 && <button onClick={() => { setError(''); setStep(value => value - 1); }}><ChevronLeft size={15} />上一步</button>}{step < steps.length - 1 ? <button className="tools-primary" onClick={next}>下一步<ChevronRight size={15} /></button> : <button className="tools-primary" onClick={save} disabled={testState !== 'passed'}>保存为测试中草稿</button>}</footer>
  </section></div>;
}

type Field = { key: string; label: string; placeholder?: string; options?: string[]; wide?: boolean };
function fieldsForType(type: ToolType): Field[] {
  if (type === 'HTTP API') return [{ key: 'baseUrl', label: 'Base URL', placeholder: 'https://api.example.com' }, { key: 'method', label: 'Method', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }, { key: 'path', label: 'Path', placeholder: '/v1/resources' }, { key: 'headers', label: '允许 Header', placeholder: 'X-Tenant-Id, X-Project-Id' }];
  if (type === 'MCP Server') return [{ key: 'serverUrl', label: '服务地址', placeholder: 'https://mcp.example.com' }, { key: 'transport', label: 'Transport', options: ['Streamable HTTP', 'SSE', 'STDIO'] }, { key: 'capabilities', label: '能力清单', placeholder: 'resources/list, tools/call', wide: true }, { key: 'protocolVersion', label: '协议版本', placeholder: '2025-06-18' }];
  if (type === '数据库') return [{ key: 'sourceRef', label: '数据源引用', placeholder: 'DS-CDP-PROD' }, { key: 'accessMode', label: '读写范围', options: ['只读', '受控写入'] }, { key: 'queryTemplate', label: '查询模板', placeholder: 'profile.queryByTenantAndProject' }, { key: 'rowPolicy', label: '行级权限', placeholder: 'tenant_id + project_id' }];
  if (type === '消息通道') return [{ key: 'provider', label: '服务商', placeholder: '企业微信开放平台' }, { key: 'channel', label: '通道', placeholder: '客户联系消息' }, { key: 'capability', label: '模板能力', placeholder: '文本、图文卡片、事件回执' }, { key: 'sendScope', label: '发送范围', placeholder: '已授权客户与内部成员' }];
  if (type === '文件系统') return [{ key: 'provider', label: '存储提供方', options: ['S3 兼容对象存储', '企业网盘', 'NAS'] }, { key: 'pathScope', label: '路径范围', placeholder: '/tenant/{tenant_id}/project/{project_id}' }, { key: 'formats', label: '允许格式', placeholder: 'pdf, docx, xlsx, pptx, md', wide: true }];
  return [{ key: 'runtime', label: '运行时', options: ['Python 3.12', 'Node.js 22', 'Java 21'] }, { key: 'packages', label: '依赖白名单', placeholder: 'pandas, numpy, pydantic' }, { key: 'resources', label: '资源上限', placeholder: 'CPU 1核 / 内存 512MB / 30秒' }, { key: 'networkPolicy', label: '网络策略', placeholder: '禁止外网，仅允许白名单对象存储' }];
}

function validateBeforeTest(draft: ToolRecord, requestSchema: string, responseSchema: string) {
  if (!draft.name.trim()) return '缺少 Tool 名称。';
  if (!Object.values(draft.connection).some(Boolean)) return '连接配置不完整。';
  if (!draft.environments.find(item => item.name === '测试')?.secretRef.trim()) return '测试环境缺少 Secret 引用。';
  try { JSON.parse(requestSchema); JSON.parse(responseSchema); } catch { return 'Schema 不是合法 JSON。'; }
  return '';
}
