import type { RoleId } from '../../types';
import type { DataScopeLevel, RiskLevel } from './platform-data';

export type ManagementObjectType = 'organization'|'position'|'user'|'reporting'|'config'|'budget'|'modelConnection'|'modelVersion'|'pricing'|'supplierBill'|'reconciliation'|'budgetPolicy'|'role'|'policy'|'scope'|'review'|'decision';
export type ManagementAction = 'create'|'read'|'update'|'delete'|'disable'|'restore'|'archive'|'approve'|'publish'|'revoke'|'delegate';

export interface ManagementCapability {
  subjectId:string;
  objectType:ManagementObjectType|'*';
  actions:(ManagementAction|'*')[];
  dataScope:DataScopeLevel;
  scopeTargets:string[];
  validFrom:string;
  validTo:string;
  riskCeiling:RiskLevel;
  source:'系统角色'|'直接委派'|'岗位继承'|'组织继承'|'临时申请';
}

export interface ManageableObject {
  id:string;
  objectType:ManagementObjectType;
  ownerId?:string;
  organizationId?:string;
  tenantId?:string;
  status?:string;
  risk?:RiskLevel;
  protected?:boolean;
  dependencies?:string[];
}

export interface ManagementContext { role:RoleId; userId:string; accountStatus?:'正常'|'锁定'|'停用'; now?:string }
export interface ManagementDecision { allowed:boolean; reason:string; auditId:string; capability?:ManagementCapability; blockedBy:string[] }

const rank:Record<RiskLevel,number>={低:0,中:1,高:2,极高:3};
const allActions:ManagementAction[]=['create','read','update','delete','disable','restore','archive','approve','publish','revoke','delegate'];
const allTypes:ManagementObjectType[]=['organization','position','user','reporting','config','budget','modelConnection','modelVersion','pricing','supplierBill','reconciliation','budgetPolicy','role','policy','scope','review','decision'];

const systemCapabilities:ManagementCapability[]=[
  {subjectId:'USR-SUPER',objectType:'*',actions:['*'],dataScope:'全租户',scopeTargets:['*'],validFrom:'2026-01-01',validTo:'长期',riskCeiling:'极高',source:'系统角色'},
  ...allTypes.map(objectType=>({subjectId:'USR-ADMIN',objectType,actions:objectType==='decision'?['read'] as ManagementAction[]:allActions,dataScope:'平台' as DataScopeLevel,scopeTargets:['TENANT-AIMP'],validFrom:'2026-01-01',validTo:'长期',riskCeiling:'高' as RiskLevel,source:'系统角色' as const})),
  ...(['organization','position','user','reporting','budget'] as ManagementObjectType[]).map(objectType=>({subjectId:'USR-BIZ',objectType,actions:['create','read','update','delete','disable','restore','archive'] as ManagementAction[],dataScope:'组织' as DataScopeLevel,scopeTargets:['ORG-LEAD','ORG-LEAD-CULTIVATE','ORG-CFT-LEAD'],validFrom:'2026-08-01',validTo:'2026-12-31',riskCeiling:'中' as RiskLevel,source:'直接委派' as const})),
  ...(['review','decision'] as ManagementObjectType[]).map(objectType=>({subjectId:'USR-BIZ',objectType,actions:['read'] as ManagementAction[],dataScope:'组织' as DataScopeLevel,scopeTargets:['ORG-LEAD','ORG-LEAD-CULTIVATE','ORG-CFT-LEAD','USR-BIZ'],validFrom:'2026-08-01',validTo:'2026-12-31',riskCeiling:'中' as RiskLevel,source:'直接委派' as const})),
  ...(['config','budget','review','decision','modelConnection','modelVersion'] as ManagementObjectType[]).map(objectType=>({subjectId:'USR-TRAINER',objectType,actions:['read'] as ManagementAction[],dataScope:'部门' as DataScopeLevel,scopeTargets:['ORG-CAPABILITY','USR-TRAINER'],validFrom:'2026-08-01',validTo:'2026-10-31',riskCeiling:'中' as RiskLevel,source:'直接委派' as const})),
  {subjectId:'USR-EMP',objectType:'user',actions:['read'],dataScope:'本人',scopeTargets:['USR-EMP'],validFrom:'2026-01-01',validTo:'长期',riskCeiling:'低',source:'系统角色'},
  {subjectId:'USR-EMP',objectType:'decision',actions:['read'],dataScope:'本人',scopeTargets:['USR-EMP'],validFrom:'2026-01-01',validTo:'长期',riskCeiling:'低',source:'系统角色'},
];

