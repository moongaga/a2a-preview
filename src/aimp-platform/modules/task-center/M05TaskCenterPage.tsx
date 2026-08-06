import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ModuleHeader } from '../../components/ModuleHeader';
import type { RoleId } from '../../types';
import './m05.css';

type TaskStatus = '待处理' | '进行中' | '待审核' | '已完成';
type TaskPriority = 'P0' | 'P1' | 'P2';
type Task = { id: string; name: string; priority: TaskPriority; status: TaskStatus; assignee: string; creator: string; deadline: string; description: string; project: string };
type TaskRoleProfile = { label: string; scope: string; ids: string[] | 'all'; canCreate: boolean; canReassign: boolean; canAdvance: (task: Task) => boolean; defaultFilter: '全部任务' | '我的任务' | '我创建的' | '我分发的' };

const people = ['李明远', '张伟国', '王晓芳', '赵志强', '陈思敏'];
const agents = ['营销策略Agent', '内容生成Agent', '线索诊断Agent', '线索培育Agent', 'KOC运营Agent', '客服应答Agent', '数据同步Agent'];
const projects = ['无关联项目', 'Q3线索转化提升', 'N7新车上市营销', '商城双十一大促', 'AI客服质量优化'];
const statusOrder: TaskStatus[] = ['待处理', '进行中', '待审核', '已完成'];
const initialTasks: Task[] = [
    { id: 'TASK-014', name: '华南线索转化率根因分析', priority: 'P0', status: '待处理', assignee: '线索诊断Agent', creator: '赵志强', deadline: '2小时内', description: '分析华南区域线索到店率连续3天低于全国均值15%的根因，2h内完成', project: 'Q3线索转化提升' },
    { id: 'TASK-013', name: 'N7试驾链路优化方案输出', priority: 'P1', status: '待处理', assignee: '营销策略Agent', creator: '李明远', deadline: '今日 16:00 前', description: '基于用户画像和竞品对标，输出N7试驾预约链路优化方案，含3个改进方向', project: 'N7新车上市营销' },
    { id: 'TASK-012', name: '客服对话质量抽查（50条）', priority: 'P2', status: '待处理', assignee: '王晓芳', creator: '赵志强', deadline: '今日', description: '随机抽样昨日50条客服对话，人工审核 Agent 应答质量并标记 badcase', project: 'AI客服质量优化' },
    { id: 'TASK-010', name: 'Q3线索转化提升方案审批', priority: 'P0', status: '进行中', assignee: '李明远', creator: '营销策略Agent', deadline: '今日', description: '审核营销策略 Agent 生成的 Q3 方案，确认三大策略方向，批准执行', project: 'Q3线索转化提升' },
    { id: 'TASK-009', name: '内容 Agent v3.0.3 用例修复', priority: 'P1', status: '进行中', assignee: '陈思敏', creator: 'Agent测试沙箱', deadline: '明日', description: '修复预发布测试中发现的8个失败用例：6个 Prompt 注入与2个平台适配问题', project: 'AI客服质量优化' },
    { id: 'TASK-007', name: 'Token 销售定价方案', priority: 'P1', status: '待审核', assignee: '张伟国', creator: '营销策略Agent', deadline: '今日', description: '三层 Token 套餐定价方案：基础版、专业版、企业版，需完成审批', project: '无关联项目' },
    { id: 'TASK-006', name: 'N7城市NOA文档审核', priority: 'P2', status: '待审核', assignee: '王晓芳', creator: '知识库', deadline: '今日', description: '审核陈思敏提交的3篇 N7 城市 NOA 功能文档，确认内容准确性', project: 'N7新车上市营销' },
    { id: 'TASK-005', name: '品牌方A晨间数据同步', priority: 'P2', status: '已完成', assignee: '数据同步Agent', creator: '系统自动', deadline: '2m10s', description: '完成品牌方 A/B/C 数据同步，耗时2分10秒', project: '无关联项目' },
];
const taskRoleProfiles: Record<RoleId, TaskRoleProfile> = {
    employee: { label: '员工', scope: '项目成员范围 · 处理本人参与项目的执行任务', ids: ['TASK-014', 'TASK-013', 'TASK-012', 'TASK-010'], canCreate: true, canReassign: false, canAdvance: (task) => task.status === '待处理' || task.status === '进行中', defaultFilter: '我的任务' },
    business: { label: '业务负责人', scope: '负责项目与部门 · 审核业务决策与关键交付', ids: ['TASK-010', 'TASK-007', 'TASK-006'], canCreate: true, canReassign: true, canAdvance: (task) => task.status === '待审核', defaultFilter: '我的任务' },
    trainer: { label: 'AI 训练师', scope: '能力维护范围 · 处理 Agent 诊断、修复和测试任务', ids: ['TASK-014', 'TASK-013', 'TASK-009', 'TASK-005'], canCreate: true, canReassign: true, canAdvance: (task) => task.status !== '已完成', defaultFilter: '全部任务' },
    admin: { label: '平台管理员', scope: '平台运行范围 · 管理租户内全部协作任务', ids: 'all', canCreate: true, canReassign: true, canAdvance: (task) => task.status !== '已完成', defaultFilter: '全部任务' },
    superadmin: { label: '超级管理员', scope: '全租户审计范围 · 查看与处置跨租户治理任务', ids: 'all', canCreate: true, canReassign: true, canAdvance: (task) => task.status !== '已完成', defaultFilter: '全部任务' },
    client: { label: '客户管理员', scope: '仅查看本租户客户门户服务事项', ids: [], canCreate: false, canReassign: false, canAdvance: () => false, defaultFilter: '全部任务' },
};

