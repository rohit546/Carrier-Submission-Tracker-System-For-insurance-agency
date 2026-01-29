import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";

interface StatusDashboardProps {
  accountName: string;
  status: {
    form: "completed" | "in-progress" | "pending";
    automation: "completed" | "in-progress" | "pending";
    coversheet: "completed" | "in-progress" | "pending";
    summary: "completed" | "in-progress" | "pending";
    qc: "completed" | "in-progress" | "pending";
  };
}

export function StatusDashboard({ accountName, status }: StatusDashboardProps) {
  const getStatusValue = (statusValue: string) => {
    switch (statusValue) {
      case "completed":
        return 100;
      case "in-progress":
        return 50;
      default:
        return 0;
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "completed":
        return "#22c55e";
      case "in-progress":
        return "#3b82f6";
      default:
        return "#d1d5db";
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (statusValue: string) => {
    switch (statusValue) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      default:
        return "Pending";
    }
  };

  const chartData = [
    { name: "Form", value: getStatusValue(status.form), status: status.form },
    {
      name: "Automation",
      value: getStatusValue(status.automation),
      status: status.automation,
    },
    {
      name: "Coversheet",
      value: getStatusValue(status.coversheet),
      status: status.coversheet,
    },
    { name: "Summary", value: getStatusValue(status.summary), status: status.summary },
    { name: "QC", value: getStatusValue(status.qc), status: status.qc },
  ];

  const totalSteps = 5;
  const completedSteps = Object.values(status).filter(
    (s) => s === "completed"
  ).length;
  const inProgressSteps = Object.values(status).filter(
    (s) => s === "in-progress"
  ).length;
  const pendingSteps = Object.values(status).filter(
    (s) => s === "pending"
  ).length;

  const overallProgress = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Overall Progress</p>
              <p className="text-3xl mb-2">{overallProgress.toFixed(0)}%</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl mb-1">{completedSteps}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl mb-1">{inProgressSteps}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-2xl mb-1">{pendingSteps}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Module Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  return [getStatusLabel(props.payload.status), "Status"];
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Module Status Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(status).map(([key, value]) => {
              const moduleName =
                key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(value)}
                    <div>
                      <p>{moduleName}</p>
                      <p className="text-sm text-gray-600">
                        {key === "form" && "Data collection and enrichment"}
                        {key === "automation" && "Carrier automation process"}
                        {key === "coversheet" && "Quotes and insured information"}
                        {key === "summary" && "Document summary generation"}
                        {key === "qc" && "Quality control verification"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      value === "completed"
                        ? "default"
                        : value === "in-progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {getStatusLabel(value)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}