import definitionsData from '../data/operational-modules.json';

export type OperationalField = {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required: boolean;
    options: string[];
};

export type WorkbenchType =
    | 'task'
    | 'asset'
    | 'process'
    | 'governance'
    | 'experiment'
    | 'insight';

export type OperationalModuleDefinition = {
    moduleId: string;
    workbench: WorkbenchType;
    objectName: string;
    fields: OperationalField[];
    columns: string[];
    filters: string[];
    statuses: string[];
    actions: string[];
    stateActions: Array<{ from: string; action: string; label: string; to: string }>;
    archiveRule: string;
    relationTargets: string[];
    workflowSteps: string[];
    resultMetrics: string[];
    exceptionCases: string[];
};

export const operationalDefinitions = definitionsData as OperationalModuleDefinition[];

export const getOperationalDefinition = (moduleId: string) =>
    operationalDefinitions.find((item) => item.moduleId === moduleId);
