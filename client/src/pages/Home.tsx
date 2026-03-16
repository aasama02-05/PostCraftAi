import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Loader2, MessageSquareText, Download, X, Maximize2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { CopyButton } from "@/components/CopyButton";
import { useGeneratePost, useRefinePost, useGenerateImages, useEditPost } from "@/hooks/use-posts";
import * as Dialog from "@radix-ui/react-dialog";

const TONES = [
  "Professional",
  "Storytelling",
  "Educational",
  "Informative",
  "Motivational",
  "Thought Leadership"
];

function ImagePreviewModal({ image, isOpen, onClose }: { image: string | null; isOpen: boolean; onClose: () => void }) {
  if (!image) return null;
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 outline-none">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <Dialog.Close asChild>
              <button className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/50">
              <img src={image} className="w-auto h-auto max-w-full max-h-[80vh] object-contain" alt="Preview" />
              <div className="absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2">
                <a
                  href={image}
                  download="postcraft-image.png"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full shadow-lg font-medium tracking-wide transition-all"
                >
                  <Download className="w-4 h-4" /> Download High-Res
                </a>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PostCard({ 
  initialContent, 
  title, 
  provider,
  delay = 0,
  className = "bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col space-y-4 hover:shadow-md transition-shadow"
}: { 
  initialContent: string; 
  title: React.ReactNode;
  provider: string;
  delay?: number;
  className?: string;
}) {
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const editMutation = useEditPost();

  const currentContent = history[currentIndex];

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    editMutation.mutate(
      { originalContent: currentContent, instructions: chatInput, provider },
      {
        onSuccess: (data) => {
          // Slice history up to current index + 1 (removes "future" states if they redo something different)
          const newHistory = [...history.slice(0, currentIndex + 1), data.content];
          setHistory(newHistory);
          setCurrentIndex(newHistory.length - 1);
          setChatInput("");
          setIsEditing(false);
        }
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={className}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="font-semibold text-slate-800 text-sm tracking-wide flex items-center gap-3">
          {title}
          
          {history.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1.5 py-1 text-slate-500 shadow-inner ml-2">
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-0.5 hover:bg-slate-200 hover:text-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous version"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold px-1 select-none">
                {currentIndex + 1} / {history.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.min(history.length - 1, currentIndex + 1))}
                disabled={currentIndex === history.length - 1}
                className="p-0.5 hover:bg-slate-200 hover:text-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next version"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium border ${isEditing ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <MessageSquareText className="w-4 h-4" />
            Improve
          </button>
          <CopyButton text={currentContent} />
        </div>
      </div>
      
      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-[15px]">
        {currentContent}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-4 border-t border-slate-100 mt-2"
          >
            <form onSubmit={handleEdit} className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
              <input
                type="text"
                placeholder="E.g. Make it funnier, add 3 hashtags, shorten it..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm px-2 text-slate-800 placeholder:text-slate-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={editMutation.isPending || !chatInput.trim()}
                className="w-full sm:w-auto shrink-0 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Edit
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GenerateView() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [regeneratedImages, setRegeneratedImages] = useState<string[] | null>(null);
  const generateMutation = useGeneratePost();
  const generateImagesMutation = useGenerateImages();

  const handleRegenerateImages = () => {
    generateImagesMutation.mutate({ topic }, {
      onSuccess: (data) => {
        setRegeneratedImages(prev => [...(prev || generateMutation.data?.images || []), ...data.images]);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setRegeneratedImages(null);
    generateMutation.mutate({ topic, tone });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-bold text-slate-700 mb-2">
            What do you want to post about?
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. My top 3 learnings from scaling a SaaS startup to 10k MRR..."
            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-y text-slate-700 placeholder:text-slate-400"
            required
          />
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-bold text-slate-700 mb-2">
            Select Tone
          </label>
          <div className="relative">
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-4 pr-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-medium"
            >
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={generateMutation.isPending || !topic.trim()}
          className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-primary/30"
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating Magic...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Post</>
          )}
        </button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {generateMutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4">
              ✨ Generated Variations
            </h3>

            <div className="grid gap-6">
              {generateMutation.data.variations?.map((variation: any, idx) => (
                <PostCard 
                  key={idx}
                  initialContent={typeof variation === 'string' ? variation : variation.content}
                  provider={typeof variation === 'string' ? 'unknown' : variation.provider}
                  title={`OPTION ${idx + 1}`}
                  delay={idx * 0.1}
                />
              ))}
            </div>

            {generateMutation.data.images && generateMutation.data.images.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    AI-Generated Visuals
                  </p>
                  <button
                    onClick={handleRegenerateImages}
                    disabled={generateImagesMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${generateImagesMutation.isPending ? 'animate-spin' : ''}`} />
                    {generateImagesMutation.isPending ? 'Improving...' : 'Improve Images'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(regeneratedImages || generateMutation.data.images).map((img, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => setPreviewImage(img)}>
                      <img
                        src={img}
                        alt={`Generated visual ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white drop-shadow-md" />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
                          <a
                            href={img}
                            download={`postcraft-image-${i + 1}.png`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <ImagePreviewModal image={previewImage} isOpen={!!previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

function RefineView() {
  const [draft, setDraft] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [regeneratedImages, setRegeneratedImages] = useState<string[] | null>(null);
  const refineMutation = useRefinePost();
  const generateImagesMutation = useGenerateImages();

  const handleRegenerateImages = () => {
    // For refinement, we generate images based on the polished content if available,
    // otherwise fallback to draft.
    const contentToUse = refineMutation.data?.content || draft;
    generateImagesMutation.mutate({ topic: contentToUse }, {
      onSuccess: (data) => {
        setRegeneratedImages(prev => [...(prev || refineMutation.data?.images || []), ...data.images]);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setRegeneratedImages(null);
    refineMutation.mutate({ draft });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <label htmlFor="draft" className="block text-sm font-bold text-slate-700 mb-2">
            Paste your rough draft
          </label>
          <textarea
            id="draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste the post you want to improve here..."
            className="w-full min-h-[200px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-y text-slate-700 placeholder:text-slate-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={refineMutation.isPending || !draft.trim()}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {refineMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Refining...</>
          ) : (
            <><Wand2 className="w-5 h-5" /> Improve Draft</>
          )}
        </button>
      </form>

      <AnimatePresence>
        {refineMutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {refineMutation.data.variations && refineMutation.data.variations.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4">
                  ✨ Improved Variations
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                  {refineMutation.data.variations.map((variation: any, idx: number) => (
                    <PostCard
                      key={idx}
                      initialContent={typeof variation === 'string' ? variation : variation.content}
                      provider={typeof variation === 'string' ? 'unknown' : variation.provider}
                      title={`OPTION ${idx + 1}`}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col space-y-4 hover:shadow-md transition-shadow"
                    />
                  ))}
                </div>
              </div>
            )}

            {refineMutation.data.images && refineMutation.data.images.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    AI-Generated Visuals
                  </p>
                  <button
                    onClick={handleRegenerateImages}
                    disabled={generateImagesMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${generateImagesMutation.isPending ? 'animate-spin' : ''}`} />
                    {generateImagesMutation.isPending ? 'Improving...' : 'Improve Images'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(regeneratedImages || refineMutation.data.images).map((img, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => setPreviewImage(img)}>
                      <img
                        src={img}
                        alt={`Generated visual ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white drop-shadow-md" />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
                          <a
                            href={img}
                            download={`postcraft-refined-img-${i + 1}.png`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <ImagePreviewModal image={previewImage} isOpen={!!previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("Generate Post");

  return (
    <div className="min-h-screen bg-transparent pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            <span className="text-gradient">PostCraft AI</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            AI-powered LinkedIn post generation. Create high-converting, professional posts in seconds. 
            Start from scratch or refine your drafts into viral content.
          </p>
        </div>

        {/* Navigation */}
        <Tabs
          tabs={["Generate Post", "Improve Draft"]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Content Area */}
        <main className="min-h-[500px]">
          <div className={activeTab === "Generate Post" ? "block animate-in fade-in slide-in-from-bottom-2 duration-500" : "hidden"}>
            <GenerateView />
          </div>
          <div className={activeTab === "Improve Draft" ? "block animate-in fade-in slide-in-from-bottom-2 duration-500" : "hidden"}>
            <RefineView />
          </div>
        </main>
      </div>
    </div>
  );
}
