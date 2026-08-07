import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';

interface TerminalEmulatorProps {
  logs: string[];
  onExecuteCommand: (command: string) => void;
  onClearLogs: () => void;
}

export const TerminalEmulator: React.FC<TerminalEmulatorProps> = ({
  logs,
  onExecuteCommand,
  onClearLogs,
}) => {
  const [inputVal, setInputVal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onExecuteCommand(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 font-mono text-xs border-t border-slate-800 text-slate-200">
      {/* Terminal Top Control Bar */}
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
            OPROX Bash Terminal Emulator
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            TTY 1
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Clear Console Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Logs Canvas */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text">
        <div className="text-slate-500 text-[11px] pb-2">
          OPROX Autonomous Terminal OS [Version 4.2.0-enterprise]
          <br />
          Type <span className="text-emerald-400">help</span> to list commands (<span className="text-indigo-400">oprox build</span>, <span className="text-indigo-400">oprox test</span>, <span className="text-indigo-400">ls</span>, <span className="text-indigo-400">cat</span>, <span className="text-indigo-400">oprox deploy</span>).
        </div>

        {logs.map((log, idx) => {
          let isError = log.includes('[ERROR]') || log.includes('failed');
          let isSuccess = log.includes('[SUCCESS]') || log.includes('passed') || log.includes('Deployed');
          let isCmd = log.startsWith('oprox@workspace:~$');

          return (
            <div
              key={idx}
              className={`leading-relaxed whitespace-pre-wrap break-all ${
                isCmd
                  ? 'text-emerald-400 font-semibold'
                  : isError
                  ? 'text-rose-400'
                  : isSuccess
                  ? 'text-teal-300'
                  : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Command Input Form */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <div className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
          <span>oprox@workspace:~$</span>
        </div>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Execute bash command or 'oprox agent --prompt <text>'..."
          className="flex-1 bg-transparent border-none text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
        >
          <Play className="w-3 h-3 text-emerald-400" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};
