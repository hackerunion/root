#!/bin/bash
curl -X POST http://localhost:3000/sbin/token -d grant_type=authorization_code -d response_type=code -d redirect_uri=http://google.com/ -d scope=nothing -d client_id=5 -d client_secret=password -d code=$3
