# syntax=docker/dockerfile:1.4
FROM node:20

WORKDIR /app

# SSH setup
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts

RUN --mount=type=ssh git config --global url."ssh://git@github.com/".insteadOf "https://github.com/"

COPY package.json yarn.lock ./
RUN --mount=type=ssh yarn install

COPY . .
RUN yarn build

CMD ["node", "dist/index.js"]