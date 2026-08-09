import type { ModelBillingState } from './model-billing-types';

export const modelBillingSeed: ModelBillingState = {
  connections: [
    {
      id:'CONN-OPENAI-PROD',name:'OpenAI 生产连接',provider:'OpenAI',region:'全球',baseUrl:'https://api.openai.com/v1',secretRef:'SECRET-MODEL-OPENAI-PROD',owner:'顾川',departmentId:'ORG-CAPABILITY',risk:'高',health:'正常',lifecycle:'已发布',version:'v2.1',p95:690,todayCalls:45230,timeout:60,rateLimit:1200,routePolicy:'生产主路由，故障时切换百炼备线',
      models:[
        {id:'MV-GPT-51',modelId:'gpt-5.1',displayName:'GPT-5.1',contextWindow:400000,modalities:['文本','图片'],health:'正常',lifecycle:'已发布',inputPrice:8.75,outputPrice:70,currency:'CNY'},
        {id:'MV-GPT-51-MINI',modelId:'gpt-5.1-mini',displayName:'GPT-5.1 mini',contextWindow:400000,modalities:['文本','图片'],health:'正常',lifecycle:'已发布',inputPrice:1.75,outputPrice:14,currency:'CNY'},
      ],
      dependencies:[{id:'AGENT-LEAD-03',type:'Agent',name:'线索诊断 Agent',version:'v3.2.1',scope:'生产推理模型'},{id:'WF-LEAD-01',type:'工作流',name:'线索转化提升工作流',version:'v2.1.5',scope:'诊断节点'}],
      audit:[{id:'MAUD-101',action:'发布连接',actor:'顾川',at:'2026-08-01 09:20',result:'门禁通过，发布 v2.1'}],
    },
    {
      id:'CONN-DEEPSEEK-PROD',name:'DeepSeek 生产连接',provider:'DeepSeek',region:'中国大陆',baseUrl:'https://api.deepseek.com/v1',secretRef:'SECRET-MODEL-DEEPSEEK-PROD',owner:'赵岑',departmentId:'ORG-CAPABILITY',risk:'中',health:'正常',lifecycle:'已发布',version:'v1.6',p95:820,todayCalls:18640,timeout:60,rateLimit:800,routePolicy:'成本优先路由',
      models:[{id:'MV-DS-V4',modelId:'deepseek-v4',displayName:'DeepSeek V4',contextWindow:128000,modalities:['文本'],health:'正常',lifecycle:'已发布',inputPrice:2,outputPrice:8,currency:'CNY'}],dependencies:[{id:'AGENT-CONTENT-08',type:'Agent',name:'内容生成 Agent',version:'v3.0.3',scope:'草稿生成'}],audit:[{id:'MAUD-102',action:'健康巡检',actor:'系统',at:'10分钟前',result:'连接正常'}],
    },
    {
      id:'CONN-BAILIAN-BACKUP',name:'百炼灾备连接',provider:'百炼',region:'华东 1',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',secretRef:'SECRET-MODEL-BAILIAN-BACKUP',owner:'赵岑',departmentId:'ORG-CAPABILITY',risk:'中',health:'波动',lifecycle:'已发布',version:'v1.3',p95:1250,todayCalls:2840,timeout:90,rateLimit:500,routePolicy:'OpenAI 故障后的区域备线',models:[{id:'MV-QWEN-MAX',modelId:'qwen-max',displayName:'通义千问 Max',contextWindow:131072,modalities:['文本'],health:'波动',lifecycle:'已发布',inputPrice:2.4,outputPrice:9.6,currency:'CNY'}],dependencies:[],audit:[{id:'MAUD-103',action:'SLO 告警',actor:'系统',at:'25分钟前',result:'P95 超过 1200ms'}],
    },
    {
      id:'CONN-PRIVATE-TEST',name:'私有模型测试连接',provider:'私有化',region:'DNDC 私有云',baseUrl:'https://model-gateway.internal/v1',secretRef:'SECRET-MODEL-PRIVATE-TEST',owner:'周芮',departmentId:'ORG-CAPABILITY',risk:'高',health:'维护中',lifecycle:'草稿',version:'v0.3-draft',p95:0,todayCalls:0,timeout:120,rateLimit:100,routePolicy:'仅测试环境',models:[{id:'MV-LEAD-REASONER',modelId:'lead-reasoner-1.8',displayName:'LeadReasoner 1.8',contextWindow:64000,modalities:['文本'],health:'维护中',lifecycle:'测试中',inputPrice:0,outputPrice:0,currency:'CNY'}],dependencies:[],audit:[{id:'MAUD-104',action:'创建草稿',actor:'周芮',at:'今天 09:10',result:'待完成连通测试'}],
    },
  ],
  pricing:[
    {id:'PRICE-GPT51-202608',provider:'OpenAI',modelId:'gpt-5.1',version:'2026.08',effectiveFrom:'2026-08-01',status:'已发布',inputPerMillion:8.75,outputPerMillion:70,cachePerMillion:0.875,requestPrice:0,currency:'CNY',author:'顾川'},
    {id:'PRICE-GPT51M-202608',provider:'OpenAI',modelId:'gpt-5.1-mini',version:'2026.08',effectiveFrom:'2026-08-01',status:'已发布',inputPerMillion:1.75,outputPerMillion:14,cachePerMillion:0.175,requestPrice:0,currency:'CNY',author:'顾川'},
    {id:'PRICE-DSV4-202608',provider:'DeepSeek',modelId:'deepseek-v4',version:'2026.08',effectiveFrom:'2026-08-01',status:'已发布',inputPerMillion:2,outputPerMillion:8,cachePerMillion:0.2,requestPrice:0,currency:'CNY',author:'顾川'},
    {id:'PRICE-QWEN-202609-D',provider:'百炼',modelId:'qwen-max',version:'2026.09-draft',effectiveFrom:'2026-09-01',status:'草稿',inputPerMillion:2.4,outputPerMillion:9.6,cachePerMillion:0.6,requestPrice:0,currency:'CNY',author:'赵岑'},
  ],
  usage:[
    {id:'USE-001',date:'2026-08-09',provider:'OpenAI',modelId:'gpt-5.1',departmentId:'ORG-LEAD',projectId:'PJ-LEAD-Q3-02',agentId:'AGENT-LEAD-03',workflowId:'WF-LEAD-01',costCenter:'CC-LEAD',inputTokens:18200000,outputTokens:4600000,calls:15420,supplierCost:481.25,allocatedCost:505.31},
    {id:'USE-002',date:'2026-08-09',provider:'OpenAI',modelId:'gpt-5.1-mini',departmentId:'ORG-LEAD',projectId:'PJ-LEAD-Q3-02',agentId:'AGENT-CLEAN-01',workflowId:'WF-LEAD-01',costCenter:'CC-LEAD',inputTokens:32800000,outputTokens:6200000,calls:29810,supplierCost:144.2,allocatedCost:151.41},
    {id:'USE-003',date:'2026-08-09',provider:'DeepSeek',modelId:'deepseek-v4',departmentId:'ORG-CONTENT',projectId:'PJ-CONTENT-08',agentId:'AGENT-CONTENT-08',workflowId:'WF-CONTENT-02',costCenter:'CC-CONTENT',inputTokens:26400000,outputTokens:8800000,calls:18640,supplierCost:123.2,allocatedCost:129.36},
  ],
  supplierBills:[
    {id:'BILL-OPENAI-202607',provider:'OpenAI',period:'2026-07',currency:'USD',billedAmount:12840.62,meteredAmount:12794.18,status:'有差异',sourceFile:'openai-2026-07.csv'},
    {id:'BILL-DS-202607',provider:'DeepSeek',period:'2026-07',currency:'CNY',billedAmount:38620.4,meteredAmount:38620.4,status:'已核对',sourceFile:'deepseek-2026-07.xlsx'},
  ],
  reconciliations:[
    {id:'REC-001',billId:'BILL-OPENAI-202607',kind:'价格不一致',amount:32.18,owner:'赵岑',status:'处理中',resolution:'核对 7 月 18 日生效价目版本'},
    {id:'REC-002',billId:'BILL-OPENAI-202607',kind:'汇率差异',amount:14.26,owner:'顾川',status:'待处理',resolution:''},
  ],
  budgets:[
    {id:'MBUD-LEAD',name:'线索中心模型预算',scopeType:'部门',scopeId:'ORG-LEAD',monthlyLimit:180000,used:126800,thresholds:[70,85,95],action:'降级',enabled:true},
    {id:'MBUD-CONTENT',name:'内容中心模型预算',scopeType:'部门',scopeId:'ORG-CONTENT',monthlyLimit:120000,used:93600,thresholds:[80,90],action:'限流',enabled:true},
    {id:'MBUD-AGENT-LEAD',name:'线索诊断 Agent 预算',scopeType:'Agent',scopeId:'AGENT-LEAD-03',monthlyLimit:60000,used:51800,thresholds:[80,95],action:'提醒',enabled:true},
  ],
  testEvidence:[{id:'MEVI-001',connectionId:'CONN-OPENAI-PROD',modelId:'gpt-5.1',source:'M11',passed:true,latency:724,score:96,createdAt:'今天 10:15',detail:'结构化输出、敏感字段和知识引用校验通过'}],
};
