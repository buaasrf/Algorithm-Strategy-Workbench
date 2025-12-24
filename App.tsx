
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
  X,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { OperatorType, Node, Edge, Scenario, ExecutionLog, Position } from './types';
import { OPERATOR_METADATA } from './constants';
import { runLLMNode, suggestOptimizations } from './services/geminiService';

// --- UI Constants ---
const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;
const IF_ELSE_HEIGHT = 86;
const PORT_SIZE = 6;
const SNAP_THRESHOLD = 30;

// --- Helper for Curves ---
const getBezierPath = (start: Position, end: Position) => {
  const dx = Math.abs(end.x - start.x) * 0.4;
  const curvature = Math.max(dx, 40); 
  return `M ${start.x} ${start.y} C ${start.x + curvature} ${start.y}, ${end.x - curvature} ${end.y}, ${end.x} ${end.y}`;
};

// --- Sub-components ---

const SidebarItem: React.FC<{ type: OperatorType; onAdd: (type: OperatorType) => void }> = ({ type, onAdd }) => {
  const meta = OPERATOR_METADATA[type];
  return (
    <div 
      onClick={() => onAdd(type)}
      className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className={`${meta.color} p-2 rounded-lg text-white group-hover:scale-110 transition-transform shadow-sm`}>
        {React.cloneElement(meta.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
      </div>
      <div>
        <p className="text-[13px] font-bold text-gray-700 leading-none mb-1">{meta.label}</p>
        <p className="text-[10px] text-gray-400 truncate w-32">{meta.description}</p>
      </div>
    </div>
  );
};

const NodeCard: React.FC<{ 
  node: Node; 
  isActive: boolean; 
  isDragging: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string, handle?: string) => void;
  onConnectEnd: (id: string) => void;
  isSnapTarget: boolean;
  isConnecting: boolean;
}> = ({ node, isActive, isDragging, onClick, onEdit, onDelete, onDragStart, onConnectStart, onConnectEnd, isSnapTarget, isConnecting }) => {
  const meta = OPERATOR_METADATA[node.type];
  const isIfElse = node.type === OperatorType.IF_ELSE;
  const isStart = node.type === OperatorType.START;
  const isEnd = node.type === OperatorType.END;
  
  const height = isIfElse ? IF_ELSE_HEIGHT : NODE_HEIGHT;

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => {
        // Prevent drag when clicking actions or ports
        if ((e.target as HTMLElement).closest('.port') || (e.target as HTMLElement).closest('.action-btn')) return;
        onDragStart(e, node.id);
      }}
      style={{ 
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: `${NODE_WIDTH}px`,
        height: `${height}px`,
        willChange: 'transform', // Hardware acceleration
      }}
      className={`absolute bg-white rounded-2xl border cursor-grab active:cursor-grabbing node-shadow ${
        isActive ? 'border-blue-500 ring-4 ring-blue-500/10 z-30' : 'border-gray-50 hover:border-gray-200 z-20'
      } ${isDragging ? 'opacity-90 shadow-2xl scale-[1.02]' : 'transition-[border,box-shadow,transform] duration-200'}`}
    >
      <div className="flex items-center h-full px-3 relative">
        <div className={`${meta.color} w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm`}>
          {React.cloneElement(meta.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
        </div>
        
        <div className="ml-3 flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-800 truncate select-none">{node.name}</span>
          </div>
          {isIfElse && (
            <div className="mt-2 flex flex-col gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-right pr-1 select-none">
              <span className="h-4">IF</span>
              <span className="h-4">ELSE</span>
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity action-btn">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="bg-white border border-gray-200 p-1.5 rounded-lg text-gray-400 hover:text-blue-500 shadow-sm transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="bg-white border border-gray-200 p-1.5 rounded-lg text-gray-400 hover:text-red-500 shadow-sm transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>

        {/* Status */}
        {(node.status && node.status !== 'idle') && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
             <div className={`w-2 h-2 rounded-full ${
               node.status === 'success' ? 'bg-green-500' : 
               node.status === 'running' ? 'bg-blue-500 animate-pulse' : 
               'bg-red-500'
             }`} />
          </div>
        )}

        {/* Ports */}
        {!isStart && (
          <div 
            onMouseUp={() => onConnectEnd(node.id)}
            className={`port absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-40 cursor-crosshair transition-transform ${
              isSnapTarget ? 'bg-blue-500 scale-150' : 'bg-blue-400 hover:scale-125'
            }`} 
          />
        )}
        
        {!isEnd && !isIfElse && (
          <div 
            onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id); }}
            className="port absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-400 shadow-sm z-40 cursor-crosshair hover:scale-125 transition-transform" 
          />
        )}

        {isIfElse && (
          <>
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'true'); }}
              className="port absolute right-0 top-[35%] -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-400 shadow-sm z-40 cursor-crosshair hover:scale-125 transition-transform" 
            />
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'false'); }}
              className="port absolute right-0 top-[78%] -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-400 shadow-sm z-40 cursor-crosshair hover:scale-125 transition-transform" 
            />
          </>
        )}
      </div>
    </div>
  );
};

