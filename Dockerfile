# Use official Bun image
FROM oven/bun

# Set working directory
WORKDIR /app

# Copy only package.json first
COPY package.json ./

# Install deps
RUN bun install

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Run your app
CMD ["bun", "run", "index.ts"]
