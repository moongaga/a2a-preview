import versionsData from '../data/versions.json';
import domainsData from '../data/domains.json';
import modulesData from '../data/modules.json';
import type {
    DomainDefinition,
    ModuleDefinition,
    ModulePageDefinition,
    VersionDefinition,
} from '../types';

export const versions = versionsData as VersionDefinition[];
export const domains = domainsData as DomainDefinition[];
export const modules = modulesData as ModuleDefinition[];

export const getVersion = (versionId: string) =>
    versions.find((item) => item.id === versionId);

export const getDomain = (domainId: string) =>
    domains.find((item) => item.id === domainId);

export const getModule = (moduleId: string) =>
    modules.find((item) => item.id === moduleId);

export const getModulePage = (
    moduleId: string,
    pageId: string,
): ModulePageDefinition | undefined =>
    getModule(moduleId)?.pages.find((item) => item.id === pageId);

export const getModulesForDomain = (domainId: string) =>
    modules.filter((item) => item.domainId === domainId);

export const getModulesForVersion = (versionId: string) => {
    const maxIndex = versions.findIndex((item) => item.id === versionId);
    return modules.filter((item) =>
        versions.findIndex((version) => version.id === item.versionId) <= maxIndex,
    );
};
