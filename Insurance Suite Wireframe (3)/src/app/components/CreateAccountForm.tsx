import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Calendar } from "lucide-react";
import logoImage from "figma:asset/bf1eab1b84d659d2659f000ac01eda1ef0a03988.png";

interface CreateAccountFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CreateAccountForm({ onSubmit, onCancel }: CreateAccountFormProps) {
  const [formData, setFormData] = useState({
    // Property Address
    propertyAddress: "",
    
    // Ownership Type
    ownershipType: "Owner",
    
    // Corporation Details
    corporationName: "",
    contactName: "",
    contactNumber: "",
    contactEmail: "",
    leadSource: "",
    proposedEffectiveDate: "",
    priorCarrier: "",
    legalPremises: "",
    
    // Applicant Type
    applicantType: "",
    
    // Operation Description
    operationDescription: "",
    dba: "",
    address: "",
    mailingAddress: "",
    
    // Property Details
    hoursOfOperation: "",
    numberOfMPOs: "",
    constructionType: "",
    yearsInBusiness: "",
    yearsAtLocation: "",
    yearBuilt: "",
    yearOfLatestUpdate: "",
    totalSqFootage: "",
    anyNewSideBusiness: "",
    
    // Protection Class
    protectionClass: "",
    
    // Additional Insured Info
    additionalInsuredType: "",
  });

