#!/bin/bash

ROOT_DIR=$(dirname $(cd $(dirname "$0"); pwd););

LIB_DIR="$ROOT_DIR/lib";
CONFIG_DIR="$ROOT_DIR/config";
DATA_DIR="$ROOT_DIR/data";
MODULES_DIR="$ROOT_DIR/modules";

# Solr:

java \
  -jar "$LIB_DIR/jetty/start.jar"\
  -Dsolr.solr.home="$ROOT_DIR/search"\
  -Dsolr.data.dir="$DATA_DIR/solr"\
  "$CONFIG_DIR/config/jetty-solr.xml" &> "$DATA_DIR/log/solr-server.log" &

# save pid of java process:
echo $! > "$DATA_DIR/solr.pid"

sleep 2


# Www:

java \
    -Dringo.classpath="./**"\
    -jar "$LIB_DIR/run.jar"\
    -D ringo.home="$LIB_DIR/ringo.jar"\
    -e "require.paths.push('$CONFIG_DIR')"\
    "$MODULES_DIR/start-www.js" &> "$DATA_DIR/log/www-server.log" &

# save pid of java process:
echo $! > "$DATA_DIR/www.pid"


# Crawler:

java \
    -Dringo.classpath="./**"\
    -jar "$LIB_DIR/run.jar"\
    -D ringo.home="$LIB_DIR/ringo.jar"\
    -e "require.paths.push('$CONFIG_DIR')"\
    -i "$MODULES_DIR/start-crawler.js" 

