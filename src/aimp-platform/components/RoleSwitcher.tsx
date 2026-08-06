import React from 'react';
import { Bot } from 'lucide-react';
import type { RoleId } from '../types';
export const roles: Array<{ id: RoleId; name: string }> = [
    { id: 'employee', name: '员工' },
    { id: 'business', name: '业务负责人' },
    { id: 'trainer', name: 'AI 训练师' },
    { id: 'admin', name: '平台管理员' },
    { id: 'superadmin', name: '超级管理员' },
    { id: 'client', name: '客户管理员' },
];
export function RoleSwitcher({ value, onChange }: { value: RoleId; onChange: (value: RoleId) => void }) { return <label className="identity-switcher"><Bot size={15} /><span>当前身份</span><select aria-label="当前身份" value={value} onChange={(event) => onChange(event.target.value as RoleId)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>; }
