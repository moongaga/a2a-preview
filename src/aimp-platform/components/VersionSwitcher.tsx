import React from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { versions } from '../model/registry';
import type { VersionId } from '../types';
export function VersionSwitcher({ value, onChange }: { value: VersionId; onChange: (value: VersionId) => void }) { return <label className="context-switcher"><Activity size={15} /><select aria-label="产品版本" value={value} onChange={(event) => onChange(event.target.value as VersionId)}>{versions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14} /></label>; }
