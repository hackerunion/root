#!/bin/bash
curl -X POST http://localhost:3000/sbin/token -d grant_type=password -d username=test -d password=password -d client_id=test -d client_secret=password
