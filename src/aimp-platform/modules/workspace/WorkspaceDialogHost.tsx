import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Download, FileSearch, Link2, Search, ShieldCheck, X } from 'lucide-react';
import type { PermissionDecision, RoleId } from '../../types';
import { workspaceAgentRuntimeConfigs, workspaceAgents, workspaceBindings, workspaceNotices, workspacePlan, workspaceRoleAgentIds, workspaceRoleProfiles, workspaceRuntimeTraces, type WorkspaceNavigateAction, type WorkspaceNotice } from './workspace-contract';
import { createRepairTask, createResultFeedback, describeShare } from './workspace-actions';

export type WorkspaceDialogId =
    | 'agent-picker'
    | 'capability-picker'
    | 'attachment'
    | 'share'
    | 'conversation-more'
    | 'evidence'
    | 'result-feedback'
    | 'repair-task'
    | 'permission'
    | 'time-range'
    | 'data-scope'
    | 'search'
    | 'help'
    | 'notifications'
    | 'agent-detail'
    | 'incident-detail'
    | 'source-detail'
    | 'plan-detail';

export type WorkspaceDialogState = { id: WorkspaceDialogId; payload?: string };
export type WorkspaceFeedback = {
    tone: 'success' | 'error' | 'info';
    message: string;
};

const initialForm = {
    title: '修复意向评分Agent的新车型标签偏差', taskType: 'Agent质量修复', priority: 'P1', assignee: 'AI训练师队列',
    completionGate: 'M11组合测试通过', deadline: '2026-08-06T18:00', approver: '李沐 · 线索中心经理',
    feedbackType: '结论不准确', detail: '车型标签版本判断需要进一步核实。',
    shareTarget: '当前项目成员', sharePermission: '只读，可查看脱敏证据', shareExpiry: '7天',
};

