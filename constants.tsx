
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
  Edit2
} from 'lucide-react';
import { OperatorType } from './types';

export const OPERATOR_METADATA = {
  [OperatorType.START]: {
    label: 'Start Execution',
    icon: <PlayCircle className="w-4 h-4" />,
    color: 'bg-emerald-500',
    description: 'The starting point of the logic'
  },
  [OperatorType.INPUT]: {
    label: 'Input Source',
    icon: <Database className="w-4 h-4" />,
    color: 'bg-blue-500',
    description: 'Entry point for data'
  },
  [OperatorType.LLM]: {
    label: 'Gemini LLM',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-indigo-500',
    description: 'Advanced reasoning & text generation'
  },
  [OperatorType.PYTHON]: {
    label: 'Python Script',
    icon: <Code className="w-4 h-4" />,
    color: 'bg-green-600',
    description: 'Custom logic and processing'
  },
  [OperatorType.AB_TEST]: {
    label: 'A/B Test',
    icon: <Split className="w-4 h-4" />,
    color: 'bg-purple-500',
    description: 'Split traffic between variants'
  },
  [OperatorType.IF_ELSE]: {
    label: 'If-Else Condition',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'bg-amber-500',
    description: 'Branching logic based on expression'
  },
  [OperatorType.FILTER]: {
    label: 'Logic Filter',
    icon: <Filter className="w-4 h-4" />,
    color: 'bg-orange-500',
    description: 'Conditional flow control'
  },
  [OperatorType.TRANSFORMER]: {
    label: 'Transformer',
    icon: <Variable className="w-4 h-4" />,
    color: 'bg-pink-500',
    description: 'Data structure manipulation'
  },
  [OperatorType.OUTPUT]: {
    label: 'Output Sink',
    icon: <ArrowRight className="w-4 h-4" />,
    color: 'bg-gray-700',
    description: 'Result storage or response'
  },
  [OperatorType.END]: {
    label: 'End Execution',
    icon: <StopCircle className="w-4 h-4" />,
    color: 'bg-rose-500',
    description: 'Final state of the flow'
  }
};