export const managementCapabilities = systemCapabilities;
export const roleUserId:Record<RoleId,string>={employee:'USR-EMP',business:'USR-BIZ',trainer:'USR-TRAINER',admin:'USR-ADMIN',superadmin:'USR-SUPER',client:'USR-CLIENT'};

export function getManagementDecision(context:ManagementContext,object:ManageableObject,action:ManagementAction):ManagementDecision {
  const auditId=`MDEC-${Date.now().toString().slice(-7)}`;
  const reject=(reason:string,blockedBy:string[]=[]):ManagementDecision=>({allowed:false,reason,auditId,blockedBy});
  if(context.role==='client') return reject('客户管理员无权访问内部平台管理。',['InternalPlatformBoundary']);
  if(context.accountStatus==='停用'||context.accountStatus==='锁定') return reject(`账号${context.accountStatus}，不能执行管理操作。`,['AccountStatus']);
  if(object.protected&&context.role!=='superadmin'&&['update','delete','disable','archive'].includes(action)) return reject('系统内置角色定义仅允许超级管理员维护；成员授权仍需经过风险与冲突校验。',['ProtectedObject']);
  if(action==='delete'&&object.protected) return reject('系统根对象或最高权限对象受保护，不能删除。',['RootObjectProtected']);
  if(action==='publish'&&object.risk==='高'&&context.role!=='superadmin') return reject('高风险配置必须由超级管理员审批发布。',['HighRiskNeedsSuperadmin']);
  if(action==='delete'&&object.dependencies?.length) return reject(`存在 ${object.dependencies.length} 项依赖，不能删除。`,object.dependencies);
  if(object.objectType==='decision'&&action!=='read') return reject('权限决策日志为不可修改审计证据。',['ImmutableAudit']);
  const now=context.now??'2026-08-06';
  const candidates=systemCapabilities.filter(cap=>cap.subjectId===context.userId&&(cap.objectType==='*'||cap.objectType===object.objectType)&&(cap.actions.includes('*')||cap.actions.includes(action))&&(cap.validTo==='长期'||cap.validTo>=now));
  for(const cap of candidates){
    if(object.risk&&rank[object.risk]>rank[cap.riskCeiling]) continue;
    if(cap.scopeTargets.includes('*')) return {allowed:true,reason:'超级管理员全租户能力命中。',auditId,capability:cap,blockedBy:[]};
    if(cap.dataScope==='本人'&&(object.ownerId===context.userId||object.id===context.userId)) return {allowed:true,reason:'本人范围能力命中。',auditId,capability:cap,blockedBy:[]};
    if(cap.dataScope==='平台'&&(object.tenantId==='TENANT-AIMP'||!object.tenantId)) return {allowed:true,reason:'平台管辖范围能力命中。',auditId,capability:cap,blockedBy:[]};
    if(object.organizationId&&cap.scopeTargets.includes(object.organizationId)) return {allowed:true,reason:`受委派${cap.dataScope}范围能力命中。`,auditId,capability:cap,blockedBy:[]};
    if(object.ownerId&&cap.scopeTargets.includes(object.ownerId)) return {allowed:true,reason:'受委派对象能力命中。',auditId,capability:cap,blockedBy:[]};
  }
  return reject(`当前身份没有 ${object.objectType}.${action} 权限，或对象超出委派范围。`,['CapabilityOrScope']);
}

export function canSeeManagementModule(role:RoleId,module:'M15'|'M16') {
  if(role==='client') return false;
  const userId=roleUserId[role];
  return systemCapabilities.some(cap=>cap.subjectId===userId&&(cap.objectType==='*'||(module==='M15'?['organization','position','user','reporting','config','budget'].includes(cap.objectType):['role','policy','scope','review','decision'].includes(cap.objectType))));
}