export function WorkspaceDialogHost({
    dialog,
    role,
    actor,
    projectId,
    threadId,
    agentId,
    permissionFor,
    noticeReadIds,
    onMarkNoticeRead,
    onNavigate,
    onClose,
    onAgent,
    onFeedback,
}: {
    dialog: WorkspaceDialogState | null;
    role: RoleId;
    actor: string;
    projectId: string;
    threadId: string;
    agentId: string;
    permissionFor: (action: string) => PermissionDecision;
    noticeReadIds: string[];
    onMarkNoticeRead: (id?: string) => void;
    onNavigate: (action: WorkspaceNavigateAction, notice?: WorkspaceNotice) => void;
    onClose: () => void;
    onAgent: (agentId: string) => void;
    onFeedback: (feedback: WorkspaceFeedback) => void;
}) {
    const [form, setForm] = useState(initialForm);
    const [dialogError, setDialogError] = useState<string | null>(null);
    useEffect(() => { setForm(initialForm); setDialogError(null); }, [dialog?.id]);
    if (!dialog) return null;
    const profile = workspaceRoleProfiles[role];
    const source = workspaceBindings.find((item) => item.id === dialog.payload);
    const detailAgent = workspaceAgents.find((item) => item.id === dialog.payload);
    const runtimeConfig = detailAgent ? workspaceAgentRuntimeConfigs[detailAgent.id] : undefined;
    const trace = workspaceRuntimeTraces.find((item) => item.id === dialog.payload || item.threadId === threadId);
    const activeRuntimeConfig = workspaceAgentRuntimeConfigs[trace?.agentId || agentId];
    const availableAgents = workspaceAgents.filter((agent) => workspaceRoleAgentIds[role].includes(agent.id));
    const set = (key: keyof typeof initialForm, value: string) => { setDialogError(null); setForm((current) => ({ ...current, [key]: value })); };
    const finish = (feedback: WorkspaceFeedback) => { onFeedback(feedback); onClose(); };
    const submitTask = () => {
        const permission = permissionFor('create');
        if (!permission.allowed || !profile.canCreateTask) return finish({ tone: 'error', message: permission.reason || '当前身份不能创建修复任务。' });
        if (!form.title.trim()) return setDialogError('请填写任务标题。');
        if (!form.deadline) return setDialogError('请选择截止时间。');
        const result = createRepairTask({
            title: form.title.trim(), taskType: form.taskType, priority: form.priority, assignee: form.assignee,
            completionGate: form.completionGate, deadline: form.deadline, approver: form.approver,
            sourceConversationId: threadId, sourceProjectId: projectId, sourceAgentId: agentId,
            traceId: trace?.id || `trace-${threadId.toLowerCase()}`, actor, role,
        });
        finish(result.ok
            ? {
                tone: 'success',
                message: `已创建修复任务 ${result.entity.id}，并关联当前项目、会话和运行证据。`,
            }
            : { tone: 'error', message: result.message });
    };
    const submitFeedback = () => {
        const permission = permissionFor('feedback');
        if (!permission.allowed) return finish({ tone: 'error', message: permission.reason || '当前身份不能提交问题反馈。' });
        if (!form.detail.trim()) return setDialogError('请填写问题说明。');
        const result = createResultFeedback({
            feedbackType: form.feedbackType, detail: form.detail.trim(), sourceConversationId: threadId,
            sourceProjectId: projectId, sourceAgentId: agentId, traceId: trace?.id || `trace-${threadId.toLowerCase()}`, actor, role,
        });
        finish(result.ok
            ? { tone: 'success', message: `问题反馈 ${result.entity.id} 已提交，并关联当前回答与运行证据。` }
            : { tone: 'error', message: result.message });
    };

    const titleMap: Record<WorkspaceDialogId, string> = {
        'agent-picker': '选择参与 Agent', 'capability-picker': '添加能力', attachment: '添加附件', share: '分享当前对话',
        'conversation-more': '对话操作', evidence: '执行证据与追踪', 'result-feedback': '反馈 AI 结果问题',
        'repair-task': '从对话结论创建修复任务', permission: '本次对话权限', 'time-range': '选择分析时间范围',
        'data-scope': '数据范围与脱敏', search: '全局搜索', help: '工作空间帮助', notifications: '通知中心',
        'agent-detail': '参与 Agent 详情', 'incident-detail': '异常处置详情', 'source-detail': '授权信息源详情', 'plan-detail': '动态计划详情',
    };
    const choose = (message: string) => finish({ tone: 'success', message });
    const assist = (action: WorkspaceNavigateAction) => onNavigate(action);
    const unreadNotices = workspaceNotices.filter((notice) => !noticeReadIds.includes(notice.id));

    return <div className="m04-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section className={`m04-dialog ${['evidence', 'permission', 'agent-detail', 'incident-detail', 'source-detail', 'plan-detail', 'help', 'notifications'].includes(dialog.id) ? 'is-drawer' : ''}`} role="dialog" aria-modal="true" aria-label={titleMap[dialog.id]}>
            <header><div><span>M04 · 工作空间</span><h2>{titleMap[dialog.id]}</h2></div><button type="button" aria-label="关闭" onClick={onClose}><X size={19} /></button></header>
            <div className="m04-dialog-body">
                {dialogError && <div className="m04-dialog-error" role="alert"><AlertTriangle size={18} /><span>{dialogError}</span></div>}
                {dialog.id === 'agent-picker' && <div className="m04-choice-list">{availableAgents.map((agent) => <button type="button" key={agent.id} onClick={() => { onAgent(agent.id); choose(`已切换参与 Agent：${agent.name}`); }}><Bot size={19} /><span><strong>{agent.name} · {agent.version}</strong><small>{agent.capabilities.join('、')} · {agent.permission}</small></span></button>)}</div>}
                {dialog.id === 'capability-picker' && <div className="m04-choice-list">
                    <button type="button" onClick={() => choose('已添加车型知识检索能力。')}><FileSearch size={19} /><span><strong>车型知识检索</strong><small>M06 · 只读 RAG 检索</small></span></button>
                    <button type="button" onClick={() => choose('已添加质量版本对比工具。')}><Link2 size={19} /><span><strong>质量版本对比</strong><small>Tool · 只读版本差异</small></span></button>
                </div>}
                {dialog.id === 'attachment' && <div className="m04-form-grid"><label className="span-two"><span>上传文件</span><input type="file" accept=".pdf,.xlsx,.csv" /></label><div className="m04-info span-two">文件限制：PDF、XLSX、CSV，≤20MB。加入上下文前自动查毒、脱敏并校验权限。</div></div>}
                {dialog.id === 'share' && <div className="m04-form-grid">
                    <label><span>分享范围</span><select id="shareTarget" name="shareTarget" value={form.shareTarget} onChange={(event) => set('shareTarget', event.target.value)}><option>当前项目成员</option><option>指定人员</option><option>本部门成员</option></select></label>
                    <label><span>访问权限</span><select id="sharePermission" name="sharePermission" value={form.sharePermission} onChange={(event) => set('sharePermission', event.target.value)}><option>只读，可查看脱敏证据</option><option>只读，不包含执行证据</option><option>可查看并评论</option></select></label>
                    <label><span>链接有效期</span><select id="shareExpiry" name="shareExpiry" value={form.shareExpiry} onChange={(event) => set('shareExpiry', event.target.value)}><option>1天</option><option>7天</option><option>30天</option><option>至项目结束</option></select></label>
                </div>}
                {dialog.id === 'conversation-more' && <div className="m04-choice-list">
                    <button type="button" onClick={() => choose('对话已重命名，运行证据不受影响。')}><span><strong>重命名对话</strong><small>修改当前会话标题</small></span></button>
                    <button type="button" onClick={() => choose('对话与脱敏证据已生成导出文件（原型模拟）。')}><Download size={19} /><span><strong>导出对话与证据</strong><small>生成可交付的 PDF 记录</small></span></button>
                    <button type="button" onClick={() => choose('对话已归档，可从归档会话恢复。')}><span><strong>归档对话</strong><small>保留任务、关联与审计</small></span></button>
                </div>}
                {dialog.id === 'evidence' && <div className="m04-evidence-list">
                    <article><span>01</span><div><strong>权限检查</strong><p>{profile.identity} · {profile.dataScope}；仅允许读取授权聚合指标与脱敏样本。</p></div></article>
                    <article><span>02</span><div><strong>数据读取</strong><p>{trace ? `本次运行读取${trace.consumedSources.length}项授权来源；未读取CRM客户明细。` : '当前会话尚无可验证的运行来源记录。'}</p></div></article>
                    <article><span>03</span><div><strong>能力版本</strong><p>{activeRuntimeConfig ? `Agent ${activeRuntimeConfig.agentId} · Prompt ${activeRuntimeConfig.prompt.version} · 模型 ${activeRuntimeConfig.model.version}` : '当前会话尚未生成能力版本证据。'}</p></div></article>
                    <article><span>04</span><div><strong>结论生成</strong><p>识别Prompt与知识版本不一致；置信度91%；建议创建P1修复任务。</p></div></article>
                    {trace?.consumedSources.length ? <section className="m04-trace-sources"><h3>本次实际消费</h3>{trace.consumedSources.map((usage) => {
                        const binding = workspaceBindings.find((item) => item.id === usage.bindingId);
                        return <article key={usage.bindingId}><strong>{binding?.name} · {binding?.version}</strong><p>{usage.operation} · {usage.result}</p></article>;
                    })}</section> : <div className="m04-info">没有真实来源证据，本次不生成模拟引用记录。</div>}
                    {trace && <div className="m04-success"><CheckCircle2 size={18} />Trace ID：{trace.id} · 数据已脱敏 · 审计已写入</div>}
                </div>}
                {dialog.id === 'result-feedback' && <div className="m04-form-grid">
                    <label><span>问题类型 *</span><select id="feedbackType" name="feedbackType" value={form.feedbackType} onChange={(event) => set('feedbackType', event.target.value)}><option>结论不准确</option><option>遗漏关键信息</option><option>答非所问</option><option>数据或引用错误</option><option>权限或隐私问题</option><option>安全或合规风险</option><option>其他</option></select></label>
                    <label className="span-two"><span>问题说明 *</span><textarea value={form.detail} onChange={(event) => set('detail', event.target.value)} /></label>
                    <div className="m04-info span-two">提交后创建质量样本，关联当前回答与运行证据，并通知AI训练师。</div>
                </div>}
                {dialog.id === 'repair-task' && <div className="m04-form-grid">
                    <div className="m04-info span-two">来源：{threadId} · 已附分析结论、版本血缘和126条脱敏样本引用</div>
                    <label className="span-two"><span>任务标题 *</span><input value={form.title} onChange={(event) => set('title', event.target.value)} /></label>
                    <label><span>任务类型 *</span><select id="taskType" name="taskType" value={form.taskType} onChange={(event) => set('taskType', event.target.value)}><option>Agent质量修复</option><option>Prompt优化</option><option>知识纠错</option><option>模型优化</option><option>运行异常处置</option></select></label>
                    <label><span>优先级 *</span><select id="priority" name="priority" value={form.priority} onChange={(event) => set('priority', event.target.value)}><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select></label>
                    <label><span>负责人 *</span><select id="assignee" name="assignee" value={form.assignee} onChange={(event) => set('assignee', event.target.value)}><option>AI训练师队列</option><option>周芮 · AI训练师</option><option>平台运行队列</option><option>项目负责人</option></select></label>
                    <label><span>完成门槛 *</span><select id="completionGate" name="completionGate" value={form.completionGate} onChange={(event) => set('completionGate', event.target.value)}><option>M11组合测试通过</option><option>测试通过且业务验收</option><option>人工复核通过</option><option>生产指标恢复至门槛</option></select></label>
                    <label><span>截止时间 *</span><input type="datetime-local" value={form.deadline} onChange={(event) => set('deadline', event.target.value)} /></label>
                    <label><span>业务验收人</span><select id="approver" name="approver" value={form.approver} onChange={(event) => set('approver', event.target.value)}><option>李沐 · 线索中心经理</option><option>线索CFT负责人</option><option>无需业务验收</option></select></label>
                </div>}
                {dialog.id === 'permission' && <div className="m04-permission-detail"><ShieldCheck size={25} /><h3>{profile.dataScope}</h3><p>{profile.permissionSummary}</p><div><strong>明确禁止</strong><p>工作空间不能写入CRM客户明细，不能绕过测试门禁发布Agent，也不能超出项目授权读取敏感数据。</p></div></div>}
                {dialog.id === 'time-range' && <div className="m04-choice-list">{['近24小时', '近7天', '近30天', '自定义时间'].map((item) => <button type="button" key={item} onClick={() => choose(`分析时间范围已切换为${item}。`)}><span><strong>{item}</strong><small>使用当前项目授权范围</small></span></button>)}</div>}
                {dialog.id === 'data-scope' && <div className="m04-permission-detail"><ShieldCheck size={25} /><h3>{profile.dataScope}</h3><p>当前项目、近7天、聚合指标与脱敏运行样本。</p><div><strong>脱敏规则</strong><p>客户姓名、手机号、地址和自由文本PII不会进入对话上下文。</p></div></div>}
                {dialog.id === 'search' && <div><label className="m04-search-field"><Search size={18} /><input autoFocus placeholder="输入项目、对话、任务、Agent或工单ID" /></label><div className="m04-info">搜索仅在当前工作空间显示项目、会话、任务、Agent和运行证据摘要。</div></div>}
                {dialog.id === 'help' && <div className="m04-assist-list">
                    <div className="m04-info">所有指引只在当前项目、会话和授权数据范围内执行，不会跳转到其他模块。</div>
                    <section className="m04-assist-section"><h3>开始协作</h3>
                        <button type="button" onClick={() => assist('new-chat')}><span><strong>新建一轮项目对话</strong><small>清空当前草稿，开始新的授权协作上下文</small></span></button>
                        <button type="button" onClick={() => assist('open-project')}><span><strong>选择项目与 Agent</strong><small>在项目详情中核对成员、参与 Agent 与信息源绑定</small></span></button>
                    </section>
                    <section className="m04-assist-section"><h3>查看结果</h3>
                        <button type="button" onClick={() => assist('open-evidence')}><span><strong>核对本次运行依据</strong><small>查看 Trace、实际消费来源与能力版本</small></span></button>
                    </section>
                    <section className="m04-assist-section"><h3>出现问题</h3>
                        <button type="button" onClick={() => assist('open-result-feedback')}><span><strong>反馈回答问题</strong><small>按问题类型提交质量样本，并关联当前证据</small></span></button>
                        <button type="button" onClick={() => assist('open-repair-task')}><span><strong>创建修复任务</strong><small>带入当前项目、会话、Agent 与运行证据</small></span></button>
                    </section>
                </div>}
                {dialog.id === 'notifications' && <div className="m04-notice-list">
                    <div className="m04-notice-toolbar"><div><strong>未读 {unreadNotices.length} 条</strong><small>仅展示当前工作空间内需要处理的动态</small></div>{unreadNotices.length > 0 && <button type="button" onClick={() => onMarkNoticeRead()}>全部标为已读</button>}</div>
                    {workspaceNotices.map((notice) => {
                        const unread = !noticeReadIds.includes(notice.id);
                        return <article key={notice.id} className={`m04-notice-card${unread ? ' is-unread' : ''}`}>
                            <div><span>{unread ? '未读' : '已读'}</span><small>{notice.timestamp} · {notice.projectId} · {notice.threadId}</small></div>
                            <strong>{notice.title}</strong><p>{notice.summary}</p>
                            <footer><button type="button" onClick={() => { onMarkNoticeRead(notice.id); onNavigate(notice.action, notice); }}>{notice.actionLabel}</button>{unread && <button type="button" className="m04-text-action" onClick={() => onMarkNoticeRead(notice.id)}>标为已读</button>}</footer>
                        </article>;
                    })}
                </div>}
                {dialog.id === 'agent-detail' && detailAgent && <div className="m04-source-detail"><span>当前项目授权 Agent</span><h3>{detailAgent.name} · {detailAgent.version}</h3><dl><div><dt>Agent ID</dt><dd>{detailAgent.id}</dd></div><div><dt>运行状态</dt><dd>{detailAgent.status}</dd></div><div><dt>责任团队</dt><dd>{detailAgent.owner}</dd></div><div><dt>项目权限</dt><dd>{detailAgent.permission}</dd></div><div><dt>Prompt ID</dt><dd>{runtimeConfig?.prompt.id}</dd></div><div><dt>Prompt版本</dt><dd>{runtimeConfig?.prompt.version} · {runtimeConfig?.prompt.status}</dd></div><div><dt>模型版本</dt><dd>{runtimeConfig?.model.id} · {runtimeConfig?.model.version}</dd></div><div><dt>已启用 Skill</dt><dd>{runtimeConfig?.skills.join('、')}</dd></div><div><dt>已启用 Tool</dt><dd>{runtimeConfig?.tools.join('、')}</dd></div><div><dt>本次 Trace</dt><dd>{trace?.id || '当前会话尚未运行'}</dd></div><div><dt>当前视角</dt><dd>{profile.identity} · {profile.dataScope}</dd></div></dl></div>}
                {dialog.id === 'incident-detail' && trace?.incident && <div className="m04-source-detail"><span>当前运行异常处置</span><h3>{trace.incident.id} · {trace.incident.severity}</h3><dl><div><dt>处理状态</dt><dd>{trace.incident.status}</dd></div><div><dt>负责人</dt><dd>{trace.incident.owner}</dd></div><div><dt>SLA</dt><dd>{trace.incident.sla}</dd></div><div><dt>触发原因</dt><dd>{trace.incident.trigger}</dd></div><div><dt>Trace ID</dt><dd>{trace.id}</dd></div><div><dt>关联 Agent</dt><dd>{trace.agentId}</dd></div></dl></div>}
                {dialog.id === 'source-detail' && source && <div className="m04-source-detail"><span>{source.kind === 'knowledge' ? '知识库' : source.kind === 'data' ? '数据源' : '内容资产'}</span><h3>{source.name}</h3><dl><div><dt>资产 ID</dt><dd>{source.id}</dd></div><div><dt>版本</dt><dd>{source.version}</dd></div><div><dt>状态</dt><dd>{source.status}</dd></div><div><dt>用途</dt><dd>{source.purpose}</dd></div><div><dt>授权范围</dt><dd>{source.access}</dd></div><div><dt>使用证据</dt><dd>{source.evidence}</dd></div></dl></div>}
                {dialog.id === 'plan-detail' && <div className="m04-source-detail"><span>动态计划</span><h3>{workspacePlan.name}</h3><dl><div><dt>计划 ID</dt><dd>{workspacePlan.id}</dd></div><div><dt>执行计划</dt><dd>{workspacePlan.schedule}</dd></div><div><dt>下次运行</dt><dd>{workspacePlan.nextRun}</dd></div><div><dt>数据范围</dt><dd>{workspacePlan.scope}</dd></div><div><dt>状态</dt><dd>{workspacePlan.status}</dd></div></dl></div>}
            </div>
            <footer>
                <span>{dialog.id === 'repair-task' || dialog.id === 'result-feedback' ? '提交后保留关联证据与审计记录' : '所有操作保留当前项目与角色上下文'}</span>
                <button type="button" onClick={onClose}>取消</button>
                {dialog.id === 'attachment' && <button type="button" className="m04-primary" onClick={() => choose('附件已通过基础检查并加入当前上下文。')}>确认添加</button>}
                {dialog.id === 'share' && <button type="button" className="m04-primary" onClick={() => choose(describeShare(form))}>创建链接</button>}
                {dialog.id === 'result-feedback' && <button type="button" className="m04-primary" onClick={submitFeedback}>提交反馈</button>}
                {dialog.id === 'repair-task' && <button type="button" className="m04-primary" onClick={submitTask}>创建任务</button>}
            </footer>
        </section>
    </div>;
}
