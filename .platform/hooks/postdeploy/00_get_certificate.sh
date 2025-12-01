#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh
sudo certbot -n -d 4-5-ellarising.is404.net --nginx --agree-tos --email mjohans0@byu.edu