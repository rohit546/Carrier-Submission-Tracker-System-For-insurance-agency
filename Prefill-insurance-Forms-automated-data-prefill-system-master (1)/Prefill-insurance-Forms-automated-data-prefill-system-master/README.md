# Convenience Store Application

A modern, professional insurance application form built with Next.js 14, TailwindCSS, and React Hook Form for Mckinney & Co. Insurance.

## Features

- 🎨 Clean, minimal black and white design
- 📱 Fully responsive layout
- ✅ Form validation with React Hook Form
- 📄 PDF generation with filled form data
- 🎭 Smooth animations and transitions
- 🏢 Professional insurance branding

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
convenience-store-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── FormSection.tsx
├── lib/
│   └── pdf.ts
├── types/
│   └── form.ts
└── public/
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Forms**: React Hook Form
- **PDF Generation**: jsPDF
- **Animations**: Framer Motion
- **TypeScript**: Full type safety

## Form Fields

The application includes all standard convenience store insurance fields:

- Company Information (name, contact, dates, etc.)
- Applicant Type (Individual, Partnership, Corporation, etc.)
- Security Systems (Burglar/Fire alarms)
- Operations Description
- Ownership Type
- Comprehensive Property Details

## Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Railway Deployment

This application is configured for deployment on Railway.

### Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. GitHub repository connected to Railway

### Deployment Steps

1. **Create a new Railway project:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables:**
   Add these environment variables in Railway project settings:
   ```
   GHL_API_KEY=your_ghl_api_key_here
   GHL_LOCATION_ID=your_ghl_location_id_here
   ```
   Optional (if using Google Maps or Smarty Streets):
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   SMARTY_AUTH_ID=your_smarty_auth_id_here
   SMARTY_AUTH_TOKEN=your_smarty_auth_token_here
   ```

3. **Deploy:**
   - Railway will automatically detect Next.js
   - Build and deploy will start automatically
   - Your app will be live at `https://your-app.railway.app`

### Railway Configuration

- **Build Command:** `npm run build` (automatically detected)
- **Start Command:** `npm start` (automatically detected)
- **Output:** Standalone build for optimal performance

### Environment Variables

Required for the application to work:

- `GHL_API_KEY` - GoHighLevel API key for CRM integration
- `GHL_LOCATION_ID` - GoHighLevel location ID

Optional:
- `GOOGLE_MAPS_API_KEY` - For Google Maps features
- `SMARTY_AUTH_ID` - For Smarty Streets address validation
- `SMARTY_AUTH_TOKEN` - For Smarty Streets address validation
- `NEON_CONNECTION_STRING` - For Neon database GSOS business lookups
- `COVERSHEET_STRING` - For Coversheet database (submissions and insured_information tables)

## License

Private - Mckinney & Co. Insurance