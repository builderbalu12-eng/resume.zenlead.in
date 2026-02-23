import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowRight, Sparkles, Ghost, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="text-center max-w-lg relative z-10 space-y-12">
        <div className="space-y-6">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-700" />
            <div className="relative h-40 w-40 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-2xl">
               <Search className="h-16 w-16 text-cyan-500 animate-bounce" />
            </div>
            <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-black text-xl shadow-xl">
               404
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
              Page <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Vanished</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
              The professional record you're looking for seems to have been archived or moved.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto py-8 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-2xl hover:scale-105 transition-all flex items-center gap-3 group">
              <Home className="h-5 w-5" />
              Back to Dashboard
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline" className="w-full sm:w-auto py-8 px-10 rounded-2xl border-2 border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
               <Sparkles className="h-4 w-4" /> View Premium Plans
            </Button>
          </Link>
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pt-8">
          ResumeMatch Pro © 2024
        </p>
      </div>
    </div>
  );
};
