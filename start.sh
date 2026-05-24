#!/bin/sh
npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma
node packages/server/dist/index.js
