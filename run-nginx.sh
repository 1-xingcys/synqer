#!/usr/bin/env bash

docker run --rm -p 8088:8088 \
  -v "$PWD/nginx.conf:/etc/nginx/nginx.conf:ro" \
  nginx:alpine
