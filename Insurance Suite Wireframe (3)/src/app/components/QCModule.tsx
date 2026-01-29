import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Upload, FileText, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

interface QCModuleProps {
  accountId: string;
  accountName: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: "policy" | "accord";
  uploadedAt: string;
}

interface Difference {
  field: string;
  policyValue: string;
  accordValue: string;
  severity: "high" | "medium" | "low";
}

export function QCModule({ accountId, accountName }: QCModuleProps) {
  const [policyFile, setPolicyFile] = useState<UploadedFile | null>(null);
  const [accordFile, setAccordFile] = useState<UploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handlePolicyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPolicyFile({
        id: Date.now().toString(),
        name: file.name,
        type: "policy",
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  const handleAccordUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAccordFile({
        id: Date.now().toString(),
        name: file.name,
        type: "accord",
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      const mockDifferences: Difference[] = [
        {
          field: "Coverage Limit",
          policyValue: "$1,000,000",
          accordValue: "$500,000",
          severity: "high",
        },
        {
          field: "Deductible Amount",
          policyValue: "$5,000",
          accordValue: "$2,500",
          severity: "high",
        },
        {
          field: "Effective Date",
          policyValue: "01/01/2025",
          accordValue: "01/15/2025",
          severity: "medium",
        },
        {
          field: "Named Insured",
          policyValue: "ABC Tech Solutions LLC",
          accordValue: "ABC Tech Solutions",
          severity: "low",
        },
        {
          field: "Policy Number",
          policyValue: "POL-2025-001234",
          accordValue: "POL-2025-001234",
          severity: "low",
        },
      ];
      setDifferences(mockDifferences);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 2500);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const criticalIssues = differences.filter((d) => d.severity === "high").length;
  const mediumIssues = differences.filter((d) => d.severity === "medium").length;
  const matchingFields = differences.filter(
    (d) => d.policyValue === d.accordValue
  ).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="differences">Differences</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Policy Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <Label htmlFor="policy-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Upload Policy Document
                    </p>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </Label>
                  <Input
                    id="policy-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handlePolicyUpload}
                    className="hidden"
                  />
                </div>

                {policyFile && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm">{policyFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(policyFile.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accord Upload */}
            <Card>
              <CardHeader>
                <CardTitle>ACORD Form</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <Label htmlFor="accord-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Upload ACORD Form
                    </p>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </Label>
                  <Input
                    id="accord-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleAccordUpload}
                    className="hidden"
                  />
                </div>

                {accordFile && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm">{accordFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(accordFile.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAnalyze}
                disabled={!policyFile || !accordFile || isAnalyzing}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analyzing with AI..." : "Analyze Documents"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {!analysisComplete ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No analysis yet</p>
                <p className="text-sm">
                  Upload both documents and click "Analyze Documents" to begin
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                      <p className="text-3xl mb-1">{criticalIssues}</p>
                      <p className="text-sm text-gray-600">Critical Issues</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-3xl mb-1">{mediumIssues}</p>
                      <p className="text-sm text-gray-600">Medium Issues</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-3xl mb-1">{matchingFields}</p>
                      <p className="text-sm text-gray-600">Matching Fields</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm">
                          <strong>{criticalIssues} critical discrepancies</strong> found
                          between the policy and ACORD form. Immediate review required.
                        </p>
                      </div>
                    </div>

                    {mediumIssues > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm">
                            <strong>{mediumIssues} medium-priority issues</strong>{" "}
                            require verification.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm">
                          <strong>{matchingFields} fields match</strong> correctly
                          between documents.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Differences Tab */}
        <TabsContent value="differences" className="space-y-4">
          {!analysisComplete ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No differences to show</p>
                <p className="text-sm">Complete the analysis first</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Field Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {differences.map((diff, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4>{diff.field}</h4>
                        {getSeverityBadge(diff.severity)}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Policy Value</p>
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm">{diff.policyValue}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-600 mb-1">ACORD Value</p>
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-sm">{diff.accordValue}</p>
                          </div>
                        </div>
                      </div>

                      {diff.policyValue !== diff.accordValue && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            {diff.severity === "high"
                              ? "⚠️ Critical: Values do not match. Verify immediately."
                              : diff.severity === "medium"
                              ? "⚡ Review: Minor discrepancy detected."
                              : "✓ Note: Values match or minor formatting difference."}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {analysisComplete && (
        <Card>
          <CardContent className="pt-6">
            <Button className="w-full" size="lg">
              Mark QC as Complete
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}