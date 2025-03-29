#!/bin/bash
kill-port 3000 || true
next dev -p 3001
