import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Send, Check, Loader2, DollarSign } from "lucide-react";

interface CoversheetModuleProps {
  accountId: string;
  accountName: string;
}

interface Carrier {
  id: string;
  name: string;
  status: "pending" | "sent" | "quoted";
  quote?: number;
  remarks?: string;
}

export function CoversheetModule({ accountId, accountName }: CoversheetModuleProps) {
  const [insuredInfo, setInsuredInfo] = useState({
    name: "ABC Tech Solutions LLC",
    address: "123 Innovation Drive, San Francisco, CA 94105",
    contactPerson: "John Smith",
    phone: "(555) 123-4567",
    email: "john@abctech.com",
  });

  const [carriers, setCarriers] = useState<Carrier[]>([
    { id: "1", name: "State Farm", status: "pending" },
    { id: "2", name: "Progressive", status: "pending" },
    { id: "3", name: "Liberty Mutual", status: "pending" },
    { id: "4", name: "Nationwide", status: "pending" },
  ]);

  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteRemarks, setQuoteRemarks] = useState("");

  const handleSendToCarrier = (carrierId: string) => {
    setCarriers((prev) =>
      prev.map((c) =>
        c.id === carrierId ? { ...c, status: "sent" as const } : c
      )
    );
  };

  const handleSaveQuote = () => {
    if (selectedCarrier) {
      setCarriers((prev) =>
        prev.map((c) =>
          c.id === selectedCarrier.id
            ? {
                ...c,
                status: "quoted" as const,
                quote: parseFloat(quoteAmount),
                remarks: quoteRemarks,
              }
            : c
        )
      );
      setSelectedCarrier(null);
      setQuoteAmount("");
      setQuoteRemarks("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "quoted":
        return <Badge variant="default">Quoted</Badge>;
      case "sent":
        return <Badge variant="secondary">Sent</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="insured" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insured">Insured Info</TabsTrigger>
          <TabsTrigger value="carriers">Carriers & Quotes</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Insured Info Tab */}
        <TabsContent value="insured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insured Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="insured-name">Business Name</Label>
                <Input
                  id="insured-name"
                  value={insuredInfo.name}
                  onChange={(e) =>
                    setInsuredInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="insured-address">Address</Label>
                <Input
                  id="insured-address"
                  value={insuredInfo.address}
                  onChange={(e) =>
                    setInsuredInfo((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-person">Contact Person</Label>
                  <Input
                    id="contact-person"
                    value={insuredInfo.contactPerson}
                    onChange={(e) =>
                      setInsuredInfo((prev) => ({
                        ...prev,
                        contactPerson: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={insuredInfo.phone}
                    onChange={(e) =>
                      setInsuredInfo((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={insuredInfo.email}
                  onChange={(e) =>
                    setInsuredInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <Button className="w-full">Save Insured Info</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carriers & Quotes Tab */}
        <TabsContent value="carriers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carriers List */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Carriers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {carriers.map((carrier) => (
                  <div
                    key={carrier.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCarrier(carrier)}
                  >
                    <div className="flex-1">
                      <p>{carrier.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(carrier.status)}
                        {carrier.quote && (
                          <span className="text-sm text-gray-600">
                            ${carrier.quote.toLocaleString()}/year
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={carrier.status === "sent" ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (carrier.status === "pending") {
                          handleSendToCarrier(carrier.id);
                        }
                      }}
                      disabled={carrier.status !== "pending"}
                    >
                      {carrier.status === "sent" ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Sent
                        </>
                      ) : carrier.status === "quoted" ? (
                        "Quoted"
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quote Entry */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCarrier ? `Quote for ${selectedCarrier.name}` : "Select a Carrier"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCarrier ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quote-amount">Quote Amount (Annual)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="quote-amount"
                          type="number"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                          placeholder="Enter quote amount"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="quote-remarks">Remarks / Notes</Label>
                      <Textarea
                        id="quote-remarks"
                        value={quoteRemarks}
                        onChange={(e) => setQuoteRemarks(e.target.value)}
                        placeholder="Add any notes or remarks about this quote..."
                        rows={6}
                      />
                    </div>

                    {selectedCarrier.quote && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm">Current Quote</p>
                        <p className="text-lg">
                          ${selectedCarrier.quote.toLocaleString()}/year
                        </p>
                        {selectedCarrier.remarks && (
                          <p className="text-sm text-gray-600 mt-2">
                            {selectedCarrier.remarks}
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleSaveQuote}
                      disabled={!quoteAmount}
                    >
                      Save Quote & Remarks
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Select a carrier from the list to enter quote details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="mb-2">Form Data Available</h4>
                  <p className="text-sm text-gray-600">
                    All form information has been collected and is ready to be sent to
                    carriers automatically.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {carriers.map((carrier) => (
                    <Card key={carrier.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4>{carrier.name}</h4>
                          {getStatusBadge(carrier.status)}
                        </div>
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleSendToCarrier(carrier.id)}
                          disabled={carrier.status !== "pending"}
                        >
                          {carrier.status === "pending" ? (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Auto-Send Data
                            </>
                          ) : carrier.status === "sent" ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Awaiting Response
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Completed
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <Button className="w-full" size="lg" variant="outline">
                    Send to All Carriers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}