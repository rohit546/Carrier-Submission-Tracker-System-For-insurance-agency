import { useState } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, Zap, Send, BarChart3 } from "lucide-react";
import { InsuredInformationForm } from "./InsuredInformationForm";
import { CoversheetModule } from "./CoversheetModule";
import { SummaryModule } from "./SummaryModule";
import { QCModule } from "./QCModule";
import { StatusDashboard } from "./StatusDashboard";
import { DocumentsModule } from "./DocumentsModule";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface AccountDetailViewProps {
  account: {
    id: string;
    accountName: string;
    businessType: string;
    status: {
      form: "completed" | "in-progress" | "pending";
      automation: "completed" | "in-progress" | "pending";
      coversheet: "completed" | "in-progress" | "pending";
      summary: "completed" | "in-progress" | "pending";
      qc: "completed" | "in-progress" | "pending";
    };
  };
  onBack: () => void;
}

export function AccountDetailView({ account, onBack }: AccountDetailViewProps) {
  const [activeTab, setActiveTab] = useState("insured");

  const handleFormSave = (data: any) => {
    console.log("Form saved:", data);
    // Handle form save
  };

  // Calculate overall progress
  const statusValues = Object.values(account.status);
  const completedCount = statusValues.filter((s) => s === "completed").length;
  const overallProgress = (completedCount / statusValues.length) * 100;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hover:bg-green-50 hover:text-green-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>

        {/* Account Info Card */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl mb-2">{account.accountName}</h1>
                <p className="text-gray-600 mb-4">{account.businessType}</p>
                
                {/* Progress Bar */}
                <div className="max-w-md">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="text-green-600">{overallProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Automation Status
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Auto Submit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-white border-0 shadow-sm p-1">
          <TabsTrigger
            value="insured"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Insured Info
          </TabsTrigger>
          <TabsTrigger
            value="coversheet"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Coversheet
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="qc"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            QC
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Status
          </TabsTrigger>
        </TabsList>

        {/* Insured Information Tab */}
        <TabsContent value="insured">
          <InsuredInformationForm
            accountName={account.accountName}
            onSave={handleFormSave}
          />
        </TabsContent>

        {/* Coversheet Tab */}
        <TabsContent value="coversheet">
          <CoversheetModule
            accountId={account.id}
            accountName={account.accountName}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentsModule
            accountId={account.id}
            accountName={account.accountName}
          />
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <SummaryModule
            accountId={account.id}
            accountName={account.accountName}
          />
        </TabsContent>

        {/* QC Tab */}
        <TabsContent value="qc">
          <QCModule accountId={account.id} accountName={account.accountName} />
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <StatusDashboard
            accountName={account.accountName}
            status={account.status}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}