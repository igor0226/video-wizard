FROM node:24-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
