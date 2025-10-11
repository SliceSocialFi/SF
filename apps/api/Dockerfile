FROM node:20-alpine
WORKDIR /app

# Cài pnpm
RUN npm install -g pnpm


# Copy workspace configs
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy toàn bộ source
COPY . .

# Cài dependencies (cả root lẫn api)
RUN pnpm install --frozen-lockfile
RUN pnpm install --filter api...

# Set env
ENV NODE_ENV=production

EXPOSE 4000

# Run bằng tsx (vì dự án không build ra dist)
CMD ["pnpm", "--filter", "api", "start"]