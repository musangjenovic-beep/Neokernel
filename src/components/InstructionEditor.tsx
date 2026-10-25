import React, { useState, useEffect } from 'react';
import { Instruction } from '../types/virtualComputer';
import { Assembler } from '../core/assembler';
import { OS_PRESETS, OsPreset } from '../core/osPrograms';
import {
  Code,
  FileJson,
  Upload,
  Download,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface InstructionEditorProps {
  currentInstructions: Instruction[];
  onLoadProgram: (instructions: Instruction[], baseAddr?: number) => void;
  currentPC: number;
  isRunning: boolean;
  onApplyPreset?: (preset: OsPreset) => void;
}

export const InstructionEditor: React.FC<InstructionEditorProps> = ({
  currentInstructions,
  onLoadProgram,
  currentPC,
  isRunning,
  onApplyPreset,
}) => {
  const [mode, setMode] = useState<'JSON' | 'ASM'>('JSON');
  const [jsonText, setJsonText] = useState<string>('');
  const [asmText, setAsmText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nano_os');
  const [injectSuccess, setInjectSuccess] = useState<boolean>(false);

  // Sync state when currentInstructions change externally
  useEffect(() => {
    setJsonText(JSON.stringify(currentInstructions, null, 2));
    setAsmText(Assembler.disassemble(currentInstructions));
  }, [currentInstructions]);

  // Handle switching between JSON and ASM
  const handleSwitchMode = (targetMode: 'JSON' | 'ASM') => {
    if (targetMode === mode) return;

    if (mode === 'JSON') {
      const res = Assembler.validateJsonInstructions(jsonText);
      if (res.instructions) {
        setAsmText(Assembler.disassemble(res.instructions));
        setValidationError(null);
        setMode('ASM');
      } else {
        setValidationError(res.error);
      }
    } else {
      const res = Assembler.assemble(asmText);
      if (res.errors.length === 0) {
        setJsonText(JSON.stringify(res.instructions, null, 2));
        setValidationError(null);
        setMode('JSON');
      } else {
        setValidationError(res.errors.join('; '));
      }
    }
  };

  // Inject current editor content into CPU
  const handleInject = () => {
    if (mode === 'JSON') {
      const res = Assembler.validateJsonInstructions(jsonText);
      if (res.instructions) {
        onLoadProgram(res.instructions, 0x0080);
        setValidationError(null);
        setInjectSuccess(true);
        setTimeout(() => setInjectSuccess(false), 2500);
      } else {
        setValidationError(res.error);
      }
    } else {
      const res = Assembler.assemble(asmText);
      if (res.errors.length === 0) {
        onLoadProgram(res.instructions, 0x0080);
        setValidationError(null);
        setInjectSuccess(true);
        setTimeout(() => setInjectSuccess(false), 2500);
      } else {
        setValidationError(res.errors.join('\n'));
      }
    }
  };

  // Load a preset OS
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = OS_PRESETS.find((p) => p.id === presetId);
    if (found) {
      if (onApplyPreset) {
        onApplyPreset(found);
      } else {
        onLoadProgram(found.instructions, 0x0080);
      }
      setJsonText(JSON.stringify(found.instructions, null, 2));
      setAsmText(Assembler.disassemble(found.instructions));
      setValidationError(null);
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    let contentToExport = jsonText;
    if (mode === 'ASM') {
      const res = Assembler.assemble(asmText);
      if (res.instructions.length > 0) {
        contentToExport = JSON.stringify(res.instructions, null, 2);
      }
    }

    const blob = new Blob([contentToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtuarch_program_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file from user disk
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = Assembler.validateJsonInstructions(content);
      if (res.instructions) {
        setJsonText(content);
        setAsmText(Assembler.disassemble(res.instructions));
        onLoadProgram(res.instructions, 0x0080);
        setValidationError(null);
        setInjectSuccess(true);
        setTimeout(() => setInjectSuccess(false), 2500);
      } else {
        setValidationError(res.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentInstIndex = currentPC - 0x0080;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full space-y-3">
      {/* Top Header & Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Injecteur de Code Bas-Niveau (Instructions Séquentielles JSON)
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Modèle / OS :</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-cyan-300 text-xs rounded px-2.5 py-1 font-medium outline-none focus:border-cyan-500"
          >
            {OS_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* JSON vs ASM Mode Segmented Control */}
        <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => handleSwitchMode('JSON')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'JSON'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode Fichier JSON
          </button>
          <button
            onClick={() => handleSwitchMode('ASM')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'ASM'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode Assembleur (ASM)
          </button>
        </div>

        {/* Action Buttons: Import, Export, Inject */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer transition-colors text-[11px]">
            <Upload className="w-3 h-3" />
            <span>Importer JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors text-[11px]"
          >
            <Download className="w-3 h-3" />
            <span>Télécharger JSON</span>
          </button>

          <button
            onClick={handleInject}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded transition-colors text-xs"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Injecter dans le CPU</span>
          </button>
        </div>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{validationError}</span>
        </div>
      )}

      {injectSuccess && (
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Programme injecté dans la mémoire RAM (adresse 0x0080). Prêt pour l'exécution !</span>
        </div>
      )}

      {/* Main Textarea Editor */}
      <div className="flex-1 min-h-[300px] flex flex-col relative">
        <textarea
          value={mode === 'JSON' ? jsonText : asmText}
          onChange={(e) => {
            if (mode === 'JSON') setJsonText(e.target.value);
            else setAsmText(e.target.value);
          }}
          spellCheck={false}
          className="flex-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
          placeholder={
            mode === 'JSON'
              ? '[\n  { "op": "MOV", "dst": "R0", "src": 10 },\n  { "op": "ADD", "dst": "R0", "src": 5 },\n  { "op": "HALT" }\n]'
              : 'MOV R0, 10\nADD R0, 5\nHALT'
          }
        />

        {/* Live Execution Instruction Pointer */}
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>Pointeur PC: <strong className="text-cyan-400">0x{currentPC.toString(16).toUpperCase()}</strong></span>
            <span>·</span>
            <span>Index Instruction: <strong className="text-white">#{currentInstIndex}</strong></span>
          </div>
          <div>
            Format: {mode === 'JSON' ? 'Spécification Bas-Niveau JSON' : 'Mnémoniques Assembleur'}
          </div>
        </div>
      </div>
    </div>
  );
};
