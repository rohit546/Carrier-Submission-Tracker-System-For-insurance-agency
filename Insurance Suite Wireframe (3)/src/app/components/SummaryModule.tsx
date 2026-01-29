import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Upload, FileText, Sparkles, Download } from "lucide-react";

interface SummaryModuleProps {
  accountId: string;
  accountName: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export function SummaryModule({ accountId, accountName }: SummaryModuleProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Application_Form.pdf",
      type: "Application",
      size: "2.4 MB",
      uploadedAt: "2024-12-20",
    },
    {
      id: "2",
      name: "Loss_History.pdf",
      type: "Loss History",
      size: "1.1 MB",
      uploadedAt: "2024-12-21",
    },
  ]);

  const [generatedSummary, setGeneratedSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDocs: Document[] = Array.from(files).map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        type: "Document",
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString().split("T")[0],
      }));
      setDocuments((prev) => [...prev, ...newDocs]);
    }
  };

  const handleGenerateSummary = () => {
    setIsGenerating(true);
    // Simulate AI summary generation
    setTimeout(() => {
      const summary = `INSURANCE ACCOUNT SUMMARY

Account: ${accountName}
Generated: ${new Date().toLocaleDateString()}

BUSINESS OVERVIEW:
ABC Tech Solutions LLC is a technology services company established in 2015, operating in San Francisco, CA. The company specializes in IT consulting and software development with approximately 75 employees and annual revenue estimated between $5-10 million.

COVERAGE DETAILS:
- Property Value: $500,000
- Business Type: LLC
- Years in Business: 9
- Location Risk Zone: Low Risk
- Flood Zone: Zone X

RISK ASSESSMENT:
The business demonstrates a strong risk profile with:
- No recent claims history
- Good credit score
- Excellent safety record
- Low-risk geographic location
- Low crime rate area

CARRIER QUOTES RECEIVED:
- State Farm: Quote pending
- Progressive: Quote pending
- Liberty Mutual: Quote pending
- Nationwide: Quote pending

DOCUMENTS REVIEWED:
${documents.map((doc) => `- ${doc.name} (${doc.type})`).join("\n")}

RECOMMENDATIONS:
1. Based on the low-risk profile, recommend pursuing competitive quotes from all carriers
2. Consider bundling commercial property and general liability coverage for potential discounts
3. Review current cyber liability coverage given the technology sector operations
4. Annual policy review recommended due to business growth trajectory

NEXT STEPS:
- Complete carrier automation process
- Follow up on pending quotes
- Schedule client review meeting
- Finalize policy selection and binding`;

      setGeneratedSummary(summary);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSaveSummary = () => {
    alert("Summary saved successfully!");
  };

  const handleDownloadSummary = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedSummary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${accountName}_Summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload documents
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{doc.size}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {doc.uploadedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={handleGenerateSummary}
            disabled={isGenerating || documents.length === 0}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate AI Summary"}
          </Button>
        </div>

        {/* Summary Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account Summary</CardTitle>
                {generatedSummary && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadSummary}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" onClick={handleSaveSummary}>
                      Save Summary
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!generatedSummary ? (
                <div className="text-center py-16 text-gray-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No summary generated yet</p>
                  <p className="text-sm">
                    Upload documents and click "Generate AI Summary" to create a
                    comprehensive account summary
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6">
                  <Textarea
                    value={generatedSummary}
                    onChange={(e) => setGeneratedSummary(e.target.value)}
                    rows={25}
                    className="font-mono text-sm bg-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}