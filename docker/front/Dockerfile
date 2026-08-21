# FROM node:20-alpine3.18

# WORKDIR /usr/src/app

# ADD ./app/package*.json ./
# RUN npm install

# COPY ./app ./

# EXPOSE 3000
# ENV CI=true
# CMD ["npm", "run", "dev"]
FROM node:20-alpine3.18

WORKDIR /usr/src/app

# パッケージ定義だけ先にコピーして install
COPY ./app/package*.json ./
RUN npm ci

# アプリ全部をコピー
COPY ./app ./

# 本番ビルド
RUN npm run build

# 本番起動用の環境変数
ENV NODE_ENV=production
EXPOSE 3000

# 起動コマンドを start に
CMD ["npm", "run", "start"]

