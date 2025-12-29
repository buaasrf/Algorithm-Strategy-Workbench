
import React from 'react';
import { 
  Database, Cpu, GitBranch, Layers, StopCircle, Zap, Code, Split, Filter, ArrowRight, Search, StopCircle as StopIcon
} from 'lucide-react';
import { OperatorType } from './types';

export interface CategoryMeta {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const CATEGORY_METADATA: Record<string, CategoryMeta> = {
  entry: {
    id: 'entry',
    label: '入口算子',
    icon: <Database className="w-4 h-4" />,
    color: 'bg-blue-600',
  },
  logic: {
    id: 'logic',
    label: '逻辑引擎',
    icon: <Cpu className="w-4 h-4" />,
    color: 'bg-indigo-600',
  },
  flow: {
    id: 'flow',
    label: '流程控制',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'bg-purple-600',
  },
  data: {
    id: 'data',
    label: '数据加工',
    icon: <Layers className="w-4 h-4" />,
    color: 'bg-emerald-500',
  },
  terminal: {
    id: 'terminal',
    label: '终止算子',
    icon: <StopCircle className="w-4 h-4" />,
    color: 'bg-slate-700',
  },
};

export interface OperatorMeta {
  label: string;
  category: string;
  description: string;
}

export const OPERATOR_METADATA: Record<OperatorType, OperatorMeta> = {
  [OperatorType.START]: {
    label: '策略开始',
    category: 'entry',
    description: '策略流程的起点，定义输入参数'
  },
  [OperatorType.INPUT]: {
    label: '数据检索',
    category: 'entry',
    description: '从外部知识库或 API 获取实时数据'
  },
  [OperatorType.LLM]: {
    label: '大模型决策',
    category: 'logic',
    description: '使用 Gemini 进行文本理解与决策生成'
  },
  [OperatorType.PYTHON]: {
    label: '代码脚本',
    category: 'logic',
    description: '执行复杂的自定义 Python 数值计算逻辑'
  },
  [OperatorType.AB_TEST]: {
    label: 'AB 实验',
    category: 'flow',
    description: '按比例分配流量，验证不同策略效果'
  },
  [OperatorType.IF_ELSE]: {
    label: '条件分支',
    category: 'flow',
    description: '基于布尔表达式进行逻辑分流判断'
  },
  [OperatorType.FILTER]: {
    label: '逻辑过滤',
    category: 'data',
    description: '剔除不符合当前策略要求的异常样本'
  },
  [OperatorType.TRANSFORMER]: {
    label: '数据转换',
    category: 'data',
    description: '对算子间的数据格式进行映射与对齐'
  },
  [OperatorType.OUTPUT]: {
    label: '策略输出',
    category: 'terminal',
    description: '策略运行终点，返回决策结果'
  },
  [OperatorType.END]: {
    label: '流程终止',
    category: 'terminal',
    description: '显式声明策略流程在当前路径终止'
  }
};
