#!/bin/bash
su ec2-user -l -c 'cd /home/ec2-user && npm install'
su ec2-user -l -c 'npm install -g pm2'
su ec2-user -l -c 'pm2 stop /home/ec2-user/app.js'
su ec2-user -l -c 'pm2 start /home/ec2-user/app.js'