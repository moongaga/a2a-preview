import React from 'react';
import { ArrowUpRight, CheckCircle2, CircleAlert, ListChecks, ShieldAlert } from 'lucide-react';

const icons = [ListChecks, CheckCircle2, CircleAlert, ShieldAlert];

export function RoleActionCard({ label, value, description, index, onClick }: { label: string; value: string; description: string; index: number; onClick?: () => void }) {
    const Icon = icons[index % icons.length];
    return <button type="button" className="role-action-card" onClick={onClick}>
        <span className="role-action-icon"><Icon size={17} /></span>
        <span><small>{label}</small><strong>{value}</strong><em>{description}</em></span>
        <ArrowUpRight size={15} />
    </button>;
}

