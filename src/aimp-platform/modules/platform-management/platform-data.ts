import type { RoleId } from '../../types';

export type RecordStatus = '草稿' | '启用' | '停用' | '归档';
export type DataScopeLevel = '本人' | '项目' | '部门' | '组织' | '租户' | '平台' | '全租户';
export type AccessRequestStatus = '草稿' | '待审批' | '审批中' | '已生效' | '已驳回' | '已撤回' | '已到期' | '已回收';
export type RiskLevel = '低' | '中' | '高' | '极高';

export interface TenantProfile { id:string; name:string; status:'启用'|'停用'; defaultOrganizationId:string; contact:string }
export interface OrganizationUnit { id:string; tenantId:string; name:string; type:'集团'|'中心'|'部门'|'科室'|'虚拟CFT'; parentId:string|null; status:RecordStatus; managerId:string; reportingSystem:'DNDC'|'营销总部'|'平台治理'; userCount:number; childCount:number; policyRefs:number }
export interface Position { id:string; organizationId:string; name:string; levelSystem:'DNDC'|'营销总部'|'平台治理'; level:string; duties:string[]; status:RecordStatus; userCount:number }
export interface UserAccount { id:string; name:string; account:string; status:'正常'|'锁定'|'停用'; tenantId:string; primaryOrganizationId:string; primaryPositionId:string; assignments:string[]; roleIds:string[]; dataScopes:DataScopeLevel[]; lastLogin:string; openTasks:number; pendingApprovals:number }
export interface ReportingRelation { id:string; subjectId:string; relationType:'原组织上级'|'挂职上级'|'CFT 负责人'|'流程审批人'; leaderId:string; effectiveFrom:string; effectiveTo:string; reportingSystem:'DNDC'|'营销总部'|'平台治理' }
export interface PlatformConfig { id:string; category:'模型供应商'|'模型路由'|'系统参数'|'业务字典'|'通知模板'|'配额预算'; name:string; currentVersion:string; draftVersion?:string; status:'已发布'|'草稿'|'待审批'|'发布失败'|'已回滚'; risk:RiskLevel; owner:string; updatedAt:string; impactModules:string[]; gateEvidence?:string }
export interface Role { id:string; name:string; kind:'系统内置'|'自定义'; risk:RiskLevel; status:RecordStatus; memberCount:number; description:string; systemRole?:RoleId }
export interface PermissionPolicy { id:string; roleId:string; moduleId:string; moduleName:string; page:string; actions:string[]; fields:string[]; effect:'允许'|'显式拒绝'; dataScope:DataScopeLevel; risk:RiskLevel }
export interface RoleBinding { id:string; subjectType:'用户'|'岗位'|'组织'; subjectId:string; roleId:string; validFrom:string; validTo:string; source:'直接授权'|'岗位继承'|'组织继承'|'临时申请'; status:'生效'|'到期'|'回收' }
export interface AccessRequest { id:string; applicantId:string; applicantName:string; targetRoleId:string; permission:string; dataScope:DataScopeLevel; scopeTarget:string; reason:string; temporary:boolean; validTo:string; risk:RiskLevel; status:AccessRequestStatus; approvers:string[]; conflictIds:string[]; createdAt:string }
export interface ConflictRule { id:string; name:string; leftPermission:string; rightPermission:string; risk:RiskLevel; handling:'阻断'|'例外审批'; hitCount:number; status:'启用'|'停用' }
export interface AccessReview { id:string; name:string; scope:string; owner:string; dueAt:string; status:'待开始'|'进行中'|'已完成'; total:number; reviewed:number; revokeSuggested:number }
export interface DecisionLog { id:string; at:string; subject:string; module:string; action:string; resource:string; result:'允许'|'拒绝'; dataScope:DataScopeLevel; matchedPolicies:string[]; reason:string }
export interface AuditItem { id:string; at:string; actor:string; action:string; object:string; detail:string }
export interface BudgetPolicy { id:string; organizationId:string; name:string; period:string; quota:number; used:number; threshold:number; status:RecordStatus; ownerId:string; alerts:number }
export interface Delegation { id:string; subjectId:string; objectTypes:string[]; actions:string[]; dataScope:DataScopeLevel; scopeTargets:string[]; validFrom:string; validTo:string; riskCeiling:RiskLevel; status:'生效'|'到期'|'回收' }
export interface ConflictHit { id:string; ruleId:string; subjectId:string; objectId:string; status:'待整改'|'例外审批中'|'已解决'; at:string; resolution:string }
export interface ReviewItem { id:string; reviewId:string; subjectId:string; permission:string; lastUsed:string; recommendation:'保留'|'回收'|'转交复核'; status:'待复核'|'已保留'|'已回收'|'已转交' }

