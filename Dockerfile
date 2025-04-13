FROM node:20

WORKDIR /app
    
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh
    

RUN --mount=type=ssh git config --global url."ssh://git@github.com/".insteadOf "https://github.com/"
    
COPY package.json yarn.lock ./
RUN yarn install
    
COPY . .
RUN yarn build

CMD ["node", "dist/index.js"]