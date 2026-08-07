import React, { useState } from 'react';
import { 
  Film, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Tag, 
  Play, 
  Download, 
  RefreshCw, 
  Wand2, 
  FileText
} from 'lucide-react';
import { MEDIA_ASSETS } from '../../data/mockData';
import { MediaAsset } from '../../types';

export const MediaStudio: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>(MEDIA_ASSETS);
  const [prompt, setPrompt] = useState('A sleek autonomous AI software factory dashboard with floating holographic code nodes and cyberpunk neon lighting');
  const [contentType, setContentType] = useState<'Image Prompt' | 'Video Script' | 'UI Component'>('Image Prompt');
  const [style, setStyle] = useState('Cyberpunk Studio 8K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(assets[0]);

  const handleGenerateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/media-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, contentType, style }),
      });

      const data = await res.json();

      const newAsset: MediaAsset = {
        id: 'asset_' + Math.random().toString(36).substring(7),
        title: data.title || prompt.slice(0, 30),
        type: contentType,
        concept: data.concept || 'AI Generated Asset Concept',
        description: data.scriptOrDescription || 'Detailed scene rendering specs',
        tags: data.tags || ['OPROX Media', style],
        dateCreated: new Date().toISOString().split('T')[0],
      };

      setAssets((prev) => [newAsset, ...prev]);
      setActiveAsset(newAsset);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>OPROX Media Studio & AI Content Factory</span>
            </h1>
            <p className="text-xs text-slate-400">
              AI-powered visual asset storyboarding, video script writing, prompt synthesizer, and 4K media generation.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono">
          Engine: Gemini 3.6 Flash
        </span>
      </div>

      {/* Generator Prompt Box */}
      <form onSubmit={handleGenerateAsset} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-pink-400" />
            <span>Synthesize New Media Asset</span>
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={contentType}
              onChange={(e: any) => setContentType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-pink-500 font-semibold"
            >
              <option value="Image Prompt">Image Prompt</option>
              <option value="Video Script">Video Script</option>
              <option value="UI Component">UI Component Spec</option>
            </select>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-pink-500 font-semibold"
            >
              <option value="Cyberpunk Studio 8K">Cyberpunk Studio 8K</option>
              <option value="Photorealistic Octane Render">Photorealistic Octane</option>
              <option value="Minimalist Tech Vector">Minimalist Vector</option>
              <option value="Cinematic 4K Trailer">Cinematic 4K Trailer</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the visual scene, video script concept, or brand asset..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none font-mono"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`absolute right-3 bottom-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              prompt.trim() && !isGenerating
                ? 'bg-pink-500 hover:bg-pink-400 text-slate-950 shadow-lg shadow-pink-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Asset...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Media Asset</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Asset Gallery & Active Asset Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Asset List */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Generated Media Assets ({assets.length})
          </h3>

          <div className="space-y-2">
            {assets.map((ast) => (
              <div
                key={ast.id}
                onClick={() => setActiveAsset(ast)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1 ${
                  activeAsset?.id === ast.id
                    ? 'bg-pink-500/10 border-pink-500/30 text-white'
                    : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ast.type}
                  </span>
                  <span className="text-[10px] text-slate-500">{ast.dateCreated}</span>
                </div>
                <h4 className="font-bold text-xs text-white truncate">{ast.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Asset Detail Spec */}
        {activeAsset && (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-pink-400 font-bold uppercase">
                  {activeAsset.type}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{activeAsset.title}</h3>
              </div>

              <div className="flex gap-2">
                {activeAsset.tags.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Concept Overview</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {activeAsset.concept}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Scene Rendering & Production Specs</h4>
              <pre className="text-xs font-mono text-pink-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {activeAsset.description}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
