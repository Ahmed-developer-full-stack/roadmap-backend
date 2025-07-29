# Use official Bun image
FROM oven/bun

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY bun.lockb package.json ./
RUN bun install

# Copy rest of the app
COPY . .

# Expose port (Railway uses PORT env var)
EXPOSE 3000

# Start the app
CMD ["bun", "run", "src/index.ts"]
