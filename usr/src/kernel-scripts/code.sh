#!/bin/bash
curl -X POST http://localhost:3000/sbin/code -d grant_type=authorization_code -d response_type=code -d redirect_uri=http://google.com -d scope=photos -d client_id=test -d client_secret=password
