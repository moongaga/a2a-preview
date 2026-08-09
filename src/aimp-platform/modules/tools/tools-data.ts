export type ToolType = 'HTTP API' | 'MCP Server' | '数据库' | '消息通道' | '文件系统' | '代码执行';
export type ToolLifecycle = '草稿' | '测试中' | '待审核' | '已发布' | '已停用' | '已归档';
export type ToolHealth = '正常' | '波动' | '故障' | '维护中';
export type ToolRisk = '低' | '中' | '高';
export type ToolEnvironmentName = '开发' | '测试' | '生产';

export type ToolEnvironment = {
  name: ToolEnvironmentName;
  endpoint: string;
  secretRef: string;
  networkScope: string;
  enabled: boolean;
};

export type ToolContractParameter = {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  example: string;
  description: string;
};

export type ToolContract = {
  method: string;
  path: string;
  operation: string;
  parameters: ToolContractParameter[];
  requestSchema: string;
  responseSchema: string;
  errorCodes: string;
  idempotency: string;
};

export type ToolDependency = {
  id: string;
  type: 'Agent' | '工作流' | 'Skill' | '运行实例' | '部门' | '角色';
  name: string;
  version?: string;
  scope: string;
};

export type ToolVersion = {
  version: string;
  status: '草稿' | '待审核' | '已发布' | '历史版本' | '已归档';
  author: string;
  time: string;
  change: string;
};

export type ToolTestRun = {
  id: string;
  time: string;
  environment: ToolEnvironmentName;
  result: '通过' | '失败' | '限流' | '熔断';
  latency: string;
  retries: number;
  request: string;
  response: string;
  error?: string;
};

export type ToolCallLog = {
  id: string;
  time: string;
  caller: string;
  result: '成功' | '失败' | '限流' | '熔断';
  latency: string;
  traceId: string;
};

export type ToolAuditEvent = { id: string; time: string; actor: string; action: string; evidence: string };

export type ToolRecord = {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  owner: string;
  department: string;
  purpose: string;
  risk: ToolRisk;
  lifecycle: ToolLifecycle;
  health: ToolHealth;
  currentVersion: string;
  successRate: number;
  p95Latency: string;
  dailyCalls: number;
  qpsLimit: number;
  timeoutMs: number;
  retries: number;
  circuitBreaker: string;
  connection: Record<string, string>;
  contract: ToolContract;
  environments: ToolEnvironment[];
  dependencies: ToolDependency[];
  versions: ToolVersion[];
  tests: ToolTestRun[];
  calls: ToolCallLog[];
  audit: ToolAuditEvent[];
  lastTestPassed: boolean;
};

