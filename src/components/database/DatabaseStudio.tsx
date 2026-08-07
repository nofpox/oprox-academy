import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Plus, 
  Table as TableIcon, 
  Search, 
  Check, 
  Copy, 
  FileCode, 
  Layers, 
  Zap, 
  HardDrive
} from 'lucide-react';
import { DB_TABLES } from '../../data/mockData';
import { DBTable } from '../../types';

export const DatabaseStudio: React.FC = () => {
  const [tables, setTables] = useState<DBTable[]>(DB_TABLES);
  const [selectedTableName, setSelectedTableName] = useState<string>('projects');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM projects WHERE pipeline_status = \'Deployed\';');
  const [queryResult, setQueryResult] = useState<Record<string, any>[] | null>(null);
  const [queryTimeMs, setQueryTimeMs] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'tables' | 'sql' | 'erd'>('tables');

  const selectedTable = tables.find((t) => t.name === selectedTableName) || tables[0];

  const handleRunQuery = () => {
    const start = performance.now();
    setTimeout(() => {
      const end = performance.now();
      setQueryTimeMs(Math.round(end - start + 12));
      setQueryResult(selectedTable.sampleData);
    }, 120);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>OPROX Database Studio & Schema Engine</span>
            </h1>
            <p className="text-xs text-slate-400">
              PostgreSQL Relational DB Studio, migration safety verification, and interactive SQL console.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('tables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'tables' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Table Browser
          </button>
          <button
            onClick={() => setViewMode('sql')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'sql' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SQL Console
          </button>
          <button
            onClick={() => setViewMode('erd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'erd' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ERD Diagram
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      {viewMode === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Table List */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Database Tables ({tables.length})
              </h3>
            </div>

            <div className="space-y-1">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTableName(t.name)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between ${
                    selectedTableName === t.name
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold'
                      : 'bg-slate-950/60 border border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate text-xs">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{t.rowCount} rows</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Selected Table Schema & Sample Data */}
          <div className="lg:col-span-3 space-y-6">
            {/* Schema Columns Table */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-amber-400" />
                    <span>Table Schema: {selectedTable.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedTable.description}</p>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Status: Synced & Migrated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase">
                    <tr>
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3">Primary Key</th>
                      <th className="p-3">Nullable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedTable.columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-3 font-semibold text-white">{col.name}</td>
                        <td className="p-3 text-amber-400">{col.type}</td>
                        <td className="p-3">{col.isPrimary ? 'PRIMARY KEY' : '-'}</td>
                        <td className="p-3 text-slate-400">{col.isNullable ? 'YES' : 'NO'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sample Records Table */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Sample Data Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      {selectedTable.columns.map((col, idx) => (
                        <th key={idx} className="p-3">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedTable.sampleData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        {selectedTable.columns.map((col, cIdx) => (
                          <td key={cIdx} className="p-3">{String(row[col.name] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Console Mode */}
      {viewMode === 'sql' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>Interactive SQL Query Console</span>
              </h3>
              <button
                onClick={handleRunQuery}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute SQL</span>
              </button>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          {queryResult && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Query Results</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Execution time: <span className="text-emerald-400 font-bold">{queryTimeMs}ms</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      {Object.keys(queryResult[0] || {}).map((key, i) => (
                        <th key={i} className="p-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {queryResult.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="p-3">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ERD Visualizer */}
      {viewMode === 'erd' && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-center">
          <h3 className="font-bold text-white text-base">PostgreSQL Relational ERD Topology</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Visual relationship graph mapping primary keys, foreign key dependencies, and non-blocking index trees across all tables.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left font-mono text-xs">
            {tables.map((t) => (
              <div key={t.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded font-bold text-amber-300 flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="text-[10px] text-slate-400">TABLE</span>
                </div>
                <ul className="space-y-1 text-slate-300">
                  {t.columns.map((c, i) => (
                    <li key={i} className="flex items-center justify-between text-[11px]">
                      <span>{c.name}</span>
                      <span className="text-slate-500 text-[10px]">{c.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
