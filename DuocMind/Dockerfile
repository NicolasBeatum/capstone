FROM node:24.21.0-bookworm-slim

ENV BROWSER=none
ENV EXPO_NO_TELEMETRY=1

WORKDIR /app

RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 8081

CMD ["npm", "run", "web", "--", "--host", "lan"]
