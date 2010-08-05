#!/bin/sh

ROOT_DIR=$(dirname $(cd $(dirname "$0"); pwd););

cd $ROOT_DIR

bin/start-solr.sh &> data/log/solr-server.log &
bin/start-www.sh &> data/log/www-server.log &
bin/start-crawler.sh
