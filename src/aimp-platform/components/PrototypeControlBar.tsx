import React from 'react';
import { BookOpen, Eye, SlidersHorizontal } from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { VersionSwitcher } from './VersionSwitcher';
import type { RoleId, VersionId } from '../types';

export function PrototypeControlBar({ role, version, mode, onRole, onVersion, onMode, onExplain }: { role: RoleId; version: VersionId; mode: 'use' | 'review'; onRole: (role: RoleId) => void; onVersion: (version: VersionId) => void; onMode: (mode: 'use' | 'review') => void; onExplain: () => void }) {
    return <div className="prototype-control-bar"><span className="prototype-label"><SlidersHorizontal size={14} />原型体验控制</span><RoleSwitcher value={role} onChange={onRole} /><VersionSwitcher value={version} onChange={onVersion} /><div className="mode-switch" aria-label="体验模式"><button type="button" className={mode === 'use' ? 'is-active' : ''} onClick={() => onMode('use')}><Eye size={13} />用户使用</button><button type="button" className={mode === 'review' ? 'is-active' : ''} onClick={() => onMode('review')}><BookOpen size={13} />交付评审</button></div><button className="explain-button" type="button" onClick={onExplain}>页面说明</button></div>;
}
