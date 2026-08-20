#!/usr/bin/env bash
#
# Start the local reverse proxy that fronts both dev servers on :8088.
# See nginx.conf for the full request chain and why the proxy is needed.
#
# Start both dev servers first. Nginx comes up either way, but a request to a
# port with nothing behind it just returns 502:
#   backend   npm --prefix backend run start:dev   (:8080)
#   frontend  npm --prefix frontend run dev        (:3000)
#
# Runs in the foreground; Ctrl-C stops it and --rm discards the container.

docker run --rm -p 8088:8088 \
  -v "$PWD/nginx.conf:/etc/nginx/nginx.conf:ro" \
  nginx:alpine
