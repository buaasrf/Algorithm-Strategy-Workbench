
import React from 'react';
import { 
  Database, Zap, Code, Split, Filter, ArrowRight, Search, RefreshCw, Layers, GitBranch, StopCircle
} from 'lucide-react';
import { OperatorType } from './types';

export interface OperatorMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export const OPERATOR_METADATA: Record<OperatorType, OperatorMeta> = {
  [OperatorType.START]: {
    label: '开始/用户输入',
    icon: <Database className="w-4 h-4" />,
    color: 'bg-blue-600',
    description: '策略流程的起点，定义输入参数'
  },
  [OperatorType.INPUT]: {
    label: '数据检索',
    icon: <Search className="w-4 h-4" />,
    color: 'bg-emerald-500',
    description: '从外部知识库或 API 获取实时数据'
  },
  [OperatorType.LLM]: {
    label: '大模型处理',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-indigo-600',
    description: '使用 Gemini 进行文本理解与决策生成'
  },
  [OperatorType.PYTHON]: {
    label: '代码脚本',
    icon: <Code className="w-4 h-4" />,
    color: 'bg-orange-500',
    description: '执行复杂的自定义 Python 数值计算逻辑'
  },
  [OperatorType.AB_TEST]: {
    label: 'AB 流量实验',
    icon: <Split className="w-4 h-4" />,
    color: 'bg-purple-600',
    description: '按比例分配流量，验证不同策略效果'
  },
  [OperatorType.IF_ELSE]: {
    label: '条件分支',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'bg-cyan-600',
    description: '基于布尔表达式进行逻辑分流判断'
  },
  [OperatorType.FILTER]: {
    label: '逻辑过滤',
    icon: <Filter className="w-4 h-4" />,
    color: 'bg-pink-600',
    description: '剔除不符合当前策略要求的异常样本'
  },
  [OperatorType.TRANSFORMER]: {
    label: '格式转换',
    icon: <Layers className="w-4 h-4" />,
    color: 'bg-blue-400',
    description: '对算子间的数据格式进行映射与对齐'
  },
  [OperatorType.OUTPUT]: {
    label: '结果输出',
    icon: <ArrowRight className="w-4 h-4" />,
    color: 'bg-slate-700',
    description: '策略运行终点，返回决策结果'
  },
  [OperatorType.END]: {
    label: '流程结束',
    icon: <StopCircle className="w-4 h-4" />,
    color: 'bg-rose-500',
    description: '显式声明策略流程在当前路径终止'
  }
};
