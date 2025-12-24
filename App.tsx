
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, Play, Layout, Settings, ChevronRight, Trash2, Zap, Download, Share2, 
  Cpu, History, Info, Maximize, ZoomIn, ZoomOut, Edit3, FileJson, X, RefreshCw
} from 'lucide-react';
import { OperatorType, Node, Edge, Scenario, Position } from './types';
import { OPERATOR_METADATA } from './constants';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 92; 
const SNAP_THRESHOLD = 30;

const getBezierPath = (start: Position, end: Position) => {
  const dx = Math.abs(end.x - start.x) * 0.4;
  const curvature = Math.max(dx, 40); 
  return `M ${start.x} ${start.y} C ${start.x + curvature} ${start.y}, ${end.x - curvature} ${end.y}, ${end.x} ${end.y}`;
};

const NodeCard: React.FC<{ 
  node: Node; 
  isActive: boolean; 
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string, handle?: string) => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isSnapTarget: boolean;
}> = ({ node, isActive, onDragStart, onConnectStart, onSelect, onEdit, onDelete, isSnapTarget }) => {
  const meta = OPERATOR_METADATA[node.type];
  const isBranchNode = node.type === OperatorType.IF_ELSE || node.type === OperatorType.AB_TEST;

  return (
    <div 
      onMouseDown={(e) => {
        // 核心：必须阻止冒泡，防止触发父级 main 的 onMouseDown (画布平移)
        e.stopPropagation(); 
        if ((e.target as HTMLElement).closest('.port') || (e.target as HTMLElement).closest('.action-btn')) return;
        onDragStart(e, node.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      style={{ 
        transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)`,
        width: `${NODE_WIDTH}px`,
        height: `${NODE_HEIGHT}px`,
        zIndex: isActive ? 50 : 20,
      }}
      className={`absolute bg-white rounded-2xl border cursor-grab active:cursor-grabbing node-shadow select-none group flex flex-col p-3 transition-[border-color,box-shadow] duration-200 pointer-events-auto ${
        isActive ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100 hover:border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-2 pointer-events-none">
        <div className={`${meta.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
          {React.cloneElement(meta.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-800 truncate block">{node.name}</span>
          <span className="text-[10px] text-slate-400 font-medium truncate block leading-tight mt-0.5">{meta.description}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] font-bold pointer-events-none">
        <div className="flex items-center gap-1.5">
           <span className="text-slate-300 uppercase tracking-tighter">{node.type}</span>
           {node.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
        </div>
        {node.status === 'running' && <span className="text-blue-500 flex items-center gap-1">RUNNING</span>}
      </div>

      {/* Actions */}
      <div className="absolute -top-3 -right-3 flex gap-1 action-btn pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(node.id)} className="bg-white border border-slate-100 p-1.5 rounded-lg text-slate-400 hover:text-blue-500 shadow-md"><Edit3 className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(node.id)} className="bg-white border border-slate-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 shadow-md"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {/* Ports */}
      {node.type !== OperatorType.START && (
        <div className={`port absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all ${
          isSnapTarget ? 'bg-blue-600 scale-125 ring-4 ring-blue-100' : 'bg-slate-300'
        }`} />
      )}
      
      {node.type !== OperatorType.END && !isBranchNode && (
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id); }}
          className="port absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm pointer-events-auto hover:scale-150 transition-transform cursor-crosshair" 
        />
      )}

      {isBranchNode && (
        <>
          <div onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'true'); }} className="port absolute right-0 top-[35%] -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-4 border-white bg-blue-400 shadow-sm pointer-events-auto hover:scale-150 transition-transform cursor-crosshair group/p">
            <div className="absolute left-full ml-2 px-1.5 py-0.5 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover/p:opacity-100 pointer-events-none">PASS</div>
          </div>
          <div onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'false'); }} className="port absolute right-0 top-[75%] -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-4 border-white bg-indigo-400 shadow-sm pointer-events-auto hover:scale-150 transition-transform cursor-crosshair group/p">
            <div className="absolute left-full ml-2 px-1.5 py-0.5 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover/p:opacity-100 pointer-events-none">FAIL</div>
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [scenario, setScenario] = useState<Scenario>({
    id: 'sc-1', name: 'New Strategy', description: 'DAG Flow', nodes: [], edges: [], updatedAt: new Date().toISOString()
  });

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState<Position>({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [isSnapNodeId, setIsSnapNodeId] = useState<string | null>(null);
  const [tempEdge, setTempEdge] = useState<{from: Position, to: Position} | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom, canvasOffset, scenario });

  useEffect(() => {
    stateRef.current = { zoom, canvasOffset, scenario };
  }, [zoom, canvasOffset, scenario]);

  const getPortPos = (nodeId: string, type: 'in' | 'out', handle?: string): Position => {
    const node = stateRef.current.scenario.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    if (type === 'in') return { x: node.position.x, y: node.position.y + NODE_HEIGHT / 2 };
    if (node.type === OperatorType.IF_ELSE || node.type === OperatorType.AB_TEST) {
      return { x: node.position.x + NODE_WIDTH, y: node.position.y + (handle === 'true' ? NODE_HEIGHT * 0.35 : NODE_HEIGHT * 0.75) };
    }
    return { x: node.position.x + NODE_WIDTH, y: node.position.y + NODE_HEIGHT / 2 };
  };

  // 1. 独立节点拖拽逻辑 (无联动)
  const startDragging = (e: React.MouseEvent, nodeId: string) => {
    const startMouse = { x: e.clientX, y: e.clientY };
    const node = stateRef.current.scenario.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const initialPos = { ...node.position };

    const onMouseMove = (moveEvent: MouseEvent) => {
      // 计算位移时考虑缩放
      const dx = (moveEvent.clientX - startMouse.x) / stateRef.current.zoom;
      const dy = (moveEvent.clientY - startMouse.y) / stateRef.current.zoom;
      
      setScenario(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, position: { x: initialPos.x + dx, y: initialPos.y + dy } } : n)
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 2. 画布平移逻辑
  const startPanning = (e: React.MouseEvent) => {
    const startMouse = { x: e.clientX, y: e.clientY };
    const initialOffset = { ...stateRef.current.canvasOffset };

    const onMouseMove = (moveEvent: MouseEvent) => {
      setCanvasOffset({
        x: initialOffset.x + (moveEvent.clientX - startMouse.x),
        y: initialOffset.y + (moveEvent.clientY - startMouse.y)
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 3. 连线逻辑
  const startConnecting = (e: React.MouseEvent, fromId: string, handle?: string) => {
    let currentSnapId: string | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mx = (moveEvent.clientX - rect.left - stateRef.current.canvasOffset.x) / stateRef.current.zoom;
      const my = (moveEvent.clientY - rect.top - stateRef.current.canvasOffset.y) / stateRef.current.zoom;

      let snapId: string | null = null;
      let targetPos = { x: mx, y: my };

      for (const node of stateRef.current.scenario.nodes) {
        if (node.id === fromId) continue;
        const port = getPortPos(node.id, 'in');
        if (Math.hypot(mx - port.x, my - port.y) < SNAP_THRESHOLD / stateRef.current.zoom) {
          snapId = node.id;
          targetPos = port;
          break;
        }
      }
      
      currentSnapId = snapId;
      setIsSnapNodeId(snapId);
      setTempEdge({ from: getPortPos(fromId, 'out', handle), to: targetPos });
    };

    const onMouseUp = () => {
      if (currentSnapId) {
        setScenario(prev => ({
          ...prev,
          edges: [...prev.edges.filter(edge => !(edge.source === fromId && edge.target === currentSnapId && edge.sourceHandle === handle)), 
                 { id: `edge-${Date.now()}`, source: fromId, target: currentSnapId!, sourceHandle: handle }]
        }));
      }
      setIsSnapNodeId(null);
      setTempEdge(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const addNode = (type: OperatorType) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = rect ? ((rect.width / 2) - canvasOffset.x) / zoom - (NODE_WIDTH / 2) : 100;
    const y = rect ? ((rect.height / 2) - canvasOffset.y) / zoom - 20 : 150;
    const newNode: Node = { id: `node-${Date.now()}`, type, name: OPERATOR_METADATA[type].label, position: { x, y }, config: {} };
    setScenario(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setActiveNodeId(newNode.id);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-medium select-none">
      <header className="h-14 bg-white border-b flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Cpu className="w-5 h-5" /></div>
          <span className="font-extrabold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">AlgoStrat</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProtocolOpen(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
            <FileJson className="w-4 h-4"/> DAG Protocol
          </button>
          <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95 ${
            isRunning ? 'bg-amber-100 text-amber-700 shadow-amber-50' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
          }`}>
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? 'Running Simulation' : 'Run Workflow'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className="w-72 bg-white border-r p-5 z-40 flex flex-col gap-3 shrink-0 overflow-y-auto shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between px-1 mb-2">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operator Library</h3>
             <Info className="w-3.5 h-3.5 text-slate-300"/>
          </div>
          {Object.entries(OPERATOR_METADATA).filter(([t]) => t !== OperatorType.END).map(([type, meta]) => (
            <div 
              key={type} 
              onClick={() => addNode(type as OperatorType)} 
              className="flex flex-col gap-1 p-3.5 border border-slate-50 rounded-2xl cursor-pointer hover:border-blue-100 hover:bg-blue-50/30 transition-all group active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className={`${meta.color} p-2.5 rounded-xl text-white group-hover:scale-105 transition-transform shadow-sm`}>{meta.icon}</div>
                <span className="text-sm font-bold text-slate-700">{meta.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">{meta.description}</p>
            </div>
          ))}
        </aside>

        <main 
          ref={canvasRef} 
          className="flex-1 relative overflow-hidden canvas-grid cursor-default" 
          onMouseDown={(e) => {
            // 只有点击背景时才触发平移
            if (e.target === canvasRef.current) {
              startPanning(e);
              setActiveNodeId(null);
              setEditingNodeId(null);
            }
          }}
        >
          {/* 画布缩放与平移容器 */}
          <div 
            className="absolute inset-0 pointer-events-none origin-top-left" 
            style={{ 
              transform: `translate3d(${canvasOffset.x}px, ${canvasOffset.y}px, 0) scale(${zoom})`,
              willChange: 'transform'
            }}
          >
            {/* 连线层 */}
            <svg className="absolute inset-0 w-[20000px] h-[20000px] pointer-events-none overflow-visible z-0 translate-x-[-10000px] translate-y-[-10000px]">
              <g transform="translate(10000, 10000)">
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                  </marker>
                </defs>
                {scenario.edges.map(edge => {
                  const start = getPortPos(edge.source, 'out', edge.sourceHandle);
                  const end = getPortPos(edge.target, 'in');
                  return (
                    <path 
                      key={edge.id} d={getBezierPath(start, end)} fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#arrow)" 
                      className="pointer-events-auto hover:stroke-blue-400 cursor-pointer transition-colors" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setScenario(prev => ({ ...prev, edges: prev.edges.filter(er => er.id !== edge.id) })); 
                      }} 
                    />
                  );
                })}
                {tempEdge && (
                  <path d={getBezierPath(tempEdge.from, tempEdge.to)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6,4" className="animate-pulse" />
                )}
              </g>
            </svg>

            {/* 节点层 */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {scenario.nodes.map(node => (
                <NodeCard 
                  key={node.id} node={node} 
                  isActive={activeNodeId === node.id} 
                  onSelect={(id) => setActiveNodeId(id)}
                  onEdit={(id) => setEditingNodeId(id)}
                  onDelete={(id) => setScenario(prev => ({ 
                    ...prev, 
                    nodes: prev.nodes.filter(n => n.id !== id), 
                    edges: prev.edges.filter(e => e.source !== id && e.target !== id) 
                  }))}
                  onDragStart={(e, id) => startDragging(e, id)}
                  onConnectStart={(e, id, h) => startConnecting(e, id, h)}
                  isSnapTarget={isSnapNodeId === node.id}
                />
              ))}
            </div>
          </div>

          {/* 浮动控制栏 */}
          <div className="absolute bottom-8 right-8 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-50 pointer-events-auto">
            <button onClick={() => setZoom(z => Math.max(z / 1.1, 0.2))} className="p-2 hover:text-blue-600 transition-colors"><ZoomOut className="w-5 h-5"/></button>
            <div className="text-[10px] font-bold text-slate-400 px-2 min-w-[50px] text-center">{Math.round(zoom * 100)}%</div>
            <button onClick={() => setZoom(z => Math.min(z * 1.1, 3))} className="p-2 hover:text-blue-600 transition-colors"><ZoomIn className="w-5 h-5"/></button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button onClick={() => { setCanvasOffset({ x: 0, y: 0 }); setZoom(1); }} className="p-2 hover:text-blue-600 transition-colors"><Maximize className="w-5 h-5"/></button>
          </div>
        </main>

        {/* 属性面板 */}
        {editingNodeId && (
          <div className="w-[420px] bg-white border-l h-full flex flex-col z-[60] shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-7 border-b flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-xl text-slate-800">Operator Config</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Property Inspector</p>
              </div>
              <button onClick={() => setEditingNodeId(null)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <div className="p-7 flex-1 overflow-y-auto space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  value={scenario.nodes.find(n => n.id === editingNodeId)?.name || ''} 
                  onChange={(e) => setScenario(prev => ({ 
                    ...prev, 
                    nodes: prev.nodes.map(n => n.id === editingNodeId ? { ...n, name: e.target.value } : n) 
                  }))} 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 ring-blue-50 outline-none transition-all" 
                />
              </div>
              <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white"><Info className="w-4 h-4"/></div>
                  <span className="text-xs font-bold text-slate-900">Operator Details</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {OPERATOR_METADATA[scenario.nodes.find(n => n.id === editingNodeId)!.type].description}
                </p>
              </div>
            </div>
            <div className="p-7 border-t bg-slate-50/50">
              <button onClick={() => setEditingNodeId(null)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                Close & Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 协议弹窗 */}
      {isProtocolOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsProtocolOpen(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl text-white"><FileJson className="w-5 h-5"/></div>
                <span className="font-extrabold text-lg">Scenario DAG Protocol</span>
              </div>
              <button onClick={() => setIsProtocolOpen(false)} className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-[#0D1117]">
              <pre className="text-indigo-200 font-mono text-[12px] leading-[1.8] select-all">
                {JSON.stringify(scenario, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
