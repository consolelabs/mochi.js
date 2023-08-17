# Use an official Node.js image as the base
FROM node:18.7.0-alpine

RUN apk add --no-cache python3 py3-pip make build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev librsvg-dev libpng-dev imagemagick

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./
# Install the dependencies
RUN yarn

COPY . .

CMD yarn start