export const tenantSeed:TenantProfile[] = [
  { id:'TENANT-AIMP', name:'AIMP 内部平台', status:'启用', defaultOrganizationId:'ORG-AIMP', contact:'顾川' },
  { id:'TENANT-BRAND-A', name:'品牌方 A', status:'启用', defaultOrganizationId:'ORG-BRAND-A', contact:'王琳' },
];

export const organizationSeed:OrganizationUnit[] = [
  { id:'ORG-AIMP',tenantId:'TENANT-AIMP',name:'AIMP 平台',type:'集团',parentId:null,status:'启用',managerId:'USR-SUPER',reportingSystem:'平台治理',userCount:32,childCount:2,policyRefs:8 },
  { id:'ORG-DNDC',tenantId:'TENANT-AIMP',name:'DNDC',type:'集团',parentId:'ORG-AIMP',status:'启用',managerId:'USR-BIZ',reportingSystem:'DNDC',userCount:780,childCount:5,policyRefs:12 },
  { id:'ORG-LEAD',tenantId:'TENANT-AIMP',name:'线索中心',type:'中心',parentId:'ORG-DNDC',status:'启用',managerId:'USR-BIZ',reportingSystem:'DNDC',userCount:186,childCount:4,policyRefs:6 },
  { id:'ORG-LEAD-CULTIVATE',tenantId:'TENANT-AIMP',name:'客户培育室',type:'科室',parentId:'ORG-LEAD',status:'启用',managerId:'USR-MANAGER',reportingSystem:'DNDC',userCount:42,childCount:0,policyRefs:3 },
  { id:'ORG-CAPABILITY',tenantId:'TENANT-AIMP',name:'数字营销能力中台',type:'中心',parentId:'ORG-DNDC',status:'启用',managerId:'USR-ADMIN',reportingSystem:'DNDC',userCount:95,childCount:4,policyRefs:14 },
  { id:'ORG-MKT-HQ',tenantId:'TENANT-AIMP',name:'营销总部',type:'集团',parentId:'ORG-AIMP',status:'启用',managerId:'USR-MKT',reportingSystem:'营销总部',userCount:128,childCount:3,policyRefs:4 },
  { id:'ORG-CFT-LEAD',tenantId:'TENANT-AIMP',name:'线索融合 CFT',type:'虚拟CFT',parentId:'ORG-AIMP',status:'启用',managerId:'USR-BIZ',reportingSystem:'平台治理',userCount:18,childCount:0,policyRefs:5 },
];

export const positionSeed:Position[] = [
  { id:'POS-LEAD-DIRECTOR',organizationId:'ORG-LEAD',name:'线索中心总监',levelSystem:'DNDC',level:'总监',duties:['经营目标','资源协调','重大审批'],status:'启用',userCount:1 },
  { id:'POS-CULTIVATE',organizationId:'ORG-LEAD-CULTIVATE',name:'客户培育顾问',levelSystem:'DNDC',level:'员工',duties:['线索培育','结果回写'],status:'启用',userCount:28 },
  { id:'POS-TRAINER',organizationId:'ORG-CAPABILITY',name:'AI 训练师',levelSystem:'DNDC',level:'经理',duties:['Agent训练','知识与Prompt治理'],status:'启用',userCount:10 },
  { id:'POS-ADMIN',organizationId:'ORG-CAPABILITY',name:'平台运行管理员',levelSystem:'DNDC',level:'经理',duties:['平台配置','账号与权限运营'],status:'启用',userCount:6 },
  { id:'POS-MKT-CHIEF',organizationId:'ORG-MKT-HQ',name:'线索业务科长',levelSystem:'营销总部',level:'科长',duties:['业务需求','总部审批'],status:'启用',userCount:1 },
];

