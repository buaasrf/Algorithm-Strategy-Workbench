
import React from 'react';
import { 
  Play, 
  Settings, 
  Database, 
  Zap, 
  Code, 
  Split, 
  Filter, 
  ArrowRight, 
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Layout,
  Cpu,
  Variable,
  GitBranch,
  PlayCircle,
  StopCircle,
  Edit2,
  Search,
  RefreshCw,
  Layers
} from 'lucide-react';
import { OperatorType } from './types';

export const OPERATOR_METADATA = {
  [OperatorType.START]: {
    label: '用户输入',
    icon: <Database className="w-4 h-4" />,
    color: 'bg-blue-500',
    description: '数据的起始录入点'
  },
  [OperatorType.INPUT]: {
    label: '数据检索',
    icon: <Search className="w-4 h-4" />,
    color: 'bg-emerald-500',
    description: '外部知识库检索'
  },
  [OperatorType.LLM]: {
    label: 'LLM',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-indigo-500',
    description: '大语言模型处理'
  },
  [OperatorType.PYTHON]: {
    label: '代码执行',
    icon: <Code className="w-4 h-4" />,
    color: 'bg-orange-500',
    description: '自定义 Python 逻辑'
  },
  [OperatorType.AB_TEST]: {
    label: 'AB 实验',
    icon: <Split className="w-4 h-4" />,
    color: 'bg-purple-500',
    description: '流量切分测试'
  },
  [OperatorType.IF_ELSE]: {
    label: '条件分支',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'bg-cyan-500',
    description: '基于条件的逻辑分流'
  },
  [OperatorType.FILTER]: {
    label: '逻辑过滤',
    icon: <Filter className="w-4 h-4" />,
    color: 'bg-pink-500',
    description: '过滤不符合条件的数据'
  },
  [OperatorType.TRANSFORMER]: {
    label: '模板转换',
    icon: <Layers className="w-4 h-4" />,
    color: 'bg-blue-400',
    description: '数据格式转换'
  },
  [OperatorType.OUTPUT]: {
    label: '输出响应',
    icon: <ArrowRight className="w-4 h-4" />,
    color: 'bg-slate-700',
    description: '结果返回或存储'
  },
  [OperatorType.END]: {
    label: '结束',
    icon: <StopCircle className="w-4 h-4" />,
    color: 'bg-rose-500',
    description: '流程执行完毕'
  }
};