const parameters: ToolContractParameter[] = [
  { id: 'PARAM-01', name: 'tenant_id', type: 'string', required: true, example: 'TENANT-AIMP', description: '租户隔离标识' },
  { id: 'PARAM-02', name: 'payload', type: 'object', required: true, example: '{"message":"hello"}', description: '已脱敏的业务请求体' },
];
const environments: ToolEnvironment[] = [
  { name: '开发', endpoint: 'https://dev-api.aimp.local', secretRef: 'SECRET-DEV-TOOL-01', networkScope: '开发 VPC', enabled: true },
  { name: '测试', endpoint: 'https://test-api.aimp.local', secretRef: 'SECRET-TEST-TOOL-01', networkScope: '测试 VPC', enabled: true },
  { name: '生产', endpoint: 'https://api.aimp.local', secretRef: 'SECRET-PROD-TOOL-01', networkScope: '生产 VPC 白名单', enabled: true },
];
const contract = (method: string, path: string, operation: string): ToolContract => ({ method, path, operation, parameters: parameters.map(item => ({ ...item })), requestSchema: '{\n  "type": "object",\n  "required": ["tenant_id", "payload"]\n}', responseSchema: '{\n  "type": "object",\n  "required": ["success", "trace_id"]\n}', errorCodes: '400 参数错误 · 401 认证失败 · 429 限流 · 500 上游异常', idempotency: '使用 X-Idempotency-Key，24小时内去重' });
const version = (value: string, author: string): ToolVersion => ({ version: value, status: '已发布', author, time: '2026-08-06 10:20', change: '完成连接、契约、安全与运行门禁审核' });
const audit = (tool: string): ToolAuditEvent[] => [{ id: `AUD-${tool}-01`, time: '2026-08-06 10:20', actor: '赵岑', action: '发布生产版本', evidence: `审批单 REL-${tool}-01 · M11 工具测试通过` }];
const calls = (prefix: string): ToolCallLog[] => [
  { id: `${prefix}-CALL-8821`, time: '10:48:51', caller: '线索诊断 Agent', result: '成功', latency: '86ms', traceId: 'TRACE-LEAD-8821' },
  { id: `${prefix}-CALL-8819`, time: '10:47:32', caller: '线索转化提升工作流', result: '成功', latency: '102ms', traceId: 'TRACE-WF-8819' },
  { id: `${prefix}-CALL-8790`, time: '10:42:10', caller: 'M11 工具测试', result: '限流', latency: '8ms', traceId: 'TRACE-TEST-8790' },
];
const tests = (prefix: string): ToolTestRun[] => [{ id: `${prefix}-TEST-128`, time: '今天 10:15', environment: '测试', result: '通过', latency: '92ms', retries: 0, request: '{"tenant_id":"TENANT-AIMP","payload":{"sample":true}}', response: '{"success":true,"trace_id":"TRACE-TEST-128"}' }];

