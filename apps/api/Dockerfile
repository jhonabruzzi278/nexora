FROM oven/bun:1.3.13-alpine AS build
WORKDIR /workspace

COPY package.json bun.lock* tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN bun install --frozen-lockfile

COPY apps/api apps/api
COPY packages/contracts packages/contracts
RUN bun run --cwd apps/api build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nexora && adduser -S nexora -G nexora
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist

USER nexora
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
