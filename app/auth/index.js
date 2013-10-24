var express = require("express")
	, passport = require("passport")
	, TokenStrategy = require('passport-http-oauth').TokenStrategy;

var consumer = module.exports.consumer = {
	key : "123",
	secret : "456"
}

var token = module.exports.token = {
	key : "321",
	secret : "654"
}

var nonces = {};

passport.use('token', new TokenStrategy(
  // consumer callback
  function(consumerKey, done) {
    if(consumerKey === consumer.key){
		done(null, consumer, consumer.secret);
	}else{
		return done(null, false);
	}
  },
  // verify callback
  function(accessToken, done) {
	if(accessToken === token.key){
		return done(null, token, token.secret);
	}else{
		return done(null, false);
	}
  },
  //validate callback
  function(timestamp, nonce, done) {
	if(nonces[nonce] == null){
		nonces[nonce] = true;
		var now = new Date();
		var diff = Math.abs(timestamp - Math.floor(now.getTime() / 1000));
		//allow for a 90 minute lag between clocks - very generous
		var err = diff > (60 * 90) ? "Timestamp is invalid" : null;
		//done - do we have errors
		done(err, err == null ? true : false);
	}else{
		done("Nonce is not unique", false)
	}
  }
));