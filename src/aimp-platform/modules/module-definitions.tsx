import React from 'react';
import definitionsData from '../data/module-view-definitions.json';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    GitBranch,
    PlayCircle,
} from 'lucide-react';
import {
    EntityTable,
    FieldGrid,
    FilterBar,
    StatusPill,
    Timeline,
} from '../components/ProductComponents';
import type { DeepModuleProps } from './types';

type ModuleViewDefinition = {
    moduleId: string;
    keyFields: string[];
    workflowSteps: string[];
    resultMetrics: string[];
    exceptionCases: string[];
};

export const moduleViewDefinitions = definitionsData as ModuleViewDefinition[];

export function ConfiguredModuleWorkspace(props: DeepModuleProps) {
    const { module, page, moduleEntities, openEntity } = props;
    const definition = moduleViewDefinitions.find((item) => item.moduleId === module.id);
    const entity = moduleEntities[0];
    if (!definition || !entity) return null;

    if (page.kind === 'audit') {
        return <section className="content-panel"><div className="panel-heading"><div><h2>{module.name}审计</h2><p>操作、状态变化、影响范围和证据不可篡改。</p></div><span>审计视图</span></div><Timeline entity={entity} /></section>;
    }
    if (page.kind === 'detail') {
        return <section className="content-panel"><div className="panel-heading"><div><h2>{module.name}详情</h2><p>核心字段、当前状态、上下游关系和后续动作。</p></div><StatusPill status={entity.status} /></div><FieldGrid entity={entity} /><div className="definition-chips">{definition.keyFields.map((field) => <span key={field}>{field}</span>)}</div><button className="primary-button" type="button" onClick={() => openEntity(entity)}>打开统一对象详情</button></section>;
    }
    if (page.kind === 'create') {
        return <section className="content-panel"><div className="panel-heading"><div><h2>{page.name}</h2><p>字段校验、依赖检查和权限判断完成后才能提交。</p></div><span>草稿自动保存</span></div><div className="form-grid">{definition.keyFields.slice(0, 5).map((field, index) => <label key={field} className={index === 4 ? 'span-two' : ''}><span>{field}{index < 3 ? ' *' : ''}</span>{index === 4 ? <textarea defaultValue={`${module.name}${field}的示例输入与业务说明`} /> : <input defaultValue={`${field}示例值`} />}</label>)}</div><div className="form-footer"><span>前置依赖已检查</span><button className="secondary-button" type="button">保存草稿</button><button className="primary-button" type="button">{page.primaryActions[0]}</button></div></section>;
    }
    if (page.kind === 'process') {
        return <section className="content-panel"><div className="panel-heading"><div><h2>{page.name}流程</h2><p>当前节点、进入条件、责任角色、异常路径和退出结果。</p></div><GitBranch /></div><div className="run-flow">{definition.workflowSteps.map((step, index) => <article className={index < 2 ? 'is-done' : index === 2 ? 'is-running' : ''} key={step}><span>{index < 2 ? <CheckCircle2 /> : index + 1}</span><strong>{step}</strong><small>{index < 2 ? '已完成' : index === 2 ? '处理中' : '等待'}</small></article>)}</div><div className="exception-grid">{definition.exceptionCases.map((item) => <article key={item}><AlertTriangle /><strong>{item}</strong><small>查看影响范围与恢复动作</small></article>)}</div><button className="primary-button" type="button"><PlayCircle />执行当前节点</button></section>;
    }
    if (page.kind === 'result') {
        return <section className="content-panel"><div className="panel-heading"><div><h2>{page.name}</h2><p>指标必须绑定口径、来源对象、目标值和改进动作。</p></div><BarChart3 /></div><div className="acceptance-grid">{definition.resultMetrics.map((metric, index) => <article key={metric}><span>{metric}</span><strong>{['92.4%','18.6%','3.2天','¥286万'][index] || `${index + 3}项`}</strong><small>{index === 0 ? '达到目标' : '较上周期改善'}</small></article>)}</div></section>;
    }
    return <section className="content-panel"><div className="panel-heading"><div><h2>{page.name}</h2><p>{page.purpose}</p></div><span>{definition.keyFields.join(' · ')}</span></div><FilterBar count={moduleEntities.length} /><EntityTable entities={moduleEntities} onOpen={openEntity} /><div className="exception-grid compact-grid">{definition.exceptionCases.map((item) => <article key={item}><AlertTriangle /><strong>{item}</strong><small>已配置处置规则</small></article>)}</div></section>;
}
