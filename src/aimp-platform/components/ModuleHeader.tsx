import React, { type ReactNode } from 'react';

export type ModuleHeaderProps = {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ModuleHeader({ title, subtitle, actions, className = '' }: ModuleHeaderProps) {
  return (
    <header className={`aimp-module-header ${className}`.trim()}>
      <div className="aimp-module-header__copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="aimp-module-header__actions">{actions}</div> : null}
    </header>
  );
}
