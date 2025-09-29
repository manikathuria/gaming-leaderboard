FROM node:20-alpine

# Install PostgreSQL client (use apk instead of apt-get)
RUN apk add --no-cache postgresql-client


WORKDIR /usr/src/app

# Install deps
COPY package*.json ./
RUN npm install

# Copy Prisma schema + migrations
COPY prisma ./prisma
RUN npx prisma generate

# Copy rest of app
COPY . .

EXPOSE 3002 9229

# Don't run migrations here (handled in compose service)
CMD ["npm", "run", "start:debug"]
