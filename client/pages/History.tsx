import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, Search, Filter, Calendar, Briefcase, Target, TrendingUp, Sparkles, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApplicationList } from "@/components/ApplicationList";
import { ApplicationRecord } from "@/types";
import {
  getApplicationHistory,
  updateApplicationStatus,
} from "@/services/mongodb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    ApplicationRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | ApplicationRecord["status"]
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const apps = await getApplicationHistory();
        setApplications(apps);
        setFilteredApplications(apps);
      } finally {
        setIsLoading(false);
      }
    };
    loadApplications();
  }, []);

  useEffect(() => {
    let result = [...applications];
    if (statusFilter !== "all") {
      result = result.filter((app) => app.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (app) =>
          app.jobTitle.toLowerCase().includes(term) ||
          app.company.toLowerCase().includes(term)
      );
    }
    setFilteredApplications(result);
  }, [statusFilter, searchTerm, applications]);

  const handleStatusChange = async (
    appId: string,
    newStatus: ApplicationRecord["status"],
  ) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      setApplications(prev => prev.map((app) =>
        app.id === appId || app._id === appId
          ? { ...app, status: newStatus }
          : app
      ));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Job Title", "Company", "Status", "Match Score", "Applied Date"];
    const rows = applications.map((app) => [
      app.jobTitle,
      app.company,
      app.status,
      `${app.atsScore || app.matchPercentage || 0}%`,
      new Date(app.appliedDate).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const avgScore = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.atsScore || a.matchPercentage || 0), 0) / applications.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black transition-all uppercase tracking-widest text-xs"
            >
               <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
                 <ArrowLeft className="h-4 w-4" />
               </div>
               Dashboard
            </button>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              Application <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">History</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Track and manage all your tailored applications in one professional hub.
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={applications.length === 0}
            className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 px-8 flex items-center gap-2 group shadow-xl shadow-slate-200 dark:shadow-none transition-all hover:scale-105"
          >
            <Download className="h-5 w-5 group-hover:animate-bounce" /> Export CSV
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
              <div className="h-16 w-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                <Briefcase className="h-8 w-8 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Apps</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white">{applications.length}</p>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Target className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white">{avgScore}%</p>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
              <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Growth</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white">Active</p>
              </div>
           </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mb-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
             <div className="relative flex-1 w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by job title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-8 pl-16 pr-8 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 focus:border-cyan-500 font-bold transition-all"
                />
             </div>
             
             <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
               <div className="flex items-center gap-2 mr-4">
                 <Filter className="h-4 w-4 text-slate-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by status:</span>
               </div>
               {['all', 'applied', 'interviewing', 'offered', 'rejected'].map((status) => (
                 <button
                   key={status}
                   onClick={() => setStatusFilter(status as any)}
                   className={cn(
                     "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                     statusFilter === status
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-lg"
                      : "bg-transparent text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                   )}
                 >
                   {status}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-32 space-y-6">
              <div className="relative">
                <div className="h-16 w-16 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin border-t-cyan-500" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading Records...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-32 space-y-8 text-center">
              <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No records found</h3>
                <p className="text-slate-500 font-medium">Try adjusting your filters or start tailoring new resumes.</p>
              </div>
              <Button
                onClick={() => navigate("/tailor")}
                className="rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black px-10 py-6"
              >
                Tailor First Resume
              </Button>
            </div>
          ) : (
            <div className="p-8">
               <div className="flex items-center gap-4 mb-8">
                  <LayoutGrid className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Applications ({filteredApplications.length})</h3>
               </div>
               <ApplicationList
                  applications={filteredApplications}
                  onStatusChange={handleStatusChange}
                  isLoading={isLoading}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