export const userSeed:UserAccount[] = [
  { id:'USR-EMP',name:'陈屿',account:'chenyu',status:'正常',tenantId:'TENANT-AIMP',primaryOrganizationId:'ORG-LEAD-CULTIVATE',primaryPositionId:'POS-CULTIVATE',assignments:['ORG-CFT-LEAD'],roleIds:['ROLE-EMPLOYEE'],dataScopes:['本人','项目'],lastLogin:'10分钟前',openTasks:5,pendingApprovals:0 },
  { id:'USR-BIZ',name:'李沐',account:'limu',status:'正常',tenantId:'TENANT-AIMP',primaryOrganizationId:'ORG-LEAD',primaryPositionId:'POS-LEAD-DIRECTOR',assignments:['ORG-CFT-LEAD'],roleIds:['ROLE-BUSINESS'],dataScopes:['组织','项目'],lastLogin:'2分钟前',openTasks:3,pendingApprovals:6 },
  { id:'USR-TRAINER',name:'周芮',account:'zhourui',status:'正常',tenantId:'TENANT-AIMP',primaryOrganizationId:'ORG-CAPABILITY',primaryPositionId:'POS-TRAINER',assignments:['ORG-CFT-LEAD'],roleIds:['ROLE-TRAINER'],dataScopes:['部门','项目'],lastLogin:'在线',openTasks:8,pendingApprovals:1 },
  { id:'USR-ADMIN',name:'赵岑',account:'zhaocen',status:'正常',tenantId:'TENANT-AIMP',primaryOrganizationId:'ORG-CAPABILITY',primaryPositionId:'POS-ADMIN',assignments:[],roleIds:['ROLE-ADMIN'],dataScopes:['平台'],lastLogin:'在线',openTasks:4,pendingApprovals:9 },
  { id:'USR-SUPER',name:'顾川',account:'guchuan',status:'正常',tenantId:'TENANT-AIMP',primaryOrganizationId:'ORG-AIMP',primaryPositionId:'POS-ADMIN',assignments:[],roleIds:['ROLE-SUPERADMIN'],dataScopes:['全租户'],lastLogin:'在线',openTasks:2,pendingApprovals:4 },
  { id:'USR-LOCKED',name:'孙浩然',account:'sunhaoran',status:'锁定',tenantId:'TENANT-AIMP',primaryOrganizationId:'ORG-CAPABILITY',primaryPositionId:'POS-TRAINER',assignments:[],roleIds:['ROLE-TRAINER'],dataScopes:['部门'],lastLogin:'3天前',openTasks:0,pendingApprovals:0 },
];

export const reportingSeed:ReportingRelation[] = [
  { id:'REL-001',subjectId:'USR-EMP',relationType:'原组织上级',leaderId:'USR-MANAGER',effectiveFrom:'2026-01-01',effectiveTo:'长期',reportingSystem:'DNDC' },
  { id:'REL-002',subjectId:'USR-EMP',relationType:'CFT 负责人',leaderId:'USR-BIZ',effectiveFrom:'2026-07-01',effectiveTo:'2026-12-31',reportingSystem:'平台治理' },
  { id:'REL-003',subjectId:'USR-BIZ',relationType:'挂职上级',leaderId:'USR-MKT',effectiveFrom:'2026-07-01',effectiveTo:'2026-12-31',reportingSystem:'营销总部' },
  { id:'REL-004',subjectId:'USR-TRAINER',relationType:'流程审批人',leaderId:'USR-ADMIN',effectiveFrom:'2026-01-01',effectiveTo:'长期',reportingSystem:'平台治理' },
];

