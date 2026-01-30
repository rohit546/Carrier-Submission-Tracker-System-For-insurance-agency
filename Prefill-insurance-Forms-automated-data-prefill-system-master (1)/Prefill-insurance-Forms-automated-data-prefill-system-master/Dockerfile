FROM node:18-alpine


# Accept build-time environment variables
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Clear Next.js cache to prevent stale data
RUN rm -rf .next/cache

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]