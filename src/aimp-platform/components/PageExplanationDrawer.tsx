import React from 'react';
import { ArrowRight, Database, MousePointerClick, X } from 'lucide-react';
import type { PageExplanation } from '../data/page-explanations';

export function PageExplanationDrawer({ explanation, onClose }: { explanation: PageExplanation; onClose: () => void }) {
    return <div className="explanation-backdrop" role="presentation" onClick={onClose}><aside className="explanation-drawer" role="dialog" aria-label="页面说明" onClick={(event) => event.stopPropagation()}><header><div><span>独立说明层</span><h2>{explanation.title}</h2></div><button type="button" aria-label="关闭页面说明" onClick={onClose}><X size={17} /></button></header><p className="explanation-purpose">{explanation.purpose}</p><section><h3>输入</h3>{explanation.inputs.map((item) => <p key={item}><ArrowRight size={13} />{item}</p>)}</section><section><h3>主要交互</h3>{explanation.actions.map((item) => <p key={item}><MousePointerClick size={13} />{item}</p>)}</section><section><h3>输出</h3>{explanation.outputs.map((item) => <p key={item}><ArrowRight size={13} />{item}</p>)}</section><section><h3>页面状态</h3><div className="explanation-chips">{explanation.states.map((item) => <span key={item}>{item}</span>)}</div></section><section><h3>数据流</h3><p><Database size={13} />{explanation.dataFlow}</p></section></aside></div>;
}
