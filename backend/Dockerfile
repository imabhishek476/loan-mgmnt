
FROM node:20.18.1

#RUN apt update

WORKDIR /usr/src/app/server

COPY . /usr/src/app/server



RUN cd /usr/src/app/server



RUN yarn install 

# EXPOSE 3050
# EXPOSE 5050
EXPOSE 5000

CMD [ "yarn", "dev"]
