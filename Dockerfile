FROM node:24-slim

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

# The scheduler resolves timezones via Node's built-in ICU, so no tzdata needed.
CMD ["pnpm", "start"]
