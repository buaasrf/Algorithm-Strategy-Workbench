
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, Play, Layout, Settings, ChevronRight, Trash2, Zap, Download, Share2, 
  Cpu, History, Info, Maximize, ZoomIn, ZoomOut, Edit3, FileJson, X, RefreshCw,
  ChevronLeft, Maximize2, Minimize2, ChevronDown, Move, PlusCircle, Trash,
  Wand2, Target
} from 'lucide-react';
import { OperatorType, Node, Edge, Scenario, Position } from './types';
import { OPERATOR_METADATA, CATEGORY_METADATA, CategoryMeta } from './constants';

// 算子基础尺寸
const NODE_WIDTH = 120;
const NODE_HEIGHT = 54; 
const SNAP_THRESHOLD = 20;

// 计算贝塞尔曲线路径
const getBezierPath = (start: Position, end: Position) => {
  const dx = Math.abs(end.x - start.x) * 0.45;
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
  const catMeta = CATEGORY_METADATA[meta.category];
  const isBranchNode = node.type === OperatorType.IF_ELSE || node.type === OperatorType.AB_TEST;

  return (
    <div 
      onMouseDown={(e) => {
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
      className={`absolute bg-white rounded-xl border cursor-grab active:cursor-grabbing node-shadow select-none group flex flex-col p-1.5 transition-[border-color,box-shadow] duration-200 pointer-events-auto ${
        isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-100 hover:border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-1.5 mb-1 pointer-events-none">
        <div className={`${catMeta.color} w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm`}>
          {React.cloneElement(catMeta.icon as React.ReactElement<any>, { className: 'w-3 h-3' })}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[8px] font-bold text-slate-800 truncate block leading-tight">{node.name}</span>
          <span className="text-[7px] text-slate-400 font-medium line-clamp-1 leading-tight mt-0.5">{meta.description}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-[6px] font-bold pointer-events-none">
        <div className="flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded">
           <span className="text-slate-400 uppercase tracking-tighter">{node.type}</span>
           {node.status === 'running' && <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>}
        </div>
      </div>

      <div className="absolute -top-2 -right-2 flex gap-0.5 action-btn pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(node.id)} className="bg-white border border-slate-100 p-1 rounded-md text-slate-400 hover:text-blue-500 shadow-md transition-colors"><Edit3 className="w-2.5 h-2.5" /></button>
        <button onClick={() => onDelete(node.id)} className="bg-white border border-slate-100 p-1 rounded-md text-slate-400 hover:text-red-500 shadow-md transition-colors"><Trash2 className="w-2.5 h-2.5" /></button>
      </div>

      {node.type !== OperatorType.START && (
        <div className={`port absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-all ${
          isSnapTarget ? 'bg-blue-600 scale-125 ring-2 ring-blue-100' : 'bg-slate-300'
        }`} />
      )}
      
      {node.type !== OperatorType.END && !isBranchNode && (
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id); }}
          className="port absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-500 shadow-sm pointer-events-auto hover:scale-150 transition-transform cursor-crosshair" 
        />
      )}

      {isBranchNode && (
        <>
          <div onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'true'); }} className="port absolute right-0 top-[35%] -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-400 shadow-sm pointer-events-auto hover:scale-150 transition-transform cursor-crosshair group/p">
          </div>
          <div onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, 'false'); }} className="port absolute right-0 top-[75%] -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-400 shadow-sm pointer-events-auto hover:scale-150 transition-transform cursor-crosshair group/p">
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
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);
  
  const [sidePanelWidth, setSidePanelWidth] = useState(480);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const isResizingRef = useRef(false);

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    entry: true, logic: true, flow: true, data: true, terminal: true,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom, canvasOffset, scenario });

  useEffect(() => {
    stateRef.current = { zoom, canvasOffset, scenario };
  }, [zoom, canvasOffset, scenario]);

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getPortPos = (nodes: Node[], nodeId: string, type: 'in' | 'out', handle?: string): Position => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    if (type === 'in') return { x: node.position.x, y: node.position.y + NODE_HEIGHT / 2 };
    if (node.type === OperatorType.IF_ELSE || node.type === OperatorType.AB_TEST) {
      return { x: node.position.x + NODE_WIDTH, y: node.position.y + (handle === 'true' ? NODE_HEIGHT * 0.35 : NODE_HEIGHT * 0.75) };
    }
    return { x: node.position.x + NODE_WIDTH, y: node.position.y + NODE_HEIGHT / 2 };
  };

  const startDraggingNode = (e: React.MouseEvent, nodeId: string) => {
    const startMouse = { x: e.clientX, y: e.clientY };
    const node = stateRef.current.scenario.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const initialPos = { ...node.position };

    const onMouseMove = (moveEvent: MouseEvent) => {
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

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizingPanel(true);
    const startX = e.clientX;
    const startWidth = sidePanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(300, Math.min(window.innerWidth - 300, startWidth + deltaX));
      setSidePanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      setIsResizingPanel(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
        const port = getPortPos(stateRef.current.scenario.nodes, node.id, 'in');
        if (Math.hypot(mx - port.x, my - port.y) < SNAP_THRESHOLD / stateRef.current.zoom) {
          snapId = node.id;
          targetPos = port;
          break;
        }
      }
      
      currentSnapId = snapId;
      setIsSnapNodeId(snapId);
      setTempEdge({ from: getPortPos(stateRef.current.scenario.nodes, fromId, 'out', handle), to: targetPos });
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

  const handleDragStartFromSidebar = (e: React.DragEvent, type: OperatorType) => {
    e.dataTransfer.setData('operatorType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
    
    const type = e.dataTransfer.getData('operatorType') as OperatorType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasOffset.x) / zoom - (NODE_WIDTH / 2);
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom - (NODE_HEIGHT / 2);

    const newNode: Node = { 
      id: `node-${Date.now()}`, 
      type, 
      name: OPERATOR_METADATA[type].label, 
      position: { x, y }, 
      config: { params: [] } 
    };

    setScenario(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setActiveNodeId(newNode.id);
  };

  // 核心居中适配函数
  const fitToView = (nodes: Node[]) => {
    if (nodes.length === 0 || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
    });

    const padding = 80;
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;
    const layoutWidth = maxX - minX;
    const layoutHeight = maxY - minY;

    const scaleX = availableWidth / layoutWidth;
    const scaleY = availableHeight / layoutHeight;
    const newZoom = Math.max(0.2, Math.min(scaleX, scaleY, 1.0)); 
    
    // 计算居中偏移量: 偏移 = 视口中心 - 布局中心 * 缩放
    const newOffsetX = (rect.width / 2) - ((minX + maxX) / 2) * newZoom;
    const newOffsetY = (rect.height / 2) - ((minY + maxY) / 2) * newZoom;

    setZoom(newZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  };

  // 整理画布并自动缩放以适配视口
  const layoutScenario = () => {
    const { nodes, edges } = scenario;
    if (nodes.length === 0) return;

    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    nodes.forEach(n => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    edges.forEach(e => {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    const levels = new Map<string, number>();
    const roots = nodes.filter(n => (inDegree.get(n.id) === 0 || n.type === OperatorType.START));
    const queue: [string, number][] = roots.map(r => [r.id, 0]);
    roots.forEach(r => levels.set(r.id, 0));

    while (queue.length > 0) {
      const [u, level] = queue.shift()!;
      (adj.get(u) || []).forEach(v => {
        const nextLevel = level + 1;
        if (!levels.has(v) || levels.get(v)! < nextLevel) {
          levels.set(v, nextLevel);
          queue.push([v, nextLevel]);
        }
      });
    }

    nodes.forEach(n => { if (!levels.has(n.id)) levels.set(n.id, 0); });

    const groups: Record<number, string[]> = {};
    levels.forEach((level, id) => {
      if (!groups[level]) groups[level] = [];
      groups[level].push(id);
    });

    const HORIZONTAL_SPACING = 240;
    const VERTICAL_SPACING = 120;
    
    const newNodes = nodes.map(node => {
      const level = levels.get(node.id) || 0;
      const levelNodes = groups[level];
      const index = levelNodes.indexOf(node.id);
      const totalColumnHeight = (levelNodes.length - 1) * VERTICAL_SPACING;
      
      const x = level * HORIZONTAL_SPACING;
      const y = - (totalColumnHeight / 2) + index * VERTICAL_SPACING;

      return { ...node, position: { x, y } };
    });

    setScenario(prev => ({ ...prev, nodes: newNodes }));
    // 在状态更新后进行视图适配 (延迟一个 tick 确保 rect 计算正确，或者直接用 newNodes 计算)
    setTimeout(() => fitToView(newNodes), 0);
  };

  const addParameter = () => {
    if (!editingNodeId) return;
    setScenario(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => {
        if (n.id === editingNodeId) {
          const params = Array.isArray(n.config.params) ? n.config.params : [];
          return {
            ...n,
            config: {
              ...n.config,
              params: [...params, { key: `param_${params.length + 1}`, value: '' }]
            }
          };
        }
        return n;
      })
    }));
  };

  const updateParameter = (index: number, field: 'key' | 'value', val: string) => {
    if (!editingNodeId) return;
    setScenario(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => {
        if (n.id === editingNodeId) {
          const params = [...(n.config.params || [])];
          params[index] = { ...params[index], [field]: val };
          return { ...n, config: { ...n.config, params } };
        }
        return n;
      })
    }));
  };

  const removeParameter = (index: number) => {
    if (!editingNodeId) return;
    setScenario(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => {
        if (n.id === editingNodeId) {
          const params = (n.config.params || []).filter((_: any, i: number) => i !== index);
          return { ...n, config: { ...n.config, params } };
        }
        return n;
      })
    }));
  };

  const editingNode = editingNodeId ? scenario.nodes.find(n => n.id === editingNodeId) : null;
  const editingMeta = editingNode ? OPERATOR_METADATA[editingNode.type] : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-medium select-none">
      <header className="h-14 bg-white border-b flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Cpu className="w-5 h-5" /></div>
          <span className="font-extrabold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">AlgoStrat</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProtocolOpen(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
            <FileJson className="w-4 h-4"/> 查看 DAG 协议
          </button>
          <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95 ${
            isRunning ? 'bg-amber-100 text-amber-700 shadow-amber-50' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
          }`}>
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? '正在运行...' : '开始仿真'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className="w-72 bg-white border-r z-40 flex flex-col shrink-0 overflow-y-auto shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
          <div className="p-5 pb-2 flex items-center justify-between">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">算子工具箱</h3>
             <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" title="算子分类管理，按住并拖动算子到画布"/>
          </div>
          <div className="px-3 pb-8 space-y-1">
            {Object.values(CATEGORY_METADATA).map(cat => (
              <div key={cat.id} className="flex flex-col">
                <button 
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors group"
                >
                  <div className={`p-1.5 rounded-lg ${cat.color} text-white shadow-sm`}>
                    {cat.icon}
                  </div>
                  <span className="flex-1 text-left text-xs font-bold text-slate-700">{cat.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedCats[cat.id] ? '' : '-rotate-90'}`} />
                </button>
                {expandedCats[cat.id] && (
                  <div className="pl-11 pr-2 py-1 space-y-2">
                    {Object.entries(OPERATOR_METADATA)
                      .filter(([_, meta]) => meta.category === cat.id)
                      .map(([type, meta]) => (
                        <div 
                          key={type} 
                          draggable
                          onDragStart={(e) => handleDragStartFromSidebar(e, type as OperatorType)}
                          className="p-2 border border-slate-50 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-100 hover:bg-blue-50/30 transition-all group shadow-sm flex items-center justify-between"
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors truncate">{meta.label}</span>
                            <p className="text-[8px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{meta.description}</p>
                          </div>
                          <Move className="w-3 h-3 text-slate-200 group-hover:text-blue-300 shrink-0 ml-2" />
                        </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main 
          ref={canvasRef} 
          className={`flex-1 relative overflow-hidden canvas-grid cursor-default transition-colors duration-200 ${isDraggingOverCanvas ? 'bg-blue-50/20' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOverCanvas(true); }}
          onDragLeave={() => setIsDraggingOverCanvas(false)}
          onDrop={handleDropOnCanvas}
          onMouseDown={(e) => {
            if (e.target === canvasRef.current) {
              startPanning(e);
              setActiveNodeId(null);
              setEditingNodeId(null);
            }
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none origin-top-left" 
            style={{ 
              transform: `translate3d(${canvasOffset.x}px, ${canvasOffset.y}px, 0) scale(${zoom})`,
              willChange: 'transform'
            }}
          >
            <svg className="absolute inset-0 w-[20000px] h-[20000px] pointer-events-none overflow-visible z-0 translate-x-[-10000px] translate-y-[-10000px]">
              <g transform="translate(10000, 10000)">
                <defs>
                  <marker id="arrow" markerWidth="4" markerHeight="4" refX="5" refY="2" orient="auto">
                    <path d="M0,0 L4,2 L0,4 Z" fill="#94a3b8" />
                  </marker>
                </defs>
                {scenario.edges.map(edge => {
                  const start = getPortPos(scenario.nodes, edge.source, 'out', edge.sourceHandle);
                  const end = getPortPos(scenario.nodes, edge.target, 'in');
                  return (
                    <path 
                      key={edge.id} d={getBezierPath(start, end)} fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" 
                      className="pointer-events-auto hover:stroke-blue-400 cursor-pointer transition-colors" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setScenario(prev => ({ ...prev, edges: prev.edges.filter(er => er.id !== edge.id) })); 
                      }} 
                    />
                  );
                })}
                {tempEdge && (
                  <path d={getBezierPath(tempEdge.from, tempEdge.to)} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" className="animate-pulse" />
                )}
              </g>
            </svg>

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
                  onDragStart={(e, id) => startDraggingNode(e, id)}
                  onConnectStart={(e, id, h) => startConnecting(e, id, h)}
                  isSnapTarget={isSnapNodeId === node.id}
                />
              ))}
            </div>
          </div>

          {/* 工具栏 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-50 pointer-events-auto transition-all duration-300 hover:scale-105 hover:bg-white">
            <button onClick={() => setZoom(z => Math.max(z / 1.1, 0.05))} className="p-2 hover:text-blue-600 transition-colors" title="缩小"><ZoomOut className="w-5 h-5"/></button>
            <div className="text-[10px] font-bold text-slate-400 px-2 min-w-[50px] text-center">{Math.round(zoom * 100)}%</div>
            <button onClick={() => setZoom(z => Math.min(z * 1.1, 3))} className="p-2 hover:text-blue-600 transition-colors" title="放大"><ZoomIn className="w-5 h-5"/></button>
            
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            
            <button onClick={() => fitToView(scenario.nodes)} className="p-2 hover:text-blue-600 transition-colors group relative" title="居中并自适应">
              <Target className="w-5 h-5"/>
              <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">居中视口</span>
            </button>
            
            <button onClick={layoutScenario} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all group relative" title="整理画布并自适应">
               <Wand2 className="w-4 h-4" />
               <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">自动整理并居中</span>
            </button>
          </div>
        </main>

        {editingNode && (
          <>
            {!isFullScreen && (
              <div 
                onMouseDown={startResizing}
                className="w-1.5 h-full cursor-col-resize hover:bg-blue-400 transition-colors z-[70] bg-slate-100 flex items-center justify-center shrink-0 group relative"
              >
                <div className="h-8 w-1 bg-slate-300 rounded group-hover:bg-white z-10"></div>
                <div className="absolute inset-y-0 -left-1 -right-1 z-0"></div>
              </div>
            )}
            <div 
              style={{ width: isFullScreen ? '100%' : `${sidePanelWidth}px` }}
              className={`bg-white border-l h-full flex flex-col z-[60] shadow-2xl ${isFullScreen ? 'absolute right-0 top-0 w-full transition-[width] duration-300 ease-in-out' : 'relative'} ${!isResizingPanel && !isFullScreen ? 'transition-[width] duration-300 ease-in-out' : ''}`}
            >
              <div className="p-7 border-b flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className={`${CATEGORY_METADATA[editingMeta!.category].color} p-2.5 rounded-xl text-white shadow-sm`}>
                    {CATEGORY_METADATA[editingMeta!.category].icon}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xl text-slate-800 leading-tight">{editingNode.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">算子属性检查器</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    {isFullScreen ? <Minimize2 className="w-5 h-5 text-slate-400"/> : <Maximize2 className="w-5 h-5 text-slate-400"/>}
                  </button>
                  <button onClick={() => { setEditingNodeId(null); setIsFullScreen(false); }} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5 text-slate-400"/>
                  </button>
                </div>
              </div>
              <div className="p-7 flex-1 overflow-y-auto space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Edit3 className="w-3 h-3" /> 显示名称
                  </label>
                  <input 
                    type="text" 
                    value={editingNode.name} 
                    onChange={(e) => setScenario(prev => ({ 
                      ...prev, 
                      nodes: prev.nodes.map(n => n.id === editingNodeId ? { ...n, name: e.target.value } : n) 
                    }))} 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 ring-blue-50 outline-none transition-all" 
                  />
                </div>
                {editingMeta && (
                  <div className="p-5 bg-blue-50/40 rounded-[24px] border border-blue-100/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`${CATEGORY_METADATA[editingMeta.category].color} p-2 rounded-lg text-white`}>
                        {CATEGORY_METADATA[editingMeta.category].icon}
                      </div>
                      <span className="text-xs font-bold text-blue-900">算子逻辑描述</span>
                    </div>
                    <p className="text-[11px] text-blue-800/70 font-medium leading-relaxed">
                      {editingMeta.description}
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-3 h-3" /> 运行参数配置
                     </label>
                     <button 
                        onClick={addParameter}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" /> 添加参数
                      </button>
                   </div>
                   <div className="space-y-4">
                     {Array.isArray(editingNode.config.params) && editingNode.config.params.length > 0 ? (
                       editingNode.config.params.map((param: any, idx: number) => (
                         <div key={idx} className="group relative bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                           <div className="flex items-center justify-between mb-3 gap-3">
                              <input 
                                placeholder="键 (Key)"
                                value={param.key}
                                onChange={(e) => updateParameter(idx, 'key', e.target.value)}
                                className="flex-1 bg-slate-50 border border-transparent rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-200 outline-none transition-all"
                              />
                              <button 
                                onClick={() => removeParameter(idx)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                           </div>
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mb-1 ml-1 uppercase tracking-tighter">
                               值 (Value / 富文本)
                             </div>
                             <textarea 
                               placeholder="在此输入内容或配置信息..."
                               value={param.value}
                               onChange={(e) => updateParameter(idx, 'value', e.target.value)}
                               rows={3}
                               className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-xs font-medium text-slate-600 focus:bg-white focus:border-blue-100 outline-none transition-all resize-none leading-relaxed"
                             />
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="p-8 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center gap-2">
                          <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                            <Settings className="w-8 h-8"/>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">暂无配置参数</span>
                          <button onClick={addParameter} className="mt-2 px-4 py-2 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 rounded-xl hover:bg-slate-50">立即添加第一个变量</button>
                       </div>
                     )}
                   </div>
                </div>
              </div>
              <div className="p-7 border-t bg-slate-50/50 flex gap-3">
                <button 
                  onClick={() => { setEditingNodeId(null); setIsFullScreen(false); }} 
                  className="flex-1 py-4 bg-slate-900 text-white text-sm font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  保存并关闭
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isProtocolOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsProtocolOpen(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl text-white"><FileJson className="w-5 h-5"/></div>
                <span className="font-extrabold text-lg">场景 DAG 协议定义</span>
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
