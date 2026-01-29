import { Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

export interface Account {
  id: string;
  name: string;
  status: {
    form: "completed" | "in-progress" | "pending";
    automation: "completed" | "in-progress" | "pending";
    coversheet: "completed" | "in-progress" | "pending";
    summary: "completed" | "in-progress" | "pending";
    qc: "completed" | "in-progress" | "pending";
  };
  completionPercentage: number;
  insuredName?: string;
  policyType?: string;
}

interface AccountCardProps {
  account: Account;
  onClick: () => void;
  isSelected?: boolean;
}

export function AccountCard({ account, onClick, isSelected }: AccountCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-600" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              {account.insuredName && (
                <p className="text-sm text-gray-600 mt-1">{account.insuredName}</p>
              )}
            </div>
          </div>
          {account.policyType && (
            <Badge variant="outline">{account.policyType}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span>{account.completionPercentage}%</span>
            </div>
            <Progress value={account.completionPercentage} />
          </div>

          <div className="grid grid-cols-5 gap-2 pt-2">
            <div className="flex flex-col items-center gap-1">
              {getStatusIcon(account.status.form)}
              <span className="text-xs text-gray-600">Form</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              {getStatusIcon(account.status.automation)}
              <span className="text-xs text-gray-600">Auto</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              {getStatusIcon(account.status.coversheet)}
              <span className="text-xs text-gray-600">Cover</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              {getStatusIcon(account.status.summary)}
              <span className="text-xs text-gray-600">Summary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              {getStatusIcon(account.status.qc)}
              <span className="text-xs text-gray-600">QC</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
