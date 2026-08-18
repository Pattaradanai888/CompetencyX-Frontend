FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

# The whole project is copied before installing because the `postinstall` hook
# runs `nuxt prepare`, which needs nuxt.config.ts and the app/ directory.
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Nitro's node-server output is self-contained: no node_modules needed at runtime.
COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
