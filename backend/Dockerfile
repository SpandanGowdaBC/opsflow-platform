FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# We skip prisma generate here because it will be run in the container context
# or handled by volumes during dev

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && node server.js"]
