FROM nginx:1.26-alpine

RUN apk update && apk add --no-cache curl

COPY ./docker/nginx/conf.d /etc/nginx/conf.d

WORKDIR /app

COPY ./public ./public
