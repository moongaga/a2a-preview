import React from 'react';
import { versions } from '../model/registry';
import { getVersionSnapshot } from '../model/version-snapshot';
import type { VersionId } from '../types';
export function VersionRoadmap({ currentVersion, onSelect }: { currentVersion: VersionId; onSelect: (version: VersionId) => void }) { return <section className="content-panel version-roadmap"><div className="panel-heading"><div><h2>🗺️ AIMP 七版本推进路线</h2><p>当前版本：{currentVersion.toUpperCase()}，点击版本查看累计快照。</p></div></div><div className="version-roadmap-grid">{versions.map((version) => { const snapshot = getVersionSnapshot(version.id as VersionId); return <button type="button" key={version.id} className={version.id === currentVersion ? 'is-current' : ''} onClick={() => onSelect(version.id as VersionId)}><strong>{version.id.toUpperCase()}</strong><small>{version.date}</small><span>{snapshot.enabledModules.length} 模块</span><em>{snapshot.maturity === 'planned' ? '规划中' : '已交付'}</em></button>; })}</div></section>; }
