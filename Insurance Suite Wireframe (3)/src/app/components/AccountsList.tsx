import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, FileText, Building2, TrendingUp } from "lucide-react";
import { Progress } from "./ui/progress";

export interface Submission {
  id: string;
  accountName: string;
  businessType: string;
  submittedDate: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  quotesReceived?: number;
  completionPercentage?: number;
}

interface AccountsListProps {
  submissions: Submission[];
  onViewDetails: (submission: Submission) => void;
  onNewSubmission: () => void;
}

export function AccountsList({
  submissions,
  onViewDetails,
  onNewSubmission,
}: AccountsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl">My Accounts</h2>
          <Button
            onClick={onNewSubmission}
            className="bg-green-600 hover:bg-green-700"
          >
            + New Account
          </Button>
        </div>
        <p className="text-gray-600">
          Manage and track all your insurance submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Accounts</p>
                <p className="text-2xl">{submissions.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl">
                  {submissions.filter((s) => s.status === "ACTIVE").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl">
                  {submissions.filter((s) => s.status === "COMPLETED").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Draft</p>
                <p className="text-2xl">
                  {submissions.filter((s) => s.status === "DRAFT").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <Card
            key={submission.id}
            className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => onViewDetails(submission)}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg mb-1 truncate group-hover:text-green-600 transition-colors">
                      {submission.accountName}
                    </h3>
                    {submission.businessType && (
                      <p className="text-sm text-gray-500 truncate">
                        {submission.businessType}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <Badge
                  className={`${getStatusColor(submission.status)} border`}
                  variant="outline"
                >
                  {submission.status}
                </Badge>
              </div>

              {/* Progress */}
              {submission.completionPercentage !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-green-600">
                      {submission.completionPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={submission.completionPercentage}
                    className="h-2"
                  />
                </div>
              )}

              {/* Meta Information */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(submission.submittedDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  {submission.quotesReceived || 0} quotes
                </div>
              </div>

              {/* Hover Action */}
              <Button
                variant="ghost"
                className="w-full mt-4 text-green-600 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onViewDetails(submission);
                }}
              >
                View Details →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {submissions.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl mb-2">No submissions yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first submission to get started
            </p>
            <Button
              onClick={onNewSubmission}
              className="bg-green-600 hover:bg-green-700"
            >
              + New Submission
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}