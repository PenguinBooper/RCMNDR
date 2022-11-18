const express = require('express')

const ejs=require("ejs")

var SpotifyWebApi = require('spotify-web-api-node');

const bodyParser = require('body-parser');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: 'ddf12990257a45b5802563789f2a3ca0',
  clientSecret: '4a2c8fc69eb2453282185cdec071c5d4',
  redirectUri: 'http://localhost:8888/callback'
});




/**
 * This example is using the Authorization Code flow.
 *
 * In root directory run
 *
 *     npm install express
 *
 * then run with the followinng command. If you don't have a client_id and client_secret yet,
 * create an application on Create an application here: https://developer.spotify.com/my-applications to get them.
 * Make sure you whitelist the correct redirectUri in line 26.
 *
 *     node access-token-server.js "<Client ID>" "<Client Secret>"
 *
 *  and visit <http://localhost:8888/login> in your Browser.
 */

const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];


const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get('/',function(req,res){
  res.sendFile(__dirname+"/main.html");
})

app.get('/signuplogin.html',function(req,res){
  res.sendFile(__dirname+'/signuplogin.html');
})
app.set('view engine', 'ejs');

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.redirect('/example');

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
      }, expires_in / 2 * 1000);
      
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

app.listen(8888, () =>
  console.log(
    'HTTP Server up. Now go to http://localhost:8888/login in your browser.'
  )
);

app.get('/example',function(req,res){
  // spotifyApi.searchTracks('track:Into The Night artist:YOASOBI')
  // .then(function(data) {
  //   console.log('Search tracks by "Alright" in the track name and "Kendrick Lamar" in the artist name', data.body);
  // }, function(err) {
  //   console.log('Something went wrong!', err);
  // });
  spotifyApi.getMyTopArtists({limit:5})
  .then(function(data) {
    let topArtists = data.body.items;
    let ArtIds=[];
    topArtists.forEach(function(artist){
      console.log(artist.name);
      ArtIds.push(artist.id);
    })
    //console.log(ArtIds);
    spotifyApi.getRecommendations({
      min_energy: 0.4,
      seed_artists:ArtIds ,
      min_popularity: 50
    })
  .then(function(data) {
    let recommendations = data.body;
    let recommendedTracks=recommendations.tracks;
    let recTracks=[];


    recommendedTracks.forEach(function(track){
    recTracks.push(track.name);

   })


    console.log("Here are recommendations /n/n/n/n/n");
    console.log(typeof(recommendations.tracks))
    console.log(recTracks);
    res.render('home',{
      recTracks:recTracks
    })
  }, function(err) {
    console.log("Something went wrong!", err);
  });

  }, function(err) {
    console.log('Something went wrong!', err);
  });
})