function nextAction(status: TaskStatus) {
    if (status === '待处理') return { label: '▶ 开始处理', next: '进行中' as TaskStatus };
    if (status === '进行中') return { label: '提交审核', next: '待审核' as TaskStatus };
    if (status === '待审核') return { label: '审核通过', next: '已完成' as TaskStatus };
    return null;
}

export function M05TaskCenterPage({ role }: { role: RoleId }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [view, setView] = useState<'看板视图' | '列表视图'>('看板视图');
    const [createOpen, setCreateOpen] = useState(false);
    const [detail, setDetail] = useState<Task | null>(null);
    const [reassigning, setReassigning] = useState(false);
    const [notice, setNotice] = useState('');
    const [filter, setFilter] = useState<'全部任务' | '我的任务' | '我创建的' | '我分发的'>(taskRoleProfiles[role].defaultFilter);
    const [draft, setDraft] = useState({ name: '', priority: 'P2' as TaskPriority, deadline: '', description: '', assigneeType: '人类员工', assignee: people[0], project: projects[0] });
    const [reassignedTo, setReassignedTo] = useState(people[0]);
    const canUse = role !== 'client';
    const profile = taskRoleProfiles[role];
    const isAgent = (value: string) => value.includes('Agent') || value === '系统自动' || value === '知识库';
    const scopedTasks = profile.ids === 'all' ? tasks : tasks.filter((task) => profile.ids.includes(task.id) || task.creator === '陈琳');
    const visibleTasks = filter === '我创建的' ? scopedTasks.filter((task) => task.creator === '陈琳') : filter === '我分发的' ? scopedTasks.filter((task) => task.creator === '陈琳') : scopedTasks;

    useEffect(() => {
        setFilter(taskRoleProfiles[role].defaultFilter);
        setDetail(null);
        setReassigning(false);
    }, [role]);

    const closeCreate = () => setCreateOpen(false);
    const createTask = () => {
        if (!draft.name.trim()) { setNotice('请输入任务名称'); return; }
        const id = `TASK-${String(15 + tasks.length).padStart(3, '0')}`;
        setTasks((current) => [{ id, name: draft.name.trim(), priority: draft.priority, status: '待处理', assignee: draft.assignee, creator: '陈琳', deadline: draft.deadline || '今日', description: draft.description || '新建任务，等待处理', project: draft.project }, ...current]);
        setDraft({ name: '', priority: 'P2', deadline: '', description: '', assigneeType: '人类员工', assignee: people[0], project: projects[0] });
        closeCreate();
        setNotice(`任务“${draft.name.trim()}”已创建并分配`);
    };
    const advanceTask = () => {
        if (!detail || !profile.canAdvance(detail)) { setNotice('当前身份只能处理职责范围内的任务。'); return; }
        const action = nextAction(detail.status);
        if (!action) return;
        const updated = { ...detail, status: action.next };
        setTasks((current) => current.map((task) => task.id === detail.id ? updated : task));
        setDetail(null);
        setNotice(`任务“${detail.name}”已更新为${action.next}`);
    };
    const saveReassignment = () => {
        if (!detail || !profile.canReassign) { setNotice('当前身份没有重新分配任务的权限。'); return; }
        const updated = { ...detail, assignee: reassignedTo };
        setTasks((current) => current.map((task) => task.id === detail.id ? updated : task));
        setDetail(updated);
        setReassigning(false);
        setNotice(`任务已重新分配给${reassignedTo}`);
    };

    if (!canUse) return <section className="m05-gate"><h1>M05 任务中心受限</h1><p>客户管理员不查看内部任务协作记录。</p></section>;

    return <section className="m05" data-module="task-center">
        <ModuleHeader title="M05 任务中心" subtitle="创建、分发、执行、审核与追踪人机协作任务" actions={<><select aria-label="任务筛选" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option>全部任务</option><option>我的任务</option><option>我创建的</option><option>我分发的</option></select>{profile.canCreate && <button className="m05-primary" onClick={() => setCreateOpen(true)}><Plus size={15} />创建任务</button>}</>} />
        {notice && <div className="m05-notice" role="status">{notice}<button onClick={() => setNotice('')}>关闭</button></div>}
        <div className="m05-content">
            <nav className="m05-tabs" aria-label="任务视图">
                {(['看板视图', '列表视图'] as const).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item === '看板视图' ? '📋' : '📃'} {item}</button>)}
                <small>当前身份可见 {visibleTasks.length} 项任务</small>
            </nav>
        {view === '看板视图' ? <div className="m05-kanban">
            {statusOrder.map((status) => <section className="m05-column" key={status}><h3>{status}<em>{visibleTasks.filter((task) => task.status === status).length}</em></h3>
                {visibleTasks.filter((task) => task.status === status).map((task) => <button className={`m05-card ${status === '已完成' ? 'done' : ''}`} key={task.id} onClick={() => { setDetail(task); setReassigning(false); }}>
                    <strong><i className={task.priority.toLowerCase()} />{task.name}{status === '已完成' ? ' ✓' : ''}</strong>
                    <small><span>{isAgent(task.assignee) ? '🤖' : '👤'} {task.assignee}</span><span>⏰ {task.deadline}</span></small>
                </button>)}
            </section>)}
        </div> : <div className="m05-list"><table><thead><tr><th>编号</th><th>任务名称</th><th>优先级</th><th>状态</th><th>指派人</th><th>创建者</th><th>截止时间</th><th>操作</th></tr></thead><tbody>
            {visibleTasks.map((task) => <tr key={task.id} onClick={() => { setDetail(task); setReassigning(false); }}><td>{task.id}</td><td><b>{task.name}</b></td><td><span className={`m05-tag ${task.priority.toLowerCase()}`}>{task.priority}</span></td><td>{task.status}</td><td>{isAgent(task.assignee) ? '🤖' : '👤'} {task.assignee}</td><td>{task.creator}</td><td>{task.deadline}</td><td><button>详情</button></td></tr>)}
        </tbody></table></div>}
        </div>

        {createOpen && <div className="m05-mask" onMouseDown={closeCreate}><form onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); createTask(); }}>
            <header><h2>📋 创建任务</h2><button type="button" aria-label="关闭创建任务" onClick={closeCreate}><X size={19} /></button></header>
            <label className="wide">任务名称 *<input autoFocus value={draft.name} placeholder="输入任务名称..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>优先级<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskPriority })}><option value="P2">P2 普通</option><option value="P1">P1 重要</option><option value="P0">P0 紧急</option></select></label>
            <label>截止时间<input type="datetime-local" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /></label>
            <label className="wide">任务描述<textarea rows={3} value={draft.description} placeholder="描述任务的详细内容和验收标准..." onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label>指派对象类型<select value={draft.assigneeType} onChange={(event) => { const assigneeType = event.target.value; setDraft({ ...draft, assigneeType, assignee: assigneeType === '数字Agent' ? agents[0] : people[0] }); }}><option>人类员工</option><option>数字Agent</option></select></label>
            <label>指派给<select value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}>{(draft.assigneeType === '数字Agent' ? agents : people).map((person) => <option key={person}>{person}</option>)}</select></label>
            <label className="wide">关联项目（可选）<select value={draft.project} onChange={(event) => setDraft({ ...draft, project: event.target.value })}>{projects.map((project) => <option key={project}>{project}</option>)}</select></label>
            <footer><button type="button" onClick={closeCreate}>取消</button><button className="m05-primary">创建任务</button></footer>
        </form></div>}

        {detail && <aside className="m05-drawer" aria-label="任务详情"><button className="m05-drawer-close" onClick={() => setDetail(null)}>关闭</button><h2>📋 {detail.id}</h2>
            <section><h3>任务详情</h3><div className="m05-kpis"><span><b className={detail.priority.toLowerCase()}>{detail.priority}</b><small>优先级</small></span><span><b>{detail.status}</b><small>状态</small></span><span><b>{detail.id}</b><small>编号</small></span></div>
                <dl><dt>任务名称</dt><dd>{detail.name}</dd><dt>指派人</dt><dd>{detail.assignee}</dd><dt>创建者</dt><dd>{detail.creator}</dd><dt>截止时间</dt><dd>{detail.deadline}</dd><dt>关联项目</dt><dd>{detail.project}</dd><dt>描述</dt><dd>{detail.description}</dd></dl>
            </section><section><h3>处理记录</h3><div className="m05-timeline"><p><time>10:30</time>任务创建 · {detail.creator}</p>{detail.status !== '待处理' && <p><time>10:45</time>开始处理 · {detail.assignee}</p>}{detail.status === '待审核' && <p><time>11:20</time>已提交审核</p>}{detail.status === '已完成' && <p><time>11:35</time>审核通过 · 已完成</p>}</div></section>
            {reassigning ? <section className="m05-reassign"><h3>重新分配</h3><select value={reassignedTo} onChange={(event) => setReassignedTo(event.target.value)}>{[...people, ...agents].map((item) => <option key={item}>{item}</option>)}</select><div><button onClick={() => setReassigning(false)}>取消</button><button className="m05-primary" onClick={saveReassignment}>确认分配</button></div></section> : <footer>{profile.canAdvance(detail) && <button className="m05-primary" disabled={!nextAction(detail.status)} onClick={advanceTask}>{nextAction(detail.status)?.label || '已完成'}</button>}{profile.canReassign && <button onClick={() => { setReassignedTo(detail.assignee); setReassigning(true); }}>↩ 重新分配</button>}</footer>}
        </aside>}
    </section>;
}
