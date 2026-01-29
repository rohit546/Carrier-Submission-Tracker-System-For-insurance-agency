import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  FolderOpen,
} from "lucide-react";

interface DocumentsModuleProps {
  accountId: string;
  accountName: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadDate: string;
  size: string;
  status: "uploaded" | "processing" | "verified";
  uploadedBy: string;
}

export function DocumentsModule({ accountId, accountName }: DocumentsModuleProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Certificate_of_Insurance.pdf",
      type: "PDF",
      category: "Certificates",
      uploadDate: "2024-01-15",
      size: "245 KB",
      status: "verified",
      uploadedBy: "Agent Smith",
    },
    {
      id: "2",
      name: "Property_Inspection_Report.pdf",
      type: "PDF",
      category: "Inspections",
      uploadDate: "2024-01-14",
      size: "1.2 MB",
      status: "verified",
      uploadedBy: "Agent Smith",
    },
    {
      id: "3",
      name: "Loss_History.xlsx",
      type: "XLSX",
      category: "Loss Runs",
      uploadDate: "2024-01-13",
      size: "89 KB",
      status: "uploaded",
      uploadedBy: "Agent Smith",
    },
  ]);

  const [uploading, setUploading] = useState(false);

  const categories = [
    "All Documents",
    "Certificates",
    "Policies",
    "Inspections",
    "Loss Runs",
    "ACORD Forms",
    "Other",
  ];

  const [selectedCategory, setSelectedCategory] = useState("All Documents");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      // Simulate upload
      setTimeout(() => {
        const newDoc: Document = {
          id: `${Date.now()}`,
          name: files[0].name,
          type: files[0].name.split(".").pop()?.toUpperCase() || "FILE",
          category: selectedCategory === "All Documents" ? "Other" : selectedCategory,
          uploadDate: new Date().toISOString().split("T")[0],
          size: `${(files[0].size / 1024).toFixed(0)} KB`,
          status: "processing",
          uploadedBy: "Agent Smith",
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setUploading(false);
      }, 1500);
    }
  };

  const handleDelete = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Upload className="w-3 h-3 mr-1" />
            Uploaded
          </Badge>
        );
    }
  };

  const filteredDocuments =
    selectedCategory === "All Documents"
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border-0 shadow-sm">
          <TabsTrigger
            value="manage"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Manage Documents
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Upload New
          </TabsTrigger>
        </TabsList>

        {/* Manage Documents Tab */}
        <TabsContent value="manage" className="space-y-4">
          {/* Category Filter */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === category
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredDocuments.length} document(s) found
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {selectedCategory}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length > 0 ? (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* File Icon */}
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate mb-1">{doc.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{doc.category}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {getStatusBadge(doc.status)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg mb-2">No documents found</h3>
                  <p className="text-gray-600 mb-4">
                    No documents in this category yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload New Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Selection */}
              <div>
                <Label className="mb-3 block">Document Category</Label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.slice(1).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`p-3 border-2 rounded-lg text-sm transition-all ${
                        selectedCategory === category
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <Label htmlFor="file-upload" className="mb-3 block">
                  Select Files
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="mb-2">
                      {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      PDF, DOCX, XLSX, PNG, JPG (max. 10MB)
                    </p>
                  </label>
                </div>
              </div>

              {/* Recent Uploads */}
              {documents.length > 0 && (
                <div>
                  <Label className="mb-3 block">Recent Uploads</Label>
                  <div className="space-y-2">
                    {documents.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <FileText className="w-5 h-5 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-gray-600">{doc.size}</p>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
