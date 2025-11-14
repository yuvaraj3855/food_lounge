# Stage 1: Build
FROM node:22 AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: Runtime
FROM node:22 AS runtime

# Set environment
ENV NODE_ENV=production
WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled dist folder and any other necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose port (use the port your NestJS app listens on)
EXPOSE 5000

# Start the app
CMD ["node", "dist/main.js"]
