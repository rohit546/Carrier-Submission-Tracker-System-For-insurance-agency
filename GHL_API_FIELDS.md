# GoHighLevel API Fields Reference

## What We're Getting from GHL API

### 1. Opportunity Object (from `/opportunities/search`)

**Fields We're Currently Using:**
- `id` - Opportunity ID
- `name` - Opportunity name
- `contactId` - Associated contact ID (used to fetch contact details)
- `pipelineStageId` - Stage ID (used for filtering)
- `dateAdded` / `createdAt` / `dateCreated` - Creation date (we check all three)

**Fields Available (but not currently used):**
The GHL API returns many more fields. When you run the API, check the console logs for a complete sample opportunity object. Common fields include:
- `status` - Opportunity status (open, won, lost, etc.)
- `pipelineId` - Pipeline ID
- `locationId` - Location ID
- `assignedTo` - Assigned user ID
- `value` - Opportunity value/amount
- `source` - Source of opportunity
- `tags` - Array of tags
- `customFields` - Custom field values
- `notes` - Notes array
- `tasks` - Tasks array
- And many more...

### 2. Contact Object (from `/contacts/{contactId}`)

**Fields We're Currently Using:**
- `id` - Contact ID
- `firstName` - First name
- `lastName` - Last name
- `name` - Full name
- `email` - Email address
- `phone` - Phone number
- `address1` - Street address
- `city` - City
- `state` - State
- `postalCode` / `zip` - ZIP code (we check both)
- `companyName` - Company name
- `website` - Website URL

**Fields Available (but not currently used):**
The GHL API returns many more contact fields. When you run the API, check the console logs for a complete sample contact object. Common fields include:
- `address2` - Additional address line
- `country` - Country
- `timezone` - Timezone
- `dateAdded` - Date contact was added
- `dateOfBirth` - Date of birth
- `socialProfiles` - Social media profiles
- `tags` - Array of tags
- `source` - Source of contact
- `customFields` - Custom field values
- `assignedTo` - Assigned user ID
- `status` - Contact status
- `type` - Contact type
- `companyId` - Company ID
- `ownerId` - Owner ID
- And many more...

## What We Return to Frontend

The final object returned combines opportunity + contact data:

```typescript
{
  id: string,                    // Contact ID
  opportunityId: string,         // Opportunity ID
  opportunityName: string,       // Opportunity name
  dateAdded: string,             // Opportunity creation date
  firstName: string,             // Contact first name
  lastName: string,              // Contact last name
  name: string,                  // Contact full name
  email: string,                 // Contact email
  phone: string,                 // Contact phone
  address1: string,              // Street address
  city: string,                  // City
  state: string,                 // State
  zip: string,                   // ZIP code
  companyName: string,           // Company name
  website: string                // Website URL
}
```

## How to See All Available Fields

When you run the API, check your server console logs. The code now logs:
1. **Sample Opportunity Object** - Shows all fields from the first opportunity
2. **Sample Contact Object** - Shows all fields from the first contact

This will help you see what additional data is available if you need to use more fields in the future.

