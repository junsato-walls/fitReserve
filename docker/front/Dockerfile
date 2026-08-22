FROM oven/bun:1-alpine

WORKDIR /usr/src/app

# パッケージ定義とロックファイルだけ先にコピーして install
# （bun.lock は必ずコミットすること。--frozen-lockfile で再現性を担保する）
COPY ./app/package.json ./app/bun.lock ./
RUN bun install --frozen-lockfile

# アプリ全部をコピー
COPY ./app ./

# 本番ビルド
RUN bun run build

# 本番起動用の環境変数
ENV NODE_ENV=production
EXPOSE 3000

# 起動コマンドを start に
CMD ["bun", "run", "start"]
