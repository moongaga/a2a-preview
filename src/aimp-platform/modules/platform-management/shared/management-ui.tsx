import React, { type ReactNode } from 'react';
import { ArrowLeft, MoreHorizontal, X } from 'lucide-react';
import { ModuleHeader } from '../../../components/ModuleHeader';

export function ManagementHeader({title,subtitle,actions}:{title:string;subtitle:string;actions?:ReactNode}){return <ModuleHeader title={title} subtitle={subtitle} actions={actions} className="pm-header" />}

export function ManagementTabs({items,value,onChange}:{items:{id:string;label:string;description?:string}[];value:string;onChange:(id:string)=>void}){return <nav className="pm-tabs">{items.map(item=><button key={item.id} className={value===item.id?'active':''} onClick={()=>onChange(item.id)}><b>{item.label}</b>{item.description&&<small>{item.description}</small>}</button>)}</nav>}

export function ManagementToolbar({children}:{children:ReactNode}){return <div className="pm-toolbar">{children}</div>}

export function ManagementDetail({title,meta,backLabel,onBack,metrics,tabs,actions,children}:{title:string;meta:string;backLabel:string;onBack:()=>void;metrics?:{label:string;value:string}[];tabs?:ReactNode;actions?:ReactNode;children:ReactNode}){return <main className="pm-detail"><header><button onClick={onBack}><ArrowLeft/> {backLabel}</button><div><h2>{title}</h2><p>{meta}</p></div><div className="pm-detail-actions">{actions}</div></header>{metrics&&<section className="pm-kpis">{metrics.map(item=><Kpi key={item.label} {...item}/>)}</section>}{tabs}<section className="pm-detail-content">{children}</section></main>}

export function ManagementDialog({title,children,onClose,footer,size='normal'}:{title:string;children:ReactNode;onClose:()=>void;footer:ReactNode;size?:'normal'|'wide'}){return <div className="pm-mask"><section className={`pm-dialog ${size==='wide'?'pm-dialog--wide':''}`}><header><h2>{title}</h2><button aria-label="关闭" onClick={onClose}><X/></button></header><div className="pm-dialog-body">{children}</div><footer>{footer}</footer></section></div>}

export function ImpactPanel({title,items}:{title:string;items:string[]}){return <div className="pm-impact"><b>{title}</b>{items.map(item=><span key={item}>{item}</span>)}</div>}
export function EmptyState({text}:{text:string}){return <div className="pm-empty">{text}</div>}
export function Status({value}:{value:string}){return <span className={`pm-status s-${value}`}>{value}</span>}
export function Risk({value}:{value:string}){return <span className={`pm-risk r-${value}`}>{value}</span>}
export function Kpi({label,value}:{label:string;value:string}){return <div className="pm-kpi"><span>{label}</span><strong>{value}</strong></div>}

export function OperationMenu({items}:{items:{label:string;onClick:()=>void;disabled?:boolean;reason?:string;danger?:boolean}[]}){return <details className="pm-operation-menu"><summary aria-label="更多操作"><MoreHorizontal/></summary><div>{items.map(item=><button key={item.label} className={item.danger?'danger':''} disabled={item.disabled} title={item.reason} onClick={item.onClick}>{item.label}{item.disabled&&item.reason&&<small>{item.reason}</small>}</button>)}</div></details>}

export function PermissionGuard({allowed,reason,children}:{allowed:boolean;reason:string;children:ReactNode}){return allowed?<>{children}</>:<section className="pm-inline-gate"><b>当前操作不可用</b><p>{reason}</p></section>}
