FROM node:24.21.0-bookworm-slim

WORKDIR /workspace/admin-web

RUN chown node:node /workspace/admin-web
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
