import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex space-x-1 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full max-w-2xl mx-auto mb-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-semibold rounded-xl w-full transition-colors duration-200",
              isActive ? "text-primary" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
