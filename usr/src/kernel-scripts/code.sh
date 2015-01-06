#!/bin/bash
curl -X POST http://localhost:3000/sbin/token -d grant_type=authorization_code -d response_type=code -d redirect_uri=$3 -d scope=nothing -d client_id=$1 -d client_secret=$2 -d code=$4 -d api=1
