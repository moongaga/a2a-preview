import type { RoleId } from '../../types';
import { conflictSeed, policySeed, roleIdForSystemRole, type DataScopeLevel, type PermissionPolicy } from './platform-data';

export interface AccessDecisionInput {
  role:RoleId;
  accountStatus?:'正常'|'锁定'|'停用';
  moduleId:string;
  action:string;
  requestedScope?:DataScopeLevel;
  grantedScope?:DataScopeLevel;
  temporaryValidTo?:string;
  permissionPair?:[string,string];
}

export interface AccessDecision { allowed:boolean; reason:string; matchedPolicies:string[]; dataScope:DataScopeLevel; auditId:string }

const scopeOrder:DataScopeLevel[] = ['本人','项目','部门','组织','租户','平台','全租户'];
const defaultScope:Record<RoleId,DataScopeLevel> = { employee:'本人',business:'组织',trainer:'部门',admin:'平台',superadmin:'全租户',client:'租户' };
const actionMatches=(policy:PermissionPolicy,action:string)=>policy.actions.includes('*')||policy.actions.includes(action);

export function decideAccess(input:AccessDecisionInput):AccessDecision {
  const auditId=`DEC-${Date.now().toString().slice(-6)}`;
  const scope=input.grantedScope??defaultScope[input.role];
  const roleId=roleIdForSystemRole(input.role);
  const policies=policySeed.filter(item=>item.roleId===roleId&&(item.moduleId==='*'||item.moduleId===input.moduleId)&&actionMatches(item,input.action));
  const reject=(reason:string,matchedPolicies:string[]=policies.map(item=>item.id)):AccessDecision=>({allowed:false,reason,matchedPolicies,dataScope:scope,auditId});
  if(input.accountStatus==='停用') return reject('账号已停用，所有会话与授权均已回收。');
  if(input.accountStatus==='锁定') return reject('账号已锁定，需要平台管理员完成解锁。');
  if(input.temporaryValidTo&&input.temporaryValidTo<'2026-08-06') return reject('授权已过期，请重新申请。');
  if(input.requestedScope&&scopeOrder.indexOf(input.requestedScope)>scopeOrder.indexOf(scope)) return reject(`数据范围越界：当前仅允许${scope}范围。`);
  if(input.permissionPair){
    const conflict=conflictSeed.find(item=>item.status==='启用'&&item.leftPermission===input.permissionPair?.[0]&&item.rightPermission===input.permissionPair?.[1]);
    if(conflict) return reject(`职责冲突：${conflict.name}，需要${conflict.handling==='阻断'?'取消冲突权限':'双人复核'}。`,[conflict.id]);
  }
  const explicitDeny=policies.find(item=>item.effect==='显式拒绝');
  if(explicitDeny) return reject(`显式拒绝策略 ${explicitDeny.id} 命中。`,[explicitDeny.id]);
  const allow=policies.find(item=>item.effect==='允许');
  if(allow) return {allowed:true,reason:'角色、操作与数据范围均匹配。',matchedPolicies:[allow.id],dataScope:scope,auditId};
  if(['platform-foundation','access-control'].includes(input.moduleId)) return reject('当前角色无权访问平台管理模块。');
  return reject(`当前角色无“${input.action}”操作权限。`);
}
