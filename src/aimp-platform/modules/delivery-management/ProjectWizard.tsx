import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { RoleId } from '../../types';
import { bindableAssets } from './delivery-data';
import { useDeliveryProjectRegistry } from './delivery-registry-store';
import type { ProjectDraft, ProjectKind } from './delivery-types';

const actors: Record<RoleId,string> = { employee:'陈屿',business:'李沐',trainer:'周芮',admin:'赵岑',superadmin:'顾川',client:'王琳' };
const candidateMembers = [
  { id:'USR-EMP-01', name:'陈屿', role:'项目成员', organization:'DNDC线索中心', responsibility:'业务样本复核与结果反馈', dataScope:'本人及项目脱敏数据', validTo:'2026-12-31' },
  { id:'USR-BIZ-01', name:'李沐', role:'项目负责人', organization:'DNDC线索中心', responsibility:'业务目标、风险与验收', dataScope:'项目业务指标', validTo:'2026-12-31' },
  { id:'USR-TRAINER-01', name:'周芮', role:'AI能力负责人', organization:'AIMP能力运营组', responsibility:'能力诊断、修复与测试', dataScope:'项目授权能力', validTo:'2026-12-31' },
  { id:'USR-ADMIN-01', name:'赵岑', role:'平台保障负责人', organization:'AIMP平台运营组', responsibility:'运行保障与发布治理', dataScope:'平台运行范围', validTo:'2026-12-31' },
];
const steps = ['项目类型','基本信息','来源与范围','成员职责','能力绑定','校验提交'];

