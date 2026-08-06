import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  auditSeed,bindingSeed,budgetSeed,configSeed,conflictHitSeed,conflictSeed,decisionSeed,delegationSeed,
  organizationSeed,policySeed,positionSeed,reportingSeed,requestSeed,reviewItemSeed,reviewSeed,roleSeed,userSeed,
  type AccessRequest,type AccessReview,type AuditItem,type BudgetPolicy,type ConflictHit,type ConflictRule,type DecisionLog,type Delegation,type OrganizationUnit,type PermissionPolicy,type PlatformConfig,type Position,type ReportingRelation,type ReviewItem,type Role,type RoleBinding,type UserAccount,
} from './platform-data';
import type { ManagementAction, ManagementObjectType } from './management-capability';

export interface ManagementState {
  organizations:OrganizationUnit[]; positions:Position[]; users:UserAccount[]; reporting:ReportingRelation[];
  configs:PlatformConfig[]; budgets:BudgetPolicy[]; roles:Role[]; policies:PermissionPolicy[];
  requests:AccessRequest[]; conflicts:ConflictRule[]; conflictHits:ConflictHit[]; reviews:AccessReview[];
  reviewItems:ReviewItem[]; decisions:DecisionLog[]; delegations:Delegation[]; bindings:RoleBinding[]; audits:AuditItem[];
}
export interface CommandResult { ok:boolean; auditId:string; message:string; blockedBy:string[] }
export interface ManagementCommand { objectType:ManagementObjectType; action:ManagementAction; id?:string; payload?:any; actor:string; dependencies?:string[] }

const initial:ManagementState={organizations:organizationSeed,positions:positionSeed,users:userSeed,reporting:reportingSeed,configs:configSeed,budgets:budgetSeed,roles:roleSeed,policies:policySeed,requests:requestSeed,conflicts:conflictSeed,conflictHits:conflictHitSeed,reviews:reviewSeed,reviewItems:reviewItemSeed,decisions:decisionSeed,delegations:delegationSeed,bindings:bindingSeed,audits:auditSeed};
const collection:Record<ManagementObjectType,keyof ManagementState>={organization:'organizations',position:'positions',user:'users',reporting:'reporting',config:'configs',budget:'budgets',role:'roles',policy:'policies',scope:'policies',request:'requests',conflict:'conflicts',review:'reviews',decision:'decisions'};

const Context=createContext<null|{state:ManagementState;setState:React.Dispatch<React.SetStateAction<ManagementState>>;execute:(command:ManagementCommand)=>CommandResult}>(null);

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
  const value=useMemo(()=>({state,setState,execute}),[state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePlatformManagement(){const value=useContext(Context);if(!value)throw new Error('PlatformManagementProvider missing');return value}
