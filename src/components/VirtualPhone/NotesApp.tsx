import React, { useState } from 'react';
import { ChevronLeft, FileText, Plus, Copy, Check, Lock } from 'lucide-react';
import { BackupNote } from '../../types';

interface NotesAppProps {
  notes: BackupNote[];
  onBack: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onAddNote: (title: string, service: string, codes: string[]) => void;
}

export const NotesApp: React.FC<NotesAppProps> = ({
  notes,
  onBack,
  onCopyCode,
  copiedCode,
  onAddNote,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [service, setService] = useState('');
  const [rawCodes, setRawCodes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawCodes) return;
    const codesList = rawCodes.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean);
    onAddNote(title, service || 'General', codesList);
    setTitle('');
    setService('');
    setRawCodes('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white z-10 overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-400 font-medium text-xs hover:text-blue-300"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Home</span>
        </button>

        <div className="flex items-center space-x-1">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <h2 className="text-xs font-semibold text-slate-100">Backup Codes Vault</h2>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-slate-800"
          title="Add Note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Note Drawer */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="p-3 bg-slate-900 border-b border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-300 flex justify-between items-center">
            <span>Save Backup Recovery Codes</span>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300">Cancel</button>
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
              placeholder="e.g. GitHub Recovery Codes"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Service</label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
              placeholder="GitHub, Google, AWS"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Codes (One per line or comma separated)</label>
            <textarea
              required
              value={rawCodes}
              onChange={(e) => setRawCodes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500 h-16 font-mono"
              placeholder="8x92-a1b2&#10;3c4d-5e6f"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded"
          >
            Save to Vault
          </button>
        </form>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">Vault is empty.</p>
            <p className="text-[10px]">Store backup recovery codes here for quick workflow access.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div>
                  <h3 className="font-bold text-xs text-amber-300">{note.title}</h3>
                  <span className="text-[10px] text-slate-400">{note.service}</span>
                </div>
                <span className="text-[10px] text-slate-500">{note.createdAt}</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {note.codes.map((code, idx) => {
                  const isCopied = copiedCode === code;
                  return (
                    <button
                      key={idx}
                      onClick={() => onCopyCode(code)}
                      className={`px-2 py-1.5 rounded-lg border text-left font-mono text-[11px] font-semibold flex items-center justify-between transition ${
                        isCopied
                          ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 hover:border-amber-500/60 text-slate-200'
                      }`}
                    >
                      <span className="truncate">{code}</span>
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" /> : <Copy className="w-3 h-3 text-slate-500 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
