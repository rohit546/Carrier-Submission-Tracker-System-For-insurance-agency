import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Pencil } from "lucide-react";

interface InsuredFormData {
  // Basic Information
  corporationName: string;
  dba: string;
  feinId: string;
  ownershipType: string;
  applicantType: string;
  operationDescription: string;
  
  // Contact Information
  contactName: string;
  contactNumber: string;
  contactEmail: string;
  address: string;
  
  // Property Details
  hoursOfOperation: string;
  numberOfMPOs: string;
  constructionType: string;
  totalSqFootage: string;
  yearBuilt: string;
  yearOfLatestUpdate: string;
  yearsAtLocation: string;
  
  // Additional Information
  leadSource: string;
  priorCarrier: string;
  additionalInsured: string;
}

interface InsuredInformationFormProps {
  accountName: string;
  onSave: (data: InsuredFormData) => void;
}

export function InsuredInformationForm({
  accountName,
  onSave,
}: InsuredInformationFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<InsuredFormData>({
    corporationName: "Affordable Atlanta LLC",
    dba: "1151 Chatahoochee Ave NW",
    feinId: "N/A",
    ownershipType: "Owner",
    applicantType: "BC",
    operationDescription: "citizens with 18 hours",
    contactName: "Mutalim Brar",
    contactNumber: "40329887D",
    contactEmail: "mutalim1432@gmail.com",
    address: "1151 Chatahoochee Ave NW, Atlanta, GA 30318-3705",
    hoursOfOperation: "18",
    numberOfMPOs: "6",
    constructionType: "Frame",
    totalSqFootage: "30000",
    yearBuilt: "2098",
    yearOfLatestUpdate: "N/A",
    yearsAtLocation: "2",
    leadSource: "internet",
    priorCarrier: "N/A",
    additionalInsured: "Southview Bank - Mortgagee; 03,000,000",
  });

  const handleInputChange = (field: keyof InsuredFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-xl">
                <Pencil className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <CardTitle>Insured Information</CardTitle>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs text-green-600"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Form Store"}
                </Button>
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="hover:bg-green-50"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Corporation Name *</Label>
                  {isEditing ? (
                    <Input
                      value={formData.corporationName}
                      onChange={(e) =>
                        handleInputChange("corporationName", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.corporationName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">DBA (Doing Business As)</Label>
                  {isEditing ? (
                    <Input
                      value={formData.dba}
                      onChange={(e) => handleInputChange("dba", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.dba}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">FEIN ID</Label>
                  {isEditing ? (
                    <Input
                      value={formData.feinId}
                      onChange={(e) => handleInputChange("feinId", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.feinId}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Ownership Type</Label>
                  {isEditing ? (
                    <Select
                      value={formData.ownershipType}
                      onValueChange={(value) =>
                        handleInputChange("ownershipType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Owner</SelectItem>
                        <SelectItem value="Tenant">Tenant</SelectItem>
                        <SelectItem value="Landlord">Landlord</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm mt-1">{formData.ownershipType}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Applicant Type</Label>
                  {isEditing ? (
                    <Input
                      value={formData.applicantType}
                      onChange={(e) =>
                        handleInputChange("applicantType", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.applicantType}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Operation Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.operationDescription}
                      onChange={(e) =>
                        handleInputChange("operationDescription", e.target.value)
                      }
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.operationDescription}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm mb-4">Contact Information</h3>

                <div>
                  <Label className="text-xs text-gray-600">Contact Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.contactName}
                      onChange={(e) =>
                        handleInputChange("contactName", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.contactName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Contact Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.contactNumber}
                      onChange={(e) =>
                        handleInputChange("contactNumber", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.contactNumber}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Contact Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        handleInputChange("contactEmail", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.contactEmail}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h3 className="text-sm mb-4">Property Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Hours of Operation</Label>
                  {isEditing ? (
                    <Input
                      value={formData.hoursOfOperation}
                      onChange={(e) =>
                        handleInputChange("hoursOfOperation", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.hoursOfOperation}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">No. of MPOs</Label>
                  {isEditing ? (
                    <Input
                      value={formData.numberOfMPOs}
                      onChange={(e) =>
                        handleInputChange("numberOfMPOs", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.numberOfMPOs}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Construction Type</Label>
                  {isEditing ? (
                    <Select
                      value={formData.constructionType}
                      onValueChange={(value) =>
                        handleInputChange("constructionType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Frame">Frame</SelectItem>
                        <SelectItem value="Masonry">Masonry</SelectItem>
                        <SelectItem value="Steel">Steel</SelectItem>
                        <SelectItem value="Concrete">Concrete</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm mt-1">{formData.constructionType}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Total Sq. Footage</Label>
                  {isEditing ? (
                    <Input
                      value={formData.totalSqFootage}
                      onChange={(e) =>
                        handleInputChange("totalSqFootage", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.totalSqFootage}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Year Built</Label>
                  {isEditing ? (
                    <Input
                      value={formData.yearBuilt}
                      onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.yearBuilt}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Year of Latest Update</Label>
                  {isEditing ? (
                    <Input
                      value={formData.yearOfLatestUpdate}
                      onChange={(e) =>
                        handleInputChange("yearOfLatestUpdate", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.yearOfLatestUpdate}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Years at This Location</Label>
                  {isEditing ? (
                    <Input
                      value={formData.yearsAtLocation}
                      onChange={(e) =>
                        handleInputChange("yearsAtLocation", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.yearsAtLocation}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-sm mb-4">Additional Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Lead Source</Label>
                  {isEditing ? (
                    <Input
                      value={formData.leadSource}
                      onChange={(e) =>
                        handleInputChange("leadSource", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.leadSource}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Prior Carrier</Label>
                  {isEditing ? (
                    <Input
                      value={formData.priorCarrier}
                      onChange={(e) =>
                        handleInputChange("priorCarrier", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.priorCarrier}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Additional Insured</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.additionalInsured}
                    onChange={(e) =>
                      handleInputChange("additionalInsured", e.target.value)
                    }
                    rows={4}
                  />
                ) : (
                  <p className="text-sm mt-1">{formData.additionalInsured}</p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <div className="text-center text-sm text-gray-600">
          Make changes and click Save
        </div>
      )}
    </div>
  );
}