// --- Protocol Modal ---

const ProtocolModal: React.FC<{ scenario: Scenario; isOpen: boolean; onClose: () => void }> = ({ scenario, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const jsonStr = useMemo(() => JSON.stringify(scenario, null, 2), [scenario]);
  const handleCopy = () => { navigator.clipboard.writeText(jsonStr); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><FileJson className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">DAG 协议调试</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Payload Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-bold text-xs shadow-lg shadow-blue-100">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制配置'}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <pre className="text-[11px] text-slate-700 font-mono leading-relaxed select-all">{jsonStr}</pre>
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
  const [aiTips, setAiTips] = useState<string>('');

  const [zoom, setZoom] = useState(1);
  const [draggingNode, setDraggingNode] = useState<{ id: string, startNodePos: Position, startMousePos: Position } | null>(null);
  const [panning, setPanning] = useState<{ startOffset: Position, startMousePos: Position } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<Position>({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ fromId: string, fromHandle?: string, currentPos: Position } | null>(null);
  const [snapNodeId, setSnapNodeId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const editingNode = useMemo(() => scenario.nodes.find(n => n.id === editingNodeId) || null, [scenario.nodes, editingNodeId]);

  const getPortPos = useCallback((nodeId: string, type: 'in' | 'out', handle?: string): Position => {
    const node = scenario.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const h = node.type === OperatorType.IF_ELSE ? IF_ELSE_HEIGHT : NODE_HEIGHT;
    
    if (type === 'in') {
      return { x: node.position.x, y: node.position.y + h / 2 };
    } else {
      if (node.type === OperatorType.IF_ELSE) {
        const yOffset = handle === 'true' ? h * 0.35 : h * 0.78;
        return { x: node.position.x + NODE_WIDTH, y: node.position.y + yOffset };
      }
      return { x: node.position.x + NODE_WIDTH, y: node.position.y + h / 2 };
    }
  }, [scenario.nodes]);

  const createEdge = useCallback((fromId: string, toId: string, fromHandle?: string) => {
    if (fromId === toId) return;
    setScenario(prev => {
      if (prev.edges.some(e => e.source === fromId && e.target === toId && e.sourceHandle === fromHandle)) return prev;
      return { 
        ...prev, 
        edges: [...prev.edges, { id: `edge-${Date.now()}`, source: fromId, target: toId, sourceHandle: fromHandle }],
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const addNode = (type: OperatorType) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = rect ? ((rect.width / 2) - canvasOffset.x) / zoom - (NODE_WIDTH / 2) : 100;
    const y = rect ? ((rect.height / 2) - canvasOffset.y) / zoom - 20 : 150;
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      name: OPERATOR_METADATA[type].label,
      position: { x, y },
      config: {},
      status: 'idle'
    };
    setScenario(prev => ({ ...prev, nodes: [...prev.nodes, newNode], updatedAt: new Date().toISOString() }));
    setActiveNodeId(newNode.id);
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

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setScenario(prev => ({ ...prev, nodes: prev.nodes.map(n => ({ ...n, status: 'idle' })) }));

    const startNodes = scenario.nodes.filter(n => n.type === OperatorType.START);
    const queue = [...startNodes];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;

      setScenario(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: 'running' } : n) }));
      try {
        if (node.type === OperatorType.LLM) {
          await runLLMNode(node.config.prompt || 'Summarize progress.', { history: [] });
        } else {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        setScenario(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: 'success' } : n) }));
        visited.add(node.id);
        const downstreamEdges = scenario.edges.filter(e => e.source === node.id);
        for (const edge of downstreamEdges) {
          const targetNode = scenario.nodes.find(n => n.id === edge.target);
          if (targetNode && !visited.has(targetNode.id)) queue.push(targetNode);
        }
      } catch (err) {
        setScenario(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: 'error' } : n) }));
        break; 
      }
    }
    setIsRunning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const deltaX = (e.clientX - draggingNode.startMousePos.x) / zoom;
      const deltaY = (e.clientY - draggingNode.startMousePos.y) / zoom;
      
      setScenario(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === draggingNode.id ? { 
          ...n, 
          position: { 
            x: draggingNode.startNodePos.x + deltaX,
            y: draggingNode.startNodePos.y + deltaY
          } 
        } : n)
      }));
    } else if (panning) {
      setCanvasOffset({
        x: panning.startOffset.x + (e.clientX - panning.startMousePos.x),
        y: panning.startOffset.y + (e.clientY - panning.startMousePos.y)
      });
    } else if (connecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (e.clientX - rect.left - canvasOffset.x) / zoom;
        const my = (e.clientY - rect.top - canvasOffset.y) / zoom;
        let snapped = null;
        let finalPos = { x: mx, y: my };
        for (const node of scenario.nodes) {
          if (node.id === connecting.fromId || node.type === OperatorType.START) continue;
          const inPort = getPortPos(node.id, 'in');
          if (Math.hypot(mx - inPort.x, my - inPort.y) < SNAP_THRESHOLD / zoom) { snapped = node.id; finalPos = inPort; break; }
        }
        setConnecting({ ...connecting, currentPos: finalPos });
        setSnapNodeId(snapped);
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

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-white text-slate-900 overflow-hidden select-none font-medium" 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp}
    >
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-xl text-white shadow-lg shadow-blue-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none tracking-tight">AlgoStrat</h1>
            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest leading-none">Strategy Workbench</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProtocolOpen(true)} className="flex items-center gap-2 px-4 py-1.5 text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all text-xs border border-blue-50">调试协议</button>
          <button onClick={() => suggestOptimizations(JSON.stringify(scenario)).then(setAiTips)} className="flex items-center gap-2 px-4 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold transition-all border border-indigo-50 text-xs"><Zap className="w-3.5 h-3.5 fill-current" /> AI 优化建议</button>
          <div className="w-px h-6 bg-gray-100 mx-1" />
          <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-2 px-6 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all text-xs">
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 
            运行编排
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative bg-[#f4f6f8]">
        <aside className="w-64 bg-white border-r border-gray-100 p-4 z-40 flex flex-col gap-6 shadow-xl shadow-slate-200/20 overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">流程算子</h3>
            <div className="flex flex-col gap-2">
              {[OperatorType.START, OperatorType.INPUT, OperatorType.LLM, OperatorType.IF_ELSE, OperatorType.PYTHON, OperatorType.TRANSFORMER, OperatorType.OUTPUT].map(t => (
                <SidebarItem key={t} type={t} onAdd={addNode} />
              ))}
            </div>
          </div>
        </aside>

        <main 
          ref={canvasRef} 
          className="flex-1 relative overflow-hidden canvas-grid cursor-default" 
          onMouseDown={(e) => { 
            if (e.target === canvasRef.current) { 
              setPanning({ startOffset: { ...canvasOffset }, startMousePos: { x: e.clientX, y: e.clientY } }); 
              setActiveNodeId(null); 
              setEditingNodeId(null); 
            } 
          }}
          onWheel={(e) => { 
            if (e.ctrlKey || e.metaKey) { 
              e.preventDefault(); 
              const factor = e.deltaY > 0 ? 0.92 : 1.08;
              setZoom(z => Math.min(Math.max(z * factor, 0.2), 2)); 
            } 
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none origin-top-left" 
            style={{ 
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              willChange: 'transform',
              transition: (panning || draggingNode) ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <svg className="absolute inset-0 w-[8000px] h-[8000px] pointer-events-none z-0 overflow-visible">
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#cbd5e1" /></marker>
              </defs>
              {scenario.edges.map(edge => {
                const start = getPortPos(edge.source, 'out', edge.sourceHandle);
                const end = getPortPos(edge.target, 'in');
                return (
                  <g key={edge.id} className="pointer-events-auto">
                    <path d={getBezierPath(start, end)} fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" className="hover:stroke-blue-400 transition-colors" />
                    <path d={getBezierPath(start, end)} fill="none" stroke="transparent" strokeWidth="10" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setScenario(prev => ({ ...prev, edges: prev.edges.filter(er => er.id !== edge.id) })); }} />
                  </g>
                );
              })}
              {connecting && <path d={getBezierPath(getPortPos(connecting.fromId, 'out', connecting.fromHandle), connecting.currentPos)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" className="animate-pulse" />}
            </svg>
            <div className="absolute inset-0 pointer-events-none z-10">
              {scenario.nodes.map(node => (
                <div key={node.id} className="pointer-events-auto group">
                  <NodeCard 
                    node={node} 
                    isActive={activeNodeId === node.id} 
                    isDragging={draggingNode?.id === node.id}
                    onClick={() => setActiveNodeId(node.id)} 
                    onEdit={() => setEditingNodeId(node.id)} 
                    onDelete={deleteNode} 
                    onDragStart={(e, id) => { 
                      setDraggingNode({ id, startNodePos: { ...node.position }, startMousePos: { x: e.clientX, y: e.clientY } }); 
                      setActiveNodeId(id); 
                      setEditingNodeId(null); 
                    }} 
                    onConnectStart={(e, id, handle) => setConnecting({ fromId: id, fromHandle: handle, currentPos: getPortPos(id, 'out', handle) })} 
                    onConnectEnd={(id) => { if (connecting) { createEdge(connecting.fromId, id, connecting.fromHandle); setConnecting(null); } }} 
                    isSnapTarget={snapNodeId === node.id} 
                    isConnecting={!!connecting} 
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6 flex items-center gap-2 z-50 pointer-events-none">
            <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex shadow-xl pointer-events-auto">
              <button onClick={() => setZoom(prev => Math.min(prev * 1.1, 2))} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => setZoom(prev => Math.max(prev / 1.1, 0.2))} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><ZoomOut className="w-4 h-4" /></button>
              <button onClick={() => {setCanvasOffset({ x: 0, y: 0 }); setZoom(1);}} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Maximize className="w-4 h-4" /></button>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-xl flex items-center gap-2 pointer-events-auto">
               <span className="text-[10px] font-bold text-gray-400 uppercase">缩放</span>
               <span className="text-[10px] font-mono text-blue-600 font-bold">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {aiTips && (
            <div className="absolute bottom-6 left-6 max-w-sm bg-white border border-indigo-100 rounded-3xl p-6 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm"><Zap className="w-4 h-4 fill-indigo-100" /> AI 策略优化</div>
                <button onClick={() => setAiTips('')} className="text-gray-400 hover:text-gray-600 p-1 bg-slate-50 rounded-lg">×</button>
              </div>
              <div className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2">{aiTips}</div>
            </div>
          )}
        </main>
        
        <SettingsPanel node={editingNode} onUpdate={updateNode} onClose={() => setEditingNodeId(null)} />
      </div>
      <ProtocolModal scenario={scenario} isOpen={isProtocolOpen} onClose={() => setIsProtocolOpen(false)} />
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
    <div className="w-[400px] bg-white border-l border-gray-100 h-full flex flex-col animate-in slide-in-from-right duration-300 z-[60] shadow-2xl">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${meta.color} p-2 rounded-xl text-white shadow-sm`}>{meta.icon}</div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{meta.label}</h2>
            <p className="text-[10px] text-slate-400 font-mono">{node.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-all">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <section>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">算子名称</label>
          <input type="text" value={node.name} onChange={(e) => onUpdate({ name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold" />
        </section>
        {node.type === OperatorType.LLM && (
          <section>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System Prompt</label>
            <textarea rows={10} value={node.config.prompt || ''} onChange={(e) => onUpdate({ config: { ...node.config, prompt: e.target.value }})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none text-xs leading-relaxed font-medium" placeholder="输入提示词..." />
          </section>
        )}
        {node.type === OperatorType.IF_ELSE && (
          <section>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">分支条件 (JS)</label>
            <div className="bg-slate-900 rounded-2xl p-4 shadow-inner">
              <textarea rows={6} value={node.config.expression || ''} onChange={(e) => onUpdate({ config: { ...node.config, expression: e.target.value }})} className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-blue-300 font-mono text-[11px]" placeholder="e.g. input.score > 0.8" />
            </div>
          </section>
        )}
        {node.type === OperatorType.PYTHON && (
          <section>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Python 脚本</label>
            <div className="bg-[#0d1117] rounded-2xl p-5 font-mono text-[11px] border border-slate-800 shadow-xl shadow-slate-900/50">
              <textarea rows={15} spellCheck={false} value={node.config.code || 'def main(input):\n    return input'} onChange={(e) => onUpdate({ config: { ...node.config, code: e.target.value }})} className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-[#e6edf3]" />
            </div>
          </section>
        )}
      </div>
      <div className="p-6 border-t border-gray-50 bg-slate-50/50">
        <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-sm active:scale-[0.98]">确认配置</button>
      </div>
    </div>
  );
};
