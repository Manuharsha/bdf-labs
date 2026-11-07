#!/usr/bin/env bash

# Base API URL
BASE_URL="http://localhost:3000"

echo "=========================================================="
echo "          LAB 3 AUTOMATED API TEST SUITE (curl)           "
echo "=========================================================="
echo ""

echo "----------------------------------------------------------"
echo " TEST 1: GET /books (Default pagination & ordering)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/books"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 2: GET /books (search_q='Code' partial title match)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/books?search_q=Code"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 3: GET /books (Filter: min_price=700 & max_price=1000)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/books?min_price=700&max_price=1000"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 4: GET /books (order_by=price, order=DESC, limit=3)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/books?order_by=price&order=DESC&limit=3"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 5: GET /books/:id (Success: ID 1)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/books/1"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 6: GET /books/:id (Failure: Missing ID 9999 -> 404)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/books/9999"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 7: POST /books (Success: Create new book -> 201)"
echo "----------------------------------------------------------"
curl -s -i -X POST "${BASE_URL}/books" \
  -H "Content-Type: application/json" \
  -d '{"title":"Site Reliability Engineering","author":"Betsy Beyer","price":880}'
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 8: POST /books (Failure: Missing 'author' -> 400)"
echo "----------------------------------------------------------"
curl -s -i -X POST "${BASE_URL}/books" \
  -H "Content-Type: application/json" \
  -d '{"title":"Incomplete Book","price":500}'
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 9: POST /books (Failure: Non-numeric 'price' -> 400)"
echo "----------------------------------------------------------"
curl -s -i -X POST "${BASE_URL}/books" \
  -H "Content-Type: application/json" \
  -d '{"title":"Invalid Price Book","author":"John Doe","price":"five-hundred"}'
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 10: PUT /books/:id (Success: Update ID 1 -> 200)"
echo "----------------------------------------------------------"
curl -s -i -X PUT "${BASE_URL}/books/1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Code: A Handbook of Agile Software Craftsmanship","author":"Robert C. Martin","price":699}'
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 11: PUT /books/:id (Failure: Update Non-existent ID 9999 -> 404)"
echo "----------------------------------------------------------"
curl -s -i -X PUT "${BASE_URL}/books/9999" \
  -H "Content-Type: application/json" \
  -d '{"title":"Ghost Book","author":"Unknown","price":400}'
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 12: DELETE /books/:id (Success: Delete ID 10 -> 200)"
echo "----------------------------------------------------------"
curl -s -i -X DELETE "${BASE_URL}/books/10"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 13: DELETE /books/:id (Failure: Delete Non-existent ID 9999 -> 404)"
echo "----------------------------------------------------------"
curl -s -i -X DELETE "${BASE_URL}/books/9999"
echo ""
echo ""

echo "----------------------------------------------------------"
echo " TEST 14: Catch-all unknown route (Failure: GET /invalid-route -> 404)"
echo "----------------------------------------------------------"
curl -s -i "${BASE_URL}/invalid-route"
echo ""
echo ""

echo "=========================================================="
echo "                TEST SUITE EXECUTION COMPLETED            "
echo "=========================================================="

