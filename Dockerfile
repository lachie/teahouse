FROM node:18

ENV PORT=3001

WORKDIR /app
# COPY ["package.json", "package-lock.json*", "./"]
# RUN corepack pnpm install

# COPY . .

CMD ["yarn", "ts-node", "--files", "lachies-house.ts"]