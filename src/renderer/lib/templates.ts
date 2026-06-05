import { defaultDiagram } from './defaultDiagram';

export interface DiagramTemplate {
  id: string;
  label: string;
  description: string;
  source: string;
}

const basicFlow = `flowchart TD
    Start([开始]) --> Input[/输入数据/]
    Input --> Process[处理数据]
    Process --> Check{是否有效?}
    Check -->|是| Save[(保存结果)]
    Check -->|否| Input
    Save --> End([结束])`;

const decisionTree = `flowchart LR
    A[收到请求] --> B{已登录?}
    B -->|否| C[跳转登录]
    B -->|是| D{有权限?}
    D -->|否| E[拒绝访问]
    D -->|是| F[返回资源]
    C --> B`;

const swimlane = `flowchart TB
    subgraph 用户
        U1[提交订单]
        U2[确认收货]
    end
    subgraph 系统
        S1[校验库存]
        S2[生成物流单]
    end
    subgraph 仓库
        W1[拣货打包]
        W2[发货]
    end
    U1 --> S1 --> W1 --> W2 --> S2 --> U2`;

const pipeline = `flowchart LR
    Src[源数据] --> Clean[清洗]
    Clean --> Feature[特征工程]
    Feature --> Train[模型训练]
    Train --> Eval{评估达标?}
    Eval -->|否| Feature
    Eval -->|是| Deploy[上线部署]
    Deploy --> Monitor[监控回流]
    Monitor --> Train`;

export const templates: DiagramTemplate[] = [
  {
    id: 'default',
    label: 'AI 导购流程（默认）',
    description: '默认示例：多步检索与提案流程。',
    source: defaultDiagram,
  },
  {
    id: 'basic',
    label: '基础流程',
    description: '开始 / 处理 / 判定 / 结束的最小流程。',
    source: basicFlow,
  },
  {
    id: 'decision',
    label: '判定树（横向）',
    description: '从左到右的权限判定分支。',
    source: decisionTree,
  },
  {
    id: 'swimlane',
    label: '分层泳道',
    description: '用 subgraph 表达多角色协作。',
    source: swimlane,
  },
  {
    id: 'pipeline',
    label: '数据管线',
    description: '带回环的训练 / 部署 / 监控管线。',
    source: pipeline,
  },
];
