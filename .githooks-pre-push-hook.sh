#!/bin/sh
# TapTalkv3 Repository Lock
# This hook ensures all pushes go to CavenLink-Dev/TapTalkv3 only

REMOTE_URL=$(git remote get-url origin)
ALLOWED_URL="https://github.com/CavenLink-Dev/TapTalkv3.git"

if [ "$REMOTE_URL" != "$ALLOWED_URL" ]; then
    echo "ERROR: This repository is locked to TapTalkv3 only!"
    echo "Current remote: $REMOTE_URL"
    echo "Allowed remote: $ALLOWED_URL"
    echo ""
    echo "To push to a different repo, remove this hook:"
    echo "  rm .git/hooks/pre-push"
    exit 1
fi

# Check if trying to push to a different remote
while read local_ref local_sha remote_ref remote_sha
do
    # Get the remote being pushed to
    REMOTE_NAME=$(git remote)
    if [ "$REMOTE_NAME" != "origin" ]; then
        echo "ERROR: Only 'origin' remote is allowed. You tried: $REMOTE_NAME"
        exit 1
    fi
done

exit 0
