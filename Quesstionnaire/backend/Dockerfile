FROM node:20-bullseye
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
