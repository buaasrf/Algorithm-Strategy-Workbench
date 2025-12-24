
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  Layout, 
  Settings, 
  ChevronRight, 
  Trash2, 
  Zap, 
  Download, 
  Share2, 
  Cpu, 
  History, 
  Info, 
  Maximize, 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  Edit3, 
  FileJson, 
  Copy, 
  Check, 
  X 
} from 'lucide-react';
import { OperatorType, Node, Edge, Scenario, ExecutionLog, Position } from './types';
import { OPERATOR_METADATA } from './constants';
import { runLLMNode, suggestOptimizations } from './services/geminiService';

// --- Constants for UI (Scaled to ~60%) ---
// Original width was 256 (w-64). 60% is ~154.
const NODE_WIDTH = 154; 
// Original offset was 78. 60% is ~47.
const PORT_Y_OFFSET = 47; 
// Visual horizontal adjustments to match the center of the port circles precisely
const PORT_IN_X_OFFSET = -8;
const PORT_OUT_X_OFFSET = 8;
const SNAP_THRESHOLD = 40;

// --- Helper for SVG Curves ---
const getBezierPath = (start: Position, end: Position) => {
  const dx = Math.abs(end.x - start.x) * 0.5;
  const curvature = Math.max(dx, 30); 
  return `M ${start.x} ${start.y} C ${start.x + curvature} ${start.y}, ${end.x - curvature} ${end.y}, ${end.x} ${end.y}`;
};

// --- Sub-components ---

const SidebarItem: React.FC<{ type: OperatorType; onAdd: (type: OperatorType) => void }> = ({ type, onAdd }) => {
  const meta = OPERATOR_METADATA[type];
  return (
    <div 
      onClick={() => onAdd(type)}
      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:shadow-sm transition-all group"
    >
      <div className={`${meta.color} p-1.5 rounded text-white group-hover:scale-110 transition-transform`}>
        {/* Fix: Added explicit type cast to React.ReactElement<any> to resolve className assignment error */}
        {React.cloneElement(meta.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' })}
      </div>
      <div>
        <p className="text-[12px] font-semibold text-gray-800 leading-tight">{meta.label}</p>
        <p className="text-[10px] text-gray-400 truncate w-32">{meta.description}</p>
      </div>
    </div>
  );
};

const NodeCard: React.FC<{ 
  node: Node; 
  isActive: boolean; 
  onClick: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string, handle?: string) => void;
  onConnectEnd: (id: string) => void;
  isSnapTarget: boolean;
  isConnecting: boolean;
}> = ({ node, isActive, onClick, onEdit, onDelete, onDragStart, onConnectStart, onConnectEnd, isSnapTarget, isConnecting }) => {
  const meta = OPERATOR_METADATA[node.type];
  const isIfElse = node.type === OperatorType.IF_ELSE;
  const isStart = node.type === OperatorType.START;
  const isEnd = node.type === OperatorType.END;
  
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.port') || (e.target as HTMLElement).closest('.action-btn')) return;
        onDragStart(e, node.id);
      }}
      style={{ 
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: `${NODE_WIDTH}px` 
      }}
      className={`absolute bg-white border-2 rounded-lg transition-shadow node-shadow cursor-grab active:cursor-grabbing ${
        isActive ? 'border-indigo-500 ring-2 ring-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`h-1 w-full rounded-t-lg ${meta.color}`} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${meta.color} text-white p-1 rounded shrink-0`}>
              {/* Fix: Added explicit type cast to React.ReactElement<any> to resolve className assignment error */}
              {React.cloneElement(meta.icon as React.ReactElement<any>, { className: 'w-3 h-3' })}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 select-none truncate">
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-0.5 action-btn shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-gray-300 hover:text-indigo-600 p-0.5"
              title="Edit"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="text-gray-300 hover:text-red-500 p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <h3 className="font-semibold text-gray-800 select-none text-[11px] truncate leading-tight" title={node.name}>
          {node.name}
        </h3>
        
        {/* Connection Ports */}
        <div className="flex items-center justify-between mt-3">
          {/* Input Port Hitbox Area */}
          <div className="relative -ml-6 flex items-center justify-center w-8 h-8">
            {!isStart && (
              <div 
                onMouseUp={() => onConnectEnd(node.id)}
                className={`port w-3 h-3 rounded-full border-2 border-white transition-all cursor-crosshair z-20 ${
                  isSnapTarget ? 'bg-indigo-500 scale-125 ring-2 ring-indigo-100 shadow-lg' : 'bg-gray-300 hover:bg-indigo-400'
                }`} 
                title="Input" 
              />
            )}
            {isConnecting && !isStart && (
              <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-pulse border border-indigo-200/50" />
            )}
          </div>

          {/* Output Ports */}
          {!isEnd && (
            !isIfElse ? (
              <div 
                onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id); }}
                className="port w-3 h-3 bg-gray-300 rounded-full border-2 border-white -mr-4.5 hover:bg-indigo-400 hover:scale-125 transition-all cursor-crosshair z-20" 
                title="Output" 
              />
            ) : (
              <div className="flex flex-col gap-2 -mr-4.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[8px] font-bold text-green-500 uppercase">T</span>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'true'); }}
                    className="port w-3 h-3 bg-green-400 rounded-full border-2 border-white hover:bg-green-500 hover:scale-125 transition-all cursor-crosshair z-20" 
                    title="True" 
                  />
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[8px] font-bold text-red-500 uppercase">F</span>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'false'); }}
                    className="port w-3 h-3 bg-red-400 rounded-full border-2 border-white hover:bg-red-500 hover:scale-125 transition-all cursor-crosshair z-20" 
                    title="False" 
                  />
                </div>
              </div>
            )
          )}
        </div>

        {node.status === 'success' && (
          <div className="mt-1.5 text-[8px] text-green-600 font-medium flex items-center gap-0.5">
             <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Success
          </div>
        )}
      </div>
    </div>
  );
};

