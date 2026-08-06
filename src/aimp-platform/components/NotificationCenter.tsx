import React, { useState } from 'react';
import { Bell } from 'lucide-react';
export function NotificationCenter({ count = 3 }: { count?: number }) { const [open, setOpen] = useState(false); return <div className="notification-center"><button className="icon-button" type="button" aria-label="通知中心" onClick={() => setOpen((value) => !value)}><Bell size={16} />{count > 0 && <span className="notification-count">{count}</span>}</button>{open && <div className="notification-panel"><strong>待处理动态</strong><p>Agent 上线门禁待签核</p><p>数据漂移告警已创建工单</p><p>线索转化指标已回流</p></div>}</div>; }
