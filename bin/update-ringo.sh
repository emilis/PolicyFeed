#!/bin/sh
# Usage: update-ringo.sh [ringo_dir]

MERGE=meld;

PROJ_DIR=$(dirname $(cd $(dirname "$0"); pwd););

# cd to ringojs directory with newest sources:
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

# Build and test newest version of RingoJS:
ant clean
ant jar
ant test

# Remove modules/config (because these files get in the way of app config in some cases):
rm -rf modules/config

# Rebuild RingoJS again:
ant clean
ant jar

# Copy jars:
cp run.jar "$PROJ_DIR/lib/run.jar"
cp lib/ringo.jar "$PROJ_DIR/lib/ringo.jar"

# Manually compare and merge other files:
$MERGE lib/ "$PROJ_DIR/lib/"
$MERGE apps/demo/ "$PROJ_DIR/config/"
$MERGE modules/ "$PROJ_DIR/src/ringojs/"

# Show change status in project dir:
cd "$PROJ_DIR"
git status
