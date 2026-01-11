#!/bin/bash

BASE_URL="http://alx.sgrslab.in"

echo "=== Testing Health Endpoint ==="
curl $BASE_URL/health
echo -e "\n"

echo "=== Testing LaunchRequest ==="
curl -X POST $BASE_URL/alexa \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "session": {
      "new": true,
      "sessionId": "test-session-123",
      "application": {"applicationId": "test-app"},
      "user": {"userId": "test-user"}
    },
    "request": {
      "type": "LaunchRequest",
      "requestId": "test-request-123",
      "timestamp": "2026-01-11T12:00:00Z",
      "locale": "en-US"
    }
  }'
echo -e "\n"

echo "=== Testing ContinueBookIntent ==="
curl -X POST $BASE_URL/alexa \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "session": {
      "new": false,
      "sessionId": "test-session-123",
      "application": {"applicationId": "test-app"},
      "user": {"userId": "test-user"},
      "attributes": {}
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "test-request-124",
      "timestamp": "2026-01-11T12:00:00Z",
      "locale": "en-US",
      "intent": {
        "name": "ContinueBookIntent",
        "confirmationStatus": "NONE"
      }
    }
  }'
echo -e "\n"

echo "=== Testing PlayBookIntent ==="
curl -X POST $BASE_URL/alexa \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "session": {
      "new": false,
      "sessionId": "test-session-123",
      "application": {"applicationId": "test-app"},
      "user": {"userId": "test-user"},
      "attributes": {}
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "test-request-125",
      "timestamp": "2026-01-11T12:00:00Z",
      "locale": "en-US",
      "intent": {
        "name": "PlayBookIntent",
        "confirmationStatus": "NONE",
        "slots": {
          "bookName": {
            "name": "bookName",
            "value": "Harry Potter",
            "confirmationStatus": "NONE"
          }
        }
      }
    }
  }'
echo -e "\n"