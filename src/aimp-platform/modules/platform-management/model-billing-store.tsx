import React, { createContext, useContext, useMemo, useState } from 'react';
import type { RoleId } from '../../types';
import { modelBillingSeed } from './model-billing-data';
import type { BindableModel, ModelBillingState, ModelConnection, ModelDependency, ModelTestEvidence, RegistryResult } from './model-billing-types';

interface ModelBillingRegistryValue {
  state: ModelBillingState;
  bindableModels: BindableModel[];
  createConnection: (draft: ModelConnection) => RegistryResult;
  updateConnection: (role: RoleId, connection: ModelConnection) => RegistryResult;
  transitionConnection: (role: RoleId, id: string, lifecycle: ModelConnection['lifecycle']) => RegistryResult;
  deleteConnection: (role: RoleId, id: string) => RegistryResult;
  addDependency: (connectionId: string, dependency: ModelDependency) => RegistryResult;
  recordModelTestEvidence: (evidence: ModelTestEvidence) => RegistryResult;
  resolveReconciliation: (role: RoleId, id: string, resolution: string) => RegistryResult;
  settleSupplierBill: (role: RoleId, id: string) => RegistryResult;
}

const Context = createContext<ModelBillingRegistryValue | null>(null);
const canMaintain = (role: RoleId) => ['trainer','admin','superadmin'].includes(role);
const canGovern = (role: RoleId) => ['admin','superadmin'].includes(role);
const result = (ok:boolean,message:string,entityId?:string):RegistryResult => ({ok,message,entityId});

export function selectBindableModels(state: ModelBillingState): BindableModel[] {
  return state.connections.flatMap(connection => connection.lifecycle === '已发布' && connection.health === '正常'
    ? connection.models.filter(model => model.lifecycle === '已发布' && model.health === '正常').map(model => ({
      connectionId:connection.id,connectionName:connection.name,provider:connection.provider,modelId:model.modelId,displayName:model.displayName,version:connection.version,label:`${model.displayName} · ${connection.provider} · ${connection.version}`,
    })) : []);
}

export function ModelBillingProvider({children}:{children:React.ReactNode}) {
  const [state,setState] = useState<ModelBillingState>(modelBillingSeed);
  const createConnection = (draft:ModelConnection) => {
    if(state.connections.some(item => item.name === draft.name || item.id === draft.id)) return result(false,'连接名称或 ID 已存在。');
    setState(current => ({...current,connections:[draft,...current.connections]}));
    return result(true,'已创建模型连接草稿。',draft.id);
  };
  const updateConnection = (role:RoleId,connection:ModelConnection) => {
    if(!canMaintain(role)) return result(false,'当前身份没有模型连接编辑权限。');
    const current=state.connections.find(item=>item.id===connection.id);
    if(!current) return result(false,'模型连接不存在。');
    if(current.lifecycle==='已发布') return result(false,'已发布版本不可直接修改，请复制为新草稿。');
    setState(s=>({...s,connections:s.connections.map(item=>item.id===connection.id?{...connection,audit:[{id:`MAUD-${Date.now()}`,action:'编辑草稿',actor:role,at:'刚刚',result:'保存成功'},...connection.audit]}:item)}));
    return result(true,'模型连接草稿已保存。',connection.id);
  };
  const transitionConnection = (role:RoleId,id:string,lifecycle:ModelConnection['lifecycle']) => {
    const current=state.connections.find(item=>item.id===id);
    if(!current) return result(false,'模型连接不存在。');
    if(['已发布','已停用','已归档'].includes(lifecycle)&&!canGovern(role)) return result(false,'当前身份没有审核发布或生命周期治理权限。');
    if(current.risk==='高'&&lifecycle==='已发布'&&role!=='superadmin') return result(false,'高风险模型连接必须由超级管理员发布。');
    if(lifecycle==='已归档'&&current.dependencies.length) return result(false,`存在 ${current.dependencies.length} 项生产依赖，请先完成影响处置。`);
    setState(s=>({...s,connections:s.connections.map(item=>item.id===id?{...item,lifecycle,audit:[{id:`MAUD-${Date.now()}`,action:lifecycle,actor:role,at:'刚刚',result:'状态变更成功'},...item.audit]}:item)}));
    return result(true,`连接状态已更新为「${lifecycle}」。`,id);
  };
  const deleteConnection = (role:RoleId,id:string) => {
    if(!canMaintain(role)) return result(false,'当前身份没有删除权限。');
    const current=state.connections.find(item=>item.id===id);
    if(!current) return result(false,'模型连接不存在。');
    if(current.lifecycle!=='草稿') return result(false,'只有无依赖草稿可以删除。');
    if(current.dependencies.length) return result(false,`存在 ${current.dependencies.length} 项依赖，不能删除。`);
    setState(s=>({...s,connections:s.connections.filter(item=>item.id!==id)}));
    return result(true,'模型连接草稿已删除。',id);
  };
  const addDependency = (connectionId:string,dependency:ModelDependency) => {
    setState(s=>({...s,connections:s.connections.map(item=>item.id===connectionId&& !item.dependencies.some(dep=>dep.id===dependency.id)?{...item,dependencies:[dependency,...item.dependencies]}:item)}));
    return result(true,'模型依赖已登记。',connectionId);
  };
  const recordModelTestEvidence = (evidence:ModelTestEvidence) => {
    setState(s=>({...s,testEvidence:[evidence,...s.testEvidence],connections:s.connections.map(item=>item.id===evidence.connectionId?{...item,health:evidence.passed?'正常':'波动',p95:evidence.latency,audit:[{id:`MAUD-${Date.now()}`,action:'模型测试',actor:evidence.source,at:evidence.createdAt,result:evidence.detail,evidenceId:evidence.id},...item.audit]}:item)}));
    return result(true,'测试证据已回写模型连接。',evidence.id);
  };
  const resolveReconciliation=(role:RoleId,id:string,resolution:string)=>{
    if(!canGovern(role)) return result(false,'当前身份没有对账处理权限。');
    if(!resolution.trim()) return result(false,'请填写差异处理说明。');
    setState(s=>({...s,reconciliations:s.reconciliations.map(item=>item.id===id?{...item,status:'已解决',resolution}:item)}));
    return result(true,'对账差异已解决。',id);
  };
  const settleSupplierBill=(role:RoleId,id:string)=>{
    if(role!=='superadmin') return result(false,'供应商账单结算仅允许超级管理员执行。');
    const open=state.reconciliations.some(item=>item.billId===id&&item.status!=='已解决');
    if(open) return result(false,'仍有未解决的对账差异，不能结算。');
    setState(s=>({...s,supplierBills:s.supplierBills.map(item=>item.id===id?{...item,status:'已结算'}:item)}));
    return result(true,'供应商账单已结算。',id);
  };
  const value=useMemo<ModelBillingRegistryValue>(()=>({state,bindableModels:selectBindableModels(state),createConnection,updateConnection,transitionConnection,deleteConnection,addDependency,recordModelTestEvidence,resolveReconciliation,settleSupplierBill}),[state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useModelBillingRegistry(){const value=useContext(Context);if(!value)throw new Error('ModelBillingProvider missing');return value;}
