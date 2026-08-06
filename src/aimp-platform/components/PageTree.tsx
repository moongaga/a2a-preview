import React from 'react';
import type { ModuleDefinition } from '../types';

export function PageTree({
    module,
    activeView,
    onSelect,
}: {
    module: ModuleDefinition;
    activeView: string;
    onSelect: (pageId: string) => void;
}) {
    return (
        <aside className="page-tree">
            <header><span>{module.code}</span><strong>{module.name}</strong><small>{module.primaryObject}</small></header>
            <nav>
                {module.pages.map((page, index) => (
                    <button
                        type="button"
                        key={page.id}
                        className={page.id === activeView ? 'is-active' : ''}
                        onClick={() => onSelect(page.id)}
                    >
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div><strong>{page.name}</strong><small>{page.purpose}</small></div>
                    </button>
                ))}
            </nav>
        </aside>
    );
}
