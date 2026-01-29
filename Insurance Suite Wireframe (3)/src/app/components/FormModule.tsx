import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { MapPin, Sparkles } from "lucide-react";

interface FormModuleProps {
  accountId: string;
  accountName: string;
}

export function FormModule({ accountId, accountName }: FormModuleProps) {
  const [formData, setFormData] = useState({
    insuredName: "",
    businessType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    yearsInBusiness: "",
    annualRevenue: "",
    numberOfEmployees: "",
    propertyValue: "",
    description: "",
  });

  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrichData = () => {
    setIsEnriching(true);
    // Simulate API call for data enrichment
    setTimeout(() => {
      setEnrichedData({
        businessInfo: {
          foundedYear: "2015",
          industry: "Technology Services",
          employeeRange: "50-100",
          estimatedRevenue: "$5M - $10M",
        },
        riskFactors: {
          claims: "No recent claims",
          creditScore: "Good",
          safetyRecord: "Excellent",
        },
        location: {
          riskZone: "Low Risk",
          floodZone: "Zone X",
          crimeRate: "Low",
        },
      });
      setIsEnriching(false);
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Form & Data Enrichment</h2>
          <p className="text-gray-600 mt-1">Account: {accountName}</p>
        </div>
        <Button onClick={handleEnrichData} disabled={isEnriching}>
          <Sparkles className="w-4 h-4 mr-2" />
          {isEnriching ? "Enriching..." : "Enrich Data"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insured Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="insuredName">Insured Name</Label>
                  <Input
                    id="insuredName"
                    value={formData.insuredName}
                    onChange={(e) => handleInputChange("insuredName", e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleInputChange("businessType", value)}
                  >
                    <SelectTrigger id="businessType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="sole">Sole Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    value={formData.yearsInBusiness}
                    onChange={(e) => handleInputChange("yearsInBusiness", e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-4 bg-gray-100 rounded-lg h-48 flex items-center justify-center border border-gray-300">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Interactive Map View</p>
                  <p className="text-sm text-gray-500">Location will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    value={formData.annualRevenue}
                    onChange={(e) => handleInputChange("annualRevenue", e.target.value)}
                    placeholder="$1,000,000"
                  />
                </div>

                <div>
                  <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                  <Input
                    id="numberOfEmployees"
                    type="number"
                    value={formData.numberOfEmployees}
                    onChange={(e) => handleInputChange("numberOfEmployees", e.target.value)}
                    placeholder="50"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="propertyValue">Property Value</Label>
                  <Input
                    id="propertyValue"
                    value={formData.propertyValue}
                    onChange={(e) => handleInputChange("propertyValue", e.target.value)}
                    placeholder="$500,000"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the business operations..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Enrichment Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enriched Data</CardTitle>
            </CardHeader>
            <CardContent>
              {!enrichedData ? (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Click "Enrich Data" to fetch additional information from API</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm mb-2">Business Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Founded:</span>
                        <span>{enrichedData.businessInfo.foundedYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Industry:</span>
                        <span>{enrichedData.businessInfo.industry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employees:</span>
                        <span>{enrichedData.businessInfo.employeeRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Revenue:</span>
                        <span>{enrichedData.businessInfo.estimatedRevenue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm mb-2">Risk Factors</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Claims History:</span>
                        <Badge variant="outline">{enrichedData.riskFactors.claims}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Credit Score:</span>
                        <Badge variant="outline">{enrichedData.riskFactors.creditScore}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Safety Record:</span>
                        <Badge variant="default">{enrichedData.riskFactors.safetyRecord}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm mb-2">Location Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Zone:</span>
                        <Badge variant="default">{enrichedData.location.riskZone}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flood Zone:</span>
                        <span>{enrichedData.location.floodZone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Crime Rate:</span>
                        <Badge variant="outline">{enrichedData.location.crimeRate}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button className="w-full">Save Form Data</Button>
        </div>
      </div>
    </div>
  );
}