  const [isAddressLookupOpen, setIsAddressLookupOpen] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFetchData = () => {
    // Simulate data fetching
    console.log("Fetching data for:", formData.propertyAddress);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Convenience Store Insurance Application</CardTitle>
            </div>
            <img 
              src={typeof logoImage === 'string' ? logoImage : logoImage.src} 
              alt="McKinney & Co" 
              className="h-8 w-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Address Lookup */}
            <div>
              <Label className="flex items-center gap-2 text-sm mb-2">
                <Search className="w-4 h-4 text-green-600" />
                Property Address Lookup
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Start typing address... (e.g., 4964 Lantius Rd)"
                  value={formData.propertyAddress}
                  onChange={(e) => handleInputChange("propertyAddress", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleFetchData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Fetch Data
                </Button>
              </div>
            </div>

            {/* Ownership Type */}
            <div>
              <Label className="text-sm mb-3 block">Ownership Type</Label>
              <div className="grid grid-cols-4 gap-3">
                {["Owner", "Tenant", "Lessor's Risk", "Triple Net Lease"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange("ownershipType", type)}
                    className={`p-3 border-2 rounded-lg text-sm transition-all ${
                      formData.ownershipType === type
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Corporation Details - Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="corporationName" className="text-xs text-gray-600">
                  Corporation Name *
                </Label>
                <Input
                  id="corporationName"
                  placeholder="Enter corporation name"
                  value={formData.corporationName}
                  onChange={(e) => handleInputChange("corporationName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactName" className="text-xs text-gray-600">
                  Contact Name *
                </Label>
                <Input
                  id="contactName"
                  placeholder="Enter contact name"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange("contactName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactNumber" className="text-xs text-gray-600">
                  Contact Number *
                </Label>
                <Input
                  id="contactNumber"
                  placeholder="Enter contact number"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Corporation Details - Row 2 */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="contactEmail" className="text-xs text-gray-600">
                  Contact Email *
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="leadSource" className="text-xs text-gray-600">
                  Lead Source *
                </Label>
                <Input
                  id="leadSource"
                  placeholder="Enter lead source"
                  value={formData.leadSource}
                  onChange={(e) => handleInputChange("leadSource", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proposedEffectiveDate" className="text-xs text-gray-600">
                  Proposed Effective Date
                </Label>
                <Input
                  id="proposedEffectiveDate"
                  type="date"
                  value={formData.proposedEffectiveDate}
                  onChange={(e) => handleInputChange("proposedEffectiveDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="priorCarrier" className="text-xs text-gray-600">
                  Prior Carrier
                </Label>
                <Input
                  id="priorCarrier"
                  placeholder="Enter prior carrier"
                  value={formData.priorCarrier}
                  onChange={(e) => handleInputChange("priorCarrier", e.target.value)}
                />
              </div>
            </div>

            {/* Legal Premises */}
            <div>
              <Label htmlFor="legalPremises" className="text-xs text-gray-600">
                Legal Premises
              </Label>
              <Input
                id="legalPremises"
                placeholder="Enter legal premises"
                value={formData.legalPremises}
                onChange={(e) => handleInputChange("legalPremises", e.target.value)}
              />
            </div>

            {/* Applicant Type & Operation Description */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Applicant is</Label>
                <div className="space-y-2">
                  {["Individual", "Partnership", "Corporation", "Joint Venture", "LLC", "Other"].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="applicantType"
                        value={type}
                        checked={formData.applicantType === type}
                        onChange={(e) => handleInputChange("applicantType", e.target.value)}
                        className="text-green-600"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <Label htmlFor="operationDescription" className="text-xs text-gray-600">
                  Operation Description
                </Label>
                <Textarea
                  id="operationDescription"
                  placeholder="Describe your business operations..."
                  value={formData.operationDescription}
                  onChange={(e) => handleInputChange("operationDescription", e.target.value)}
                  rows={6}
                />
              </div>
              <div className="col-span-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dba" className="text-xs text-gray-600">
                      DBA
                    </Label>
                    <Input
                      id="dba"
                      placeholder="Enter DBA (Doing Business As)"
                      value={formData.dba}
                      onChange={(e) => handleInputChange("dba", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-xs text-gray-600">
                      Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="Enter property address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mailingAddress" className="text-xs text-gray-600">
                      Mailing Address
                    </Label>
                    <Input
                      id="mailingAddress"
                      placeholder="Enter mailing address"
                      value={formData.mailingAddress}
                      onChange={(e) => handleInputChange("mailingAddress", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details - Row 1 */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="hoursOfOperation" className="text-xs text-gray-600">
                  Hours of Operation
                </Label>
                <Input
                  id="hoursOfOperation"
                  placeholder="Enter hours"
                  value={formData.hoursOfOperation}
                  onChange={(e) => handleInputChange("hoursOfOperation", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="numberOfMPOs" className="text-xs text-gray-600">
                  No. Of MPOs
                </Label>
                <Input
                  id="numberOfMPOs"
                  placeholder="Enter number"
                  value={formData.numberOfMPOs}
                  onChange={(e) => handleInputChange("numberOfMPOs", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="constructionType" className="text-xs text-gray-600">
                  Construction Type
                </Label>
                <Select
                  value={formData.constructionType}
                  onValueChange={(value) => handleInputChange("constructionType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frame">Frame</SelectItem>
                    <SelectItem value="Joisted Masonry">Joisted Masonry</SelectItem>
                    <SelectItem value="Non-Combustible">Non-Combustible</SelectItem>
                    <SelectItem value="Masonry Non-Combustible">Masonry Non-Combustible</SelectItem>
                    <SelectItem value="Modified Fire Resistive">Modified Fire Resistive</SelectItem>
                    <SelectItem value="Fire Resistive">Fire Resistive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearsInBusiness" className="text-xs text-gray-600">
                  Years in Business
                </Label>
                <Input
                  id="yearsInBusiness"
                  placeholder="Enter years"
                  value={formData.yearsInBusiness}
                  onChange={(e) => handleInputChange("yearsInBusiness", e.target.value)}
                />
              </div>
            </div>

            {/* Property Details - Row 2 */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <Label htmlFor="yearsAtLocation" className="text-xs text-gray-600">
                  Years at this Location
                </Label>
                <Input
                  id="yearsAtLocation"
                  placeholder="Years"
                  value={formData.yearsAtLocation}
                  onChange={(e) => handleInputChange("yearsAtLocation", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yearBuilt" className="text-xs text-gray-600">
                  Year built
                </Label>
                <Input
                  id="yearBuilt"
                  placeholder="Year"
                  value={formData.yearBuilt}
                  onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yearOfLatestUpdate" className="text-xs text-gray-600">
                  Year of latest update
                </Label>
                <Input
                  id="yearOfLatestUpdate"
                  placeholder="Year"
                  value={formData.yearOfLatestUpdate}
                  onChange={(e) => handleInputChange("yearOfLatestUpdate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="totalSqFootage" className="text-xs text-gray-600">
                  Total sq. Footage
                </Label>
                <Input
                  id="totalSqFootage"
                  placeholder="Sq ft"
                  value={formData.totalSqFootage}
                  onChange={(e) => handleInputChange("totalSqFootage", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="anyNewSideBusiness" className="text-xs text-gray-600">
                  Any Newest sid business
                </Label>
                <Input
                  id="anyNewSideBusiness"
                  placeholder="Yes/No"
                  value={formData.anyNewSideBusiness}
                  onChange={(e) => handleInputChange("anyNewSideBusiness", e.target.value)}
                />
              </div>
            </div>

            {/* Protection Class */}
            <div>
              <Label htmlFor="protectionClass" className="text-xs text-gray-600">
                Protection Class
              </Label>
              <Input
                id="protectionClass"
                placeholder="Enter protection class"
                value={formData.protectionClass}
                onChange={(e) => handleInputChange("protectionClass", e.target.value)}
              />
            </div>

            {/* Additional Insured Section */}
            <div>
              <Label className="text-sm mb-3 block">
                Additional Insured / Loss Payee / Lender / Mortgagee
              </Label>
              <Select
                value={formData.additionalInsuredType}
                onValueChange={(value) => handleInputChange("additionalInsuredType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="additional-insured">Additional Insured</SelectItem>
                  <SelectItem value="loss-payee">Loss Payee</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="mortgagee">Mortgagee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Reset Form
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Application
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}