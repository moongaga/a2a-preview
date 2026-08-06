import React from 'react';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { StatusPill } from './ProductComponents';
import type { RoleQueueItem } from '../model/role-workspace';

export function RoleWorkQueue({ items, emptyCopy, onOpen }: { items: RoleQueueItem[]; emptyCopy: string; onOpen: (item: RoleQueueItem) => void }) {
    if (!items.length) {
        return <div className="role-empty"><Clock3 size={20} /><div><strong>现在没有要处理的事项</strong><p>{emptyCopy}</p></div></div>;
    }
    return <div className="role-work-queue">{items.map((item) => <button type="button" className="role-queue-item" key={item.entity.id} onClick={() => onOpen(item)}>
        <span className={`queue-priority is-${item.urgency}`} />
        <div className="queue-main"><strong>{item.displayName}</strong><small>{item.reason}</small><span className="queue-action"><Sparkles size={13} />{item.nextAction}</span></div>
        <div className="queue-meta"><StatusPill status={item.entity.status} /><small>{item.entity.updatedAt || '刚刚更新'}</small></div>
        <ArrowRight size={16} />
    </button>)}</div>;
}
