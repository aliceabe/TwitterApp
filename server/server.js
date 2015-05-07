
//Setup web server and socket
var mysql = require('mysql'),
express = require('express'),
url = require('url'),
http = require('http'),
app = express(),
bodyParser = require('body-parser'),
server = http.createServer(app),
io = require('socket.io').listen(server);

//Use the default port (for beanstalk) or default to 8888 locally
server.listen(process.env.PORT || 8888);
console.log('ok' + process.env.PORT)

//Setup routing for app
app.use(express.static(__dirname + '/public'))

//Use bodyparser for POST (SNS)
app.use(bodyParser.json({ type: 'text/plain' }))

//Connect to the db
var db = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME,
	user     : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port 	 : process.env.RDS_PORT,
	multipleStatements: true,
	database: "tweets"
})
db.connect(function(err) {
	if (err) console.log(err)
})


var sql_1 = "SELECT lat, lng, sent FROM mytweets WHERE keyw=?"
var sql_2 = "SELECT lat, lng, text, sent FROM mytweets WHERE keyw=? LIMIT 1"

var keywords = ['money', 'work', 'blog', 'game of thrones', 'food', 'obama', 'paris', 'music', 'football', 'friends', 'love']

var tweets = []
var samples = []
var isInitTweets = false

io.sockets.on('connection', function(socket) {

	if (! isInitTweets) {

		total_query_1 = ''
		total_query_2 = ''
		for (i=0; i<keywords.length; i++) {
			key = keywords[i]
			total_query_1 += mysql.format(sql_1, [key]) + ';'
			total_query_2 += mysql.format(sql_2, [key]) + ';'
		}
		db.query(total_query_1, function(err, results) {
			db.query(total_query_2, function(er, res) {
				for (j=0; j<keywords.length; j++) {
					samples.push(res[j])
				}
				for (i=0; i<keywords.length; i++) {
					tweets.push(results[i])
				}
				socket.emit('initial-tweets', {'tweets': tweets, 'samples': samples})
			})			
		})
		isInitTweets = true

	} else {
		socket.emit('initial-tweets', {'tweets': tweets, 'samples': samples})
	}

	app.post('/receive', function(req, res) {
		console.log(req.body)
		tweet = JSON.parse(req.body.Message)
		kw_idx = keywords.indexOf(tweet[5])
		//tweets[kw_idx].push({lat: tweet[2], lng: tweet[3], sent: tweet[7]})
		io.sockets.emit('twitter-stream', {'tweet': tweet})
	})

	socket.on('error', function(error) {
		console.log(error)
	})

})