// --- Protocol Modal ---

const ProtocolModal: React.FC<{ scenario: Scenario; isOpen: boolean; onClose: () => void }> = ({ scenario, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const jsonStr = useMemo(() => JSON.stringify(scenario, null, 2), [scenario]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">DAG Protocol</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Debug Sync Payload</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all font-bold text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <pre className="text-[10px] text-amber-400 font-mono leading-relaxed select-all">
            {jsonStr}
          </pre>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [scenario, setScenario] = useState<Scenario>({
    id: 'sc-1',
    name: 'Algorithm Strategy Workbench',
    description: 'Dynamic strategy flow builder',
    nodes: [],
    edges: [],
    updatedAt: new Date().toISOString()
  });

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [aiTips, setAiTips] = useState<string>('');

  // Interaction State
  const [zoom, setZoom] = useState(1);
  const [draggingNode, setDraggingNode] = useState<{ id: string, startNodePos: Position, startMousePos: Position } | null>(null);
  const [panning, setPanning] = useState<{ startOffset: Position, startMousePos: Position } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<Position>({ x: 0, y: 0 });
  
  const [connecting, setConnecting] = useState<{ fromId: string, fromHandle?: string, currentPos: Position } | null>(null);
  const [snapNodeId, setSnapNodeId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const editingNode = useMemo(() => 
    scenario.nodes.find(n => n.id === editingNodeId) || null
  , [scenario.nodes, editingNodeId]);

  const getPortPos = useCallback((nodeId: string, type: 'in' | 'out', handle?: string): Position => {
    const node = scenario.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    if (type === 'in') {
      return { 
        x: node.position.x + PORT_IN_X_OFFSET, 
        y: node.position.y + PORT_Y_OFFSET 
      };
    } else {
      let yFinal = node.position.y + PORT_Y_OFFSET;
      if (node.type === OperatorType.IF_ELSE) {
        // True handle is higher, False handle is lower - scaled offsets
        yFinal = handle === 'true' ? node.position.y + PORT_Y_OFFSET - 9 : node.position.y + PORT_Y_OFFSET + 11;
      }
      return { 
        x: node.position.x + NODE_WIDTH + PORT_OUT_X_OFFSET, 
        y: yFinal 
      };
    }
  }, [scenario.nodes]);

  const createEdge = useCallback((fromId: string, toId: string, fromHandle?: string) => {
    if (fromId === toId) return;
    setScenario(prev => {
      const exists = prev.edges.some(e => e.source === fromId && e.target === toId && e.sourceHandle === fromHandle);
      if (exists) return prev;
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: fromId,
        target: toId,
        sourceHandle: fromHandle
      };
      return { ...prev, edges: [...prev.edges, newEdge], updatedAt: new Date().toISOString() };
    });
  }, []);

  const addNode = (type: OperatorType) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = rect ? ((rect.width / 2) - canvasOffset.x) / zoom - (NODE_WIDTH / 2) : 100;
    const y = rect ? ((rect.height / 2) - canvasOffset.y) / zoom - 40 : 150;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      name: `${OPERATOR_METADATA[type].label}`,
      position: { x, y },
      config: type === OperatorType.AB_TEST ? { split: 50 } : type === OperatorType.IF_ELSE ? { expression: 'input > 100' } : {},
      status: 'idle'
    };
    setScenario(prev => ({ ...prev, nodes: [...prev.nodes, newNode], updatedAt: new Date().toISOString() }));
    setEditingNodeId(null);
  };

  const updateNode = useCallback((updates: Partial<Node>) => {
    if (!editingNodeId) return;
    setScenario(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === editingNodeId ? { ...n, ...updates } : n),
      updatedAt: new Date().toISOString()
    }));
  }, [editingNodeId]);

  const deleteNode = (id: string) => {
    setScenario(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.source !== id && e.target !== id),
      updatedAt: new Date().toISOString()
    }));
    if (editingNodeId === id) setEditingNodeId(null);
    if (activeNodeId === id) setActiveNodeId(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      setPanning({
        startOffset: { ...canvasOffset },
        startMousePos: { x: e.clientX, y: e.clientY }
      });
      setActiveNodeId(null);
      setEditingNodeId(null);
    }
  };

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    const node = scenario.nodes.find(n => n.id === id);
    if (!node) return;
    setDraggingNode({
      id,
      startNodePos: { ...node.position },
      startMousePos: { x: e.clientX, y: e.clientY }
    });
    setActiveNodeId(id);
    setEditingNodeId(null); 
  };

  const handleConnectStart = (e: React.MouseEvent, id: string, handle?: string) => {
    const pos = getPortPos(id, 'out', handle);
    setConnecting({ fromId: id, fromHandle: handle, currentPos: pos });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startMousePos.x) / zoom;
      const dy = (e.clientY - draggingNode.startMousePos.y) / zoom;
      setScenario(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === draggingNode.id ? { 
          ...n, 
          position: { x: draggingNode.startNodePos.x + dx, y: draggingNode.startNodePos.y + dy } 
        } : n)
      }));
    } else if (panning) {
      const dx = e.clientX - panning.startMousePos.x;
      const dy = e.clientY - panning.startMousePos.y;
      setCanvasOffset({
        x: panning.startOffset.x + dx,
        y: panning.startOffset.y + dy
      });
    } else if (connecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - canvasOffset.x) / zoom;
        const mouseY = (e.clientY - rect.top - canvasOffset.y) / zoom;
        let snappedId = null;
        let finalPos = { x: mouseX, y: mouseY };
        for (const node of scenario.nodes) {
          if (node.id === connecting.fromId || node.type === OperatorType.START) continue;
          const inPort = getPortPos(node.id, 'in');
          const dist = Math.hypot(mouseX - inPort.x, mouseY - inPort.y);
          if (dist < SNAP_THRESHOLD / zoom) {
            snappedId = node.id;
            finalPos = inPort;
            break;
          }
        }
        setConnecting({ ...connecting, currentPos: finalPos });
        setSnapNodeId(snappedId);
      }
    }
  };

  const handleMouseUp = () => {
    if (connecting && snapNodeId) {
      createEdge(connecting.fromId, snapNodeId, connecting.fromHandle);
    }
    setDraggingNode(null);
    setPanning(null);
    setConnecting(null);
    setSnapNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = 1.05;
      const newZoom = delta > 0 ? zoom * factor : zoom / factor;
      setZoom(Math.min(Math.max(newZoom, 0.1), 3));
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setLogs([]);
    for (const node of scenario.nodes) {
      setScenario(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: 'running' } : n)
      }));
      await new Promise(r => setTimeout(r, 400));
      setLogs(prev => [...prev, {
        id: `log-${Date.now()}`,
        nodeId: node.id,
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        message: `Processed: ${node.name}`
      }]);
      setScenario(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: 'success' } : n)
      }));
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none tracking-tight">AlgoStrat</h1>
            <p className="text-[9px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">Workbench v2.5</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsProtocolOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-amber-600 hover:bg-amber-50 rounded-lg font-semibold transition-all border border-amber-100 text-xs"
          >
            <FileJson className="w-3.5 h-3.5" />
            Protocol
          </button>
          <button onClick={() => suggestOptimizations(JSON.stringify(scenario)).then(setAiTips)} className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-all border border-indigo-100 text-xs">
            <Zap className="w-3.5 h-3.5 fill-current" />
            AI Optimize
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button onClick={handleRun} disabled={isRunning || scenario.nodes.length === 0} className={`flex items-center gap-2 px-5 py-1.5 rounded-lg font-bold shadow-lg transition-all text-xs ${isRunning ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100'} text-white`}>
            {isRunning ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Run
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-56 bg-white border-r border-gray-200 p-3 z-10 flex flex-col gap-5 shadow-xl shadow-gray-200/50 overflow-y-auto">
          <div>
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Flow Control</h3>
            <div className="flex flex-col gap-1.5">
              {[OperatorType.START, OperatorType.END].map(t => (
                <SidebarItem key={t} type={t} onAdd={addNode} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Processing</h3>
            <div className="flex flex-col gap-1.5">
              {[OperatorType.INPUT, OperatorType.LLM, OperatorType.PYTHON, OperatorType.IF_ELSE, OperatorType.AB_TEST, OperatorType.TRANSFORMER, OperatorType.OUTPUT].map(t => (
                <SidebarItem key={t} type={t} onAdd={addNode} />
              ))}
            </div>
          </div>
        </aside>

        <main 
          ref={canvasRef} 
          className="flex-1 relative overflow-hidden bg-gray-50 canvas-grid cursor-default" 
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          <div 
            className="absolute inset-0 pointer-events-none origin-top-left" 
            style={{ 
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                transition: panning ? 'none' : 'transform 0.05s ease-out'
            }}
          >
            <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0 overflow-visible">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#94a3b8" /></marker>
                <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#6366f1" /></marker>
              </defs>
              {scenario.edges.map(edge => {
                const start = getPortPos(edge.source, 'out', edge.sourceHandle);
                const end = getPortPos(edge.target, 'in');
                const strokeColor = edge.sourceHandle === 'true' ? '#22c55e' : edge.sourceHandle === 'false' ? '#ef4444' : '#cbd5e1';
                return (
                  <g key={edge.id} className="pointer-events-auto">
                    <path d={getBezierPath(start, end)} fill="none" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrowhead)" className="transition-all hover:stroke-indigo-300" />
                    <path d={getBezierPath(start, end)} fill="none" stroke="transparent" strokeWidth="10" className="cursor-pointer hover:stroke-red-400/10" onClick={(e) => { e.stopPropagation(); setScenario(prev => ({ ...prev, edges: prev.edges.filter(er => er.id !== edge.id) })); }} />
                  </g>
                );
              })}
              {connecting && (
                <path d={getBezierPath(getPortPos(connecting.fromId, 'out', connecting.fromHandle), connecting.currentPos)} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="5,3" markerEnd="url(#arrowhead-active)" filter="url(#glow)" />
              )}
            </svg>
            <div className="absolute inset-0 pointer-events-none z-10">
              {scenario.nodes.map(node => (
                <div key={node.id} className="pointer-events-auto">
                  <NodeCard 
                    node={node} 
                    isActive={activeNodeId === node.id} 
                    onClick={() => setActiveNodeId(node.id)} 
                    onEdit={() => setEditingNodeId(node.id)}
                    onDelete={deleteNode} 
                    onDragStart={handleDragStart} 
                    onConnectStart={handleConnectStart} 
                    onConnectEnd={(id) => { if (connecting) { createEdge(connecting.fromId, id, connecting.fromHandle); setConnecting(null); setSnapNodeId(null); } }} 
                    isSnapTarget={snapNodeId === node.id} 
                    isConnecting={!!connecting} 
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute top-4 left-4 flex items-center gap-1.5 z-20 pointer-events-none">
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-md pointer-events-auto">
              <button onClick={() => setZoom(prev => Math.min(prev * 1.1, 3))} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setZoom(prev => Math.max(prev / 1.1, 0.1))} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md"><ZoomOut className="w-3.5 h-3.5" /></button>
              <button onClick={() => {setCanvasOffset({ x: 0, y: 0 }); setZoom(1);}} className="p-1.5 text-gray-400 hover:text-gray-600" title="Reset"><Maximize className="w-3.5 h-3.5" /></button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-md flex items-center gap-1.5 pointer-events-auto">
               <span className="text-[9px] font-bold text-gray-400 uppercase">Zoom:</span>
               <span className="text-[9px] font-mono text-indigo-600 font-bold">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {aiTips && (
            <div className="absolute bottom-4 left-4 max-w-xs bg-white border border-indigo-100 rounded-xl p-4 shadow-xl z-20 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs"><Zap className="w-3.5 h-3.5 fill-indigo-100" />Optimization</div>
                <button onClick={() => setAiTips('')} className="text-gray-400 hover:text-gray-600 p-0.5">×</button>
              </div>
              <div className="text-[10px] text-gray-600 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-1">{aiTips}</div>
            </div>
          )}
        </main>
        
        <SettingsPanel node={editingNode} onUpdate={updateNode} onClose={() => setEditingNodeId(null)} />
      </div>

      <ProtocolModal 
        scenario={scenario} 
        isOpen={isProtocolOpen} 
        onClose={() => setIsProtocolOpen(false)} 
      />
    </div>
  );
}

const SettingsPanel: React.FC<{ 
  node: Node | null; 
  onUpdate: (updates: Partial<Node>) => void;
  onClose: () => void;
}> = ({ node, onUpdate, onClose }) => {
  if (!node) return null;
  const meta = OPERATOR_METADATA[node.type];
  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col animate-in slide-in-from-right duration-200 z-30 shadow-2xl overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Config</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg">×</button>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className={`${meta.color} p-2 rounded-lg text-white shadow-md`}>
            {/* Fix: Added explicit type cast to React.ReactElement<any> to resolve className assignment error */}
            {React.cloneElement(meta.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{meta.label}</p>
            <p className="text-[9px] font-mono text-gray-400 truncate">{node.id}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <section>
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Label</label>
          <input type="text" value={node.name} onChange={(e) => onUpdate({ name: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium text-xs" />
        </section>
        
        {node.type === OperatorType.LLM && (
          <section>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">System Prompt</label>
            <textarea rows={6} value={node.config.prompt || ''} onChange={(e) => onUpdate({ config: { ...node.config, prompt: e.target.value }})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 outline-none text-xs leading-relaxed" placeholder="Instructions..." />
          </section>
        )}
        
        {node.type === OperatorType.IF_ELSE && (
          <section>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Expression (JS)</label>
            <div className="bg-gray-900 rounded-lg p-3">
              <textarea rows={3} value={node.config.expression || ''} onChange={(e) => onUpdate({ config: { ...node.config, expression: e.target.value }})} className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-amber-400 font-mono text-[10px]" placeholder="e.g. input.score > 0.8" />
            </div>
          </section>
        )}
        
        {node.type === OperatorType.PYTHON && (
          <section>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Script</label>
            <div className="bg-[#1e1e2e] rounded-lg p-3 font-mono text-[10px] border border-gray-800 shadow-inner">
              <textarea rows={10} spellCheck={false} value={node.config.code || 'def solve(input):\n    return input'} onChange={(e) => onUpdate({ config: { ...node.config, code: e.target.value }})} className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-[#a6adc8]" />
            </div>
          </section>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-xs">
          Save & Close
        </button>
      </div>
    </div>
  );
};
