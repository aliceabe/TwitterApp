function initialize() {

  //Setup Google Map
  var myLatlng = new google.maps.LatLng(17.7850,-12.4183);
  var light_grey_style = [{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}];
  var myOptions = {
    zoom: 2,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    styles: light_grey_style
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  
  //Setup heat map and link to Twitter array we will append data to
  var heatmap;
  var liveTweets = new google.maps.MVCArray();
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: liveTweets,
    radius: 25
  });
  heatmap.setMap(map);
  var image = "css/small-dot-icon.png";
  var marker = new google.maps.Marker({
    map: map,
    icon: image
  });

  //Connect to socket and store tweets
  var socket = io.connect(window.location.href);
  var tweets;
  var samples;
  var counts;
  var keywords = ['money', 'work', 'blog', 'game of thrones', 'food', 'obama', 'paris', 'music', 'football', 'friends', 'love']

  function showTrend() {
    var options = {
      title: {
        text: 'Sentiment Trend',
        x: -20 //center
      },
      subtitle: {
        text: 'Source: s3://ColumbiaCloud/final/Assignment3Tweets-2',
        x: -20
      },
      yAxis: {
        title: {
          text: 'Sentiment Score'
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0
      },
      tooltip: {
        pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:.2f}</b><br/>'
      },
      chart: {
        renderTo: 'trend'
      },
      series: []
    };

    $.getJSON('data.json', function(data) {
        options.series = data;
        var chart = new Highcharts.Chart(options);
    });
  }

  function emptyMap() {
    while (liveTweets.length > 0) {
      liveTweets.pop();
    }
  }

  function populateTweets() {
    $.each(tweets[$('#kw').val()], function(i, tweet){
      var tweetLocation = new google.maps.LatLng(tweet.lat,tweet.lng);
      liveTweets.push(tweetLocation);
    });
  }

  function populateSentiment() {
    $.each(tweets[$('#kw').val()], function(i, tweet){
      if (tweet.sent == $('#st').val()) {
        var tweetLocation = new google.maps.LatLng(tweet.lat,tweet.lng);
        liveTweets.push(tweetLocation);
      }
    });
  }

  function countTweets() {
    var c = [0, 0, 0, 0];
    $.each(tweets[$('#kw').val()], function(i, tweet) {
      if (tweet.sent == "positive") {
        c[0] += 1;
      } else if (tweet.sent == "negative") {
        c[2] += 1;
      } else if (tweet.sent == "neutral") {
        c[1] += 1;
      } else if (tweet.sent == "undefined") {
        c[3] += 1;
      }
    })
    return c;
  }

  function displayCounts(c) {
    $('#pos').html("Positive: " + c[0]);
    $('#neu').html("Neutral: " + c[1]);
    $('#neg').html("Negative: " + c[2]);
    $('#und').html("Undefined: " + c[3])
  }

  function displayLastTweet(tweet, info, lat, lng) {
    $('#lastweet').html(tweet);
    $('#lastinfo').html(info.toUpperCase());
    //Get location of the tweet
    var tweetLocation = new google.maps.LatLng(lat, lng);
    //Flash a dot onto the map quickly
    marker.setPosition(tweetLocation);
    //Add to heatmap layer
    if ($("#st").is(":visible")) {
      if ($("#st").val() == info) {
        liveTweets.push(tweetLocation);
      }
    } else {
      liveTweets.push(tweetLocation);
    }    
  }

  //Get an initial bunch of tweets in the db
  socket.on('initial-tweets', function(data) {
    tweets = data.tweets;
    samples = data.samples;
    populateTweets();
    counts = countTweets();
    displayCounts(counts);
    var todisplay = samples[$('#kw').val()][0];
    displayLastTweet(todisplay.text, todisplay.sent, todisplay.lat, todisplay.lng);
  })

  //Hide the sentiment dropdown
  $('#st').hide();

  //Handle map dropdown
  $('#mp').change(function() {
    if ($('#mp').val() == "T") {
      $('#map_canvas').show();
      $('#kw').show();
      $('span').show();
      $('h4').show();
      $('h6').show();
      $('#st').hide();
      emptyMap();
      populateTweets();
    } else if ($('#mp').val() == "S") {
      $('#map_canvas').show();
      $('#kw').show();
      $('#st').show();
      $('span').show();
      $('h4').show();
      $('h6').show();
      emptyMap();
      populateSentiment();
    } else {
      $('#st').hide();
      $('#map_canvas').hide();
      $('#kw').hide();
      $('span').hide();
      $('h4').hide();
      $('h6').hide();
      showTrend();
    }
  })

  //Handle keyword dropdown
  $('#kw').change(function() {
    emptyMap();
    if ($("#st").is(":visible")) {
      populateSentiment();
    } else {
      populateTweets();
    }
    counts = countTweets();
    displayCounts(counts);
    var todisplay = samples[$('#kw').val()][0];
    displayLastTweet(todisplay.text, todisplay.sent, todisplay.lat, todisplay.lng);
  })

  //Handle sentiment dropdown
  $('#st').change(function() {
    emptyMap();
    populateSentiment();
  })

  //Update real-time tweets
  socket.on('twitter-stream', function (data) {

    //Add tweet to all tweets received
    tweet = data.tweet
    kw_idx = keywords.indexOf(tweet[5])
    tweets[kw_idx].push({lat: tweet[2], lng: tweet[3], sent: tweet[7]})

    //if current keyword
    if ($('#kw').val() == kw_idx) {

      //Update counts
      if (tweet[7] == "positive") {
        counts[0] += 1;
      } else if (tweet[7] == "negative") {
        counts[2] += 1;
      } else if (tweet[7] == "neutral") {
        counts[1] += 1;
      } else if (tweet[7] == "undefined") {
        counts[3] += 1;
      }
      displayCounts(counts)

      //Show tweet in the navbar
      displayLastTweet(tweet[6], tweet[7], tweet[2], tweet[3]);
      
    }
    
  });

}