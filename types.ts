
export enum OperatorType {
  START = 'START',
  INPUT = 'INPUT',
  LLM = 'LLM',
  PYTHON = 'PYTHON',
  AB_TEST = 'AB_TEST',
  FILTER = 'FILTER',
  IF_ELSE = 'IF_ELSE',
  TRANSFORMER = 'TRANSFORMER',
  OUTPUT = 'OUTPUT',
  END = 'END'
}

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: OperatorType;
  name: string;
  position: Position;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // e.g., 'true' or 'false' for IF_ELSE
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  nodeId: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}
