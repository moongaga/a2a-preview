import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  auditSeed,bindingSeed,budgetSeed,configSeed,conflictHitSeed,conflictSeed,decisionSeed,delegationSeed,
  organizationSeed,policySeed,positionSeed,reportingSeed,reviewItemSeed,reviewSeed,roleSeed,userSeed,
  nameOfUser,type AccessReview,type AuditItem,type BudgetPolicy,type ConflictHit,type ConflictRule,type DataScopeLevel,type DecisionLog,type Delegation,type OrganizationUnit,type PermissionPolicy,type PlatformConfig,type Position,type ReportingRelation,type ReviewItem,type RiskLevel,type Role,type RoleBinding,type UserAccount,
} from './platform-data';
import type { ManagementAction, ManagementObjectType } from './management-capability';
import type { RoleId } from '../../types';

export interface ManagementState {
  organizations:OrganizationUnit[]; positions:Position[]; users:UserAccount[]; reporting:ReportingRelation[];
  configs:PlatformConfig[]; budgets:BudgetPolicy[]; roles:Role[]; policies:PermissionPolicy[];
  conflicts:ConflictRule[]; conflictHits:ConflictHit[]; reviews:AccessReview[];
  reviewItems:ReviewItem[]; decisions:DecisionLog[]; delegations:Delegation[]; bindings:RoleBinding[]; audits:AuditItem[];
}
export interface CommandResult { ok:boolean; auditId:string; message:string; blockedBy:string[] }
export interface ManagementCommand { objectType:ManagementObjectType; action:ManagementAction; id?:string; payload?:any; actor:string; dependencies?:string[] }
export type PermissionChangeResult =
  | {outcome:'applied';bindingId:string;auditId:string}
  | {outcome:'review_required';reviewItemId:string;reasons:string[];auditId:string};
export interface RoleBindingChangeInput { actorId:string;actorName:string;actorRole:RoleId;subjectId:string;roleId:string;validTo:string;source:RoleBinding['source'] }
export interface DelegationChangeInput { actorId:string;actorName:string;actorRole:RoleId;subjectId:string;objectTypes:string[];actions:string[];dataScope:DataScopeLevel;scopeTargets:string[];validTo:string;riskCeiling:RiskLevel }
export interface MyPermissionSummary { userId:string; roles:{id:string;name:string;source:string;validTo:string;status:string}[]; dataScopes:DataScopeLevel[]; delegations:Delegation[]; recentDenials:DecisionLog[] }

const initial:ManagementState={organizations:organizationSeed,positions:positionSeed,users:userSeed,reporting:reportingSeed,configs:configSeed,budgets:budgetSeed,roles:roleSeed,policies:policySeed,conflicts:conflictSeed,conflictHits:conflictHitSeed,reviews:reviewSeed,reviewItems:reviewItemSeed,decisions:decisionSeed,delegations:delegationSeed,bindings:bindingSeed,audits:auditSeed};
const collection:Partial<Record<ManagementObjectType,keyof ManagementState>>={organization:'organizations',position:'positions',user:'users',reporting:'reporting',config:'configs',budget:'budgets',role:'roles',policy:'policies',scope:'policies',review:'reviews',decision:'decisions'};

interface ManagementContextValue {state:ManagementState;setState:React.Dispatch<React.SetStateAction<ManagementState>>;execute:(command:ManagementCommand)=>CommandResult;applyRoleBindingChange:(input:RoleBindingChangeInput)=>PermissionChangeResult;applyDelegationChange:(input:DelegationChangeInput)=>PermissionChangeResult;resolvePermissionReview:(input:{reviewItemId:string;decision:'approve'|'reject';actorName:string;actorRole:RoleId})=>CommandResult}
const Context=createContext<null|ManagementContextValue>(null);

