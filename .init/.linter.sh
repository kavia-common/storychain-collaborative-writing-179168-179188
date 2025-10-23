#!/bin/bash
cd /home/kavia/workspace/code-generation/storychain-collaborative-writing-179168-179188/storychain_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

