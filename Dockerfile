FROM oven/bun:latest

WORKDIR /app

# Install deps first (better Docker layer caching)
COPY package.json bun.lock ./
RUN bun install

# Copy source after deps
COPY . .

# SvelteKit/Vite dev server port
EXPOSE 5173

# Ensure dev server listens outside the container
CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]
