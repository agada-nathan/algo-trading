import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NodeData, Connection, NodeType } from '../types';
import { Play, Save, Plus, X, MousePointer2, Settings, ZoomIn, ZoomOut, Trash2, Code, ChevronDown, ChevronRight, Search } from 'lucide-react';

interface LibraryItem {
  type: NodeType;
  label: string;
  color: string;
  inputs: string[];
  outputs: string[];
  defaultConfigs: Record<string, any>;
}

interface LibraryCategory {
  category: string;
  items: LibraryItem[];
}

// Node Definitions Grouped by Category
const NODE_LIBRARY: LibraryCategory[] = [
  {
    category: 'Triggers',
    items: [
      { type: 'trigger', label: 'Time Trigger', color: 'border-yellow-500', inputs: [], outputs: ['OnTick'], defaultConfigs: { interval: '1h' } },
      { type: 'trigger', label: 'Price Update', color: 'border-yellow-500', inputs: [], outputs: ['OnPrice'], defaultConfigs: { symbol: 'EURUSD' } },
    ]
  },
  {
    category: 'Indicators',
    items: [
      { type: 'indicator', label: 'RSI', color: 'border-blue-500', inputs: ['Source'], outputs: ['Value'], defaultConfigs: { period: 14 } },
      { type: 'indicator', label: 'SMA', color: 'border-blue-500', inputs: ['Source'], outputs: ['Value'], defaultConfigs: { period: 20 } },
      { type: 'indicator', label: 'EMA', color: 'border-blue-500', inputs: ['Source'], outputs: ['Value'], defaultConfigs: { period: 20 } },
      { type: 'indicator', label: 'Bollinger Bands', color: 'border-blue-500', inputs: ['Source'], outputs: ['Upper', 'Middle', 'Lower'], defaultConfigs: { period: 20, stdDev: 2 } },
      { type: 'indicator', label: 'MACD', color: 'border-blue-500', inputs: ['Source'], outputs: ['MACD', 'Signal', 'Hist'], defaultConfigs: { fast: 12, slow: 26, signal: 9 } },
      { type: 'indicator', label: 'ATR', color: 'border-blue-500', inputs: [], outputs: ['Value'], defaultConfigs: { period: 14 } },
      { type: 'indicator', label: 'Stochastic', color: 'border-blue-500', inputs: [], outputs: ['K', 'D'], defaultConfigs: { k: 14, d: 3, smooth: 3 } },
    ]
  },
  {
    category: 'Logic',
    items: [
      { type: 'condition', label: 'Compare (>)', color: 'border-purple-500', inputs: ['A', 'B'], outputs: ['True', 'False'], defaultConfigs: {} },
      { type: 'condition', label: 'Compare (<)', color: 'border-purple-500', inputs: ['A', 'B'], outputs: ['True', 'False'], defaultConfigs: {} },
      { type: 'condition', label: 'Cross Over', color: 'border-purple-500', inputs: ['A', 'B'], outputs: ['True', 'False'], defaultConfigs: {} },
      { type: 'condition', label: 'AND Gate', color: 'border-purple-500', inputs: ['In1', 'In2'], outputs: ['Out'], defaultConfigs: {} },
      { type: 'condition', label: 'OR Gate', color: 'border-purple-500', inputs: ['In1', 'In2'], outputs: ['Out'], defaultConfigs: {} },
    ]
  },
  {
    category: 'Actions',
    items: [
      { type: 'action', label: 'Buy Market', color: 'border-green-500', inputs: ['Signal'], outputs: ['OnFill'], defaultConfigs: { size: 1.0, sl: 0, tp: 0 } },
      { type: 'action', label: 'Sell Market', color: 'border-red-500', inputs: ['Signal'], outputs: ['OnFill'], defaultConfigs: { size: 1.0, sl: 0, tp: 0 } },
      { type: 'action', label: 'Close Position', color: 'border-orange-500', inputs: ['Signal'], outputs: ['OnClosed'], defaultConfigs: { pair: 'All' } },
    ]
  },
  {
    category: 'Custom',
    items: [
      { type: 'custom', label: 'Custom Script', color: 'border-pink-500', inputs: ['In1', 'In2', 'In3'], outputs: ['Out1', 'Out2'], defaultConfigs: { code: '// Return an object with output names as keys\n// inputs are available as args array\nreturn { Out1: inputs.In1 > inputs.In2 };' } },
    ]
  }
];

