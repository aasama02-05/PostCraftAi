import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Loader2, MessageSquareText } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { CopyButton } from "@/components/CopyButton";
import { useGeneratePost, useRefinePost } from "@/hooks/use-posts";

const TONES = [
  "Professional",
  "Storytelling",
  "Educational",
  "Informative",
  "Motivational",
  "Thought Leadership"
];

function GenerateView() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const generateMutation = useGeneratePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
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
              {generateMutation.data.variations?.map((variation, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="font-semibold text-slate-500 text-sm tracking-wider uppercase">Option {idx + 1}</span>
                    <CopyButton text={variation} />
                  </div>
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-[15px]">
                    {variation}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RefineView() {
  const [draft, setDraft] = useState("");
  const refineMutation = useRefinePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
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
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Polished Post
                </h3>
                <CopyButton text={refineMutation.data.content} />
              </div>
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px]">
                {refineMutation.data.content}
              </div>
            </div>

            {refineMutation.data.suggestions && (
              <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 space-y-4 h-fit">
                <h4 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <MessageSquareText className="w-5 h-5" />
                  Why it's better
                </h4>
                <div className="whitespace-pre-wrap text-indigo-800/80 text-sm leading-relaxed">
                  {refineMutation.data.suggestions}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "Generate Post" && <GenerateView />}
              {activeTab === "Improve Draft" && <RefineView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
