import React from 'react';
import { FileText } from 'lucide-react';

export function RequirementBadge({ requirementId }: { requirementId: string }) {
    const annotationId = `fr-${requirementId.toLowerCase()}`;
    return (
        <button
            type="button"
            className="fr-badge"
            data-annotation-id={annotationId}
            data-feature-id={requirementId}
            aria-label={`查看 ${requirementId} 产品说明`}
            title={`查看 ${requirementId} 产品说明`}
        >
            <FileText size={13} />
            {requirementId}
        </button>
    );
}
