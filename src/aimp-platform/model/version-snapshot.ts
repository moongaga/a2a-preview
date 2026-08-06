import snapshotsData from '../data/version-snapshots.json';
import { modules, versions } from './registry';
import type { ModuleDefinition, ProductContext, RoleId, VersionId } from '../types';

export type VersionSnapshot = {
    versionId: VersionId;
    enabledModules: string[];
    enabledJourneys: string[];
    metrics: Record<string, number | string>;
    agentReleases: Array<{ name: string; version: string; status: string }>;
    notices: Array<{ type: string; title: string }>;
    maturity: 'implementation' | 'enhancement' | 'planned';
};

const snapshots = snapshotsData as VersionSnapshot[];

export function getVersionSnapshot(versionId: VersionId): VersionSnapshot {
    return snapshots.find((item) => item.versionId === versionId) || snapshots[snapshots.length - 1];
}

export function getCumulativeVersionIds(versionId: VersionId): VersionId[] {
    const maxIndex = versions.findIndex((item) => item.id === versionId);
    return versions.slice(0, maxIndex + 1).map((item) => item.id as VersionId);
}

export function isModuleVisibleAtVersion(moduleId: string, versionId: VersionId) {
    return getVersionSnapshot(versionId).enabledModules.includes(moduleId);
}

export function getSnapshotModules(versionId: VersionId, role: RoleId): ModuleDefinition[] {
    const snapshot = getVersionSnapshot(versionId);
    return modules.filter((module) => snapshot.enabledModules.includes(module.id) && (role === 'admin' || module.roles.includes(role)));
}

export type DashboardSnapshot = {
    versionId: VersionId;
    role: RoleId;
    metrics: Record<string, number | string>;
    agentReleases: VersionSnapshot['agentReleases'];
    notices: VersionSnapshot['notices'];
    visibleModuleCount: number;
    maturity: VersionSnapshot['maturity'];
};

export function getVersionDashboardData(versionId: VersionId, role: RoleId): DashboardSnapshot {
    const snapshot = getVersionSnapshot(versionId);
    return { versionId, role, metrics: snapshot.metrics, agentReleases: snapshot.agentReleases, notices: snapshot.notices, visibleModuleCount: getSnapshotModules(versionId, role).length, maturity: snapshot.maturity };
}

export function getContextualSnapshot(context: ProductContext) {
    return getVersionDashboardData(context.versionId, context.role);
}
