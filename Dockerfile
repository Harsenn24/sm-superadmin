FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm 

COPY . .

EXPOSE 3005
CMD [ "node", "app.js" ]