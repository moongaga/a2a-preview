import React, { useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import type { RoleId } from '../../types';
import { getManagementDecision, roleUserId, canSeeManagementModule, type ManageableObject, type ManagementAction, type ManagementObjectType } from './management-capability';
import { nameOfOrganization, nameOfPosition, nameOfUser, type BudgetPolicy, type OrganizationUnit, type PlatformConfig, type Position, type ReportingRelation, type UserAccount } from './platform-data';
import { usePlatformManagement } from './platform-management-store';
import { ModelAccessWorkspace } from './ModelAccessWorkspace';
import { BillingWorkspace } from './BillingWorkspace';
import { EmptyState, ImpactPanel, ManagementDetail, ManagementDialog, ManagementHeader, ManagementTabs, ManagementToolbar, OperationMenu, Risk, Status } from './shared/management-ui';
import './platform-management.css';
import './model-billing.css';

type View='organizations'|'users'|'configurations'|'budgets'|'changes';
type ConfigurationSection='general'|'models'|'billing';
type Detail={type:ManagementObjectType;id:string}|null;
type Modal={mode:'create'|'edit'|'delete'|'transition';type:ManagementObjectType;id?:string;event?:string}|null;

const tabs=[
  {id:'organizations',label:'组织与岗位',description:'组织、岗位与 CFT'},
  {id:'users',label:'用户管理',description:'账号、任职与安全'},
  {id:'configurations',label:'平台配置',description:'版本、审批与发布'},
  {id:'budgets',label:'配额预算',description:'额度、阈值与预警'},
  {id:'changes',label:'变更记录',description:'全部操作与拒绝审计'},
];
const trainerTabs=[
  {id:'configurations',label:'平台配置',description:'模型连接与健康'},
  {id:'budgets',label:'配额预算',description:'部门额度与使用'},
  {id:'changes',label:'变更记录',description:'本人及部门相关记录'},
];

const actorName:Record<RoleId,string>={employee:'陈屿',business:'李沐',trainer:'周芮',admin:'赵岑',superadmin:'顾川',client:'客户管理员'};
const emptyDraft={name:'',type:'中心',parentId:'ORG-DNDC',managerId:'USR-BIZ',organizationId:'ORG-LEAD',levelSystem:'DNDC',level:'员工',duties:'',account:'',positionId:'POS-CULTIVATE',subjectId:'USR-EMP',leaderId:'USR-BIZ',relationType:'原组织上级',effectiveFrom:'2026-08-06',effectiveTo:'长期',category:'系统参数',value:'',period:'2026-08',quota:'1000000',threshold:'80'};

export function M15PlatformFoundationPage({role}:{role:RoleId}){
  const {state,execute}=usePlatformManagement();
  const [view,setView]=useState<View>(role==='employee'?'users':role==='trainer'?'configurations':'organizations');
  const [configurationSection,setConfigurationSection]=useState<ConfigurationSection>(role==='business'?'billing':role==='trainer'?'models':'general');
  const [detail,setDetail]=useState<Detail>(null);
  const [modal,setModal]=useState<Modal>(null);
  const [draft,setDraft]=useState<any>(emptyDraft);
  const [query,setQuery]=useState('');
  const [notice,setNotice]=useState('');
  const userId=roleUserId[role];
  const context={role,userId};
  const canEnter=canSeeManagementModule(role,'M15');
  const configurationSections:ConfigurationSection[]=role==='business'?['billing']:role==='trainer'?['models']:role==='admin'||role==='superadmin'?['general','models','billing']:[];
  const availableTabs=role==='trainer'?trainerTabs:tabs;
  const readOnly=role==='trainer';
  useEffect(()=>{
    const next=role==='employee'?'users':role==='trainer'?'configurations':'organizations';
    setView(next);setDetail(null);setModal(null);
    setConfigurationSection(role==='business'?'billing':role==='trainer'?'models':'general');
  },[role]);
  const enterView=(next:View)=>{
    setView(next);
    setDetail(null);
    if(next==='configurations')setConfigurationSection(role==='business'?'billing':role==='trainer'?'models':'general');
  };

  const objectFor=(type:ManagementObjectType,item:any):ManageableObject=>({
    id:item.id,objectType:type,ownerId:type==='user'?item.id:type==='reporting'?item.subjectId:item.ownerId??item.managerId,
    organizationId:type==='reporting'?state.users.find(user=>user.id===item.subjectId)?.primaryOrganizationId:item.organizationId??item.primaryOrganizationId??(type==='organization'?item.id:undefined),
    tenantId:item.tenantId??'TENANT-AIMP',status:item.status,risk:item.risk,
    protected:item.id==='ORG-AIMP'||item.id==='USR-SUPER',
    dependencies:dependencies(type,item),
  });
  const decision=(type:ManagementObjectType,item:any,action:ManagementAction)=>getManagementDecision(context,objectFor(type,item),action);
  const visible=(type:ManagementObjectType,list:any[])=>list.filter(item=>decision(type,item,'read').allowed);
  const run=(type:ManagementObjectType,item:any,action:ManagementAction,payload?:any)=>{
    const permission=decision(type,item,action);
    if(!permission.allowed){setNotice(`${permission.reason} · ${permission.auditId}`);return false}
    const result=execute({objectType:type,action,id:item.id,payload,actor:actorName[role],dependencies:action==='delete'?dependencies(type,item):undefined});
    setNotice(`${result.message}${result.blockedBy.length?` 依赖：${result.blockedBy.join('、')}`:''}`);
    if(result.ok&&action==='delete')setDetail(null);
    return result.ok;
  };
  const openForm=(mode:'create'|'edit',type:ManagementObjectType,item?:any)=>{setDraft(item?toDraft(type,item):{...emptyDraft});setModal({mode,type,id:item?.id})};
  const save=()=>{
    if(!draft.name?.trim()&&modal?.type!=='reporting'){setNotice('请填写名称。');return}
    if(!modal)return;
    const existing=findItem(state,modal.type,modal.id);
    const payload=buildPayload(modal.type,draft,existing);
    if(modal.mode==='create'){
      const pseudo={...payload,id:payload.id,tenantId:'TENANT-AIMP',organizationId:payload.organizationId??payload.parentId};
      const permission=getManagementDecision(context,{...objectFor(modal.type,pseudo),ownerId:userId},'create');
      if(!permission.allowed){setNotice(`${permission.reason} · ${permission.auditId}`);return}
      execute({objectType:modal.type,action:'create',payload,actor:actorName[role]});
      setNotice(`新增成功：${payload.id}`);setDetail({type:modal.type,id:payload.id});
    }else if(existing)run(modal.type,existing,'update',payload);
    setModal(null);
  };
  if(!canEnter)return <section className="pm-gate"><ShieldCheck/><h1>M15 基础管理不可访问</h1><p>当前身份没有内部基础管理能力；客户成员管理请前往客户门户。</p></section>;
  if(role==='employee')return <EmployeeAccountReadOnly user={state.users.find(item=>item.id===userId)} state={state}/>;

  const selected=detail?findItem(state,detail.type,detail.id):undefined;
  return <section className="pm">
    <ManagementHeader title={role==='trainer'?'M15 平台信息':'M15 基础管理'} subtitle={role==='trainer'?'查看训练相关模型接入、部门配额与变更记录':'维护组织、岗位、账号与平台运行配置'}/>
    {selected&&detail?<M15Detail readOnly={readOnly} type={detail.type} item={selected} state={state} back={()=>setDetail(null)} decision={decision} edit={()=>openForm('edit',detail.type,selected)} remove={()=>setModal({mode:'delete',type:detail.type,id:selected.id})} transition={(event)=>setModal({mode:'transition',type:detail.type,id:selected.id,event})} open={setDetail} reportingAction={(mode,relation,subjectId)=>{if(mode==='create'){setDraft({...emptyDraft,subjectId});setModal({mode:'create',type:'reporting'})}else if(mode==='edit'&&relation)openForm('edit','reporting',relation);else if(mode==='delete'&&relation)setModal({mode:'delete',type:'reporting',id:relation.id})}}/>:<main className="pm-content">
      <ManagementTabs items={availableTabs} value={view} onChange={id=>enterView(id as View)}/>
      {view==='configurations'&&configurationSections.length>0&&<nav className="pm-config-switch" aria-label="平台配置工作台">
        {configurationSections.includes('general')&&<button className={configurationSection==='general'?'active':''} onClick={()=>setConfigurationSection('general')}>通用配置</button>}
        {configurationSections.includes('models')&&<button className={configurationSection==='models'?'active':''} onClick={()=>setConfigurationSection('models')}>大模型接入</button>}
        {configurationSections.includes('billing')&&<button className={configurationSection==='billing'?'active':''} onClick={()=>setConfigurationSection('billing')}>计费管理</button>}
      </nav>}
      {view==='configurations'&&configurationSections.length===0&&<section className="pm-config-denied"><ShieldCheck/><div><h2>平台配置不可访问</h2><p>员工身份仅可维护本人账号；大模型连接、供应商计费和平台配置由授权管理角色维护。</p></div></section>}
      {view!=='changes'&&(view!=='configurations'||configurationSection==='general')&&!(view==='configurations'&&configurationSections.length===0)&&<ManagementToolbar><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索名称或 ID"/></label><span>数据已按当前身份管辖范围过滤</span>{!readOnly&&<button className="primary" onClick={()=>openForm('create',view==='organizations'?'organization':view==='users'?'user':view==='configurations'?'config':'budget')}><Plus/>新增</button>}</ManagementToolbar>}
      {view==='organizations'&&<OrganizationWorkspace organizations={visible('organization',state.organizations)} positions={visible('position',state.positions)} query={query} open={setDetail} createPosition={()=>openForm('create','position')} action={(type,item,action)=>action==='delete'?setModal({mode:'delete',type,id:item.id}):action==='update'?openForm('edit',type,item):setModal({mode:'transition',type,id:item.id,event:action})} decision={decision}/>} 
      {view==='users'&&<EntityTable type="user" items={visible('user',state.users)} query={query} open={setDetail} action={(item,action)=>action==='delete'?setModal({mode:'delete',type:'user',id:item.id}):action==='update'?openForm('edit','user',item):setModal({mode:'transition',type:'user',id:item.id,event:action})} decision={decision}/>} 
      {view==='configurations'&&configurationSections.includes('general')&&configurationSection==='general'&&<EntityTable type="config" items={visible('config',state.configs)} query={query} open={setDetail} action={(item,action)=>action==='delete'?setModal({mode:'delete',type:'config',id:item.id}):action==='update'?openForm('edit','config',item):setModal({mode:'transition',type:'config',id:item.id,event:action})} decision={decision}/>} 
      {view==='configurations'&&configurationSections.includes('models')&&configurationSection==='models'&&<ModelAccessWorkspace role={role} readOnly={readOnly}/>} 
      {view==='configurations'&&configurationSections.includes('billing')&&configurationSection==='billing'&&<BillingWorkspace role={role}/>} 
      {view==='budgets'&&<EntityTable readOnly={readOnly} type="budget" items={visible('budget',state.budgets)} query={query} open={setDetail} action={(item,action)=>action==='delete'?setModal({mode:'delete',type:'budget',id:item.id}):action==='update'?openForm('edit','budget',item):setModal({mode:'transition',type:'budget',id:item.id,event:action})} decision={decision}/>} 
      {view==='changes'&&<AuditTable items={role==='trainer'?trainerAuditItems(state):state.audits}/>} 
    </main>}
    {modal&&<M15Modal modal={modal} item={findItem(state,modal.type,modal.id)} draft={draft} setDraft={setDraft} close={()=>setModal(null)} save={save} confirm={()=>{
      const item=findItem(state,modal.type,modal.id);if(!item)return;
      if(modal.mode==='delete')run(modal.type,item,'delete');
      else {const event=modal.event as ManagementAction;const status=event==='disable'?'停用':event==='restore'?'启用':event==='archive'?'归档':event==='publish'?'已发布':item.status;run(modal.type,item,event,{status});}
      setModal(null);
    }}/>} 
    {notice&&<div className="pm-notice">{notice}<button onClick={()=>setNotice('')}>关闭</button></div>}
  </section>
}

function EmployeeAccountReadOnly({user,state}:{user?:UserAccount;state:any}){
  if(!user)return <section className="pm"><ManagementHeader title="M15 我的账号" subtitle="查看本人账号、任职组织、岗位与汇报关系"/><main className="pm-content"><EmptyState text="未找到当前账号资料"/></main></section>;
  const relations=relationsFor('user',user,state);
  return <section className="pm">
    <ManagementHeader title="M15 我的账号" subtitle="查看本人账号、任职组织、岗位与汇报关系"/>
    <main className="pm-content pm-self-permissions">
      <div className="pm-kpis"><article className="pm-kpi"><span>账号状态</span><strong>{user.status}</strong></article><article className="pm-kpi"><span>所属组织</span><strong>{nameOfOrganization(user.primaryOrganizationId)}</strong></article><article className="pm-kpi"><span>当前岗位</span><strong>{nameOfPosition(user.primaryPositionId)}</strong></article><article className="pm-kpi"><span>汇报与协作关系</span><strong>{relations.length}</strong></article></div>
      <article className="pm-panel"><header><b>账号资料</b><Status value="只读"/></header><dl><dt>姓名</dt><dd>{user.name}</dd><dt>账号</dt><dd>{user.account}</dd><dt>主组织</dt><dd>{nameOfOrganization(user.primaryOrganizationId)}</dd><dt>主岗位</dt><dd>{nameOfPosition(user.primaryPositionId)}</dd><dt>兼任 / CFT</dt><dd>{user.assignments.map(nameOfOrganization).join('、')||'无'}</dd><dt>数据范围</dt><dd>{user.dataScopes.join('、')}</dd><dt>最近登录</dt><dd>{user.lastLogin}</dd><dt>账号 ID</dt><dd>{user.id}</dd></dl></article>
      <article className="pm-panel"><header><b>任职与汇报</b><span>由组织管理员维护</span></header>{relations.length?relations.map(relation=><div className="pm-list-row" key={relation.id}><span><b>{relation.relationType}</b><small>{relation.reportingSystem} · {relation.effectiveFrom} 至 {relation.effectiveTo}</small></span><strong>{nameOfUser(relation.leaderId)}</strong><Status value={relation.effectiveTo==='长期'||relation.effectiveTo>='2026-08-09'?'生效':'到期'}/></div>):<EmptyState text="暂无汇报或协作关系"/>}</article>
    </main>
  </section>
}

function trainerAuditItems(state:any){
  const relatedIds=new Set([
    ...state.configs.filter((item:PlatformConfig)=>['模型供应商','模型路由'].includes(item.category)).map((item:PlatformConfig)=>item.id),
    ...state.budgets.filter((item:BudgetPolicy)=>item.organizationId==='ORG-CAPABILITY').map((item:BudgetPolicy)=>item.id),
  ]);
  return state.audits.filter((item:any)=>relatedIds.has(String(item.object).split(' ')[0])||/MODEL|PROVIDER|CONN/i.test(item.object)||(item.actor===actorName.trainer&&/模型|配置|预算|连接|路由/.test(`${item.action}${item.detail}${item.object}`)));
}

function dependencies(type:ManagementObjectType,item:any){if(type==='organization')return [...(item.userCount?[`${item.userCount} 名用户`]:[]),...(item.childCount?[`${item.childCount} 个下级组织`]:[]),...(item.policyRefs?[`${item.policyRefs} 条权限策略`]:[])];if(type==='position'&&item.userCount)return [`${item.userCount} 名任职人员`];if(type==='user')return [...(item.openTasks?[`${item.openTasks} 个任务`]:[]),...(item.pendingApprovals?[`${item.pendingApprovals} 个审批`]:[])];if(type==='config'&&item.status!=='草稿')return ['生产或审批版本'];return []}
function findItem(state:any,type:ManagementObjectType,id?:string){if(!id)return undefined;const keys:Partial<Record<ManagementObjectType,string>>={organization:'organizations',position:'positions',user:'users',reporting:'reporting',config:'configs',budget:'budgets'};const key=keys[type];return key?state[key].find((item:any)=>item.id===id):undefined}
function toDraft(type:ManagementObjectType,item:any){if(type==='position')return {...item,duties:item.duties.join('、')};if(type==='budget')return {...item,quota:String(item.quota),threshold:String(item.threshold)};return {...item,name:item.name??`${nameOfUser(item.subjectId)} → ${nameOfUser(item.leaderId)}`}}
function buildPayload(type:ManagementObjectType,d:any,existing?:any){const id=existing?.id??`${type.toUpperCase().slice(0,4)}-${Date.now().toString().slice(-6)}`;if(type==='organization')return {...existing,id,tenantId:'TENANT-AIMP',name:d.name,type:d.type,parentId:d.parentId,status:existing?.status??'草稿',managerId:d.managerId,reportingSystem:d.parentId==='ORG-MKT-HQ'?'营销总部':'DNDC',userCount:existing?.userCount??0,childCount:existing?.childCount??0,policyRefs:existing?.policyRefs??0};if(type==='position')return {...existing,id,organizationId:d.organizationId,name:d.name,levelSystem:d.levelSystem,level:d.level,duties:String(d.duties).split(/[、,]/).filter(Boolean),status:existing?.status??'草稿',userCount:existing?.userCount??0};if(type==='user')return {...existing,id,name:d.name,account:d.account,status:existing?.status??'正常',tenantId:'TENANT-AIMP',primaryOrganizationId:d.organizationId,primaryPositionId:d.positionId,assignments:existing?.assignments??[],roleIds:existing?.roleIds??['ROLE-EMPLOYEE'],dataScopes:existing?.dataScopes??['本人'],lastLogin:existing?.lastLogin??'尚未登录',openTasks:existing?.openTasks??0,pendingApprovals:existing?.pendingApprovals??0};if(type==='reporting')return {...existing,id,subjectId:d.subjectId,leaderId:d.leaderId,relationType:d.relationType,effectiveFrom:d.effectiveFrom,effectiveTo:d.effectiveTo,reportingSystem:d.relationType==='原组织上级'?'DNDC':d.relationType==='挂职上级'?'营销总部':'平台治理'};if(type==='config')return {...existing,id,category:d.category,name:d.name,currentVersion:existing?.currentVersion??'—',draftVersion:existing?.draftVersion??'v1.0',status:existing?.status??'草稿',risk:existing?.risk??'中',owner:existing?.owner??'当前用户',updatedAt:'刚刚',impactModules:existing?.impactModules??['M15']};return {...existing,id,organizationId:d.organizationId,name:d.name,period:d.period,quota:Number(d.quota),used:existing?.used??0,threshold:Number(d.threshold),status:existing?.status??'草稿',ownerId:existing?.ownerId??'USR-ADMIN',alerts:existing?.alerts??0} as BudgetPolicy}

function OrganizationWorkspace({organizations,positions,query,open,createPosition,action,decision}:{organizations:OrganizationUnit[];positions:Position[];query:string;open:(d:Detail)=>void;createPosition:()=>void;action:(type:ManagementObjectType,item:any,action:ManagementAction)=>void;decision:any}){return <div className="pm-two"><section><div className="pm-section-title"><b>组织</b><span>{organizations.length} 个</span></div><EntityTable type="organization" items={organizations} query={query} open={open} action={(i,a)=>action('organization',i,a)} decision={decision}/></section><section><div className="pm-section-title"><b>岗位</b><button onClick={createPosition}><Plus/>新增岗位</button></div><EntityTable type="position" items={positions} query={query} open={open} action={(i,a)=>action('position',i,a)} decision={decision}/></section></div>}

function EntityTable({type,items,query,open,action,decision,readOnly=false}:{type:ManagementObjectType;items:any[];query:string;open:(d:Detail)=>void;action:(item:any,action:ManagementAction)=>void;decision:any;readOnly?:boolean}){const filtered=items.filter(item=>!query||JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));if(!filtered.length)return <EmptyState text="当前范围暂无可查看对象"/>;return <div className="pm-table-wrap"><table><thead><tr><th>对象</th><th>归属 / 类型</th><th>状态</th><th>关键指标</th><th>操作</th></tr></thead><tbody>{filtered.map(item=><tr key={item.id} onClick={()=>open({type,id:item.id})}><td><b>{displayName(type,item)}</b><small>{item.id}</small></td><td>{displayOwner(type,item)}</td><td><Status value={item.status??'生效'}/></td><td>{displayMetric(type,item)}</td><td onClick={e=>e.stopPropagation()}><button onClick={()=>open({type,id:item.id})}>详情</button>{!readOnly&&<OperationMenu items={actionsFor(type,item).map(a=>({label:actionLabel(a),onClick:()=>action(item,a),disabled:!decision(type,item,a).allowed,reason:decision(type,item,a).reason,danger:a==='delete'}))}/>}</td></tr>)}</tbody></table></div>}
function displayName(type:ManagementObjectType,i:any){if(type==='reporting')return `${nameOfUser(i.subjectId)} → ${nameOfUser(i.leaderId)}`;return i.name}
function displayOwner(type:ManagementObjectType,i:any){if(type==='organization')return `${i.type} · ${nameOfUser(i.managerId)}`;if(type==='position')return nameOfOrganization(i.organizationId);if(type==='user')return `${nameOfOrganization(i.primaryOrganizationId)} · ${nameOfPosition(i.primaryPositionId)}`;if(type==='reporting')return `${i.relationType} · ${i.reportingSystem}`;if(type==='config')return `${i.category} · ${i.owner}`;return `${nameOfOrganization(i.organizationId)} · ${i.period}`}
function displayMetric(type:ManagementObjectType,i:any){if(type==='organization')return `${i.userCount} 人 · ${i.policyRefs} 策略`;if(type==='position')return `${i.userCount} 人`;if(type==='user')return `${i.roleIds.length} 角色 · ${i.dataScopes.join('/')}`;if(type==='reporting')return `${i.effectiveFrom} — ${i.effectiveTo}`;if(type==='config')return `${i.currentVersion} → ${i.draftVersion??'无草稿'}`;return `${Math.round(i.used/i.quota*100)}% · 阈值 ${i.threshold}%`}
function actionsFor(type:ManagementObjectType,item:any):ManagementAction[]{const base:ManagementAction[]=['update'];if(['停用','归档'].includes(item.status))base.push('restore');else base.push('disable','archive');base.push('delete');if(type==='config'&&item.status==='待审批')base.unshift('publish');return base}
const actionLabel=(a:ManagementAction)=>({update:'编辑',delete:'删除',disable:'停用',restore:'恢复',archive:'归档',publish:'审批发布',create:'新增',read:'查看',approve:'审批',revoke:'回收',delegate:'委派'}[a]);

function M15Detail({type,item,state,back,decision,edit,remove,transition,open,reportingAction,readOnly=false}:{type:ManagementObjectType;item:any;state:any;back:()=>void;decision:any;edit:()=>void;remove:()=>void;transition:(a:ManagementAction)=>void;open:(d:Detail)=>void;reportingAction:(mode:'create'|'edit'|'delete',relation?:ReportingRelation,subjectId?:string)=>void;readOnly?:boolean}){const [tab,setTab]=useState('基本信息');const related=type==='organization'?state.users.filter((u:UserAccount)=>u.primaryOrganizationId===item.id):[];const relations=relationsFor(type,item,state);const metrics=[{label:'状态',value:item.status??'生效'},{label:'归属',value:displayOwner(type,item)},{label:'依赖',value:String(dependencies(type,item).length)},{label:'可操作范围',value:readOnly?'只读':decision(type,item,'update').allowed?'可编辑':'只读'}];const detailTabs=['基本信息','关联对象',...(type==='user'?['任职与汇报']:type==='organization'?['负责人及协作关系']:[]),'权限与依赖','变更审计'];return <ManagementDetail title={displayName(type,item)} meta={`${item.id} · ${type}`} backLabel="返回列表" onBack={back} metrics={metrics} tabs={<nav className="pm-detail-tabs">{detailTabs.map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>} actions={readOnly?undefined:<><button disabled={!decision(type,item,'update').allowed} title={decision(type,item,'update').reason} onClick={edit}>编辑</button><OperationMenu items={actionsFor(type,item).filter(a=>a!=='update').map(a=>({label:actionLabel(a),onClick:()=>a==='delete'?remove():transition(a),disabled:!decision(type,item,a).allowed,reason:decision(type,item,a).reason,danger:a==='delete'}))}/></>}>
  {tab==='基本信息'&&<article className="pm-panel"><header><b>对象资料</b></header><dl>{Object.entries(item).filter(([,v])=>typeof v!=='object').map(([k,v])=><React.Fragment key={k}><dt>{fieldName(k)}</dt><dd>{String(v)}</dd></React.Fragment>)}</dl></article>}
  {tab==='关联对象'&&<article className="pm-panel"><header><b>关联对象</b></header>{related.length?related.map((r:any)=><button className="pm-list-row" key={r.id} onClick={()=>open({type:type==='organization'?'user':'reporting',id:r.id})}><span><b>{displayName(type==='organization'?'user':'reporting',r)}</b><small>{r.id}</small></span></button>):<EmptyState text="暂无关联对象"/>}</article>}
  {tab==='任职与汇报'&&<ReportingRelations title="任职与汇报" relations={relations} decision={decision} create={()=>reportingAction('create',undefined,item.id)} edit={relation=>reportingAction('edit',relation)} remove={relation=>reportingAction('delete',relation)}/>} 
  {tab==='负责人及协作关系'&&<ReportingRelations title="负责人及协作关系" relations={relations} decision={decision}/>} 
  {tab==='权限与依赖'&&<article className="pm-panel"><header><b>动作权限与依赖</b></header>{actionsFor(type,item).map(a=><div className="pm-list-row" key={a}><b>{actionLabel(a)}</b><Status value={decision(type,item,a).allowed?'允许':'拒绝'}/><span>{decision(type,item,a).reason}</span></div>)}{dependencies(type,item).map((d:string)=><div className="pm-warning" key={d}>{d}</div>)}</article>}
  {tab==='变更审计'&&<AuditTable items={state.audits.filter((a:any)=>a.object===item.id)}/>} 
  </ManagementDetail>}

function relationsFor(type:ManagementObjectType,item:any,state:any):ReportingRelation[]{if(type==='user')return state.reporting.filter((relation:ReportingRelation)=>relation.subjectId===item.id);if(type==='organization'){const memberIds=new Set(state.users.filter((user:UserAccount)=>user.primaryOrganizationId===item.id||user.assignments.includes(item.id)).map((user:UserAccount)=>user.id));return state.reporting.filter((relation:ReportingRelation)=>memberIds.has(relation.subjectId))}return []}
function ReportingRelations({title,relations,decision,create,edit,remove}:{title:string;relations:ReportingRelation[];decision:any;create?:()=>void;edit?:(relation:ReportingRelation)=>void;remove?:(relation:ReportingRelation)=>void}){return <article className="pm-panel"><header><b>{title}</b>{create&&<button onClick={create}><Plus/>新增关系</button>}</header>{relations.length?relations.map(relation=><div className="pm-list-row" key={relation.id}><span><b>{nameOfUser(relation.subjectId)} → {nameOfUser(relation.leaderId)}</b><small>{relation.relationType} · {relation.reportingSystem} · {relation.effectiveFrom} 至 {relation.effectiveTo}</small></span><Status value={relation.effectiveTo==='长期'||relation.effectiveTo>='2026-08-09'?'生效':'到期'}/>{edit&&<button disabled={!decision('reporting',relation,'update').allowed} onClick={()=>edit(relation)}>编辑</button>}{remove&&<button disabled={!decision('reporting',relation,'delete').allowed} onClick={()=>remove(relation)}>删除</button>}</div>):<EmptyState text="暂无负责人、挂职或协作关系"/>}</article>}

function M15Modal({modal,item,draft,setDraft,close,save,confirm}:{modal:Modal;item:any;draft:any;setDraft:(d:any)=>void;close:()=>void;save:()=>void;confirm:()=>void}){if(!modal)return null;if(modal.mode==='delete'||modal.mode==='transition'){const deps=dependencies(modal.type,item);const title=modal.mode==='delete'?`删除 ${displayName(modal.type,item)}`:`${actionLabel(modal.event as ManagementAction)} ${displayName(modal.type,item)}`;return <ManagementDialog title={title} onClose={close} footer={<><button onClick={close}>取消</button><button className="danger" onClick={confirm}>确认{modal.mode==='delete'?'删除':actionLabel(modal.event as ManagementAction)}</button></>}><ImpactPanel title="影响分析" items={deps.length?deps:['无阻断依赖；操作仍会写入审计。']}/></ManagementDialog>};return <ManagementDialog title={`${modal.mode==='create'?'新增':'编辑'}${typeLabel(modal.type)}`} onClose={close} footer={<><button onClick={close}>取消</button><button className="primary" onClick={save}>保存</button></>} size="wide"><div className="pm-form"><Fields type={modal.type} draft={draft} setDraft={setDraft}/></div></ManagementDialog>}
function Fields({type,draft,setDraft}:{type:ManagementObjectType;draft:any;setDraft:(d:any)=>void}){const input=(key:string,label:string)=><label>{label}<input value={draft[key]??''} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>;const select=(key:string,label:string,options:string[])=><label>{label}<select value={draft[key]??options[0]} onChange={e=>setDraft({...draft,[key]:e.target.value})}>{options.map(o=><option key={o}>{o}</option>)}</select></label>;if(type==='organization')return <>{input('name','组织名称 *')}{select('type','组织类型',['集团','中心','部门','科室','虚拟CFT'])}{select('parentId','上级组织',['ORG-AIMP','ORG-DNDC','ORG-LEAD','ORG-CAPABILITY','ORG-MKT-HQ'])}{select('managerId','负责人',['USR-SUPER','USR-ADMIN','USR-BIZ','USR-TRAINER'])}</>;if(type==='position')return <>{input('name','岗位名称 *')}{select('organizationId','所属组织',['ORG-LEAD','ORG-LEAD-CULTIVATE','ORG-CAPABILITY','ORG-MKT-HQ'])}{select('levelSystem','职级体系',['DNDC','营销总部','平台治理'])}{input('level','岗位级别')}{input('duties','岗位职责（顿号分隔）')}</>;if(type==='user')return <>{input('name','姓名 *')}{input('account','登录账号 *')}{select('organizationId','主组织',['ORG-LEAD','ORG-LEAD-CULTIVATE','ORG-CAPABILITY','ORG-MKT-HQ'])}{select('positionId','主岗位',['POS-CULTIVATE','POS-TRAINER','POS-ADMIN','POS-MKT-CHIEF'])}</>;if(type==='reporting')return <>{select('subjectId','员工',['USR-EMP','USR-BIZ','USR-TRAINER','USR-ADMIN'])}{select('relationType','关系类型',['原组织上级','挂职上级','CFT 负责人','流程审批人'])}{select('leaderId','负责人',['USR-BIZ','USR-ADMIN','USR-SUPER','USR-MKT'])}{input('effectiveFrom','生效日期')}{input('effectiveTo','失效日期')}</>;if(type==='config')return <>{input('name','配置名称 *')}{select('category','配置类型',['模型供应商','模型路由','系统参数','业务字典','通知模板','配额预算'])}{input('value','配置内容')}</>;return <>{input('name','预算名称 *')}{select('organizationId','所属组织',['ORG-LEAD','ORG-CAPABILITY','ORG-MKT-HQ'])}{input('period','预算周期')}{input('quota','额度')}{input('threshold','预警阈值')}</>}
function typeLabel(type:ManagementObjectType){const labels:Partial<Record<ManagementObjectType,string>>={organization:'组织',position:'岗位',user:'用户',reporting:'汇报关系',config:'配置',budget:'预算'};return labels[type]??type}
function fieldName(key:string){return {id:'对象 ID',name:'名称',status:'状态',tenantId:'租户',type:'类型',parentId:'上级组织',managerId:'负责人',organizationId:'所属组织',primaryOrganizationId:'主组织',primaryPositionId:'主岗位',account:'登录账号',reportingSystem:'汇报体系',relationType:'关系类型',subjectId:'员工',leaderId:'负责人',effectiveFrom:'生效日期',effectiveTo:'失效日期',category:'配置类型',currentVersion:'生产版本',draftVersion:'草稿版本',risk:'风险',period:'周期',quota:'额度',used:'已使用',threshold:'阈值'}[key]??key}
function AuditTable({items}:{items:any[]}){return <div className="pm-table-wrap"><table><thead><tr><th>时间 / 审计 ID</th><th>操作人</th><th>动作</th><th>对象</th><th>结果</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><b>{i.at}</b><small>{i.id}</small></td><td>{i.actor}</td><td>{i.action}</td><td>{i.object}</td><td>{i.detail}</td></tr>)}</tbody></table></div>}
