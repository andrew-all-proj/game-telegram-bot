FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

RUN yarn build

COPY . .

CMD ["node", "dist/index.js"]