FROM keymetrics/pm2:8

ENV HOME=/home/node

# set timezone
RUN apk update
RUN apk upgrade
RUN apk add ca-certificates && update-ca-certificates
RUN apk add --update tzdata
ENV TZ=Asia/Calcutta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Clean APK cache
RUN rm -rf /var/cache/apk/*

USER root

# copy dep files to tmp folder
COPY package.json $HOME/tmp/
COPY yarn.lock $HOME/tmp/
COPY src $HOME/tmp/src
COPY tsconfig.json $HOME/tmp/
COPY tslint.json $HOME/tmp/
COPY run.sh $HOME/tmp/

# install deps in tmp folder
RUN cd $HOME/tmp/ && yarn install --pure-lockfile
# build project
RUN cd $HOME/tmp/ && npm run build

# copy installed deps to app working dir
RUN mkdir -p $HOME/app/node_modules && cp -r $HOME/tmp/node_modules $HOME/app/
RUN mkdir -p $HOME/app/dist && cp -r $HOME/tmp/dist $HOME/app/
RUN mkdir -p $HOME/app/src && cp -r $HOME/tmp/src $HOME/app/
RUN cp $HOME/tmp/run.sh $HOME/app/
RUN cp $HOME/tmp/package.json $HOME/app/
RUN cp $HOME/tmp/yarn.lock $HOME/app/
RUN cp $HOME/tmp/tsconfig.json $HOME/app/

# set working dir
WORKDIR $HOME/app

# copy pm2 config 
COPY pm2.json ./

# need to copy this to ensure correct env is used in the app
COPY .env ./

EXPOSE 3001
EXPOSE 9001