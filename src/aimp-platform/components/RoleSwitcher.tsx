import React from 'react';
import type { RoleId } from '../types';
export const roles: Array<{ id: RoleId; name: string }> = [
    { id: 'employee', name: '员工' },
    { id: 'business', name: '业务负责人' },
    { id: 'trainer', name: 'AI 训练师' },
    { id: 'admin', name: '平台管理员' },
    { id: 'superadmin', name: '超级管理员' },
    { id: 'client', name: '客户管理员' },
];
export const roleProfiles: Record<RoleId, { name: string; organization: string }> = {
    employee: { name: '陈屿', organization: 'DNDC线索中心' },
    business: { name: '李沐', organization: 'DNDC线索中心' },
    trainer: { name: '周芮', organization: 'AIMP能力运营组' },
    admin: { name: '赵岑', organization: 'AIMP平台运营组' },
    superadmin: { name: '顾川', organization: '平台治理委员会' },
    client: { name: '王琳', organization: '品牌方A' },
};
export function RoleSwitcher({ value, name, organization, onChange }: {
    value: RoleId;
    name: string;
    organization: string;
    onChange: (value: RoleId) => void;
}) {
    return <div className="identity-switcher" aria-label="当前用户与系统角色">
        <div className="identity-switcher__copy">
            <strong>{name}</strong>
            <small>{organization}</small>
        </div>
        <label className="identity-switcher__role">
            <span>系统角色</span>
            <select aria-label="当前身份" value={value} onChange={(event) => onChange(event.target.value as RoleId)}>
                {roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
        </label>
    </div>;
}
