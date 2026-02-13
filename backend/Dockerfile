FROM node:18-slim

# Install OpenSSL 1.1 dependency for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure Prisma client is generated for the current OS
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "server.js"]