export const toolRecords: ToolRecord[] = [
  {
    id: 'TOOL-WECOM-01', name: '企业微信消息推送', description: '向企业微信客户与内部成员发送经审批的消息和内容卡片', type: '消息通道', owner: '周芮', department: '线索事业部', purpose: '线索培育触达与内部异常通知', risk: '中', lifecycle: '已发布', health: '正常', currentVersion: 'v2.3.1', successRate: 99.9, p95Latency: '45ms', dailyCalls: 68420, qpsLimit: 120, timeoutMs: 3000, retries: 2, circuitBreaker: '连续5次失败或错误率≥20%，熔断60秒', connection: { provider: '企业微信开放平台', channel: '客户联系消息', capability: '文本、图文卡片、事件回执', sendScope: '已授权客户与内部成员' }, contract: contract('POST', '/v2/messages/send', 'send_message'), environments: environments.map(item => ({ ...item })), dependencies: [{ id: 'AGENT-LEAD-03', type: 'Agent', name: '线索诊断 Agent', version: 'v3.2.1', scope: '生产调用' }, { id: 'WF-LEAD-01', type: '工作流', name: '线索转化提升工作流', version: 'v2.1', scope: '触达节点' }, { id: 'ROLE-TRAINER', type: '角色', name: 'AI训练师', scope: '测试环境调用' }], versions: [version('v2.3.1', '赵岑'), { version: 'v2.2.0', status: '历史版本', author: '周芮', time: '2026-07-18 09:20', change: '增加幂等键与消息回执' }], tests: tests('WECOM'), calls: calls('WECOM'), audit: audit('WECOM'), lastTestPassed: true,
  },
  {
    id: 'TOOL-CDP-01', name: 'CDP用户数据平台', description: '按租户和项目授权范围查询脱敏用户标签、行为序列与人群包', type: '数据库', owner: '宋澜', department: '数据部', purpose: '用户洞察、策略计算和人群筛选', risk: '高', lifecycle: '已发布', health: '正常', currentVersion: 'v3.0.2', successRate: 99.8, p95Latency: '95ms', dailyCalls: 126800, qpsLimit: 80, timeoutMs: 5000, retries: 1, circuitBreaker: '错误率≥10%持续2分钟，熔断120秒', connection: { sourceRef: 'DS-CDP-PROD', accessMode: '只读', queryTemplate: 'profile.queryByTenantAndProject', rowPolicy: 'tenant_id + project_id' }, contract: contract('QUERY', 'profile.queryByTenantAndProject', 'query_profile'), environments: environments.map(item => ({ ...item, secretRef: `SECRET-${item.name === '生产' ? 'PROD' : item.name === '测试' ? 'TEST' : 'DEV'}-CDP-01` })), dependencies: [{ id: 'AGENT-LEAD-03', type: 'Agent', name: '线索诊断 Agent', version: 'v3.2.1', scope: '脱敏只读' }, { id: 'AGENT-CLEAN-08', type: 'Agent', name: '线索清洗 Agent', version: 'v1.5.0', scope: '脱敏只读' }], versions: [version('v3.0.2', '顾川')], tests: tests('CDP'), calls: calls('CDP'), audit: audit('CDP'), lastTestPassed: true,
  },
  {
    id: 'TOOL-TRACE-01', name: 'Trace 检索', description: '检索 Agent 与工作流运行链路、模型调用和依赖证据', type: 'HTTP API', owner: '周芮', department: 'AIMP能力运营组', purpose: '质量诊断、异常归因与测试证据查询', risk: '低', lifecycle: '已发布', health: '正常', currentVersion: 'v1.8.0', successRate: 99.7, p95Latency: '82ms', dailyCalls: 32400, qpsLimit: 200, timeoutMs: 3000, retries: 2, circuitBreaker: '连续8次失败，熔断30秒', connection: { baseUrl: 'https://trace-api.aimp.local', method: 'POST', path: '/v1/traces/search', headers: 'X-Tenant-Id, X-Project-Id' }, contract: contract('POST', '/v1/traces/search', 'search_trace'), environments: environments.map(item => ({ ...item })), dependencies: [{ id: 'AGENT-QUALITY-11', type: 'Agent', name: '质量诊断 Agent', version: 'v1.4.0', scope: '授权 Trace 只读' }, { id: 'M11-UNIT-01', type: '运行实例', name: 'M11 工具调用回归', scope: '测试证据' }], versions: [version('v1.8.0', '赵岑')], tests: tests('TRACE'), calls: calls('TRACE'), audit: audit('TRACE'), lastTestPassed: true,
  },
  {
    id: 'TOOL-MCP-CONTENT-01', name: '内容资产 MCP', description: '通过 MCP 协议检索已审核素材并创建内容引用', type: 'MCP Server', owner: '韩莹', department: '内容事业部', purpose: '内容生成 Agent 获取已授权内容资产', risk: '中', lifecycle: '待审核', health: '波动', currentVersion: 'v1.2.0-RC', successRate: 97.8, p95Latency: '1.2s', dailyCalls: 13800, qpsLimit: 40, timeoutMs: 8000, retries: 1, circuitBreaker: 'P95≥2秒或错误率≥15%，熔断90秒', connection: { serverUrl: 'https://mcp-content.aimp.local', transport: 'Streamable HTTP', capabilities: 'resources/list, resources/read, tools/call', protocolVersion: '2025-06-18' }, contract: contract('MCP', 'tools/call', 'content_asset_search'), environments: environments.map(item => ({ ...item })), dependencies: [], versions: [{ version: 'v1.2.0-RC', status: '待审核', author: '周芮', time: '今天 09:42', change: '补充资源级权限和超时降级' }, version('v1.1.0', '赵岑')], tests: [{ ...tests('MCP')[0], result: '失败', latency: '1.8s', error: '生产前测试发现资源列表偶发超时' }], calls: calls('MCP'), audit: [{ id: 'AUD-MCP-01', time: '今天 09:42', actor: '周芮', action: '提交审核', evidence: '连接测试 18/20 通过 · 待平台管理员复核' }], lastTestPassed: false,
  },
  {
    id: 'TOOL-OTA-01', name: 'OTA升级服务', description: '对接车辆 OTA 平台执行升级查询、推送和状态追踪', type: 'HTTP API', owner: '许言', department: '用户服务中心', purpose: '远程诊断后的升级建议与受控执行', risk: '高', lifecycle: '已停用', health: '维护中', currentVersion: 'v1.5.1', successRate: 96.4, p95Latency: '860ms', dailyCalls: 0, qpsLimit: 10, timeoutMs: 10000, retries: 0, circuitBreaker: '人工停用期间拒绝全部生产调用', connection: { baseUrl: 'https://ota-api.aimp.local', method: 'POST', path: '/v1/upgrades', headers: 'X-Tenant-Id, X-Approval-Id' }, contract: contract('POST', '/v1/upgrades', 'create_upgrade'), environments: environments.map(item => ({ ...item, enabled: item.name !== '生产' })), dependencies: [{ id: 'AGENT-REMOTE-09', type: 'Agent', name: '远程诊断 Agent', version: 'v0.9.5', scope: '当前已阻断' }], versions: [version('v1.5.1', '顾川')], tests: [{ ...tests('OTA')[0], result: '熔断', error: '上游维护窗口，生产环境不可达' }], calls: [{ ...calls('OTA')[0], result: '熔断', latency: '5ms' }], audit: [{ id: 'AUD-OTA-01', time: '今天 08:20', actor: '顾川', action: '停用生产调用', evidence: '维护单 CHG-OTA-2026-0812' }], lastTestPassed: false,
  },
  {
    id: 'TOOL-CODE-01', name: '受控 Python 执行器', description: '在隔离沙箱中执行白名单 Python 数据处理脚本', type: '代码执行', owner: '周芮', department: 'AIMP能力运营组', purpose: '数据清洗、指标计算和测试辅助', risk: '高', lifecycle: '草稿', health: '故障', currentVersion: 'v0.3.0', successRate: 0, p95Latency: '—', dailyCalls: 0, qpsLimit: 5, timeoutMs: 30000, retries: 0, circuitBreaker: '任一越权或网络访问立即熔断', connection: { runtime: 'Python 3.12', packages: 'pandas, numpy, pydantic', resources: 'CPU 1核 / 内存 512MB / 30秒', networkPolicy: '禁止外网，仅允许白名单对象存储' }, contract: contract('EXEC', 'sandbox://python', 'execute_python'), environments: environments.map(item => ({ ...item, enabled: item.name !== '生产', secretRef: '无凭据' })), dependencies: [], versions: [{ version: 'v0.3.0', status: '草稿', author: '周芮', time: '今天 08:45', change: '新建隔离执行器草稿' }], tests: [], calls: [], audit: [{ id: 'AUD-CODE-01', time: '今天 08:45', actor: '周芮', action: '新建草稿', evidence: '尚未完成安全测试' }], lastTestPassed: false,
  },
];

