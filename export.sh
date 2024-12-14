#!/usr/bin/env bash
scp profile_pic.jpg eye:/tmp/charles.jpg
ssh -t -p 1840 toor@eye-hand.wustl.edu sudo mv /tmp/charles.jpg /home/httpd/htdocs/lab/images/charles.jpg