interface StrategyBuilderProps {
  onBacktest: () => void;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onBacktest }) => {
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', type: 'trigger', label: 'Time Trigger', x: 100, y: 100, inputs: [], outputs: ['OnTick'], config: { interval: '1h' } },
    { id: '2', type: 'indicator', label: 'RSI (14)', x: 400, y: 100, inputs: ['Source'], outputs: ['Value'], config: { period: 14 } },
    { id: '3', type: 'condition', label: 'Compare (<)', x: 700, y: 100, inputs: ['A', 'B'], outputs: ['True', 'False'], config: {} },
    { id: '4', type: 'action', label: 'Buy Market', x: 1000, y: 100, inputs: ['Signal'], outputs: ['OnFill'], config: { size: 1.0 } },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'c1', fromNodeId: '1', fromPort: 'OnTick', toNodeId: '2', toPort: 'Source' },
    { id: 'c2', fromNodeId: '2', fromPort: 'Value', toNodeId: '3', toPort: 'A' },
    { id: 'c3', fromNodeId: '3', fromPort: 'True', toNodeId: '4', toPort: 'Signal' },
  ]);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [editingNode, setEditingNode] = useState<NodeData | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Triggers', 'Indicators', 'Custom']);
  const [searchTerm, setSearchTerm] = useState('');
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- Logic ---

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDraggingNodeId(nodeId);
      setDragOffset({
        x: (e.clientX - rect.left) / scale - node.x,
        y: (e.clientY - rect.top) / scale - node.y,
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = (e.clientX - rect.left) / scale - dragOffset.x;
      const newY = (e.clientY - rect.top) / scale - dragOffset.y;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
      );
    }
  }, [draggingNodeId, dragOffset, scale]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);

  useEffect(() => {
    if (draggingNodeId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, handleMouseMove, handleMouseUp]);

  const addNode = (template: any) => {
    const newNode: NodeData = {
      id: Math.random().toString(36).substr(2, 9),
      type: template.type as NodeType,
      label: template.label,
      x: 100 + Math.random() * 50 - (200 * (1-scale)), // spawn near centerish
      y: 100 + Math.random() * 50,
      inputs: template.inputs,
      outputs: template.outputs,
      config: { ...template.defaultConfigs },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNodeId !== id && c.toNodeId !== id));
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const updateNodeConfig = (nodeId: string, newConfig: Record<string, any>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config: newConfig } : n));
    // Also update local state for immediate feedback in modal
    setEditingNode(prev => prev ? { ...prev, config: newConfig } : null);
  };

  // Rendering Connections
  const renderConnections = () => {
    return connections.map((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromNodeId);
      const toNode = nodes.find((n) => n.id === conn.toNodeId);
      if (!fromNode || !toNode) return null;

      const fromX = fromNode.x + 200; 
      const fromY = fromNode.y + 40 + (fromNode.outputs.indexOf(conn.fromPort) * 24);
      const toX = toNode.x;
      const toY = toNode.y + 40 + (toNode.inputs.indexOf(conn.toPort) * 24);

      const controlPointOffset = Math.abs(toX - fromX) * 0.5;
      const d = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;

      return (
        <path
          key={conn.id}
          d={d}
          stroke="#586e85"
          strokeWidth="2"
          fill="none"
          className="pointer-events-none"
        />
      );
    });
  };

  // --- Components ---

  const NodeSettingsModal = ({ node, onClose }: { node: NodeData; onClose: () => void }) => {
    const handleChange = (key: string, value: any) => {
        const newConfig = { ...node.config, [key]: value };
        updateNodeConfig(node.id, newConfig);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-[500px] rounded-xl border border-border bg-[#181b21] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${node.type === 'custom' ? 'bg-pink-500' : 'bg-primary'}`}></div>
                <h3 className="text-lg font-bold text-white">{node.label} Settings</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Standard Config Fields */}
            {Object.entries(node.config).map(([key, value]) => {
                if (key === 'code') return null; // Handle code separately
                return (
                    <div key={key} className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">{key}</label>
                        <input 
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) => handleChange(key, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
                            className="w-full rounded-lg bg-black/20 border border-border px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                );
            })}

            {/* Custom Script Editor */}
            {node.type === 'custom' && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-pink-400 uppercase flex items-center gap-2">
                        <Code size={12} /> JavaScript Logic
                    </label>
                    <textarea 
                        value={node.config.code}
                        onChange={(e) => handleChange('code', e.target.value)}
                        className="w-full h-48 rounded-lg bg-[#0f1115] border border-border px-3 py-2 text-xs font-mono text-gray-300 focus:border-pink-500 focus:outline-none resize-none"
                        spellCheck={false}
                    />
                    <p className="text-[10px] text-gray-500">
                        Available variables: <code>inputs</code> (object), <code>state</code> (object). Return an object matching outputs.
                    </p>
                </div>
            )}

            {Object.keys(node.config).length === 0 && (
                <p className="text-sm text-gray-500 italic">No configuration options available for this node.</p>
            )}

          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
                Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background text-white overflow-hidden">
      {editingNode && <NodeSettingsModal node={editingNode} onClose={() => setEditingNode(null)} />}

      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 shadow-sm z-20">
        <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg text-white">Strategy Graph</h2>
            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-border">
                <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-1.5 hover:bg-white/10 rounded"><ZoomIn size={16} /></button>
                <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="p-1.5 hover:bg-white/10 rounded"><ZoomOut size={16} /></button>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 border border-border transition-all">
            <Save size={16} /> Save
          </button>
          <button onClick={onBacktest} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            <Play size={16} /> Run Backtest
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Node Library (Left Sidebar) */}
        <div className="w-72 border-r border-border bg-surface flex flex-col z-20">
          <div className="p-4 border-b border-border">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search nodes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-gray-600"
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {NODE_LIBRARY.map((category) => {
                const filteredItems = category.items.filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase()));
                if (searchTerm && filteredItems.length === 0) return null;
                const itemsToShow = searchTerm ? filteredItems : category.items;
                const isExpanded = expandedCategories.includes(category.category) || searchTerm.length > 0;

                return (
                    <div key={category.category} className="mb-2">
                        <button 
                            onClick={() => toggleCategory(category.category)}
                            className="w-full flex items-center justify-between p-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <span>{category.category}</span>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        
                        {isExpanded && (
                            <div className="space-y-2 mt-1 px-2 pb-2 animate-in slide-in-from-top-2 duration-200">
                                {itemsToShow.map((node) => (
                                    <div
                                        key={node.label}
                                        onClick={() => addNode(node)}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-[#0f1115] p-3 transition-all hover:border-primary hover:shadow-md group relative overflow-hidden`}
                                    >
                                        <div className={`h-3 w-3 rounded-full border-2 ${node.color.replace('border', 'bg').replace('500', '400')} border-transparent group-hover:scale-110 transition-transform`}></div>
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{node.label}</span>
                                        {node.type === 'custom' && <Code size={14} className="ml-auto text-pink-500 opacity-50 group-hover:opacity-100" />}
                                        <Plus size={14} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary ${node.type === 'custom' ? 'hidden' : ''}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
          </div>
          
          <div className="p-4 border-t border-border bg-blue-500/5">
             <div className="flex items-start gap-2">
                <MousePointer2 size={14} className="text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-200/70">
                    Use <span className="text-pink-400 font-medium">Custom Script</span> nodes to implement complex logic using JS.
                </p>
             </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div 
            ref={canvasRef}
            className="flex-1 relative overflow-hidden bg-[#0f1115] cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
                if(e.target === canvasRef.current) {
                    // Pan logic could go here
                }
            }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" 
               style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}></div>

          {/* Node Container */}
          <div 
            style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: '0 0',
                width: '100%', 
                height: '100%' 
            }}
            className="absolute inset-0"
          >
            <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
              {renderConnections()}
            </svg>

            {nodes.map((node) => {
                const nodeDef = NODE_LIBRARY.flatMap(c => c.items).find(i => i.label === node.label) || { color: 'border-gray-500' };
                const isCustom = node.type === 'custom';
                
                return (
                  <div
                    key={node.id}
                    style={{
                        transform: `translate(${node.x}px, ${node.y}px)`,
                    }}
                    className={`absolute w-[200px] rounded-lg border-l-4 ${
                         isCustom ? 'border-pink-500' : nodeDef.color
                    } bg-surface shadow-xl ring-1 ring-border select-none group hover:ring-primary/50 transition-shadow`}
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between border-b border-border bg-white/5 px-3 py-2 rounded-t-lg">
                      <div className="flex items-center gap-2">
                          {isCustom && <Code size={12} className="text-pink-500" />}
                          <span className="text-xs font-bold text-gray-200 truncate max-w-[100px]">{node.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setEditingNode(node); }} 
                            className="text-gray-400 hover:text-primary transition-colors"
                        >
                            <Settings size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} 
                            className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Node Body (Ports) */}
                    <div className="space-y-2 p-3">
                      {/* Inputs */}
                      {node.inputs.map((input) => (
                        <div key={input} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full border border-gray-500 bg-[#0f1115] hover:border-primary transition-colors cursor-crosshair"></div>
                          <span className="text-xs text-gray-400">{input}</span>
                        </div>
                      ))}
                      
                      {/* Divider if both exist */}
                      {node.inputs.length > 0 && node.outputs.length > 0 && (
                          <div className="h-px bg-border my-2 opacity-50"></div>
                      )}

                      {/* Outputs */}
                      {node.outputs.map((output) => (
                        <div key={output} className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-400">{output}</span>
                          <div className="h-3 w-3 rounded-full border border-gray-500 bg-[#0f1115] hover:bg-primary hover:border-primary transition-colors cursor-crosshair"></div>
                        </div>
                      ))}
                      
                      {/* Config Preview (Small) */}
                      {Object.keys(node.config).length > 0 && !isCustom && (
                          <div className="mt-2 pt-2 border-t border-border border-dashed">
                              <p className="text-[10px] text-gray-500">
                                  {Object.entries(node.config).slice(0, 2).map(([k,v]) => `${k}: ${v}`).join(', ')}
                              </p>
                          </div>
                      )}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};