export const isHighRiskTool = (tool: ToolRecord) => tool.risk === '高' || tool.type === '代码执行' || (tool.type === '数据库' && tool.connection.accessMode !== '只读');

export function createToolDraft(type: ToolType, name: string): ToolRecord {
  const stamp = Date.now().toString().slice(-6);
  return {
    id: `TOOL-${stamp}`, name, description: '待补充工具能力、调用边界和使用场景', type, owner: '周芮', department: 'AIMP能力运营组', purpose: '待配置', risk: type === '代码执行' || type === '数据库' ? '高' : '中', lifecycle: '草稿', health: '故障', currentVersion: 'v0.1.0', successRate: 0, p95Latency: '—', dailyCalls: 0, qpsLimit: 20, timeoutMs: 5000, retries: 1, circuitBreaker: '连续5次失败，熔断60秒', connection: {}, contract: contract(type === 'MCP Server' ? 'MCP' : type === '数据库' ? 'QUERY' : 'POST', '/', 'unconfigured_operation'), environments: environments.map(item => ({ ...item, endpoint: '', secretRef: '', enabled: item.name !== '生产' })), dependencies: [], versions: [{ version: 'v0.1.0', status: '草稿', author: '周芮', time: '刚刚', change: '创建 Tool 草稿' }], tests: [], calls: [], audit: [{ id: `AUD-${stamp}`, time: '刚刚', actor: '周芮', action: '新建 Tool 草稿', evidence: '等待连接、契约和安全配置' }], lastTestPassed: false,
  };
}
