# Node.js WebSocket Server Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build TypeScript code
RUN pnpm run build

# Expose the WebSocket port
EXPOSE 6071

# Start the server
CMD ["node", "dist/server.js"]