export function ProjectWizard({ role, onClose, onCreated, notice }: { role:RoleId; onClose:()=>void; onCreated:(id:string)=>void; notice:(message:string)=>void }) {
  const registry = useDeliveryProjectRegistry();
  const [step,setStep]=useState(0);
  const [selectedMembers,setSelectedMembers]=useState<string[]>(['USR-BIZ-01']);
  const [selectedAssets,setSelectedAssets]=useState<string[]>([]);
  const [submitAfterSave,setSubmitAfterSave]=useState(false);
  const [error,setError]=useState('');
  const activeContract=registry.contracts.find(item=>item.status==='生效');
  const [draft,setDraft]=useState<ProjectDraft>({ name:'',kind:'客户交付项目',goal:'',owner:actors[role],organization:role==='admin'?'AIMP平台运营组':'DNDC线索中心',period:'2026-08-10 ～ 2026-12-31',stage:'立项准备',contractId:activeContract?.id,sowId:activeContract?.sowId,tenantId:activeContract?.tenantId,productIds:activeContract?.productIds || [],basis:'' });
  const set=<K extends keyof ProjectDraft>(key:K,value:ProjectDraft[K])=>setDraft(current=>({...current,[key]:value}));
  const validation=useMemo(()=>{
    if(step===1&&(!draft.name.trim()||!draft.goal.trim()||!draft.owner.trim()||!draft.organization.trim()||!draft.period.trim()))return '请完整填写项目名称、目标、负责人、组织和周期。';
    if(step===2&&draft.kind==='客户交付项目'&&(!draft.contractId||!draft.sowId||!draft.tenantId||!draft.productIds.length))return '客户项目必须配置合同、SOW、租户和 AI 产品权益。';
    if(step===2&&draft.kind!=='客户交付项目'&&!draft.basis?.trim())return '请填写内部项目立项依据。';
    if(step===3&&!selectedMembers.length)return '至少选择一名项目成员。';
    return '';
  },[step,draft,selectedMembers]);
  const next=()=>{if(validation){setError(validation);return;}setError('');setStep(value=>Math.min(5,value+1));};
  const selectKind=(kind:ProjectKind)=>{
    const contract=registry.contracts.find(item=>item.status==='生效');
    setDraft(current=>({...current,kind,contractId:kind==='客户交付项目'?contract?.id:undefined,sowId:kind==='客户交付项目'?contract?.sowId:undefined,tenantId:kind==='客户交付项目'?contract?.tenantId:undefined,productIds:kind==='客户交付项目'?(contract?.productIds||[]):[],basis:kind==='客户交付项目'?'':current.basis}));
  };
  const changeContract=(id:string)=>{const contract=registry.contracts.find(item=>item.id===id);setDraft(current=>({...current,contractId:id,sowId:contract?.sowId,tenantId:contract?.tenantId,productIds:contract?.productIds||[]}));};
  const save=()=>{
    const result=registry.createProject(draft,actors[role]); if(!result.ok||!result.id){setError(result.message);return;}
    const projectId=result.id;
    selectedMembers.forEach(id=>{const member=candidateMembers.find(item=>item.id===id);if(member)registry.addMember(projectId,member,actors[role]);});
    selectedAssets.forEach(id=>{const asset=bindableAssets.find(item=>item.id===id);if(asset)registry.bindAsset(projectId,{...asset,status:'已绑定',purpose:'项目授权能力',scope:'项目成员范围'},actors[role]);});
    if(submitAfterSave)registry.transitionProject(projectId,'submit',actors[role]);
    notice(submitAfterSave?'项目已创建并提交审批。':result.message); onCreated(projectId);
  };
  return <div className="m10-mask" onMouseDown={onClose}><section className="m10-wizard" onMouseDown={event=>event.stopPropagation()}>
    <header><div><h2>新建项目</h2><p>按真实立项流程建立项目主数据及授权关系</p></div><button aria-label="关闭新建项目" onClick={onClose}><X size={19}/></button></header>
    <ol>{steps.map((item,index)=><li key={item} className={index===step?'active':index<step?'done':''}><i>{index<step?<Check size={13}/>:index+1}</i><span>{item}</span></li>)}</ol>
    <main>
      {step===0&&<div className="m10-kind-grid">{(['客户交付项目','内部运营项目','能力优化项目'] as ProjectKind[]).map(kind=><button key={kind} className={draft.kind===kind?'active':''} onClick={()=>selectKind(kind)}><strong>{kind}</strong><span>{kind==='客户交付项目'?'来源于有效合同、SOW 和产品权益':kind==='内部运营项目'?'生产保障、平台运营与治理专项':'Agent、Prompt、知识和模型能力改进'}</span></button>)}</div>}
      {step===1&&<div className="m10-form-grid"><label>项目名称 *<input autoFocus value={draft.name} onChange={event=>set('name',event.target.value)} placeholder="例如：华东Q4线索AI优化"/></label><label>项目负责人 *<input value={draft.owner} onChange={event=>set('owner',event.target.value)}/></label><label className="wide">项目目标 *<textarea rows={3} value={draft.goal} onChange={event=>set('goal',event.target.value)} placeholder="描述可验收的项目目标"/></label><label>所属组织 *<select value={draft.organization} onChange={event=>set('organization',event.target.value)}><option>DNDC线索中心</option><option>内容事业部</option><option>AIMP能力运营组</option><option>AIMP平台运营组</option></select></label><label>项目周期 *<input value={draft.period} onChange={event=>set('period',event.target.value)}/></label><label>初始阶段<select value={draft.stage} onChange={event=>set('stage',event.target.value)}><option>立项准备</option><option>基线诊断</option><option>能力建设</option></select></label></div>}
      {step===2&&(draft.kind==='客户交付项目'?<div className="m10-form-grid"><label className="wide">有效合同 *<select value={draft.contractId||''} onChange={event=>changeContract(event.target.value)}><option value="">请选择已生效合同</option>{registry.contracts.filter(item=>item.status==='生效').map(item=><option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></label><label>SOW<input readOnly value={draft.sowId||''}/></label><label>租户<input readOnly value={draft.tenantId||''}/></label><label className="wide">AI 产品权益<input readOnly value={draft.productIds.map(id=>registry.products.find(item=>item.id===id)?.name||id).join('、')}/></label><p className="wide m10-hint">合同、SOW、租户和产品权益均从已生效交付合同继承，项目中不可自由填写。</p></div>:<div className="m10-form-grid"><label className="wide">立项依据 *<textarea rows={5} value={draft.basis||''} onChange={event=>set('basis',event.target.value)} placeholder="填写专项决议、治理要求或能力改进依据"/></label><p className="wide m10-hint">内部项目不要求合同，但仍需负责人、组织、周期和审批记录。</p></div>)}
      {step===3&&<div className="m10-choice-list">{candidateMembers.map(member=><label key={member.id} className={selectedMembers.includes(member.id)?'selected':''}><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={()=>setSelectedMembers(current=>current.includes(member.id)?current.filter(id=>id!==member.id):[...current,member.id])}/><span><strong>{member.name} · {member.role}</strong><small>{member.organization} · {member.responsibility} · {member.dataScope}</small></span></label>)}</div>}
      {step===4&&<div className="m10-choice-list">{bindableAssets.map(asset=><label key={asset.id} className={selectedAssets.includes(asset.id)?'selected':''}><input type="checkbox" checked={selectedAssets.includes(asset.id)} onChange={()=>setSelectedAssets(current=>current.includes(asset.id)?current.filter(id=>id!==asset.id):[...current,asset.id])}/><span><strong>{asset.kind} · {asset.name}</strong><small>{asset.id} · 固定版本 {asset.version}</small></span></label>)}</div>}
      {step===5&&<div className="m10-review"><h3>立项校验结果</h3><dl><dt>项目类型</dt><dd>{draft.kind}</dd><dt>基本信息</dt><dd>{draft.name} · {draft.organization} · {draft.period}</dd><dt>来源</dt><dd>{draft.kind==='客户交付项目'?`${draft.contractId} / ${draft.sowId}`:draft.basis}</dd><dt>成员</dt><dd>{selectedMembers.length} 人</dd><dt>能力绑定</dt><dd>{selectedAssets.length} 项固定版本资产</dd></dl><label><input type="checkbox" checked={submitAfterSave} onChange={event=>setSubmitAfterSave(event.target.checked)}/>保存后立即提交项目审批</label></div>}
      {error&&<p className="m10-error" role="alert">{error}</p>}
    </main>
    <footer><button disabled={step===0} onClick={()=>{setError('');setStep(value=>Math.max(0,value-1));}}><ChevronLeft size={15}/>上一步</button><span>第 {step+1} / {steps.length} 步</span>{step<5?<button className="m10-primary" onClick={next}>下一步<ChevronRight size={15}/></button>:<button className="m10-primary" onClick={save}>保存项目</button>}</footer>
  </section></div>;
}
