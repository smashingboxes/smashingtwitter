'use strict';

const env = require('../env.json');
const express = require('express');
const cors = require('cors');
const LibTwitter = require('twitter');
const PORT = 3344;
const app = express();

const twitter = new LibTwitter({
  consumer_key: env.TWITTER_CONSUMER_KEY,
  consumer_secret: env.TWITTER_CONSUMER_SECRET,
  access_token_key: env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: env.TWITTER_ACCESS_TOKEN_SECRET
});

let data = [];


function filterByWords(text) {
  return text.match(/(fake|sad|leaks)/gi);
}

app.use(cors());

twitter.get('search/tweets', {q: 'from:smashingboxes', count: 10}, function(error, tweets, response) {
  data = Array.from(new Set(tweets.statuses.map(tweet => tweet.text)));
  console.log(data);
});

app.get('/', function (req, res) {
  res.json(data);
});

app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`)
});
