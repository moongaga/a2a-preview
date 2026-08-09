export type ModelLifecycle = '草稿' | '测试中' | '待审核' | '已发布' | '已停用' | '已归档';
export type ModelHealth = '正常' | '波动' | '故障' | '维护中';
export type ModelProviderType = 'OpenAI' | 'Azure OpenAI' | '百炼' | '火山方舟' | '百度千帆' | '腾讯混元' | 'DeepSeek' | '私有化' | 'OpenAI Compatible';

export interface ModelVersion {
  id: string;
  modelId: string;
  displayName: string;
  contextWindow: number;
  modalities: string[];
  health: ModelHealth;
  lifecycle: ModelLifecycle;
  inputPrice: number;
  outputPrice: number;
  currency: 'CNY' | 'USD';
}

export interface ModelDependency {
  id: string;
  type: 'Agent' | '工作流' | '测试项目';
  name: string;
  version: string;
  scope: string;
}

export interface ModelAuditEvent {
  id: string;
  action: string;
  actor: string;
  at: string;
  result: string;
  evidenceId?: string;
}

export interface ModelConnection {
  id: string;
  name: string;
  provider: ModelProviderType;
  region: string;
  baseUrl: string;
  secretRef: string;
  owner: string;
  departmentId: string;
  risk: '低' | '中' | '高' | '极高';
  health: ModelHealth;
  lifecycle: ModelLifecycle;
  version: string;
  p95: number;
  todayCalls: number;
  timeout: number;
  rateLimit: number;
  routePolicy: string;
  models: ModelVersion[];
  dependencies: ModelDependency[];
  audit: ModelAuditEvent[];
}

export interface PricingVersion {
  id: string;
  provider: string;
  modelId: string;
  version: string;
  effectiveFrom: string;
  status: '草稿' | '待审核' | '已发布' | '已停用';
  inputPerMillion: number;
  outputPerMillion: number;
  cachePerMillion: number;
  requestPrice: number;
  currency: 'CNY' | 'USD';
  author: string;
}

export interface UsageRecord {
  id: string;
  date: string;
  provider: string;
  modelId: string;
  departmentId: string;
  projectId: string;
  agentId: string;
  workflowId: string;
  costCenter: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  supplierCost: number;
  allocatedCost: number;
}

export interface SupplierBill {
  id: string;
  provider: string;
  period: string;
  currency: 'CNY' | 'USD';
  billedAmount: number;
  meteredAmount: number;
  status: '待导入' | '待对账' | '有差异' | '已核对' | '已结算';
  sourceFile: string;
}

export interface ReconciliationCase {
  id: string;
  billId: string;
  kind: '缺失' | '重复' | '价格不一致' | '汇率差异';
  amount: number;
  owner: string;
  status: '待处理' | '处理中' | '已解决';
  resolution: string;
}

export interface ModelBudgetPolicy {
  id: string;
  name: string;
  scopeType: '部门' | '项目' | 'Agent' | '工作流';
  scopeId: string;
  monthlyLimit: number;
  used: number;
  thresholds: number[];
  action: '提醒' | '限流' | '降级' | '停用';
  enabled: boolean;
}

export interface ModelTestEvidence {
  id: string;
  connectionId: string;
  modelId: string;
  source: 'M15' | 'M11';
  passed: boolean;
  latency: number;
  score: number;
  createdAt: string;
  detail: string;
}

export interface ModelBillingState {
  connections: ModelConnection[];
  pricing: PricingVersion[];
  usage: UsageRecord[];
  supplierBills: SupplierBill[];
  reconciliations: ReconciliationCase[];
  budgets: ModelBudgetPolicy[];
  testEvidence: ModelTestEvidence[];
}

export interface BindableModel {
  connectionId: string;
  connectionName: string;
  provider: ModelProviderType;
  modelId: string;
  displayName: string;
  version: string;
  label: string;
}

export interface RegistryResult { ok: boolean; message: string; entityId?: string }
