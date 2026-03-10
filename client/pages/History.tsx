import React, { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApplicationList } from "@/components/ApplicationList";
import { ApplicationRecord } from "@/types";
import { Page } from "@/components/layout/Page";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { SectionHeader } from "@/components/premium/SectionHeader";
import { StatCard } from "@/components/premium/StatCard";
import { Button } from "@/components/ui/button";
import {
  getApplicationHistory,
  updateApplicationStatus,
} from "@/services/mongodb";

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

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const apps = await getApplicationHistory();
        setApplications(apps);
        filterApplications(apps, "all");
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const filterApplications = (
    apps: ApplicationRecord[],
    status: typeof statusFilter,
  ) => {
    if (status === "all") {
      setFilteredApplications(apps);
    } else {
      setFilteredApplications(apps.filter((app) => app.status === status));
    }
  };

  const handleStatusChange = async (
    appId: string,
    newStatus: ApplicationRecord["status"],
  ) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      const updated = applications.map((app) =>
        app.id === appId || app._id === appId
          ? { ...app, status: newStatus }
          : app,
      );
      setApplications(updated);
      filterApplications(updated, statusFilter);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleFilterChange = (status: typeof statusFilter) => {
    setStatusFilter(status);
    filterApplications(applications, status);
  };

  const handleExportCSV = () => {
    const headers = [
      "Job Title",
      "Company",
      "Status",
      "Match Score",
      "Applied Date",
    ];
    const rows = applications.map((app) => [
      app.jobTitle,
      app.company,
      app.status,
      `${app.atsScore || app.matchPercentage || 0}%`,
      new Date(app.appliedDate).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Page size="xl">
      <Button variant="ghost" onClick={() => navigate("/")} className="-ml-2 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <SectionHeader
          title="Application history"
          description="Track tailored resumes and application outcomes."
          action={
            <Button
              onClick={handleExportCSV}
              disabled={applications.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          }
        />
      </div>

      {applications.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <StatCard label="Total applications" value={applications.length} />
          <StatCard
            label="Avg match score"
            value={`${applications.length > 0
              ? Math.round(
                  applications.reduce(
                    (sum, a) =>
                      sum + (a.atsScore || a.matchPercentage || 0),
                    0,
                  ) / applications.length,
                )
              : 0}%`}
          />
        </div>
      )}

      <PremiumCard className="p-6" hover={false}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                All ({applications.length})
              </button>
            </div>
          </div>

          <ApplicationList
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
      </PremiumCard>
    </Page>
  );
};
