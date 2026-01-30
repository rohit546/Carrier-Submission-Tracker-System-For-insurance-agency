import jsPDF from 'jspdf'
import { FormData } from '@/types/form'

export const generatePDF = (formData: FormData) => {
  console.log('Generating PDF with data:', formData) // Debug log
  const doc = new jsPDF()
  
  // 1 inch = 72 points in PDF
  const margin = 72 / 2.54  // 1 inch margin (approximately 28 points)
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const leftMargin = margin
  const rightMargin = pageWidth - margin
  const topMargin = margin
  const bottomMargin = pageHeight - margin
  const tableWidth = rightMargin - leftMargin
  
  let yPos = topMargin
  
  // Helper function to draw bordered cell with proper text fitting
  const drawCell = (x: number, y: number, width: number, height: number, text: string, bold = false, fontSize = 6) => {
    // Draw border with clean lines
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2) // Slightly thicker for clean, solid borders
    doc.rect(x, y, width, height, 'S') // 'S' for stroke only
    
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    
    // Handle text that might be too long for the cell
    const maxWidth = width - 3 // Leave some padding
    const splitText = doc.splitTextToSize(text, maxWidth)
    
    // If text is too long, truncate to fit
    const lineHeight = fontSize * 0.35
    const maxLines = Math.floor((height - 1) / lineHeight)
    const displayText = splitText.slice(0, maxLines)
    
    // Start text a bit lower in the cell for better centering
    const startY = y + fontSize * 0.75
    displayText.forEach((line: string, index: number) => {
      doc.text(line, x + 1, startY + (index * lineHeight))
    })
  }
  
  const rowHeight = 6  // Reduced from 10 to 6 for smaller boxes
  const headerRowHeight = 8  // Slightly larger for headers
  
  // Header Section - Row 1
  doc.setFillColor(220, 220, 220)
  doc.rect(leftMargin, yPos, tableWidth, headerRowHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Mckinney & Co. Insurance', pageWidth / 2, yPos + 5.5, { align: 'center' })
  yPos += headerRowHeight
  
  // Header Section - Row 2: Convenience Store Application
  doc.setFillColor(220, 220, 220)
  doc.rect(leftMargin, yPos, tableWidth, headerRowHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Convenience Store Application', pageWidth / 2, yPos + 5.5, { align: 'center' })
  yPos += headerRowHeight
  
  // Company Information Section
  yPos += 3
  
  // Row 1: Corporation Name and Contact Number
  drawCell(leftMargin, yPos, 38, rowHeight, 'Corporation Name', true)
  drawCell(leftMargin + 38, yPos, 58, rowHeight, formData.corporationName || '')
  drawCell(leftMargin + 96, yPos, 34, rowHeight, 'Contact Number', true)
  drawCell(leftMargin + 130, yPos, tableWidth - 130, rowHeight, formData.contactNumber || '')
  yPos += rowHeight
  
  // Row 2: Contact Name
  drawCell(leftMargin, yPos, 38, rowHeight, 'Contact Name', true)
  drawCell(leftMargin + 38, yPos, tableWidth - 38, rowHeight, formData.contactName || '')
  yPos += rowHeight
  
  // Row 3: Contact Email
  drawCell(leftMargin, yPos, 38, rowHeight, 'Contact Email', true)
  drawCell(leftMargin + 38, yPos, tableWidth - 38, rowHeight, formData.contactEmail || '')
  yPos += rowHeight
  
  // Row 4: Dates and Carrier Info
  drawCell(leftMargin, yPos, 38, rowHeight, 'Proposed Effective Date', true)
  drawCell(leftMargin + 38, yPos, 32, rowHeight, formData.proposedEffectiveDate || '')
  drawCell(leftMargin + 70, yPos, 28, rowHeight, 'Prior Carrier', true)
  drawCell(leftMargin + 98, yPos, 38, rowHeight, formData.priorCarrier || '')
  drawCell(leftMargin + 136, yPos, 24, rowHeight, 'Target Premium', true)
  drawCell(leftMargin + 160, yPos, tableWidth - 160, rowHeight, formData.targetPremium || '')
  yPos += rowHeight
  
  // Applicant Type Section
  yPos += 1
  drawCell(leftMargin, yPos, 18, rowHeight, 'Applicant is', true, 6)
  
  const applicantTypes = [
    { key: 'individual', label: 'Individual', width: 23 },
    { key: 'partnership', label: 'Partnership', width: 24 },
    { key: 'corporation', label: 'Corporation', width: 24 },
    { key: 'jointVenture', label: 'Joint Venture', width: 25 },
    { key: 'llc', label: 'LLC', width: 18 },
    { key: 'other', label: 'Other', width: 18 }
  ]
  
  let xOffset = 18
  applicantTypes.forEach((type) => {
    const isSelected = formData.applicantType === type.key
    const checkmark = isSelected ? '[X]' : '[ ]'
    drawCell(leftMargin + xOffset, yPos, type.width, rowHeight, `${checkmark} ${type.label}`, false, 6)
    xOffset += type.width
  })
  yPos += rowHeight
  
  // Ownership Type Section - just checkboxes, no header row
  yPos += 1
  
  const ownershipTypes = [
    { key: 'owner', label: 'Owner', width: 47.5 },
    { key: 'tenant', label: 'Tenant', width: 47.5 },
    { key: 'lessorsRisk', label: 'Lessor\'s Risk', width: 47.5 },
    { key: 'tripleNetLease', label: 'Triple Net Lease', width: 47.5 }
  ]
  
  xOffset = 0
  ownershipTypes.forEach((type) => {
    const isSelected = formData.ownershipType === type.key
    const checkmark = isSelected ? '[X]' : '[ ]'
    drawCell(leftMargin + xOffset, yPos, type.width, rowHeight, `${checkmark} ${type.label}`, false, 6)
    xOffset += type.width
  })
  yPos += rowHeight
  
  // Operation Description
  yPos += 1
  drawCell(leftMargin, yPos, 35, rowHeight, 'Operation Description:', true)
  drawCell(leftMargin + 35, yPos, tableWidth - 35, rowHeight, formData.operationDescription || '')
  yPos += rowHeight
  
  // DBA
  drawCell(leftMargin, yPos, 20, rowHeight, 'DBA', true)
  drawCell(leftMargin + 20, yPos, tableWidth - 20, rowHeight, formData.dba || '')
  yPos += rowHeight
  
  // Address
  drawCell(leftMargin, yPos, 20, rowHeight, 'Address', true)
  drawCell(leftMargin + 20, yPos, tableWidth - 20, rowHeight, formData.address || '')
  yPos += rowHeight
  
  // Hours and Construction
  drawCell(leftMargin, yPos, 35, rowHeight, 'Hours of operation', true)
  drawCell(leftMargin + 35, yPos, 55, rowHeight, formData.hoursOfOperation || '')
  drawCell(leftMargin + 90, yPos, 35, rowHeight, 'Construction type :', true)
  drawCell(leftMargin + 125, yPos, tableWidth - 125, rowHeight, formData.constructionType || '')
  yPos += rowHeight
  
  // No. Of MPDs
  drawCell(leftMargin, yPos, 35, rowHeight, 'No. Of MPDs', true)
  drawCell(leftMargin + 35, yPos, tableWidth - 35, rowHeight, formData.noOfMPDs || '')
  yPos += rowHeight
  
  // Years in business
  drawCell(leftMargin, yPos, 35, rowHeight, 'Years Exp. In business', true)
  drawCell(leftMargin + 35, yPos, tableWidth - 35, rowHeight, formData.yearsInBusiness || '')
  yPos += rowHeight
  
  // Years at this location
  drawCell(leftMargin, yPos, 35, rowHeight, 'Years at this Location', true)
  drawCell(leftMargin + 35, yPos, tableWidth - 35, rowHeight, formData.yearsAtLocation || '')
  yPos += rowHeight
  
  // Year built
  drawCell(leftMargin, yPos, 35, rowHeight, 'Year built', true)
  drawCell(leftMargin + 35, yPos, tableWidth - 35, rowHeight, formData.yearBuilt || '')
  yPos += rowHeight
  
  // Year of latest update
  drawCell(leftMargin, yPos, 35, rowHeight, 'Year of latest update', true)
  drawCell(leftMargin + 35, yPos, tableWidth - 35, rowHeight, formData.yearOfLatestUpdate || '')
  yPos += rowHeight
  
  // Total sq footage and leased space
  drawCell(leftMargin, yPos, 35, rowHeight, 'Total sq. Footage', true)
  drawCell(leftMargin + 35, yPos, 55, rowHeight, formData.totalSqFootage || '')
  drawCell(leftMargin + 90, yPos, 48, rowHeight, 'Any leased out space :', true)
  const leasedSpace = formData.anyLeasedOutSpace === 'yes' ? 'Yes' : formData.anyLeasedOutSpace === 'no' ? 'No' : (formData.anyLeasedOutSpace || '')
  drawCell(leftMargin + 138, yPos, tableWidth - 138, rowHeight, leasedSpace)
  yPos += rowHeight
  
  // Protection class and additional interests
  drawCell(leftMargin, yPos, 35, rowHeight, 'Protection Class:', true)
  drawCell(leftMargin + 35, yPos, 55, rowHeight, formData.protectionClass || '')
  drawCell(leftMargin + 90, yPos, 48, rowHeight, 'Additional Interests:', true)
  const additionalInterestsText = formData.additionalInterests && formData.additionalInterests.length > 0
    ? formData.additionalInterests.map(ai => 
        `${ai.type}${ai.name ? ': ' + ai.name : ''}${ai.address ? ' - ' + ai.address : ''}`
      ).join('; ')
    : ''
  drawCell(leftMargin + 138, yPos, tableWidth - 138, rowHeight, additionalInterestsText)
  yPos += rowHeight
  
  // Alarm Section
  yPos += 3
  
  drawCell(leftMargin, yPos, 16, rowHeight, 'Alarm', true, 6)
  
  // Burglar alarm
  const burglarCS = formData.burglarAlarm?.centralStation ? '[X]' : '[ ]'
  const burglarLocal = formData.burglarAlarm?.local ? '[X]' : '[ ]'
  drawCell(leftMargin + 16, yPos, 16, rowHeight, 'Burglar', true, 6)
  drawCell(leftMargin + 32, yPos, 28, rowHeight, `${burglarCS} Central Station`, false, 5)
  drawCell(leftMargin + 60, yPos, 20, rowHeight, `${burglarLocal} Local`, false, 5)
  
  // Fire alarm  
  const fireCS = formData.fireAlarm?.centralStation ? '[X]' : '[ ]'
  const fireLocal = formData.fireAlarm?.local ? '[X]' : '[ ]'
  drawCell(leftMargin + 80, yPos, 14, rowHeight, 'Fire', true, 6)
  drawCell(leftMargin + 94, yPos, 28, rowHeight, `${fireCS} Central Station`, false, 5)
  drawCell(leftMargin + 122, yPos, tableWidth - 122, rowHeight, `${fireLocal} Local`, false, 5)
  yPos += rowHeight
  
  yPos += 3 // Add space before three-column section
  
  // Three-column section: Property Section | General Liability | Worker's Compensation
  // Define column widths
  const col1Width = 45  // Property Section (Coverage + Limits)
  const col2Width = 80  // General Liability (Item + Monthly + Yearly)
  const col3Width = 65  // Worker's Compensation (Label + Value)
  
  const startYPos = yPos
  let col1YPos = yPos
  let col2YPos = yPos
  let col3YPos = yPos
  
  // COLUMN 1: Property Section Header
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'Property Section', true, 6)
  col1YPos += rowHeight
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'Coverage', true, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, 'Limits', true, 6)
  col1YPos += rowHeight
  
  // Property rows
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'Building', false, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, formData.building || '', false, 6)
  col1YPos += rowHeight
  
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'BPP', false, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, formData.bpp || '', false, 6)
  col1YPos += rowHeight
  
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'B I', false, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, formData.bi || '', false, 6)
  col1YPos += rowHeight
  
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'Canopy', false, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, formData.canopy || '', false, 6)
  col1YPos += rowHeight
  
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'Pumps', false, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, formData.pumps || '', false, 6)
  col1YPos += rowHeight
  
  drawCell(leftMargin, col1YPos, 22.5, rowHeight, 'M&S', false, 6)
  drawCell(leftMargin + 22.5, col1YPos, 22.5, rowHeight, formData.ms || '', false, 6)
  col1YPos += rowHeight
  
  // COLUMN 2: General Liability (start from same Y position as column 1)
  const col2X = leftMargin + col1Width
  
  drawCell(col2X, col2YPos, col2Width, rowHeight, 'GENERAL LIABILITY (Exposure)', true, 6)
  col2YPos += rowHeight
  
  drawCell(col2X, col2YPos, 40, rowHeight, '', true, 6)
  drawCell(col2X + 40, col2YPos, 20, rowHeight, 'Monthly', true, 6)
  drawCell(col2X + 60, col2YPos, 20, rowHeight, 'Yearly', true, 6)
  col2YPos += rowHeight
  
  drawCell(col2X, col2YPos, 40, rowHeight, 'Inside Sales Total', false, 6)
  drawCell(col2X + 40, col2YPos, 20, rowHeight, formData.insideSalesMonthly || '', false, 6)
  drawCell(col2X + 60, col2YPos, 20, rowHeight, formData.insideSalesYearly || '', false, 6)
  col2YPos += rowHeight
  
  drawCell(col2X, col2YPos, 40, rowHeight, 'Liquor Sales', false, 6)
  drawCell(col2X + 40, col2YPos, 20, rowHeight, formData.liquorSalesMonthly || '', false, 6)
  drawCell(col2X + 60, col2YPos, 20, rowHeight, formData.liquorSalesYearly || '', false, 6)
  col2YPos += rowHeight
  
  drawCell(col2X, col2YPos, 40, rowHeight, 'gasoline gallons', false, 6)
  drawCell(col2X + 40, col2YPos, 20, rowHeight, formData.gasolineSalesMonthly || '', false, 6)
  drawCell(col2X + 60, col2YPos, 20, rowHeight, formData.gasolineSalesYearly || '', false, 6)
  col2YPos += rowHeight
  
  drawCell(col2X, col2YPos, 40, rowHeight, 'Propane filling/Exchange', false, 6)
  drawCell(col2X + 40, col2YPos, 20, rowHeight, formData.propaneFillingExchangeMonthly || '', false, 6)
  drawCell(col2X + 60, col2YPos, 20, rowHeight, formData.propaneFillingExchangeYearly || '', false, 6)
  col2YPos += rowHeight
  
  const carwashValue = formData.carwash === 'yes' ? 'Yes' : formData.carwash === 'no' ? 'No' : (formData.carwash || '')
  drawCell(col2X, col2YPos, 40, rowHeight, 'Carwash', false, 6)
  drawCell(col2X + 40, col2YPos, 40, rowHeight, carwashValue, false, 6)
  col2YPos += rowHeight
  
  const cookingValue = formData.cooking === 'yes' ? 'Yes' : formData.cooking === 'no' ? 'No' : (formData.cooking || '')
  drawCell(col2X, col2YPos, 40, rowHeight, 'Cooking', false, 6)
  drawCell(col2X + 40, col2YPos, 40, rowHeight, cookingValue, false, 6)
  col2YPos += rowHeight
  
  // COLUMN 3: Worker's Compensation (start from same Y position as columns 1 & 2)
  const col3X = leftMargin + col1Width + col2Width
  
  drawCell(col3X, col3YPos, col3Width, rowHeight, 'Worker\'s Compensation', true, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, 'FEIN', true, 6)
  drawCell(col3X + 25, col3YPos, 40, rowHeight, formData.fein || '', false, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, 'No. of', true, 6)
  drawCell(col3X + 25, col3YPos, 40, rowHeight, '', false, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, 'Employees', true, 6)
  drawCell(col3X + 25, col3YPos, 40, rowHeight, formData.noOfEmployees || '', false, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, 'Payroll', true, 6)
  drawCell(col3X + 25, col3YPos, 40, rowHeight, formData.payroll || '', false, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, 'Incl/Excl', true, 6)
  drawCell(col3X + 25, col3YPos, 40, rowHeight, '', false, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, 'officers', true, 6)
  const officersValue = formData.officersInclExcl || ''
  drawCell(col3X + 25, col3YPos, 40, rowHeight, officersValue, false, 6)
  col3YPos += rowHeight
  
  drawCell(col3X, col3YPos, 25, rowHeight, '% Ownership', true, 6)
  drawCell(col3X + 25, col3YPos, 40, rowHeight, formData.ownership || '', false, 6)
  col3YPos += rowHeight
  
  // Set yPos to the maximum of all three columns
  yPos = Math.max(col1YPos, col2YPos, col3YPos)
  
  // Footer positioning - place at bottom of page with margin
  const footerYPos = bottomMargin - 10
  
  // Footer with proper positioning
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  
  // Draw a separator line above footer
  doc.setLineWidth(0.3)
  doc.line(leftMargin, footerYPos - 5, rightMargin, footerYPos - 5)
  
  // Footer content - positioned at bottom of page
  doc.text('Generated on: ' + new Date().toLocaleDateString(), leftMargin, footerYPos)
  doc.text('Mckinney & Co. Insurance - Convenience Store Application', pageWidth / 2, footerYPos, { align: 'center' })
  doc.text('Page 1 of 1', rightMargin - 15, footerYPos, { align: 'right' })
  
  return doc
}