export const configSeed:PlatformConfig[] = [
  { id:'CFG-MODEL-ROUTE',category:'模型路由',name:'生产 Agent 默认模型路由',currentVersion:'v3.2',draftVersion:'v3.3',status:'待审批',risk:'高',owner:'赵岑',updatedAt:'20分钟前',impactModules:['M03','M08','M13'],gateEvidence:'M11-GATE-8821' },
  { id:'CFG-PROVIDER',category:'模型供应商',name:'OpenAI 生产供应商连接',currentVersion:'v2.1',status:'已发布',risk:'高',owner:'顾川',updatedAt:'昨天',impactModules:['M03','M13'] },
  { id:'CFG-DICT',category:'业务字典',name:'异常优先级字典',currentVersion:'v1.8',draftVersion:'v1.9',status:'草稿',risk:'低',owner:'赵岑',updatedAt:'1小时前',impactModules:['M12'] },
  { id:'CFG-NOTIFY',category:'通知模板',name:'权限到期提醒模板',currentVersion:'v1.3',status:'已发布',risk:'低',owner:'赵岑',updatedAt:'3天前',impactModules:['M16'] },
  { id:'CFG-BUDGET',category:'配额预算',name:'能力中台月度 Token 预算',currentVersion:'2026.08',status:'已发布',risk:'中',owner:'李沐',updatedAt:'今天',impactModules:['M02','M15'] },
];

export const roleSeed:Role[] = [
  { id:'ROLE-EMPLOYEE',name:'员工',kind:'系统内置',risk:'低',status:'启用',memberCount:612,description:'本人及授权项目范围',systemRole:'employee' },
  { id:'ROLE-BUSINESS',name:'业务负责人',kind:'系统内置',risk:'中',status:'启用',memberCount:38,description:'组织经营与流程审批',systemRole:'business' },
  { id:'ROLE-TRAINER',name:'AI 训练师',kind:'系统内置',risk:'中',status:'启用',memberCount:26,description:'Agent能力训练与治理',systemRole:'trainer' },
  { id:'ROLE-ADMIN',name:'平台管理员',kind:'系统内置',risk:'高',status:'启用',memberCount:8,description:'平台运行与常规权限运营',systemRole:'admin' },
  { id:'ROLE-SUPERADMIN',name:'超级管理员',kind:'系统内置',risk:'极高',status:'启用',memberCount:2,description:'全平台最高治理权限',systemRole:'superadmin' },
  { id:'ROLE-LEAD-QA',name:'线索质量复核员',kind:'自定义',risk:'中',status:'启用',memberCount:12,description:'线索质量抽检与复核' },
];

export const policySeed:PermissionPolicy[] = [
  { id:'POL-ADMIN-M15',roleId:'ROLE-ADMIN',moduleId:'platform-foundation',moduleName:'M15 基础管理',page:'全部页面',actions:['查看','新增','编辑','停用','发布常规配置'],fields:['常规字段'],effect:'允许',dataScope:'平台',risk:'高' },
  { id:'POL-ADMIN-M16',roleId:'ROLE-ADMIN',moduleId:'access-control',moduleName:'M16 权限管理',page:'角色与授权',actions:['查看','配置普通权限','审批低风险','回收'],fields:['非系统最高权限'],effect:'允许',dataScope:'平台',risk:'高' },
  { id:'POL-SUPER-ALL',roleId:'ROLE-SUPERADMIN',moduleId:'*',moduleName:'全平台',page:'全部页面',actions:['*'],fields:['*'],effect:'允许',dataScope:'全租户',risk:'极高' },
  { id:'POL-DENY-EXPORT',roleId:'ROLE-ADMIN',moduleId:'access-control',moduleName:'M16 权限管理',page:'决策日志',actions:['导出全租户'],fields:['敏感字段'],effect:'显式拒绝',dataScope:'全租户',risk:'极高' },
  { id:'POL-TRAINER-M03',roleId:'ROLE-TRAINER',moduleId:'agent-management',moduleName:'M03 Agent 管理',page:'Agent工作台',actions:['查看','编辑','测试'],fields:['能力配置'],effect:'允许',dataScope:'部门',risk:'中' },
];

