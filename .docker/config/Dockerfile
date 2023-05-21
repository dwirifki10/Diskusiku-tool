FROM node:14-alpine

WORKDIR /app
RUN npm install
RUN npm install -g nodemon
COPY ../../. /app 
CMD ["npm", "run", "dev"]
EXPOSE 3000