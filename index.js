/*

    Reddit SMS Notifications
        by Ethan Trott - ThatsMyFace
        Created in 2018

        I totally over-commented this but I think it's hilarious and I had fun doing it so I'm keeping it. Enjoy!
        Seriously... it's like a novel. I more than doubled the file size.

*/

// Let's play the import game!
const snoowrap = require('snoowrap'); // does Reddit stuff
var AWS = require('aws-sdk'); // does SMS stuff
var shortUrl = require('node-url-shortener'); // does URL shortening


/*
    You have to configure the stuff from here down until the next block comment!
*/

// Now let's setup those imports! Wooooo!
const r = new snoowrap({
    userAgent: 'my-notifs', // I'm pretty sure you can make this whatever you want cuz I just named it something random and it worked -- maybe for logging purposes or something with Reddit
    clientId: 'get-your-own-bro', // get this from Reddit
    clientSecret: 'seriously-i-cant-share-mine', // and this
    refreshToken: 'idk-maybe-i-actually-can-but-i-wont' // also this
});

AWS.config.region = 'us-east-1'; // this can be like whichever you want bro
AWS.config.update({
  accessKeyId: "once-again-no-stealing", // get this from Amazon Web Services
  secretAccessKey: "i-dont-care-if-sharing-is-caring-bc-i-dont-care", // also this ;P
});
var sns = new AWS.SNS(); //start the SMS service

// Suprisingly we don't need an API key or anything for the url shortener -- there are still good people out there bois

// Here are some things for you to configure bc you probably aren't using this for the same stuff I am, unless you are, then I'm sorry I deleted these values.
const subredditToCheck = "TotesAGoodSubreddit"; // pretty self-explanitory bro
const phoneNumberToMessage = "+12345678901"; // You can probably format it differently from this; this is just the way I saw in Amazon's example.
const howOftenToCheck = 30; // in seconds

/*
    Okay you can be done now, the rest *just works*
*/

// Yay! Empty variables!
var lastID = ''; // you'll find out what this little thing is for later
var recentIDs = []; // also this

function thingToRun(){ // runs every so often to get the newest posts in the subreddit and then pass them to checkResults
    r.getSubreddit(subredditToCheck).getNew({limit: 1}).then(checkResults); // ^^
}

function checkResults(goodPosts){ // checks to see if the newest post is new -- if so, send SMS
    if (String(goodPosts[0].id) !== String(lastID) && recentIDs.indexOf(String(goodPosts[0].id)) < 0){ // if the ID isn't the last ID we saw, and isn't in the array of recent IDs (just in case some posts got deleted or something)
        console.log("New Post: id=" + String(goodPosts[0].id)); // For debugging -- basically useless tho cuz I am the perfect coder
        lastID = goodPosts[0].id // remember the last id for checking in line 40
        shortUrl.short(goodPosts[0].url, function(err, url){ // shorten the post URL to make life easier on AWS, cellphone-service providers, and ourselves -- p.s. it's cool that this doesn't require an API key
            sendSMS(phoneNumberToMessage, goodPosts[0].title, url); // sends the text message to the chosen phone number
        });
        if(recentIDs.length > 9){ // if there are more than 9 ID numbers stored...
            recentIDs.splice(0, 1); // delete the oldest.
        }
        recentIDs.push(goodPosts[0].id); // store this id in the array for checking in line 40
    }
}

function sendSMS(num, title, url){ // can you guess what this function does? The answer may surprise you!
    var params = { // the stuff to do for the message
        Message: '"'+ title + '": ' + url, // the message to send
        MessageStructure: 'string', // i guess this just clarifies that the message is a string... i dont really know (maybe this also supports MMS? -- probably that is it for sure)
        PhoneNumber: num // the desired phone number -- idk why I made this a local variable also, but at this point I have a personal attachment to it so I'm not going to change it
    };

    sns.publish(params, function(err, data) { // actually finally does the thing
        if (err) console.log(err, err.stack); // I've never actually seen this happen so have fun with troubleshooting :)
    });
}

setInterval(thingToRun, howOftenToCheck * 1000); //sets the interval timer to run the subreddit checking thing :D