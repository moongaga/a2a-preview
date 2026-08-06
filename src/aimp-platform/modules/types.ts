import type {
    EntityRecord,
    ModuleDefinition,
    ModulePageDefinition,
    PermissionDecision,
    RoleId,
} from '../types';

export type DeepModuleProps = {
    module: ModuleDefinition;
    page: ModulePageDefinition;
    role: RoleId;
    moduleEntities: EntityRecord[];
    allEntities: EntityRecord[];
    openEntity: (entity: EntityRecord) => void;
    onAction: (entity: EntityRecord, action: string, reason?: string) => void;
    permissionFor: (action: string) => PermissionDecision;
};
