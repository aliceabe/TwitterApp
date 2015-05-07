
//Dependencies
var sqs = require('sqs')
var twitter = require('twitter')
var mysql = require('mysql')

//Setup queue
var queue = sqs({
	access:'***',
	secret:'***',
	region:'***'
});

//Setup twitter stream api
var twit = new twitter({
	consumer_key: '***',
	consumer_secret: '***',
	access_token_key: '***',
	access_token_secret: '***'
})

//Initialize variables
var idup = 1;
var idMAX = 2734;

var keywords = ['money', 'work', 'blog', 'game of thrones', 'food', 'obama', 'paris', 'music', 'football', 'friends', 'love']
var tweets_queue = []

//Start streaming tweets (filtered on location) and pushing them into a queue
function stream_tweets() {
	twit.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(stream) {
		stream.on('data', function(data) {
			if (data.geo && data.geo != null) {
				var kw = get_keyword(data.text)
				if (kw) {
					var tweet = [data.user.screen_name, data.id, data.geo.coordinates[0], data.geo.coordinates[1], data.lang, kw, data.text, '']
					if (tweets_queue.length < 100 && tweets_queue.indexOf(tweet) < 0) {
						tweets_queue.push(tweet)
					}
				}
			}
		})
		stream.on('error', function(error) {
			console.log(error)
		})
	})
}

//Associate keyword to a tweet content
function get_keyword(text) {
	for (i=0; i<keywords.length; i++) {
		keyword = keywords[i]
		if (text.toLowerCase().search(keyword) > -1) {
			return keyword
		}
	}
	return 0
}

//Process the last element of the queue
function process_queue() {
	console.log(tweets_queue.length)
	if (tweets_queue.length > 1) {
		try {
			//Get last element in the queue, add its id 
			tweet = tweets_queue.pop()
			//Push it to the SQS queue 
			queue.push('tweetmap', {
				'tweet': tweet,
				'idup': idup,
				'api': 0
			});
			//Increment id
			idup = idup+1
			if (idup == idMAX) {
				idup = 1;
			}
		} catch(err) {
			console.log('err:' + err)
		}
	} else {
		stream_tweets()
	}
}

//Process one element in the queue every 200ms
function loop() {
	setInterval(process_queue, 1000)
}

//Start streaming and processing
stream_tweets()
setTimeout(loop, 5000)