export const bindingSeed:RoleBinding[] = [
  { id:'BIND-001',subjectType:'用户',subjectId:'USR-ADMIN',roleId:'ROLE-ADMIN',validFrom:'2026-01-01',validTo:'长期',source:'直接授权',status:'生效' },
  { id:'BIND-002',subjectType:'用户',subjectId:'USR-TRAINER',roleId:'ROLE-TRAINER',validFrom:'2026-01-01',validTo:'长期',source:'岗位继承',status:'生效' },
];

export const requestSeed:AccessRequest[] = [
  { id:'AR-2026-0088',applicantId:'USR-TRAINER',applicantName:'周芮',targetRoleId:'ROLE-ADMIN',permission:'M06 知识分类删除',dataScope:'部门',scopeTarget:'数字营销能力中台',reason:'季度知识分类治理',temporary:true,validTo:'2026-08-31',risk:'高',status:'审批中',approvers:['赵岑','顾川'],conflictIds:['CONFLICT-002'],createdAt:'10:20' },
  { id:'AR-2026-0087',applicantId:'USR-EMP',applicantName:'陈屿',targetRoleId:'ROLE-LEAD-QA',permission:'线索质量复核',dataScope:'项目',scopeTarget:'PJ-LEAD-Q3-02',reason:'参与本周线索抽检',temporary:true,validTo:'2026-08-12',risk:'低',status:'待审批',approvers:['李沐'],conflictIds:[],createdAt:'09:40' },
  { id:'AR-2026-0081',applicantId:'USR-BIZ',applicantName:'李沐',targetRoleId:'ROLE-ADMIN',permission:'M08 工作流发布',dataScope:'组织',scopeTarget:'线索中心',reason:'线索工作流灰度发布',temporary:true,validTo:'2026-08-15',risk:'中',status:'已生效',approvers:['赵岑'],conflictIds:[],createdAt:'昨天' },
];

export const conflictSeed:ConflictRule[] = [
  { id:'CONFLICT-001',name:'开发与生产发布职责分离',leftPermission:'Agent/工作流编辑',rightPermission:'生产发布',risk:'高',handling:'例外审批',hitCount:3,status:'启用' },
  { id:'CONFLICT-002',name:'知识分类维护与删除审批分离',leftPermission:'知识分类编辑',rightPermission:'知识分类删除',risk:'高',handling:'阻断',hitCount:1,status:'启用' },
  { id:'CONFLICT-003',name:'权限申请与审批分离',leftPermission:'提交本人授权申请',rightPermission:'审批本人申请',risk:'极高',handling:'阻断',hitCount:0,status:'启用' },
];

export const reviewSeed:AccessReview[] = [
  { id:'REVIEW-Q3-PLATFORM',name:'Q3 平台高权限复核',scope:'平台管理员与超级管理员',owner:'顾川',dueAt:'2026-08-15',status:'进行中',total:18,reviewed:11,revokeSuggested:2 },
  { id:'REVIEW-TEMP-AUG',name:'8月临时授权到期复核',scope:'全部临时授权',owner:'赵岑',dueAt:'2026-08-31',status:'待开始',total:36,reviewed:0,revokeSuggested:5 },
];

