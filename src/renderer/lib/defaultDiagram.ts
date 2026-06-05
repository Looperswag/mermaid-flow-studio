export const defaultDiagram = `flowchart TD
    A[用户入口] --> B{入口识别}
    B -->|搜索框入口| C1[Search Entry Context Builder]
    B -->|PDP商品页入口| C2[PDP Entry Context Builder]

    C1 --> D[Brain Agent 主控]
    C2 --> D

    D --> E[Intent & Slot Understanding Skill]
    D --> F[User Memory Skill]
    D --> G{Complexity Router}

    G -->|低复杂度| H1[传统搜索/RAG]
    G -->|中复杂度| H2[多路召回+属性过滤+粗排]
    G -->|高复杂度| H3[Agentic Retrieval / 多步检索]

    H1 --> I[Candidate Set]
    H2 --> I
    H3 --> I

    I --> J[Review Intelligence Skill]
    I --> K[Comparison Analyst Skill]
    F --> L[Persona & Purchase Power Summary]
    J --> M[Evidence Pack]
    K --> M
    L --> M

    D --> N[Proposal Composer Skill]
    M --> N

    D --> O[Need Mining Skill]
    N --> P[主理人式提案输出]
    O --> Q[下一轮Sug / Next Best Question]

    P --> R[前端动态渲染]
    Q --> R

    R --> S[用户点击/追问/加购/下单反馈]
    S --> T[训练回流与在线优化]`;
