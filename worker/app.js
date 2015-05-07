
//Dependencies
var sqs = require('sqs')
var AlchemyAPI = require('alchemy-api')
var mysql = require('mysql')
var SentimentAPI = require('sentiment')
var AWS = require('aws-sdk')

//Setup AWS config
AWS.config.update({
	accessKeyId: '***',
	secretAccessKey: '***',
	region: '***'
})
var sns = new AWS.SNS({
	params: {
		TopicArn: '***'
	}
})

//Setup Alchemy API
var alchemy = new AlchemyAPI('***');

//Setup queue
var queue = sqs({
	access:'***',
	secret:'***',
	region:'***'
});

//Setup connection to db
var db = mysql.createConnection({
	host : "***",
	user : "***",
	password: "***",
	port: "***",
	database: "tweets"
})
db.connect(function(err) {
	if (err) console.log(err)
})

//Global variables
var keywords = ['money', 'work', 'blog', 'game of thrones', 'food', 'obama', 'paris', 'music', 'football', 'friends', 'love']
var sql_check = "SELECT id from mytweets WHERE tweetid = ?"
var sql_query = "UPDATE mytweets SET user=?, tweetid=?, lat=?, lng=?, lang=?, keyw=?, text=?, sent=? WHERE id=?"

//Functions
function alchemy_api(tweet, idup, callback) {
	//Call the sentiment API
	alchemy.sentiment(tweet[6], {}, function(err, res) {
		if (err) throw err;
		if (res.status == 'ERROR') {
			var sentiment = 'undefined'
		} else {
			var sentiment = res.docSentiment.type;
		}
		tweet[7] = sentiment;
		//save it to db
		callback(tweet, idup)
	});
}

function sentiment_api(tweet, idup, callback) {
	//Tag the sentiment without Alchemy
	var r = SentimentAPI(tweet[6])
	var sentiment = 'undefined'
	if (r.score < 0) {
		sentiment = 'negative'
	} else if (r.score == 0) {
		sentiment = 'neutral'
	} else if (r.score > 0) {
		sentiment = 'positive'
	}
	tweet[7] = sentiment
	//save it to db
	callback(tweet, idup)
}

function write_to_db(tweet, idup) {
	db.query(mysql.format(sql_check, [tweet[1]]), function(err, res) {
		if (res.length == 0) {
			sns.publish({
				Message: JSON.stringify(tweet)
			}, function (err, data) {
				if (!err) console.log('Message published')
			})
			console.log(mysql.format(sql_query, tweet.concat(idup)))
			db.query(mysql.format(sql_query, tweet.concat(idup)))
		}
	})

}

// pull messages from the test queue 
queue.pull('tweetmap', function(message, callback) {
	var tweet = message.tweet
	var idup = message.idup
	var api = message.api
	//process the message
	if (api == 0) {
		sentiment_api(tweet, idup, write_to_db)
	} else {
		alchemy_api(tweet, idup, write_to_db)
	}	
	//delete the message
	callback();
	
});