#!/bin/bash
sudo yum update -y
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
su ec2-user -l -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash'
su ec2-user -l -c '. ~/.nvm/nvm.sh'
su ec2-user -l -c 'nvm install node'