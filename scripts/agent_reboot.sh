#!/bin/bash
cd /home/ubuntu/node-deploy/shared
stop=`docker stop $1`
echo $stop
sleep 5
echo "waiting for shutdown"
compose=`docker-compose up -d`
echo $stop $compose