# Build stage: pnpm installs and Nuxt compiles into .output, which the runtime
# stage copies wholesale. pnpm and node_modules never reach the final image.
FROM node:22-alpine AS build

ENV CI=1

WORKDIR /app

RUN corepack enable

# The whole project is copied before installing because the `postinstall` hook
# runs `nuxt prepare`, which needs nuxt.config.ts and the app/ directory. The
# store cache mount is what keeps reinstalls cheap instead of a deps-only layer.
COPY . .

RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

RUN pnpm build


# Runtime stage: node and the built server. No package manager, no sources.
FROM node:22-alpine AS production

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

# Nitro's node-server output is self-contained: no node_modules needed at runtime.
COPY --from=build --chown=node:node /app/.output ./.output

# node:alpine ships an unprivileged `node` user (uid 1000); nothing here needs root.
USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
