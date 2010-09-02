#!/bin/sh

DIFF=meld;

PROJ_DIR=$(dirname $(cd $(dirname "$0"); pwd););

if [ -d "$1" ]
then
    cd "$1";
    git pull;
else
    cd /tmp
    git clone "http://github.com/ringo/ringojs.git"
    cd /tmp/ringojs
fi

# Restore modules/config which may be deleted in a previous request:
git checkout -- modules/config
ant clean
ant jar
ant test
rm -rf modules/config
ant clean
ant jar

cp run.jar "$PROJ_DIR/lib/run.jar"
cp lib/ringo.jar "$PROJ_DIR/lib/ringo.jar"
$DIFF lib/ "$PROJ_DIR/lib/"
$DIFF apps/demo/ "$PROJ_DIR/config/"
$DIFF modules/ "$PROJ_DIR/src/ringojs/"