export function selectMyPermissionSummary(state:ManagementState,userId:string):MyPermissionSummary {
  const user=state.users.find(item=>item.id===userId);
  const bindings=state.bindings.filter(item=>item.subjectId===userId&&item.status==='生效');
  const roleIds=new Set([...(user?.roleIds??[]),...bindings.map(item=>item.roleId)]);
  const roles=[...roleIds].map(roleId=>{const role=state.roles.find(item=>item.id===roleId);const binding=bindings.find(item=>item.roleId===roleId);return {id:roleId,name:role?.name??roleId,source:binding?.source??'系统角色',validTo:binding?.validTo??'长期',status:binding?.status??role?.status??'启用'}});
  const policyScopes=state.policies.filter(item=>roleIds.has(item.roleId)&&item.effect==='允许').map(item=>item.dataScope);
  const delegations=state.delegations.filter(item=>item.subjectId===userId&&item.status==='生效');
  const dataScopes=[...new Set([...(user?.dataScopes??[]),...policyScopes,...delegations.map(item=>item.dataScope)])] as DataScopeLevel[];
  const userName=nameOfUser(userId);
  const recentDenials=state.decisions.filter(item=>item.subject===userName&&item.result==='拒绝').slice(0,5);
  return {userId,roles,dataScopes,delegations,recentDenials};
}

