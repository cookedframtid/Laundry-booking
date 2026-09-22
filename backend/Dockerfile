FROM node:18-alpine

WORKDIR /app

# Copy package files first for cached installs
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Create the directory for the SQLite database
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "index.js"]