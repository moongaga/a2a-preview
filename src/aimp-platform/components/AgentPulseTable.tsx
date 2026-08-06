import React from 'react';
import { getVersionSnapshot } from '../model/version-snapshot';
import type { VersionId } from '../types';
export function AgentPulseTable({ versionId }: { versionId: VersionId }) { const snapshot = getVersionSnapshot(versionId); return <section className="content-panel"><div className="panel-heading"><div><h2>Agent Pulse</h2><p>当前版本 Agent 发布与运行状态。</p></div></div><div className="pulse-table">{snapshot.agentReleases.map((agent) => <div key={agent.name}><strong>{agent.name}</strong><span>{agent.version}</span><em className={agent.status}>{agent.status === 'online' ? '● 在线' : agent.status === 'degraded' ? '● 降级' : '规划中'}</em></div>)}</div></section>; }
