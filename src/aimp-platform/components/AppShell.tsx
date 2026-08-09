import React from 'react';
import { BookOpenText, Bot, BriefcaseBusiness, CalendarClock, ClipboardCheck, FlaskConical, FolderKanban, GitBranch, KeyRound, MessageSquareCode, Puzzle, Settings2, Siren, Wrench } from 'lucide-react';
import type { RoleId } from '../types';
import { roleProfiles, RoleSwitcher } from './RoleSwitcher';

export function AppShell({ role,activeModule,onRole,onModule, children }: {
    role: RoleId;
    activeModule:string;
    onRole: (role: RoleId) => void;
    onModule:(module:'workspace'|'task-center'|'delivery-management'|'agent-management'|'agent-testing'|'agent-orchestration'|'dynamic-plan'|'incident-center'|'knowledge-base'|'prompt-engineering'|'skills'|'tools'|'platform-foundation'|'access-control')=>void;
    children: React.ReactNode;
}) {
    const user = roleProfiles[role];
    return <div className="app-shell">
        <header className="topbar">
            <div className="brand" aria-label="AIMP 统一 AI 管控平台">
                <span>A</span><div><strong>AIMP</strong><small>统一 AI 管控平台</small></div>
            </div>
            <div className="top-identity"><RoleSwitcher value={role} name={user.name} organization={user.organization} onChange={onRole} /></div>
        </header>
        <nav className="product-navigation" aria-label="主导航">
            <span className="product-navigation-label">我的工作</span>
            <button type="button" className={`product-navigation-item ${activeModule==='workspace'?'is-active':''}`} title="工作空间" onClick={()=>onModule('workspace')}>
                <BriefcaseBusiness size={15} /><span>工作空间</span>
            </button>
            <button type="button" className={`product-navigation-item ${activeModule==='task-center'?'is-active':''}`} title="任务中心" onClick={()=>onModule('task-center')}><ClipboardCheck size={15}/><span>任务中心</span></button>
            {['business','trainer','admin','superadmin'].includes(role)&&<><span className="product-navigation-label product-navigation-label--capability">交付与项目</span><button type="button" className={`product-navigation-item ${activeModule==='delivery-management'?'is-active':''}`} title={role==='trainer'?'查看参与项目与维护能力绑定':'管理合同、项目、验收与SLA'} onClick={()=>onModule('delivery-management')}><FolderKanban size={15}/><span>交付与项目管理</span></button></>}
            <span className="product-navigation-label product-navigation-label--capability">Agent 管理</span>
            {role !== 'client' && <button type="button" className={`product-navigation-item ${activeModule==='agent-management'?'is-active':''}`} title="Agent 管理" onClick={()=>onModule('agent-management')}><Bot size={15}/><span>Agent 管理</span></button>}
            {['trainer','admin','superadmin'].includes(role) && <button type="button" className={`product-navigation-item ${activeModule==='agent-testing'?'is-active':''}`} title="Agent 测试沙箱" onClick={()=>onModule('agent-testing')}><FlaskConical size={15}/><span>Agent 测试沙箱</span></button>}
            {['trainer','admin','superadmin','business'].includes(role) && <button type="button" className={`product-navigation-item ${activeModule==='agent-orchestration'?'is-active':''}`} title="Agent 编排引擎" onClick={()=>onModule('agent-orchestration')}><GitBranch size={15}/><span>Agent 编排引擎</span></button>}
            {['trainer','admin','superadmin','business'].includes(role) && <button type="button" className={`product-navigation-item ${activeModule==='dynamic-plan'?'is-active':''}`} title="动态计划" onClick={()=>onModule('dynamic-plan')}><CalendarClock size={15}/><span>动态计划</span></button>}
            {['trainer','admin','superadmin','business'].includes(role) && <button type="button" className={`product-navigation-item ${activeModule==='incident-center'?'is-active':''}`} title="异常工单中心" onClick={()=>onModule('incident-center')}><Siren size={15}/><span>异常工单中心</span></button>}
            <span className="product-navigation-label product-navigation-label--capability">能力中心</span>
            <button type="button" className={`product-navigation-item ${activeModule==='knowledge-base'?'is-active':''}`} title="知识库" onClick={()=>onModule('knowledge-base')}><BookOpenText size={15}/><span>知识库</span></button>
            {role !== 'client' && <button type="button" className={`product-navigation-item ${activeModule==='prompt-engineering'?'is-active':''}`} title="Prompt 工程" onClick={()=>onModule('prompt-engineering')}><MessageSquareCode size={15}/><span>Prompt 工程</span></button>}
            {['business','trainer','admin','superadmin'].includes(role) && <button type="button" className={`product-navigation-item ${activeModule==='skills'?'is-active':''}`} title="Skill 技能库" onClick={()=>onModule('skills')}><Puzzle size={15}/><span>Skill 技能库</span></button>}
            {['business','trainer','admin','superadmin'].includes(role) && <button type="button" className={`product-navigation-item ${activeModule==='tools'?'is-active':''}`} title="Tools 工具集" onClick={()=>onModule('tools')}><Wrench size={15}/><span>Tools 工具集</span></button>}
            {role!=='client' && <><span className="product-navigation-label product-navigation-label--capability">平台管理</span><button type="button" className={`product-navigation-item ${activeModule==='platform-foundation'?'is-active':''}`} title={role==='employee'?'查看本人账号与任职信息':role==='trainer'?'查看训练相关平台信息':['admin','superadmin'].includes(role)?'基础管理':'委派范围内基础管理'} onClick={()=>onModule('platform-foundation')}><Settings2 size={15}/><span>{role==='employee'?'我的账号':role==='trainer'?'平台信息':'基础管理'}</span></button><button type="button" className={`product-navigation-item ${activeModule==='access-control'?'is-active':''}`} title={['admin','superadmin'].includes(role)?'权限管理':'查看本人权限与数据范围'} onClick={()=>onModule('access-control')}><KeyRound size={15}/><span>{['employee','business','trainer'].includes(role)?'我的权限':'权限管理'}</span></button></>}
        </nav>
        <main className={`app-main ${activeModule==='workspace'?'is-m04':'is-m05'}`}>{children}</main>
    </div>;
}