export const decisionSeed:DecisionLog[] = [
  { id:'DEC-88201',at:'10:48:21',subject:'周芮',module:'M06 知识库',action:'删除三级分类',resource:'内容中心/售前活动',result:'拒绝',dataScope:'部门',matchedPolicies:['POL-TRAINER-M06','CONFLICT-002'],reason:'职责冲突：知识分类维护与删除审批分离' },
  { id:'DEC-88200',at:'10:45:03',subject:'赵岑',module:'M12 异常中心',action:'标记已解决',resource:'INC-2026-0710',result:'允许',dataScope:'平台',matchedPolicies:['POL-ADMIN-M12'],reason:'角色、操作与平台范围均匹配' },
  { id:'DEC-88199',at:'10:41:12',subject:'陈屿',module:'M03 Agent 管理',action:'编辑 Agent',resource:'AGENT-LEAD-03',result:'拒绝',dataScope:'项目',matchedPolicies:['ROLE-EMPLOYEE'],reason:'当前角色无 Agent 编辑权限' },
];

export const auditSeed:AuditItem[] = [
  { id:'AUD-901',at:'10:20',actor:'周芮',action:'提交授权申请',object:'AR-2026-0088',detail:'申请知识分类删除临时权限' },
  { id:'AUD-900',at:'09:30',actor:'赵岑',action:'创建配置草稿',object:'CFG-DICT v1.9',detail:'新增 P0-S 安全事件优先级' },
];

export const budgetSeed:BudgetPolicy[] = [
  { id:'BUDGET-CAP-202608',organizationId:'ORG-CAPABILITY',name:'能力中台月度 Token 预算',period:'2026-08',quota:5000000,used:2580000,threshold:80,status:'启用',ownerId:'USR-ADMIN',alerts:1 },
  { id:'BUDGET-LEAD-202608',organizationId:'ORG-LEAD',name:'线索中心 Agent 调用预算',period:'2026-08',quota:3200000,used:2260000,threshold:75,status:'启用',ownerId:'USR-BIZ',alerts:2 },
];

export const delegationSeed:Delegation[] = [
  { id:'DEL-LEAD-OPS',subjectId:'USR-BIZ',objectTypes:['organization','position','user','reporting','budget'],actions:['create','read','update','delete','disable','restore','archive'],dataScope:'组织',scopeTargets:['ORG-LEAD','ORG-LEAD-CULTIVATE','ORG-CFT-LEAD'],validFrom:'2026-08-01',validTo:'2026-12-31',riskCeiling:'中',status:'生效' },
  { id:'DEL-CAP-OPS',subjectId:'USR-TRAINER',objectTypes:['config','budget','request','review','decision'],actions:['create','read','update','delete','disable','restore','archive'],dataScope:'部门',scopeTargets:['ORG-CAPABILITY'],validFrom:'2026-08-01',validTo:'2026-10-31',riskCeiling:'中',status:'生效' },
];

export const conflictHitSeed:ConflictHit[] = [
  { id:'HIT-2026-081',ruleId:'CONFLICT-002',subjectId:'USR-TRAINER',objectId:'AR-2026-0088',status:'待整改',at:'10:20',resolution:'等待移除知识分类编辑与删除的组合授权' },
];

export const reviewItemSeed:ReviewItem[] = [
  { id:'REVITEM-001',reviewId:'REVIEW-Q3-PLATFORM',subjectId:'USR-ADMIN',permission:'M16 低风险授权审批',lastUsed:'今天',recommendation:'保留',status:'待复核' },
  { id:'REVITEM-002',reviewId:'REVIEW-Q3-PLATFORM',subjectId:'USR-TRAINER',permission:'M06 知识分类维护',lastUsed:'32天前',recommendation:'转交复核',status:'待复核' },
];

export const roleIdForSystemRole = (role:RoleId) => roleSeed.find(item=>item.systemRole===role)?.id ?? 'ROLE-EMPLOYEE';
export const nameOfUser = (id:string) => userSeed.find(item=>item.id===id)?.name ?? id;
export const nameOfOrganization = (id:string|null) => organizationSeed.find(item=>item.id===id)?.name ?? '—';
export const nameOfPosition = (id:string) => positionSeed.find(item=>item.id===id)?.name ?? id;