export function PlatformManagementProvider({children}:{children:ReactNode}){
  const [state,setState]=useState<ManagementState>(initial);
  const execute=(command:ManagementCommand):CommandResult=>{
    const auditId=`AUD-${Date.now().toString().slice(-7)}`;
    if(command.action==='delete'&&command.dependencies?.length){
      const result={ok:false,auditId,message:`删除被阻断：存在 ${command.dependencies.length} 项依赖。`,blockedBy:command.dependencies};
      setState(s=>({...s,audits:[{id:auditId,at:'刚刚',actor:command.actor,action:'拒绝删除',object:command.id??command.objectType,detail:result.message},...s.audits]}));
      return result;
    }
    const key=collection[command.objectType];
    if(!key)return {ok:false,auditId,message:`${command.objectType} 由专用注册中心维护，不能通过通用管理命令修改。`,blockedBy:['DedicatedRegistry']};
    setState(s=>{
      const list=s[key] as any[];
      let next=list;
      if(command.action==='create') next=[command.payload,...list];
      if(command.action==='update'||['disable','restore','archive','revoke'].includes(command.action)) next=list.map(item=>item.id===command.id?{...item,...command.payload}:item);
      if(command.action==='delete') next=list.filter(item=>item.id!==command.id);
      const actionText:Record<string,string>={create:'新增',update:'编辑',delete:'删除',disable:'停用',restore:'恢复',archive:'归档',approve:'审批',publish:'发布',revoke:'回收',delegate:'委派',read:'查看'};
      return {...s,[key]:next,audits:[{id:auditId,at:'刚刚',actor:command.actor,action:actionText[command.action]??command.action,object:command.id??command.payload?.id??command.objectType,detail:`${command.objectType}.${command.action} 已完成`},...s.audits]};
    });
    return {ok:true,auditId,message:`操作成功 · 审计 ID ${auditId}`,blockedBy:[]};
  };
  const applyRoleBindingChange=(input:RoleBindingChangeInput):PermissionChangeResult=>{
    const auditId=`AUD-${Date.now().toString().slice(-7)}`;
    const role=state.roles.find(item=>item.id===input.roleId);
    const subject=state.users.find(item=>item.id===input.subjectId);
    const reasons:string[]=[];
    const conflictIds:string[]=[];
    if(!role){reasons.push('目标角色不存在或已下架。')}
    if(role&&['高','极高'].includes(role.risk)&&input.actorRole!=='superadmin')reasons.push(`${role.risk}风险角色需要超级管理员复核。`);
    if(input.actorId===input.subjectId){reasons.push('授权人与被授权人相同，违反权限授予与使用分离。');conflictIds.push('CONFLICT-003')}
    if(subject?.roleIds.includes('ROLE-TRAINER')&&input.roleId==='ROLE-ADMIN'){reasons.push('Agent 编辑与生产发布权限组合需要职责分离复核。');conflictIds.push('CONFLICT-001')}
    if(reasons.length){
      const reviewItemId=`REVITEM-${Date.now().toString().slice(-7)}`;
      const reviewItem:ReviewItem={id:reviewItemId,reviewId:'REVIEW-PERMISSION-CHANGE',subjectId:input.subjectId,permission:`绑定角色 ${role?.name??input.roleId}`,lastUsed:'尚未生效',recommendation:'转交复核',status:'待复核',trigger:conflictIds.length?'职责冲突':'高风险授权',sourceId:auditId,requestedBy:input.actorName,targetRoleId:input.roleId,validTo:input.validTo,risk:role?.risk??'高',reasons,conflictIds};
      setState(current=>({...current,reviewItems:[reviewItem,...current.reviewItems],reviews:current.reviews.map(item=>item.id==='REVIEW-PERMISSION-CHANGE'?{...item,total:item.total+1}:item),conflictHits:[...conflictIds.map((ruleId,index):ConflictHit=>({id:`HIT-${Date.now().toString().slice(-6)}-${index}`,ruleId,subjectId:input.subjectId,objectId:reviewItemId,status:'例外审批中',at:'刚刚',resolution:'等待权限复核'})),...current.conflictHits],audits:[{id:auditId,at:'刚刚',actor:input.actorName,action:'提交权限复核',object:reviewItemId,detail:reasons.join('；')},...current.audits]}));
      return {outcome:'review_required',reviewItemId,reasons,auditId};
    }
    const bindingId=`BIND-${Date.now().toString().slice(-7)}`;
    const binding:RoleBinding={id:bindingId,subjectType:'用户',subjectId:input.subjectId,roleId:input.roleId,validFrom:'2026-08-09',validTo:input.validTo,source:input.source,status:'生效'};
    setState(current=>({...current,bindings:[binding,...current.bindings],roles:current.roles.map(item=>item.id===input.roleId?{...item,memberCount:item.memberCount+1}:item),audits:[{id:auditId,at:'刚刚',actor:input.actorName,action:'直接绑定角色',object:bindingId,detail:`${nameOfUser(input.subjectId)} · ${role?.name??input.roleId} · 至 ${input.validTo}`},...current.audits]}));
    return {outcome:'applied',bindingId,auditId};
  };
  const applyDelegationChange=(input:DelegationChangeInput):PermissionChangeResult=>{
    const auditId=`AUD-${Date.now().toString().slice(-7)}`;
    const reasons:string[]=[];
    const conflictIds:string[]=[];
    if(!input.objectTypes.length||!input.actions.length||!input.scopeTargets.length)reasons.push('对象类型、操作集合和目标范围必须完整。');
    if(input.actorId===input.subjectId){reasons.push('委派人与受委派人相同，需要职责分离复核。');conflictIds.push('CONFLICT-003')}
    if(['高','极高'].includes(input.riskCeiling)&&input.actorRole!=='superadmin')reasons.push(`${input.riskCeiling}风险委派需要超级管理员复核。`);
    if(['平台','全租户'].includes(input.dataScope)&&input.actorRole!=='superadmin')reasons.push('平台或全租户范围超出常规管理员委派边界。');
    const proposal:Omit<Delegation,'id'|'validFrom'|'status'>={subjectId:input.subjectId,objectTypes:input.objectTypes,actions:input.actions,dataScope:input.dataScope,scopeTargets:input.scopeTargets,validTo:input.validTo,riskCeiling:input.riskCeiling};
    if(reasons.length){
      const reviewItemId=`REVITEM-${Date.now().toString().slice(-7)}`;
      const reviewItem:ReviewItem={id:reviewItemId,reviewId:'REVIEW-PERMISSION-CHANGE',subjectId:input.subjectId,permission:`范围委派 ${input.objectTypes.join('、')}`,lastUsed:'尚未生效',recommendation:'转交复核',status:'待复核',trigger:conflictIds.length?'职责冲突':'越权委派',sourceId:auditId,requestedBy:input.actorName,validTo:input.validTo,risk:input.riskCeiling,reasons,conflictIds,proposedDelegation:proposal};
      setState(current=>({...current,reviewItems:[reviewItem,...current.reviewItems],reviews:current.reviews.map(item=>item.id==='REVIEW-PERMISSION-CHANGE'?{...item,total:item.total+1}:item),conflictHits:[...conflictIds.map((ruleId,index):ConflictHit=>({id:`HIT-${Date.now().toString().slice(-6)}-${index}`,ruleId,subjectId:input.subjectId,objectId:reviewItemId,status:'例外审批中',at:'刚刚',resolution:'等待权限复核'})),...current.conflictHits],audits:[{id:auditId,at:'刚刚',actor:input.actorName,action:'提交委派复核',object:reviewItemId,detail:reasons.join('；')},...current.audits]}));
      return {outcome:'review_required',reviewItemId,reasons,auditId};
    }
    const bindingId=`DEL-${Date.now().toString().slice(-7)}`;
    const delegation:Delegation={id:bindingId,...proposal,validFrom:'2026-08-09',status:'生效'};
    setState(current=>({...current,delegations:[delegation,...current.delegations],audits:[{id:auditId,at:'刚刚',actor:input.actorName,action:'直接范围委派',object:bindingId,detail:`${nameOfUser(input.subjectId)} · ${input.objectTypes.join('、')} · 至 ${input.validTo}`},...current.audits]}));
    return {outcome:'applied',bindingId,auditId};
  };
  const resolvePermissionReview=(input:{reviewItemId:string;decision:'approve'|'reject';actorName:string;actorRole:RoleId}):CommandResult=>{
    const auditId=`AUD-${Date.now().toString().slice(-7)}`;
    const item=state.reviewItems.find(candidate=>candidate.id===input.reviewItemId);
    if(!item)return {ok:false,auditId,message:'复核项不存在。',blockedBy:['ReviewItemMissing']};
    if(input.decision==='approve'&&item.risk&&['高','极高'].includes(item.risk)&&input.actorRole!=='superadmin')return {ok:false,auditId,message:'高风险授权只能由超级管理员批准。',blockedBy:['HighRiskNeedsSuperadmin']};
    const bindingId=`BIND-${Date.now().toString().slice(-7)}`;
    setState(current=>{
      const approved=input.decision==='approve';
      const binding:RoleBinding|undefined=approved&&item.targetRoleId?{id:bindingId,subjectType:'用户',subjectId:item.subjectId,roleId:item.targetRoleId,validFrom:'2026-08-09',validTo:item.validTo??'长期',source:'直接授权',status:'生效'}:undefined;
      const delegation:Delegation|undefined=approved&&item.proposedDelegation?{id:bindingId,...item.proposedDelegation,validFrom:'2026-08-09',status:'生效'}:undefined;
      const decision:DecisionLog={id:`DEC-${Date.now().toString().slice(-7)}`,at:'刚刚',subject:nameOfUser(item.subjectId),module:'M16 权限管理',action:item.proposedDelegation?'范围委派复核':'角色授权复核',resource:item.targetRoleId??item.permission,result:approved?'允许':'拒绝',dataScope:item.proposedDelegation?.dataScope??'平台',matchedPolicies:item.conflictIds?.length?item.conflictIds:['PermissionReview'],reason:approved?'复核通过，权限变更已生效':'复核驳回，实际权限未发生变化'};
      return {...current,bindings:binding?[binding,...current.bindings]:current.bindings,delegations:delegation?[delegation,...current.delegations]:current.delegations,roles:binding?current.roles.map(role=>role.id===binding.roleId?{...role,memberCount:role.memberCount+1}:role):current.roles,reviewItems:current.reviewItems.map(candidate=>candidate.id===item.id?{...candidate,status:approved?'已批准':'已驳回'}:candidate),reviews:current.reviews.map(review=>review.id===item.reviewId?{...review,reviewed:Math.min(review.total,review.reviewed+1)}:review),conflictHits:current.conflictHits.map(hit=>hit.objectId===item.id?{...hit,status:'已解决',resolution:approved?'超级管理员批准例外':'授权变更已驳回'}:hit),decisions:[decision,...current.decisions],audits:[{id:auditId,at:'刚刚',actor:input.actorName,action:approved?'批准权限变更':'驳回权限变更',object:item.id,detail:decision.reason},...current.audits]};
    });
    return {ok:true,auditId,message:input.decision==='approve'?`复核通过，绑定 ${bindingId} 已生效。`:'复核已驳回，未改变实际权限。',blockedBy:[]};
  };
  const value=useMemo(()=>({state,setState,execute,applyRoleBindingChange,applyDelegationChange,resolvePermissionReview}),[state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePlatformManagement(){const value=useContext(Context);if(!value)throw new Error('PlatformManagementProvider missing');return value}
