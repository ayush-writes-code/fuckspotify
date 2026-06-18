FROM node:20-slim

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install --omit=dev

# Bundle app source
COPY . .

# Hugging face runs on 7860 by default
ENV PORT=7860
EXPOSE 7860

CMD [ "node", "index.js" ]
