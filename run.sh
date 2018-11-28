#!/bin/sh

if [[ -z "${DEBUG_PORT}" ]]; then
  pm2-docker start pm2.json
else
  npm run debug
fi