import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { Sidebar } from "./components/Sidebar";
import { AccountsList, Submission } from "./components/AccountsList";
import { AccountDetailView } from "./components/AccountDetailView";
import { CreateAccountForm } from "./components/CreateAccountForm";

type ViewMode = "list" | "detail" | "create";
type SidebarView = "home" | "settings" | "help";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sidebarView, setSidebarView] = useState<SidebarView>("home");

  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: "1",
      accountName: "hp llc",
      businessType: "Technology Services",
      submittedDate: "2023-12-08",
      status: "ACTIVE",
      quotesReceived: 2,
      completionPercentage: 45,
    },
    {
      id: "2",
      accountName: "Affordable Atlanta LLC",
      businessType: "C-Store/Grocery Store",
      submittedDate: "2023-12-08",
      status: "DRAFT",
      quotesReceived: 0,
      completionPercentage: 30,
    },
    {
      id: "3",
      accountName: "Jiwani Poolville Retail LLC",
      businessType: "Retail Store",
      submittedDate: "2023-12-28",
      status: "COMPLETED",
      quotesReceived: 4,
      completionPercentage: 100,
    },
    {
      id: "4",
      accountName: "EL BUENO INC",
      businessType: "Restaurant",
      submittedDate: "2023-12-22",
      status: "DRAFT",
      quotesReceived: 1,
      completionPercentage: 20,
    },
    {
      id: "5",
      accountName: "FARAH ENTERPRISE INC",
      businessType: "Manufacturing",
      submittedDate: "2023-12-23",
      status: "ACTIVE",
      quotesReceived: 3,
      completionPercentage: 60,
    },
  ]);

  const [selectedSubmission, setSelectedSubmission] = useState<{
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
  } | null>(null);

  const handleLogin = (email: string, password: string) => {
    // Mock authentication - in real app, validate credentials
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
    setViewMode("list");
    setSelectedSubmission(null);
  };

  const handleViewDetails = (submission: Submission) => {
    // Convert submission to account detail format
    setSelectedSubmission({
      id: submission.id,
      accountName: submission.accountName,
      businessType: submission.businessType || "C-Store/Grocery Store",
      status: {
        form: submission.id === "2" ? "completed" : submission.id === "3" ? "completed" : "in-progress",
        automation: submission.id === "3" ? "completed" : submission.id === "2" ? "in-progress" : "pending",
        coversheet: submission.id === "3" ? "completed" : "pending",
        summary: submission.id === "3" ? "completed" : "pending",
        qc: submission.id === "3" ? "completed" : "pending",
      },
    });
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedSubmission(null);
  };

  const handleNewSubmission = () => {
    setViewMode("create");
  };

  const handleCreateSubmit = (data: any) => {
    const newSubmission: Submission = {
      id: `${Date.now()}`,
      accountName: data.corporationName || "New Account",
      businessType: data.operationDescription || "",
      submittedDate: new Date().toISOString().split("T")[0],
      status: "DRAFT",
      quotesReceived: 0,
      completionPercentage: 0,
    };
    setSubmissions((prev) => [newSubmission, ...prev]);
    setViewMode("list");
  };

  const handleCreateCancel = () => {
    setViewMode("list");
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Render different sidebar views
  const renderMainContent = () => {
    if (sidebarView === "settings") {
      return (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl mb-6">Settings</h2>
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-gray-600">Settings page coming soon...</p>
          </div>
        </div>
      );
    }

    if (sidebarView === "help") {
      return (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl mb-6">Help & Support</h2>
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-gray-600">Help documentation coming soon...</p>
          </div>
        </div>
      );
    }

    // Home view
    if (viewMode === "list") {
      return (
        <AccountsList
          submissions={submissions}
          onViewDetails={handleViewDetails}
          onNewSubmission={handleNewSubmission}
        />
      );
    }

    if (viewMode === "create") {
      return (
        <CreateAccountForm
          onSubmit={handleCreateSubmit}
          onCancel={handleCreateCancel}
        />
      );
    }

    if (selectedSubmission) {
      return (
        <AccountDetailView account={selectedSubmission} onBack={handleBackToList} />
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeView={sidebarView}
        onNavigate={(view) => {
          setSidebarView(view);
          setViewMode("list");
          setSelectedSubmission(null);
        }}
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{renderMainContent()}</div>
      </main>
    </div>
  );
}

export default App;