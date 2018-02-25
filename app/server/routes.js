process.env.NODE_ENV = "default";

console.log("========================= NODE ENVIRONMENT : " + process.env.NODE_ENV + "============================\n")

//===================== required files ============================================
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var request = require('request');
var Promise = require("bluebird");
var moment 		= require('moment');
var nodemailer = require('nodemailer');
var config = require('config');
var speakeasy = require('speakeasy');
var qrcode = require('qrcode');

//=================================================================================

//=====================config file access==========================================
var Credentials = config.get('Credentials');
var Server = config.get('Server');
var Transporter = config.get('Transporter');
var Captcha = config.get('Captcha');
var Referral = config.get('Referral');

var sipCoinEmailId = Credentials.sipCoinEmailId;
var sipCoinEmailPass = Credentials.sipCoinEmailPass;
var serverIP = Server.IP;
var captchaSecret = Captcha.key;
var adminSponsorCode = Referral.Admin;

//=================================================================================
//=================================================================================

//transporter for nodemailer, check config file for dev / prod configurations
var transporter = nodemailer.createTransport(Transporter);


//===================== Part of HTML for Email Verification - Go to POST /signup ========================================================================
var part1='<head> <title> </title> <style> #one{ position: absolute; top:0%; left:0%; height: 60%; width: 40%; } #gatii{ position: absolute; top:26%; left:5%; height: 20%; width: 20%; } #text_div { position: absolute; top: 10%; left: 5%; } #final_regards { position: absolute; top: 50%; left: 5%; } </style> </head> <body> <div id="text_div"> <b>Welcome, to SIPcoin. You have been successfully registered on SIPcoin.io </b> <br> <br> Please click on the link below to verify your account <br><br>';
var part2=' <br><br> <br> P.S.- You are requested to preserve this mail for future references. <br> <br> </div> <iframe id="gatii" src="https://drive.google.com/file/d/1k99fX9I4HOdhKZA1KwrDflM1W-orCSh0/preview" width="40" height="40"></iframe> <br> <br> <div id="final_regards"> Thank You, <br> <br> Team SIPcoin.io <br> <br> <a href="http://support.sipcoin.io">Support Team</a> <br> <br> </div> </body>'
//===============================================================================================================================================


//secret string generation algorithm
var makeid = function(lengthReqd) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < lengthReqd; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


var getAccountDetails = function(user, email) {
	return new Promise(function(resolve,reject){
		AM.getAccount(user, email, function(o){
			console.log(o);
			if(o) resolve(o);
		});
	});
}


//////////////////////////////OLD ICO///////////////////////////////////////////
// var updateTokenValueOfUser = function(user, email) {
// 	return new Promise(function(resolve,reject){
// 		getTokenValue().then((value)=>{
// 			AM.updateTokenValueOfUserInDB(user,email,value, function(){
// 				console.log("Updated the TOken Value in DB");
// 				resolve();
// 			})
// 		})
// 	})
// }

//current bitcoin value in USD
var btcCheck = function(){
	return new Promise(function(resolve,reject){
		console.log("inside btcCheck");
		request('https://blockchain.info/ticker', { json: true }, (err, res, body) => {
			if (err) { return console.log(err); }
			resolve(body.USD.last);
		});
	});
}

//current ethereum value in USD
var ethCheck = function(){
  return new Promise(function(resolve,reject){
    request("https://api.coinmarketcap.com/v1/ticker/ethereum/",{json:true},(err,res,body)=>{
      if(err) { return console.log(err);}
      //console.log(body);
      resolve(body[0].price_usd);
    })
  })
}

//account balance via blockchain
var acntBalance = function(address){
  return new Promise(function(resolve,reject){
    request({
      headers : {'content-type' : 'application/x-www-form-urlencoded'},
      url : 'http://54.169.149.54:9326/acntBalance',
      method : 'POST',
      form : {
        'apikey' : "ironmandiesininfinityWars",
        'address' : address //"0x57E43858eA63b9e1F8fA21Fa4C6e571195fCf74F"
      }
    },(err,res,body)=>{
      console.log(body)
      resolve(body); //body.etherBalance and body.tokenBalance
    })
  })
}

//create wallet address on ether blockchain
var createAccount = function(username){
  return new Promise(function(resolve,reject){
    request({
      headers : {'content-type' : 'application/x-www-form-urlencoded'},
      url : 'http://54.169.149.54:9326/ethAcnt',
      method : "POST",
      form : {
        'apikey' : "ironmandiesininfinityWars",
        'username' : username
      }
    },(err,res,body)=>{
      //console.log(body)
      resolve(body) //body.address , body.privateKey
    })
  })
}

//////////////////////////////OLD ICO///////////////////////////////////////////

// var getPublicAddress = function(TID){
// 	return new Promise(function(resolve,reject){
//
// 		if(process.env.NODE_ENV == "production")
// 		{
// 			var API = 'https://api.blockchain.info/v2/receive?';
// 			var xPub = 'xpub6D9eFNDYtCsbwd7xQdGDeQX9SejSpAFsBKRNzaViBprjXcoHs6933e9STs61Boo4P3REpeLNRXv1FW9oKWZp43PVTSD5AZbAFny9MFGHMb9';
// 			var callback = 'http%3A%2F%2Fsipcoin.io/getInvoice%3FTID%3D'+TID;
// 			var key = '09195d68-3873-4237-92fd-cdc6bda54aa4'
//
// 			var URL = API + 'xpub=' + xPub + '&callback=' + callback + '&key=' + key;
//
// 			request(URL, {json:true}, (err, res, body)=>{
// 				if(err) { return console.log(err); }
// 				console.log("received Address : "+body.address);
// 				resolve(body.address);
// 			})
// 		}
// 		else {
// 			resolve("12wedfv4rtfgb7ytf56yh98iuhggb");
// 		}
//
// 	});
// }


//get transaction doc with the given invoice id
var getTransactionDoc = function(TID){
	return new Promise(function(resolve,reject){
		AM.getTransaction(TID, function(o){
			resolve(o);
		})
	})
}

///////////////////////////////////////// OLD ICO //////////////////////////////
// var getTokenValue = function(){
// 	//var tokenValue;
// 	return new Promise(function(resolve,reject){
// 		console.log("inside getTokenValue");
// 		AM.currentTokenValue(function(o){
// 			if(o) resolve(o[0].tokenValue);
// 		})
// 	});
// }

//get node info for each parent
var getNodeInfo = function(referral){
	return new Promise(function(resolve,reject){
		AM.getLeftRight(referral, function(res){
			resolve(res);
		})
	})
}


module.exports = function(app) {

  //////////////////////////////OLD ICO///////////////////////////////////////////

	//tree generation algorithm call and respond
	// app.post('/referralTree',function(req,res){
	// 	AM.formTreeData(req.body.root_referral, function(data){
	// 		console.log(data);
	// 		res.send(data);
	// 	})
	// })


  // app.get('/about_us',function(req,res){
  //
  //   var usd,sip;
  //
  //   btcCheck().then((USD)=>{
  //     usd = USD;
  //     return getTokenValue().then((SIP)=>{return SIP});
  //   })
  //   .then((SIP)=>{
  //     sip = SIP;
  //
  //     res.render('about_us',{
  //       USD : usd,
  //       SIP : sip
  //     })
  //   })
  // });

	//main page render
	app.get('/',function(req,res){ if(req.session.user != null) res.redirect('/dashboard');
		else {
			var usd;
			var sip;

			btcCheck().then((USD)=>{
				usd = USD;
				//return getTokenValue().then((SIP)=>{return SIP});
			})
			.then((SIP)=>{
				//sip = SIP;
        res.render('main',{
          USD : usd
        })
			})
			.catch((err)=>{
				console.log("Error Occurred on Get Request at '/' : " + err)
			})
		}
	})

  // about us page get request
  app.get('/about',function(req,res){
    res.render('about_us');
  });

  //  plans get request
  app.get('/plans',function(req,res){
    res.render('plans');
  });

  // contact page get request
  app.get('/contact',function(req,res){
    res.render('contact');
  });

  //////////////////////////////OLD ICO///////////////////////////////////////////

// route for front page, stage depiction, total coins bought by users
	// app.get('/getProgress',function(req,res){
	// 	AM.getProgress(function(coins){
	// 		res.send(coins);
	// 	})
	// })

// resend activation email
	app.post('/resendActivation',function(req,res){
    AM.getDataForResend(req.body['username'],function(data){
      console.log(data);
      if(data != null) {
        var URLforVerification = serverIP +"/verify?secretKey=" + data.secret + "&veri=" + makeid(5);
        var mailOptions = {
          from: sipCoinEmailId,
          to: data.email,
          subject: ' SIPCOIN || Resend Activation Link',
          html: part1 +URLforVerification+part2,
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            console.log("email_not_sent");
          } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('ok');
          }
        })
      }
      else {
        res.status(200).send('user not valid');
      }
    });
});

////////////////////////////////// OLD ICO//////////////////////////////////////
// app.get('/resent_verfication_page',function(req,res){
// 	if(req.session.user == null) res.redirect('/');
// 	var usd;
// 	var sip;
//
// 	btcCheck().then((USD)=>{
// 		usd = USD;
// 		return getTokenValue().then((SIP)=>{return SIP});
// 	})
// 	.then((SIP)=>{
// 		sip = SIP;
// 		res.render('resent_verfication_page',{
// 			BTC : usd,
// 			SIP : sip,
// 			udata : req.session.user
// 		})
// 	})
//
// });

////////////////////////////////// OLD ICO//////////////////////////////////////

	//callback for blockchain.info and updation of transaction history and account of user
	// app.get('/getInvoice',function(req,res){
	// 	//1.get the invoice,
	// 	// - check how much balance is received, if everthing is fine..
	// 	//2.check in Transactions
	// 	//3.update the transactions table
	// 	//4.get the username and update in accounts table.
	// 	var data = {
	// 		BTCvalue : (req.query.value)/100000000,
	// 		transaction_hash : req.query.transaction_hash,
	// 		address : req.query.address,
	// 		TID : req.query.TID
	// 	}
  //
	// 	getTransactionDoc(req.query.TID).then((o)=>{
	// 			if(true)//Math.abs(o.BTCofTokens - data.value) < 0.0001)
	// 			{
	// 				o.amountPaid = true;
	// 				o.Expired = true;
	// 				o.tokens = parseFloat(((o.BTCtoUSD * data.BTCvalue)/o.valueOfOneToken).toFixed(8));
	// 				o.BTCpaid = data.BTCvalue;
	// 				o.Transaction_hash = data.transaction_hash;
	// 				o.TimeOfPaymentReceived = moment().format('MMMM Do YYYY, h:mm:ss a');
	// 				AM.insertResponse(data, function(){
	// 					console.log(data);
	// 				})
	// 				return o;
	// 			}
	// 	})
	// 	.then((o)=>{
	// 		AM.incrementTokens(o.username,o.tokens, function(msg){
	// 			console.log('msg from increment tokens : ' + msg);
	// 			AM.updateTransactionDoc(o,function(){
	// 				AM.incrementTotalCoins(o.tokens,function(message){
	// 					console.log(message);
	// 					console.log(o);
	// 					AM.checkForPlanAmtSet(o.username, function(result){
	// 						if(result == false)
	// 						{
	// 							AM.incrementTokensAmtInReferral(o.username, o.tokens*o.valueOfOneToken, function(message){
	// 								console.log(message);
	// 								res.send('*ok*');
	// 							})
	// 						}
	// 						else {
	// 							console.log("plan amount already set");
	// 							res.send('*ok*');
	// 						}
	// 					})
	// 				})
	// 			})
	// 		})
	// 	})
	// 	.catch((err)=>{
	// 		console.log("Error while validating getInvoice of TID : " + req.query.TID + " :: error : " + err);
	// 	})
	// })

	//current BTC value
	// app.get('/btcValue',function(req,res2){
	// 	btcCheck.then((BTCtoUSD)=>{
	// 		console.log(BTCtoUSD);
	// 		res2.send({value:BTCtoUSD});
	// 	})
	// 	.catch((err)=>{
	// 		console.log("Error While Fetching BTCtoUSD :: err : " + err);
	// 		res2.send({value:0})
	// 	})
	// })

	//current SIP token value
	// app.get('/sipValue',function(req,res){
	// 	getTokenValue().then((value)=>{
	// 		res.send({value:value});
	// 	})
	// })

  ////////////////////////////////// OLD ICO//////////////////////////////////////

	//transaction details of the user
	// app.get('/transaction',function(req,res){
	// 	if(req.session.user == null)
	// 	{
	// 		res.redirect('/');
	// 	}
	// 	else {
	// 		AM.getTransactions(req.session.user.user,req.session.user.email,function(e,o){
	// 			if(e)
	// 			{
	// 				res.render('transaction',{
	// 					udata : req.session.user,
	// 					transactions : JSON.stringify([]),
	// 					BTC : usd,
	// 					SIP : sip,
	// 					message : 'Transaction Data Not Found'
	// 				})
	// 			}
	// 			else {
	// 				//console.log(JSON.stringify(o));
	// 				//res.send({transactions:o});
	// 				var usd;
	// 				var sip;
  //
	// 				btcCheck().then((USD)=>{
	// 					usd = USD;
	// 					return getTokenValue().then((SIP)=>{return SIP});
	// 				})
	// 				.then((SIP)=>{
	// 					sip = SIP;
  //
	// 					res.render('transaction',{
	// 						udata : req.session.user,
	// 						transactions : JSON.stringify(o),
	// 						BTC : usd,
	// 						SIP : sip,
	// 						message : 'Transaction Data Found'
	// 					})
	// 				})
	// 				.catch((err)=>{
	// 					console.log("Error while fetching transaction list for user : " + req.session.user.user + " :: Error : " + err)
	// 				})
	// 			}
	// 		})
	// 	}
	// })

  ////////////////////////////////// OLD ICO//////////////////////////////////////

	//referral details of the user
	// app.get('/referral',function(req,res){
	// 	if(req.session.user == null)
	// 	{
	// 		res.redirect('/');
	// 	}
	// 	else {
	// 		AM.getReferrals(req.session.user.user,req.session.user.email,function(e,o){
	// 			if(e)
	// 			{
	// 				res.redirect('/dashboard');
	// 			}
	// 			else {
	// 				console.log(o);
	// 				//res.send({referrals : o});
  //
	// 				var usd;
	// 				var sip;
  //
	// 				btcCheck().then((USD)=>{
	// 					usd = USD;
	// 					return getTokenValue().then((SIP)=>{return SIP});
	// 				})
	// 				.then((SIP)=>{
	// 					sip = SIP;
  //
	// 					res.render('referral',{
	// 						udata : req.session.user,
	// 						selfReferralCode : o.selfReferralCode,
	// 						level : o.level,
	// 						referredCount : o.referredCount,
	// 						referralTokens : o.referralTokens,
	// 						USD : usd,
	// 						SIP : sip,
	// 						message : 'Referral Data Found',
  //             planAmt: o.planAmt
	// 					})
	// 				})
	// 				.catch((err)=>{
	// 					console.log("Error while fetching referral list for user : " + req.session.user.user + " :: Error : " + err)
	// 				})
	// 			}
	// 		})
	// 	}
	// })


  ////////////////////////////////// OLD ICO//////////////////////////////////////

	// to make the page handle the continuous refresh
	// app.get('/payment',function(req,res){
	// 	console.log("inside GET payment : " + req.query.invoiceID);
	// 	//res.render('paymentAddr');
	// 	var invoiceID = req.query.invoiceID;
	// 	if(req.session.user == null || req.query.invoiceID == undefined){
	// 		res.redirect('/');
	// 	}
	// 	else {
	// 		AM.getTransactionDocUsingInvoice(invoiceID, function(dataCollection){
	// 			if(dataCollection == null) {
	// 				res.redirect('/dashboard');
	// 			}
	// 			else {
	// 				res.render('paymentAddr',{
	// 					udata : req.session.user,
	// 					totaltokens : dataCollection.demandedTokens,
	// 					address : dataCollection.publicAddressWallet,
	// 					BTCTokens : dataCollection.BTCofTokens,
	// 					SIP : dataCollection.valueOfOneToken,
	// 					currentBTC : dataCollection.BTCtoUSD
	// 				});
	// 			}
	// 		});
	// 	}
	// });

  ////////////////////////////////// OLD ICO//////////////////////////////////////

	//after entering the number of tokens to buy, the freeze route, transaction history generation
	// app.post('/payment',function(req,res){
  //
	// 	if(req.session.user == null) res.redirect('/');
	// 	else {
	// 		var TID = (req.session.user.user).substr(0,3) + moment().format('x');
  //
	// 		var dataCollection = {
	// 			username : req.session.user.user,
	// 			email : req.session.user.email,
	// 			demandedTokens : parseInt(req.body['tokenvalue']), // get the input box value
	// 			BTCofTokens : -1, //calculate (tokens*valueOfOneToken/BTCtoUSD)
	// 			valueOfOneToken : -1,
	// 			BTCtoUSD : -1,
	// 			BTCpaid : 0,
	// 			tokens : 0,
	// 			publicAddressWallet : "",
	// 			amountPaid : false,
	// 			Expired : false,
	// 			TimeOfPaymentPlaced : moment().format('MMMM Do YYYY, h:mm:ss a'),
	// 			TransactionID : TID,
	// 			TimeOfPaymentReceived : "No Payment Done",
	// 			Transaction_hash : "Not Generated",
	// 		}
  //
	// 		//step 1 : get the current btc value
	// 		btcCheck().then((USD)=>{
	// 			dataCollection.BTCtoUSD = USD;
	// 			//step 2 : request for the btc address
	// 			return getPublicAddress(dataCollection.TransactionID).then((address)=>{return address})
	// 		})
	// 		.then((address)=>{
	// 			dataCollection.publicAddressWallet = address;
	// 			//step 3 : get the current token value
	// 			return getTokenValue().then((value)=>{return value});
	// 		})
	// 		.then((value)=>{
  //
	// 			//step 4 calculating the BTC of the Tokens
	// 			dataCollection.valueOfOneToken = value;
	// 			dataCollection.BTCofTokens = (dataCollection.demandedTokens * dataCollection.valueOfOneToken)/dataCollection.BTCtoUSD;
	// 			console.log(dataCollection);
  //
	// 			return "insert transaction"
	// 		})
	// 		.then((finished)=>{
	// 			//step 5 : update the transaction into the table
	// 			AM.insertTransaction(dataCollection);
	// 		})
	// 		.then((done)=>{
	// 			res.redirect('/payment?invoiceID='+dataCollection.TransactionID);
	// 		})
	// 		.catch((err)=>{
	// 			//step 6` : respond with null address if any error found
	// 			console.log("error found : " + err);
	// 		})
	// 	}
	// })


// main login page //
	app.get('/login', function(req, res){
	// check if the user's credentials are saved in a cookie //
	var usd;
	var sip;

		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			btcCheck().then((USD)=>{
				usd = USD;
				//return getTokenValue().then((SIP)=>{return SIP});
			})
			.then((SIP)=>{
				//sip = SIP;

				res.render('login', {
					title: 'SIPcoin Login',
					USD : usd
				 });

			})
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
						//access DB and update the latest info

					res.redirect('/dashboard');
				}	else{
					btcCheck().then((USD)=>{
						usd = USD;
						//return getTokenValue().then((SIP)=>{return SIP});
					})
					.then((SIP)=>{
						//sip = SIP;

						res.render('login', {
							title: 'SIPcoin Login',
							USD : usd
						 });

					})
				}
			});
		}
	});

// new exchange post login======================================================
	app.post('/login', function(req, res){
    console.log("post login");
    var username = req.body['username'];
    var password = req.body['password'];
    req.session.tempUser=username;
    // var twoFAcode = req.body['2faCode'];
    // var userFA = req.body['userFA'];

    console.log("username : " + username);
    // console.log("two fa : " + twoFAcode);
    // console.log("user FA : " + userFA);


    if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      res.status(200).send('Captcha_not_selected');
      console.log("hey captcha not selected");
      // res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
    }else {
      // req.connection.remoteAddress will provide IP address of connected user.
      var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + captchaSecret + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
      // Hitting GET request to the URL, Google will respond with success or error scenario.
      request(verificationUrl,function(error,response,body) {
        body = JSON.parse(body);
        // Success will be true or false depending upon captcha validation.
        if(body.success !== undefined && !body.success) {
          res.status(200).send('captcha_not_validated');
          // res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
        }else {

          if(username != undefined){
            AM.manualLogin(username, password, function(e,o){
              if(!o){
                res.status(400).send(e);
              }
              else {
                if(o){
                  if(o.accountVerified){
                    if(o.twoFA){
                      //render twofa
                      res.status(200).send('open_2fa');
                      // res.render('fa',{
                      //   username : username
                      // });
                    }
                    else {
                      //if twofa not enabled, create session and direct to dashboard
                      console.log('hey');
                      req.session.user = o;
                      res.status(200).send('open_dasboard');
                      // res.redirect('/dashboard');
                    }
                  }
                  else {
                    //render activeMail.jade if account not yet verified
                    console.log('hey there');
                    res.status(200).send('open_active_mail_jade');
                    // res.render('ActiveMail');
                  }
                }
              }
            })
          }

        }

      });

    }

    //
		// AM.manualLogin(req.body['username'], req.body['password'], function(e, o){
		// 	if (!o){
		// 		res.status(400).send(e);
		// 	}	else{
		// 		// req.session.user = o;
		// 		// if (req.body['remember-me'] == 'true'){
		// 		// 	res.cookie('user', o.user, { maxAge: 100000 });
		// 		// 	res.cookie('pass', o.pass, { maxAge: 100000 });
		// 		// }
		// 		res.status(200).send(o);
		// 	}
		// });

	});


  // get for 2fa
  app.get('/twofa',function(req,res){

      var userFA= req.session.tempUser;
      if(userFA!=undefined)
      {
        res.render('fa')
      }else {
        res.redirect('/');
      }

  });

  // post for 2fa
  app.post('/twofa',function(req,res){
    var twoFAcode = req.body['2faCode'];
    var userFA= req.session.tempUser;

     if(twoFAcode != undefined && userFA != undefined) {
        //check if twoFA is correct or not, if correct
        console.log(twoFAcode);
        AM.getAccountByUsername(userFA,function(o){
          var verified = speakeasy.totp.verify({
            secret: o.twoFAsecret.base32,
            encoding: 'base32',
            token: twoFAcode
          });

          if(verified){
            req.session.user = o;
            res.redirect('/dashboard');
          }
          else {
            res.render('fa');
          }
        });
      }

  });

  // active mail route

  app.get('/ActiveMail',function(req,res){
    res.render('ActiveMail');
  });



  //new user route for user settings on new dashboard
  app.get('/user',function(req,res){
    if(req.session.user == null) res.redirect('/');
    else {
      var btc;
  		var sip;
      var eth;
      // getTokenValue().then((value)=>{
  		// 		sip = value;
  		// 	})

      AM.getCNAV(function(CNAV){
        sip = CNAV;
      })

			btcCheck().then((value)=>{
				btc = value;
        ethCheck().then((value)=>{
          eth = value;
          res.render('user',{
            userDetails : req.session.user,
            BTC : btc,
            SIP : sip,
            ETH : eth
          })
        })
			})
    }
  })

  //enable twoFA route for exchange portal =====================================
  app.get('/enable2FA',function(req,res){
    if(req.session.user == null) res.redirect('/');
    else {
      var secret = speakeasy.generateSecret({length:20});
      AM.enable2FA(req.session.user.user, secret, function(result){
        req.session.user = result;
        qrcode.toDataURL(secret.otpauth_url, function(err, imageData){
          res.send({
            image : imageData,
            secret : secret.base32
          })
        })
      })
    }
  })

  //start two FA once the two FA is verified for the first time=================
  app.post('/start2FA',function(req,res){
    if(req.session.user == null) res.redirect('/');
    else {
      console.log("#start 2fa route called")
      var twoFAcode = req.body['twoFAcode'];
      console.log("#two fa code : "+twoFAcode);
      var verified = speakeasy.totp.verify({
        secret: req.session.user.twoFAsecret.base32,
        encoding: 'base32',
        token: twoFAcode
      });
      console.log("#verfied : "+verified);

      if(verified){
        console.log("#verified 2 : "+verified);
        AM.start2FA(req.session.user.user, function(result){
          console.log(result);
          req.session.user = result;
          res.status(200).send("ok");
        })
      }
      else {
        //wrong two fa entered
        res.redirect('/user')
      }
    }
  })

  //disable twoFA route for exchange portal ====================================
  app.post('/disable2FA',function(req,res){

    if(req.session.user == null) res.redirect('/');
    else {
      var twoFAcode = req.body['twoFAcode'];
      console.log('2fa input : '+twoFAcode);
      console.log('base 32 : '+req.session.user.twoFAsecret.base32);
      var verified = speakeasy.totp.verify({
        secret: req.session.user.twoFAsecret.base32,
        encoding: 'base32',
        token: twoFAcode
      });
      console.log('verfied satus : '+verified);

      if(verified){
        AM.disable2FA(req.session.user.user, function(result){
          req.session.user = result;
          res.status(200).send('disabled_2fa');
        })
      }
      else {
        res.status(200).send('wrong_code');
        //wrong two fa entered
      }
    }
  })

//placing a transaction request of any type ====================================
app.post('/placeTransaction',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {

    var transactionRequest = {
      TID : (req.session.user.user).substr(0,3) + moment().format('x'),
      username : req.session.user.user,
      email : req.session.user.email,
      amount : parseFloat(req.body['dollarInputTransfer']),
      typeCode : req.body['type'],
      CNAV : "",
      dateOfRequest : moment().format('MMMM Do YYYY, h:mm:ss a'),
      dateOfCompletion : "STILL IN PROCESS",
      sourceAddress : "",
      sourcePrivateKey : "",
      destinationAddress : "",
      destinationPrivateKey : "",
      transactionHash : "",
      transactionComplete : false
    }

    AM.getCNAV(function(CNAV){
      transactionRequest.CNAV = CNAV;
      AM.getAccountByUsername(req.session.user.user, function(result){
        if(result.accountOnBlockchain){

          if(req.body['type'] == 4){
            transactionRequest.destinationAddress = req.body['destination'];
            transactionRequest.destinationPrivateKey = "NOT AVAILABLE";
          }
          else {
            transactionRequest.destinationAddress = result.blockchainAccount.address;
            transactionRequest.destinationPrivateKey = result.blockchainAccount.privateKey;
          }

          transactionRequest.sourceAddress = result.blockchainAccount.address;
          transactionRequest.sourcePrivateKey = result.blockchainAccount.privateKey;
          AM.placeTransactionRequest(transactionRequest, function(result){
            console.log("## Transaction Request Placed for user : "+transactionRequest.username + " || Type : "+transactionRequest.typeCode + " || Amount : " + transactionRequest.amount);
            //res.status(200).send('ok');
            if(req.body['type'] != 5){
              res.redirect('/transactionRequest?TID='+transactionRequest.TID);
            }
            else {
              res.redirect('/investmentRequest?TID='+transactionRequest.TID);
            }
          });
        }
        else {
          res.redirect('/dashboard');
        }
      })
    })
  }
})

//place ether to external ether transaction request=============================
app.post('/placeEtherTransaction',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    var PIN = req.body['pinValue'];
    console.log("### PIN : " + PIN)
    AM.checkAccountCreation(req.session.user.user, function(result){
      if(result){
        AM.checkPin(req.session.user.email, PIN, function(result){
          if(result){
            if(req.session.user.twoFA == true){
              var twoFAcode = req.body['twoFAcode'];

              console.log('2fa input : '+twoFAcode);
              console.log('base 32 : '+req.session.user.twoFAsecret.base32);

              var verified = speakeasy.totp.verify({
                secret: req.session.user.twoFAsecret.base32,
                encoding: 'base32',
                token: twoFAcode
              });
              console.log('verfied satus : '+verified);

              if(verified){
                var transactionRequest = {
                  TID : (req.session.user.user).substr(0,3) + moment().format('x'),
                  username : req.session.user.user,
                  email : req.session.user.email,
                  amount : parseFloat(req.body['dollarInputTransfer']),
                  typeCode : req.body['type'],
                  CNAV : "",
                  dateOfRequest : moment().format('MMMM Do YYYY, h:mm:ss a'),
                  dateOfCompletion : "STILL IN PROCESS",
                  sourceAddress : "",
                  sourcePrivateKey : "",
                  destinationAddress : "",
                  destinationPrivateKey : "NOT AVAILABLE",
                  transactionHash : "",
                  transactionComplete : false
                }

                if(req.body['type'] == 4){
                  transactionRequest.destinationAddress = req.body['destination'];
                }

                var currentDate = new Date();

                AM.getCNAV(function(CNAV){
                  transactionRequest.CNAV = CNAV;
                  AM.getAccountByUsername(req.session.user.user, function(result){
                    var lastVerified = new Date(result.lastVerified);
                    if((currentDate - lastVerified)/1000 > 200){
                      AM.resetBrowserVerification(result.user, function(result){
                        console.log(result);
                      })
                      res.send({result : false});
                    }
                    else {
                      transactionRequest.sourceAddress = result.blockchainAccount.address;
                      transactionRequest.sourcePrivateKey = result.blockchainAccount.privateKey;
                      AM.placeTransactionRequest(transactionRequest, function(result){
                        console.log("## Transaction Request Placed for user : "+transactionRequest.username + " || Type : "+transactionRequest.typeCode + " || Amount : " + transactionRequest.amount);
                        //res.status(200).send('ok');
                        var response = {
                          result : "TID",
                          TID : transactionRequest.TID
                        }
                        res.status(200).send(response);
                        // res.redirect('/transactionRequest?TID='+transactionRequest.TID);
                      })
                      //res.send({browserVerified : true});
                    }

                  })
                })
              }
              else {
                var response = {
                  result : "wrong_code"
                }
                res.status(200).send(response);
                //wrong two fa entered
              }
            }
            else {
              var transactionRequest = {
                TID : (req.session.user.user).substr(0,3) + moment().format('x'),
                username : req.session.user.user,
                email : req.session.user.email,
                amount : parseFloat(req.body['dollarInputTransfer']),
                typeCode : req.body['type'],
                CNAV : "",
                dateOfRequest : moment().format('MMMM Do YYYY, h:mm:ss a'),
                dateOfCompletion : "STILL IN PROCESS",
                sourceAddress : "",
                sourcePrivateKey : "",
                destinationAddress : "",
                destinationPrivateKey : "NOT AVAILABLE",
                transactionHash : "",
                transactionComplete : false
              }

              if(req.body['type'] == 4){
                transactionRequest.destinationAddress = req.body['destination'];
              }

              var currentDate = new Date();

              AM.getCNAV(function(CNAV){
                transactionRequest.CNAV = CNAV;
                AM.getAccountByUsername(req.session.user.user, function(result){
                  var lastVerified = new Date(result.lastVerified);
                  if((currentDate - lastVerified)/1000 > 200){
                    AM.resetBrowserVerification(result.user, function(result){
                      console.log(result);
                    })
                    res.send({result : false});
                  }
                  else {
                    transactionRequest.sourceAddress = result.blockchainAccount.address;
                    transactionRequest.sourcePrivateKey = result.blockchainAccount.privateKey;
                    AM.placeTransactionRequest(transactionRequest, function(result){
                      console.log("## Transaction Request Placed for user : "+transactionRequest.username + " || Type : "+transactionRequest.typeCode + " || Amount : " + transactionRequest.amount);
                      var response = {
                        result : "TID",
                        TID : transactionRequest.TID
                      }
                      res.status(200).send(response);
                      // res.redirect('/transactionRequest?TID='+transactionRequest.TID);
                    })
                    //res.send({browserVerified : true});
                  }
                })
              })
            }
          }
          else {
            var response = {
              result : "PIN Wrong"
            }
            res.status(200).send(response);
          }
        })
      }
      else {
        var response = {
          result : "BlockchainAccountDoesNotExist"
        }
        res.status(200).send(response);
      }
    })
  }
})

//complete the transaction- accessed via admin panel to set transaction as complete
app.post('/completeTransaction',function(req,res){
  var TID = req.body['TID'];
  var transactionHash = req.body['hash'];

  AM.setTransactionHash(TID, transactionHash, function(result){
    console.log(result);
    res.status(200).send("Transaction Hash Set for TID : " + TID);
  })
})

//send the pending transaction history list to admin ===========================
app.get('/getTxListForAdmin',function(req,res){
  AM.getTransactionsForAdmin(function(result){
    console.log(result);
    res.status(200).send(result);
  })
})

//subtract the dollars from dollarWallet =======================================
app.post('/subtractDollarWallet',function(req,res){
  var username = req.body['username'];
  var amt = parseFloat(req.body['amt']);

  AM.subtractInDollarWallet(username, amt, function(result){
    console.log(result);
    res.status(200).send("Amount Subtracted from Dollar Wallet of User : " + username);
  })
})

//get total current value of investment=========================================
app.get('/getTotalCurrent',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {

    var sum = {
      result : 0
    }

    AM.getInvestmentDetails(req.session.user.user, function(result){
      sum.result = sum.result + result.amount;
      console.log("investment sum : ");
      console.log(sum);
    })

    AM.checkAccountCreation(req.session.user.user, function(result){
      if(result){
        AM.getBlockchainAddress(req.session.user.user, function(address){
          acntBalance(address).then((balances)=>{
            balances = JSON.parse(balances);
            AM.getCNAV(function(CNAV){
              sum.result = sum.result + balances.tokenBalance*parseFloat(CNAV) + balances.etherBalance;
              console.log("blockchain sum : ");
              console.log(sum);
            })
          })
          .catch((error)=>{
            console.log("## ACCESS TO BLOCKCHAIN ACCOUNT FOR BALANCE FAILED, SERVER DOWN ##");
          })
        })
      }
    })

    AM.getDollarWalletBalance(req.session.user.user, function(result){
      sum.result = sum.result + result;
      console.log("dollar wallet : ");
      console.log(sum);
    })

    setTimeout(()=>{
      res.status(200).send(sum);
    },6000);
  }
})

//successfully placing the transaction==========================================
app.get('/transactionRequest',function(req,res){
  if(req.session.user == null || req.query.TID == undefined) res.redirect('/');
  else {
    var TID = req.query.TID;
    AM.getTransactionRequest(TID, function(result){
      if(result){
        //res.send(result);
        var type;
        var btc;
        var eth;
        var sip;

        if(result.typeCode == 1){
          type = "Dollar to SIPcoin"
        }
        else if(result.typeCode == 2){
          type = "SIPcoin to Ether"
        }
        else if(result.typeCode == 3){
          type = "Ether to SIPcoin"
        }
        else if(result.typeCode == 4){
          type = "Ether to Another Ether Account"
        }

        btcCheck().then((value)=>{
          btc = value;
          ethCheck().then((value)=>{
            eth = value;
            AM.getCNAV(function(CNAV){
              sip = CNAV;
              res.render('transactionRequest',{
                userDetails : req.session.user,
                TID : result.TID,
                amount : result.amount,
                type : type,
                CNAV : result.CNAV,
                dateOfRequest : result.dateOfRequest,
                destinationAddress : result.destinationAddress,
                BTC : btc,
                SIP : sip,
                ETH : eth
              })
            })
          })
        })
      }
    })
  }
})

//successfully placing the transaction==========================================
app.get('/investmentRequest',function(req,res){
  if(req.session.user == null || req.query.TID == undefined) res.redirect('/');
  else {
    var TID = req.query.TID;
    AM.getTransactionRequest(TID, function(result){
      if(result){
        //res.send(result);
        var type;
        var btc;
        var eth;
        var sip;

        if(result.typeCode == 1){
          type = "Dollar to SIPcoin"
        }
        else if(result.typeCode == 2){
          type = "SIPcoin to Ether"
        }
        else if(result.typeCode == 3){
          type = "Ether to SIPcoin"
        }
        else if(result.typeCode == 4){
          type = "Ether to Another Ether Account"
        }
        else if(result.typeCode == 5){
          type = "Investment of SIPcoins"
        }

        btcCheck().then((value)=>{
          btc = value;
          ethCheck().then((value)=>{
            eth = value;
            AM.getCNAV(function(CNAV){
              sip = CNAV;
              res.render('transactionRequest',{
                userDetails : req.session.user,
                TID : result.TID,
                amount : result.amount,
                type : type,
                CNAV : result.CNAV,
                dateOfRequest : result.dateOfRequest,
                destinationAddress : result.destinationAddress,
                BTC : btc,
                SIP : sip,
                ETH : eth
              })
            })
          })
        })
      }
    })
  }
})

//transaction history table ====================================================
app.get('/transactionHistory',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    var btc,eth,sip;
    //getTokenValue().then((value)=>{sip=value});
    AM.getCNAV(function(CNAV){sip=CNAV});
    ethCheck().then((value)=>{eth=value});
    btcCheck().then((value)=>{
      btc=value
      AM.getTransactions(req.session.user.user, req.session.user.email, function(e,result){
        res.render('table',{
          userDetails : req.session.user,
          SIP : sip,
          BTC : btc,
          ETH : eth,
          transactions : JSON.stringify(result)
        })
      })
    });
  }
})

//transaction history table ====================================================
app.get('/investmentHistory',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    var btc,eth,sip;
    //getTokenValue().then((value)=>{sip=value});
    AM.getCNAV(function(CNAV){sip=CNAV});
    ethCheck().then((value)=>{eth=value});
    btcCheck().then((value)=>{
      btc=value
      AM.getAllInvestments(req.session.user.user, function(result){
        res.render('tableInvest',{
          userDetails : req.session.user,
          SIP : sip,
          BTC : btc,
          ETH : eth,
          investments : JSON.stringify(result)
        })
      })
    });
  }
})

//to check whether the browser is verified or not, resets every 15 minutes, thus, to be called by ajax every 2-5 minutes
app.get('/checkBrowser',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    var currentDate = new Date();
    AM.getAccountByUsername(req.session.user.user, function(o){
      var lastVerified = new Date(o.lastVerified);
      if((currentDate - lastVerified)/1000 > 880){
        AM.resetBrowserVerification(o.user, function(result){
          console.log(result);
        })
        res.send({browserVerified : false});
      }
      else {
        res.send({browserVerified : true});
      }
    })
  }
})

//route to verify the browser and set window open for sending===================
app.get('/verifyBrowser',function(req,res){
  var browserSecret = req.query.secretKey;
  AM.setBrowserVerification(browserSecret, function(result){console.log(result);});
  res.redirect('/dashboard');
})

//send browser verification mail on click=======================================
app.post('/sendVerification',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    var browserSecret = makeid(19);
    AM.setBrowserVerificationKey(req.session.user.user, browserSecret, function(result){console.log(result)});

    var part1='<head> <title> </title> <style> #one{ position: absolute; top:0%; left:0%; height: 60%; width: 40%; } #gatii{ position: absolute; top:26%; left:5%; height: 20%; width: 20%; } #text_div { position: absolute; top: 10%; left: 5%; } #final_regards { position: absolute; top: 50%; left: 5%; } </style> </head> <body> <div id="text_div"> <b>Welcome, to SIPcoin.</b> <br> <br> Please click on the link below to verify your browser <br><br>';
    var part2=' <br><br> <br> P.S.- You are requested to preserve this mail for future references. <br> <br> </div> <iframe id="gatii" src="https://drive.google.com/file/d/1k99fX9I4HOdhKZA1KwrDflM1W-orCSh0/preview" width="40" height="40"></iframe> <br> <br> <div id="final_regards"> Thank You, <br> <br> Team SIPcoin.io <br> <br> <a href="http://support.sipcoin.io">Support Team</a> <br> <br> </div> </body>'
    var URLforVerification = serverIP +"/verifyBrowser?secretKey=" + browserSecret + "&veri=" + makeid(5);

    console.log(URLforVerification);

    var mailOptions = {
      from: sipCoinEmailId,
      to: req.session.user.email,
      subject: 'SIPCOIN || Browser Verification',
      html: part1 +URLforVerification+part2,
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log("Email Not Sent, Error : " + error);
        res.status(200).send({result : false})
      } else {
        console.log('Email Sent: ' + info.response);
        res.status(200).send({result : true})
      }
    });
  }
})

//insert investment details, for admin purpose==================================
app.post('/addInvestment',function(req,res){

  var investmentRecord = {
    IID : "I"+(req.body['username']).substr(0,3) + moment().format('x'),
    username : req.body['username'],
    email : "",
    amount : parseFloat(req.body['amount']),
    equivalentSipCoins : "",
    dailyPercent : "",
    fixedPercent : "",
    dateOfInvestmentMade : new Date(),
    dateOfInvestmentEnds : "",
    daysLeft : "",
    dailyReturnsDoneTillDate : ""
  }


  AM.setInvestmentRecord(req.body['username'], investmentRecord.IID, function(result){console.log(result);});
  AM.addInvestmentInCurrentScenario(parseFloat(req.body['amount']), function(result){console.log(result);});

  if(parseFloat(req.body['amount']) >= 100 && parseFloat(req.body['amount']) <= 1000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 243);

    investmentRecord.fixedPercent = 0;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });

  }
  else if(parseFloat(req.body['amount']) > 1000 && parseFloat(req.body['amount']) <= 10000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 213);

    investmentRecord.fixedPercent = 0.1;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });
  }
  else if(parseFloat(req.body['amount']) > 10000 && parseFloat(req.body['amount']) <= 50000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 152);

    investmentRecord.fixedPercent = 0.15;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });
  }
  else if(parseFloat(req.body['amount']) > 50000 && parseFloat(req.body['amount']) <= 100000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 122);

    investmentRecord.fixedPercent = 0.2;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });
  }

  res.status(200).send('(DIRECT CASH) Investment Added with IID : '+investmentRecord.IID);

})

//insert investment details, for admin purpose, when investment done dia sipcoins
app.post('/addInvestmentViaSip',function(req,res){
  console.log(req.body['username']);
  console.log(req.body['username'].substr(0,3));

    var investmentRecord = {
    IID : "I"+req.body['username'].substr(0,3) + moment().format('x'),
    username : req.body['username'],
    email : "",
    amount : parseFloat(req.body['amount']),
    equivalentSipCoins : "",
    dailyPercent : "",
    fixedPercent : "",
    dateOfInvestmentMade : new Date(),
    dateOfInvestmentEnds : "",
    daysLeft : "",
    dailyReturnsDoneTillDate : ""
  }


  AM.setInvestmentRecord(req.body['username'], investmentRecord.IID, function(result){console.log(result);});
  //AM.addInvestmentInCurrentScenario(parseFloat(req.body['amount']), function(result){console.log(result);});

  if(parseFloat(req.body['amount']) >= 100 && parseFloat(req.body['amount']) <= 1000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 243);

    investmentRecord.fixedPercent = 0;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });

  }
  else if(parseFloat(req.body['amount']) > 1000 && parseFloat(req.body['amount']) <= 10000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 213);

    investmentRecord.fixedPercent = 0.1;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });
  }
  else if(parseFloat(req.body['amount']) > 10000 && parseFloat(req.body['amount']) <= 50000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 152);

    investmentRecord.fixedPercent = 0.15;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });
  }
  else if(parseFloat(req.body['amount']) > 50000 && parseFloat(req.body['amount']) <= 100000){
    var endOfInvestment = new Date();
    endOfInvestment.setDate(endOfInvestment.getDate() + 122);

    investmentRecord.fixedPercent = 0.2;
    investmentRecord.dateOfInvestmentEnds = new Date(endOfInvestment);
    AM.getAccountByUsername(req.body['username'], function(o){
      investmentRecord.email=o.email;
      AM.getCNAV(function(CNAV){
        investmentRecord.equivalentSipCoins = parseFloat(req.body['amount'])/CNAV;
        AM.setInvestment(investmentRecord, function(result){console.log(result);});
      })
    });
  }

  res.status(200).send('(VIA SIP) Investment Added with IID : ' + investmentRecord.IID);

})


//get investment details of the user ===========================================
app.get('/getInvestmentDetails',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    AM.getInvestmentDetails(req.session.user.user, function(result){
      res.status(200).send(result);
    })
  }
})

//set CNAV in current scenario collection updation==============================
app.post('/currentCNAV',function(req,res){
  var CNAV = req.body['CNAV'];
  AM.setCNAV(parseFloat(CNAV), function(result){
    console.log(result);
    res.status(200).send("CNAV SET");
  });
})

//get CNAV from the current scenario collection ================================
app.get('/getCNAV',function(req,res){
  AM.getCNAV(function(CNAV){
    res.status(200).send({CNAV:CNAV});
  })
})

//set initial current scenario collection data==================================
app.post('/currentScenario',function(req,res){
  var CNAV = parseFloat(req.body['CNAV']);
  var dollarPool = parseFloat(req.body['dollar']);
  var sipPool = parseFloat(req.body['sipPool']);
  var dailyPercent = parseFloat(req.body['dailyPercent']);
  AM.setCurrentScenario(dollarPool, sipPool, CNAV, dailyPercent, function(result){
    console.log(result);
    res.status(200).send("Current Scenario Initiated");
  });
})

//set daily percent return in currentScenario collection =======================
app.post('/setDailyPercent',function(req,res){
  var dailyPercent = req.body['dailyPercent'];
  AM.setDailyPercent(parseFloat(dailyPercent), function(result){
    console.log(result);
    res.status(200).send("DAILY PERCENT SET");
  });
})

//get daily percent from current Scenario collection ===========================
app.get('/getDailyPercent',function(req,res){
  AM.getDailyPercent((daily)=>{
    res.status(200).send({dailyPercent:daily});
  })
})


//create account on blockchain for the user ====================================
app.post('/createAccount',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    AM.checkAccountCreation(req.session.user.user, function(result){
      if(result == false){
        createAccount(req.session.user.user).then((account)=>{
          account = JSON.parse(account);

          var accountDetails = {
            address : account.address,
            privateKey : account.privateKey
          }

          AM.createAccountOnBlockchain(req.session.user.user, accountDetails, function(result){
            console.log(result);
            //res.session.user.accountOnBlockchain = true;
            AM.getAccountByUsername(req.session.user.user, function(result){
              req.session.user = result;
              res.redirect('/dashboard');
            })
            //res.status(200).send(accountDetails.address);
          });
        })
        .catch((error)=>{
          console.log("## BLOCKCHAIN ACCOUNT CREATION FAILED, SERVER DOWN ##");
        })
      }
      else {
        res.status(200).send("Account Already Present");
      }
    })
  }
})

//get address of blockchain account ============================================
app.get('/getAddressBlockchain',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    AM.getBlockchainAddress(req.session.user.user, function(address){
      qrcode.toDataURL(address, function(err, imageData){
        res.send({
          image : imageData,
          address : address
        })
      })
    })
  }
})



//get the sip balance and ether balance from the blockchain=====================
app.get('/getBalance',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    AM.checkAccountCreation(req.session.user.user, function(result){
      if(result){
        AM.getBlockchainAddress(req.session.user.user, function(address){
          acntBalance(address).then((balances)=>{
            balances = JSON.parse(balances);
            var balanceDetails = {
              sipBalance : balances.tokenBalance,
              etherBalance : balances.etherBalance
            }
            res.status(200).send(balanceDetails);
          })
          .catch((error)=>{
            var balanceDetails = {
              sipBalance : "Blockchain Not Accessible",
              etherBalance : "Blockchain Not Accessible"
            }
            console.log("## BLOCKCHAIN ACCOUNT ACCESS FAILED FOR BALANCE, SERVER DOWN ##");
            res.status(200).send(balanceDetails);
          })
        })
      }
      else {
        var balanceDetails = {
          sipBalance : 0,
          etherBalance : 0
        }
        res.status(200).send(balanceDetails);
      }
    })
  }
})

//get dollar wallet balance for dashboard ======================================
app.get('/getDollarBalance',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    AM.getDollarWalletBalance(req.session.user.user, function(result){
      var balance = {
        result : result
      }
      res.status(200).send(balance);
    })
  }
})

//change password via user profile ============================================
app.post('/changePassword',function(req,res){
  if(req.session.user == null) res.redirect('/');
  else {
    var oldPass = req.body['currPassChange'];
    var newPass = req.body['newPassChange'];
    var confirmNewPass = req.body['confPassChange'];
    var PIN = req.body['pinPassChange'];

    AM.checkPin(req.session.user.email, PIN, function(result){
      if(result){
        if(newPass == confirmNewPass){
          AM.changePassword(req.session.user.user, oldPass, newPass, function(result){
            var passwordChangeResult = {
              result : result
            }
            res.status(200).send(passwordChangeResult);
          })
        }
        else {
          var passwordChangeResult = {
            result : "Password Doesn't Match"
          }
          res.status(200).send(passwordChangeResult);
        }
      }
      else {
        var passwordChangeResult = {
          result : "Check Your PIN and Try Again"
        }
        res.status(200).send(passwordChangeResult);
      }
    })
  }
})

// logged-in user homepage //
	app.get('/dashboard', function(req, res) {

		var btc;
		var sip;
    var eth;
    var browserVerified;

		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{

			// getTokenValue().then((value)=>{
			// 	sip = value;
      //   console.log("## SIP : "+sip);
			// })

      AM.getCNAV(function(CNAV){
        sip = CNAV;
      })

      var currentDate = new Date();

			btcCheck().then((value)=>{
				btc = value;
        console.log("## BTC : "+btc);
        ethCheck().then((value)=>{
          eth = value;
          console.log("## ETH : "+eth);
          AM.getAccountByUsername(req.session.user.user, function(result){
            var lastVerified = new Date(result.lastVerified);
            if((currentDate - lastVerified)/1000 > 880){
              AM.resetBrowserVerification(result.user, function(result){
                console.log(result);
              })
              res.render('dashboard',{
                userDetails : result,
                BTC : btc,
                SIP : sip,
                ETH : eth,
                browserVerified : false
              })
              //res.send({browserVerified : false});
            }
            else {
              res.render('dashboard',{
                userDetails : result,
                BTC : btc,
                SIP : sip,
                ETH : eth,
                browserVerified : true
              })
              //res.send({browserVerified : true});
            }
          })
        })
			})


      // getAccountDetails(req.session.user.user,req.session.user.email).then((userDetails)=>{
			// 		console.log(btc);
			// 		res.render('home', {
			// 			udata : req.session.user,
			// 			accountDetails : userDetails,
			// 			btcValue : btc,
			// 			sipValue : sip
			// 		});
			// 	})
			// .catch((err)=>{
			// 	console.log("Error while fetching dashboard for user : "+req.session.user.user + " :: Error : "+err);
			// 	res.redirect('/dashboard');
			// })


		}
	});


	// route for the verification of the account
	app.get('/verify',function(req,res){
		AM.verifyAccount(req.query.secretKey,function(message){
			console.log("Account with Secret : " + req.query.secretKey + " is  Verified");


			var usd;
			var sip;
			var email=req.query["email"];
			var user=req.query["user"];


			// AM.getAccountBySecret(req.query.secretKey, function(o){
			// 	var string = "Username : " + o.user + "<br>Sponsor Code : "+ o.selfReferralCode + "<br>Sponsor Link : " + serverIP + "/signup?ref=" + o.selfReferralCode;
			// 	//send mail with account details to the user-------------------------------------------------------------------------------------------------------------------------
			// 	var part1='<head> <title> </title> <style> #one{ position: absolute; top:0%; left:0%; height: 60%; width: 40%; } #gatii{ position: absolute; top:26%; left:5%; height: 20%; width: 20%; } #text_div { position: absolute; top: 10%; left: 5%; } #final_regards { position: absolute; top: 50%; left: 5%; } </style> </head> <body> <div id="text_div"> <b>Welcome, to SIPcoin.</b> <br><br>Thank You for registering at SIPcoin.io. Below are your account details:- <br> <br>' + string + '<br><br>';
			// 	var part2='P.S.- Your password security is our utmost priority, only you know it. <br> In case you do not know your password or you have forgotten it, you can visit:- <a href="'+serverIP+'/login">SIPcoin Login Page</a> <br> Select the option "Forgot Password" and proceed. <br></div> <iframe id="gatii" src="https://drive.google.com/file/d/1k99fX9I4HOdhKZA1KwrDflM1W-orCSh0/preview" width="40" height="40"></iframe> <br> <div id="final_regards">'
			// 	var part3='Thank You, <br> <br> Team SIPcoin.io <br> <br><a href="http://support.sipcoin.io">Support Team</a> <br> <br> </div> </body>'
      //
			// 	var mailOptions = {
			// 		from: sipCoinEmailId,
			// 		to: o.email,
			// 		subject: ' SIPCOIN || Account Details',
			// 		html: part1+part2+part3,
			// 	};
      //
			// 	transporter.sendMail(mailOptions, function(error, info){
			// 	 if (error) {
			// 		 console.log("Email Not Send : "+error);
			// 	 } else {
			// 		 console.log('Email sent: ' + info.response);
			// 	 }
			// 	});
			// 	//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
			// })

			btcCheck().then((USD)=>{
				usd = USD;
				//return getTokenValue().then((SIP)=>{return SIP});
			})
			.then((SIP)=>{

				//sip = SIP;
				res.render('accountVerify',{
					BTC : usd
				})
			})
			//res.send("Your Account has been Successfully Verified, You can log in by visiting : ")
		})
	})


  ////////////////////////////////// OLD ICO//////////////////////////////////////

	// buy page ( 2nd page ), checks for account verification as well as coins remaining before allowing to proceed
	// app.get('/buy',function(req,res){
  //
	// 	var btc;
	// 	var sip;
  //
	// 	console.log("inside buy");
	// 	if(req.session.user == null){
	// 		res.redirect('/');
	// 	}else{
	// 		AM.checkAccountVerification(req.session.user.user, function(result){
	// 			if(result) {
	// 				btcCheck().then((value)=>{
	// 					btc = value;
	// 					return getTokenValue().then((value)=>{sip = value; return "render"})
	// 				})
	// 				.then((render)=>{
	// 					AM.getTotalCoinsAvailable(function(coins){
	// 						if(coins < 2000) {
	// 							console.log("coins below threshold")
	// 							res.render('buy',{
	// 								title : "BUY TITLE",
	// 								udata : req.session.user,
	// 								btcValue : btc,
	// 								sipValue : sip,
	// 								buyButton : false
	// 							});
	// 						}
	// 						else {
	// 							console.log("coins available");
	// 							res.render('buy',{
	// 								title : "BUY TITLE",
	// 								udata : req.session.user,
	// 								btcValue : btc,
	// 								sipValue : sip,
	// 								buyButton : true
	// 							});
	// 						}
	// 					})
	// 				})
	// 			}
	// 			else {
	// 				// res.send({"check":"account_not_verfied"});
	// 					res.redirect('/dashboard');
	// 				//res.send('200');
	// 			}
	// 		})
	// 	}
	// });

  ////////////////////////////////// OLD ICO//////////////////////////////////////

// changing the account settings, thus a POST on dashboard
	// app.post('/dashboard', function(req, res){
	// 	if (req.session.user == null){
	// 		res.redirect('/');
	// 	}	else{
	// 		if(req.body['pass'] == "")
	// 		{
	// 			res.status(400).send('enter-password-for-updation')
	// 		}
	// 		else {
	// 			AM.updateAccount({
	// 				id		: req.session.user._id,
	// 				name	: req.body['name'],
	// 				email	: req.body['email'],
	// 				pass	: req.body['pass'],
	// 				country	: req.body['country']
	// 			}, function(e, o){
	// 				if (e){
	// 					res.status(400).send('error-updating-account');
	// 				}	else{
	// 					req.session.user = o;
	// 					// update the user's login cookies if they exists //
	// 					if (req.cookies.user != undefined && req.cookies.pass != undefined){
	// 						res.cookie('user', o.user, { maxAge: 100000 });
	// 						res.cookie('pass', o.pass, { maxAge: 100000 });
	// 					}
	// 					res.status(200).send('ok');
	// 				}
	// 			});
	// 		}
	// 	}
	// });

  ////////////////////////////////// OLD ICO//////////////////////////////////////

	// account details updation page
	// app.get('/account',function(req,res){
	// 	console.log("inside account_change");
	// 	if(req.session.user == null) res.redirect('/login');
	// 	else {
	// 		var usd;
	// 		btcCheck().then((USD)=>{
	// 			usd = USD;
	// 			return getTokenValue().then((SIP)=>{return SIP});
	// 		})
	// 		.then((SIP)=>{
	// 			res.render('account_home',{
	// 				countries : CT,
	// 				udata : req.session.user,
	// 				USD : usd,
	// 				SIP : SIP
	// 			})
	// 		})
	// 	}
	// });

  ////////////////////////////////// OLD ICO//////////////////////////////////////

	//updating account details , therefore a post request
	// app.post('/account', function(req, res){
	// 	if (req.session.user == null){
	// 		res.redirect('/');
	// 	}	else{
	// 		if(req.body['pass'] == "")
	// 		{
	// 			res.status(400).send('enter-password-for-updation')
	// 		}
	// 		else {
	// 			AM.updateAccount({
	// 				id		: req.session.user._id,
	// 				name	: req.body['name'],
	// 				email	: req.body['email'],
	// 				pass	: req.body['pass'],
	// 				country	: req.body['country']
	// 			}, function(e, o){
	// 				if (e){
	// 					res.status(400).send('error-updating-account');
	// 				}	else{
	// 					req.session.user = o;
	// 					// update the user's login cookies if they exists //
	// 					if (req.cookies.user != undefined && req.cookies.pass != undefined){
	// 						res.cookie('user', o.user, { maxAge: 100000 });
	// 						res.cookie('pass', o.pass, { maxAge: 100000 });
	// 					}
	// 					res.status(200).send('ok');
	// 				}
	// 			});
	// 		}
	// 	}
	// });

//logout, change into post
	app.get('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.redirect('/') });
	})


	// creating new accounts //
		app.get('/signup', function(req, res) {

			var btc;
			btcCheck().then((BTC)=>{
				btc = BTC;
				//return getTokenValue().then((SIP)=>{return SIP});
			})
			.then((SIP)=>{
				if(req.query.ref != undefined)
				{
					AM.checkForReferral(req.query.ref,function(result){
						if(result) {
							res.render('signup', {
								title: 'Signup',
								countries : CT,
								USD : btc,
								ref : req.query.ref
							 });
						}
						else {
							res.render('signup', {
								title: 'Signup',
								countries : CT,
								USD : btc,
								ref : ""
							 });
						}
					})
				}
				else {
					res.render('signup', {  title: 'Signup', countries : CT, USD : btc, SIP : SIP, ref : "" });
				}
			})
		});


////////////////////////////////// OLD ICO//////////////////////////////////////

//nodes route for tree generation
	// app.get('/nodes',function(req,res){
  //
	// 	console.log('inside nodes');
	// 	if(req.query.node == undefined)
	// 	{
	// 		console.log('first undefined');
  //
	// 		AM.getSelfReferralCode(req.session.user.user, function(result){
  //
	// 			var data = [{
	// 				"label" : req.session.user.user+' ( Root )',
	// 				"id" : result.selfReferralCode,
	// 				"load_on_demand" : true
	// 			}]
  //
	// 			res.send(data);
	// 		})
	// 	}
	// 	else {
	// 		console.log(req.query.node);
	// 		getNodeInfo(req.query.node).then((result)=>{
	// 			console.log(result);
	// 			if(result.length == 0)
	// 			{
	// 				console.log("no tree after this");
	// 				res.send([]);
	// 			}
	// 			else {
	// 				if(result.length == 2)
	// 				{
	// 					console.log('I am two');
  //
	// 					var data = [{
	// 						"label" : result[0].username+' ('+result[0].link+')',
	// 						"id" : result[0].selfReferralCode,
	// 						"load_on_demand" : true
	// 					},
	// 					{
	// 						"label" : result[1].username+' ('+result[1].link+')',
	// 						"id" : result[1].selfReferralCode,
	// 						"load_on_demand" : true
	// 					}]
  //
	// 					res.send(data);
  //
	// 				}
	// 				else if(result.length == 1)
	// 				{
	// 					console.log('I am one');
	// 					var data = [{
	// 						"label" : result[0].username+' ('+result[0].link+')',
	// 						"id" : result[0].selfReferralCode,
	// 						"load_on_demand" : true
	// 					}]
  //
	// 					res.send(data);
	// 				}
	// 			}
	// 		})
	// 	}
	// })


//signup submission of registration form along with referral
	app.post('/signup', function(req, res){

		if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
			res.status(200).send('Captcha_not_selected');
			console.log("hey captcha not selected");
			// res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
		}else {

	    // req.connection.remoteAddress will provide IP address of connected user.
			var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + captchaSecret + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
			// Hitting GET request to the URL, Google will respond with success or error scenario.
			request(verificationUrl,function(error,response,body) {
				body = JSON.parse(body);
				// Success will be true or false depending upon captcha validation.
				if(body.success !== undefined && !body.success) {
					res.status(200).send('captcha_not_validated');
					// res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
				}else {

          var newAccount = {
          	name 	: req.body['name'],
          	email 	: req.body['emailUser'],
          	user 	: req.body['username'],
            mobile : req.body['mobileUser'],
          	pass	: req.body['passUser'],
            PIN : req.body['pinUser'],
            twoFA : false,
            twoFAsecret : "TWO FA DISABLED",
          	secret : makeid(20),
            browserVerified : false,
            lastVerified : new Date(),
          	accountVerified : false,
            investmentIDs : [],
            accountOnBlockchain : false,
            dollarWallet : 0
          }

          AM.addNewAccount(newAccount, function(e){
            if (e){
              console.log('error in account creation');
              res.status(400).send(e);
            }	else{

              console.log('account created successfully');

              var URLforVerification = serverIP +"/verify?secretKey=" + newAccount.secret + "&veri=" + makeid(5);

              var mailOptions = {
                from: sipCoinEmailId,
                to: newAccount.email,
                subject: 'SIPCOIN || Successful Registration',
                html: part1 +URLforVerification+part2,
              };

              transporter.sendMail(mailOptions,function(error, info){

                if (error) {
                  console.log("Email Not Sent, Error : " + error);
                } else {
                  console.log('Email Sent: ' + info.response);
                }
                res.status(200).send('ok');
              });
            }
          });

				}
		 });
	 }
	});



// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){

				var part1='<head> <title> </title> <style> #one{ position: absolute; top:0%; left:0%; height: 60%; width: 40%; } #gatii{ position: absolute; top:26%; left:5%; height: 20%; width: 20%; } #text_div { position: absolute; top: 10%; left: 5%; } #final_regards { position: absolute; top: 50%; left: 5%; } </style> </head> <body> <div id="text_div"> <b>Welcome, to SIPcoin.</b> <br> <br> Please click on the link below to change your password <br><br>';
		    var part2=' <br><br> <br> P.S.- You are requested to preserve this mail for future references. <br> <br> </div> <iframe id="gatii" src="https://drive.google.com/file/d/1k99fX9I4HOdhKZA1KwrDflM1W-orCSh0/preview" width="40" height="40"></iframe> <br> <br> <div id="final_regards"> Thank You, <br> <br> Team SIPcoin.io <br> <br> <a href="http://support.sipcoin.io">Support Team</a> <br> <br> </div> </body>'

				var link = serverIP + '/reset-password?e='+o.email+'&p='+o.pass;

        console.log(link);

				var mailOptions = {
					from: sipCoinEmailId,
					to: o.email,
					subject: ' SIPCOIN || Password Reset',
					html: part1+link+part2,
				};

				transporter.sendMail(mailOptions, function(error, info){
				 if (error) {
					 console.log(error);
					 console.log("email_not_sent");
					 //response_value="Not Registred Sucessfully";
					 //res.json({"mail_value" : "mail_not_sent"});
					 res.status(400).send('unable to dispatch password reset')
				 } else {
					 console.log('Email sent: ' + info.response);
					 //res.json({"mail_value" : "mail_sent"});
					 //response_value="Registred Sucessfully";
					 res.status(200).send('ok')
				 }
				});
			}
			else{
				res.status(400).send('email-not-found');
			}

	});
});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/login');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
    var nPin = req.body['PIN'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
    AM.checkPin(email, nPin, function(result){
      console.log("email : " +email);
      console.log("PIN : "+nPin);
      if(result){
        console.log("result : "+result);
        AM.updatePassword(email, nPass, function(e, o){
          if (o){
            res.status(200).send('ok');
          }	else{
            res.status(400).send('unable to update password');
          }
        })
      }
      else {
        res.status(200).send("Invalid Pin");
      }
    })
	});

	// view & delete accounts //
  ////////////////////////////////// OLD ICO//////////////////////////////////////

		// app.get('/print', function(req, res) {
		// 	if(req.query.secret == "SIPcoinICO") {																		/// http://sipcoin.io/print?secret=SIPcoinIC        if(req.session.user!=null)
    //     if(req.session.user == null)
    //     {
    //       res.redirect('/');
    //     }else{
    //
    //       console.log('reached Here');
    //       var usd;
    //       var sip;
    //
    //       btcCheck().then((USD)=>{
    //         usd = USD;
    //         return getTokenValue().then((SIP)=>{return SIP});
    //       })
    //       .then((SIP)=>{
    //         sip = SIP;
    //         AM.getAllRecords(function(e, accounts){
    //           res.render('print',{
    //             title : 'Account List',
    //             accts : JSON.stringify(accounts),
    //             SIP:sip,
    //             USD:usd,
    //             udata:req.session.user });
    //         })
    //       })
    //     }
		// 	}
		// 	else {
		// 		res.redirect('/');
		// 	}
		// });

	// app.post('/delete', function(req, res){
	// 	AM.deleteAccount(req.body.id, function(e, obj){
	// 		if (!e){
	// 			res.clearCookie('user');
	// 			res.clearCookie('pass');
	// 			req.session.destroy(function(e){ res.status(200).send('ok'); });
	// 		}	else{
	// 			res.status(400).send('record not found');
	// 		}
	//     });
	// });

  ////////////////////////////////// OLD ICO//////////////////////////////////////

	// app.get('/reset', function(req, res) {
	// 	AM.delAllRecords(function(){
	// 		res.redirect('/print');
	// 	});
	// });


	app.get('/confirmation',function(req,res){

		if(req.session.user!=null)
		{
			res.redirect('/');
		}else{

			var usd;
			var sip;
			var email=req.query["email"];
			var user=req.query["user"];

			btcCheck().then((USD)=>{
				usd = USD;
				return getTokenValue().then((SIP)=>{return SIP});
			})
			.then((SIP)=>{
				sip = SIP;

				AM.getAccountByEmail(email,function(o){
					if(o != null)
					{
						res.render('confirmation',{
							BTC : usd,
							SIP : sip,
							EMAIL:email,
							USER:user
						})
					}
					else {
						res.redirect('/');
					}
				})
			})
		}
	});

  ////////////////////////////////// OLD ICO//////////////////////////////////////

// app.post('/withdrawal',function(req,res){
//
//   if(req.session.user == null) res.redirect('/');
//   else {
//     var TID = (req.session.user.user).substr(0,3) + moment().format('x');
//     var withdrawalAmount=parseFloat(req.body['withdrawalAmount']);
//     var dataCollection = {
//       username : req.session.user.user,
//       email : req.session.user.email,
//       coinDemanded : withdrawalAmount, // get the input box value
//       BTCtoUSD : -1,
//       amountPaid : false,
//       TimeOfPaymentPlaced : moment().format('MMMM Do YYYY, h:mm:ss a'),
//       TransactionID : TID,
//       TimeOfPaymentReceived : "No Payment Done",
//       Transaction_hash : "Not Generated",
//       btcAddress:req.body['btc_wallet_address'],
//       amountToPayBtc:-1
//     }
//
//     //step 1 : get the current btc value
//     btcCheck().then((USD)=>{
//       dataCollection.BTCtoUSD = USD;
//       // get current token value
//       getTokenValue().then((value)=>{
//         console.log(withdrawalAmount);
//         dataCollection.amountToPayBtc=parseFloat(((withdrawalAmount)/dataCollection.BTCtoUSD)-0.0005).toFixed(8);
//
//         AM.withdrawalDocUpdation(dataCollection,function(result){
//           console.log(result);
//           AM.withdrawalCommission(req.session.user.user,-withdrawalAmount,function(result){
//               res.redirect('/withdrawalConfirmation?transaction_id='+TID);
//           });
//         });
//       });
//       //step 2 : request for the btc address
//     })
//   }
// });

////////////////////////////////// OLD ICO//////////////////////////////////////

// app.get('/withdrawalConfirmation',function(req,res){
//
//   console.log(req.query.transaction_id);
//   if(req.session.user == null || req.query.transaction_id == undefined){
//     console.log('inside not');
//     res.redirect('/');
//   }else {
//
//     AM.getwithdrawalData(req.query.transaction_id,function(dataCollection){
//       if(dataCollection == null) {
//         res.redirect('/dashboard');
//       }
//       else{
//         getTokenValue().then((value)=>{
//           res.render('withdrawalConfirmation',{
//             udata : req.session.user,
//             coinDemanded : dataCollection.coinDemanded,
//             address : dataCollection.btcAddress,
//             BTCToPay : dataCollection.amountToPayBtc,
//             SIP : value,
//             currentBTC : dataCollection.BTCtoUSD,
//             TID:dataCollection.TransactionID
//           });
//         })
//       }
//     });
//
//   }
//
//   // res.render('/withdrawalConfirmation',{
//   //
//   // });
// });

////////////////////////////////// OLD ICO//////////////////////////////////////

// app.get('/withdrawal',function(req,res){
//
//   var btc;
//   var sip;
//
//   if (req.session.user == null){
// // if user is not logged-in redirect back to login page //
//     res.redirect('/');
//   }	else{
//
//     getTokenValue().then((value)=>{
//       sip = value;
//     })
//
//     btcCheck().then((value)=>{
//       btc = value;
//     })
//     .then((value)=>{
//       updateTokenValueOfUser(req.session.user.user,req.session.user.email).then((value)=>{
//         return getAccountDetails(req.session.user.user,req.session.user.email).then((details)=>{return details});
//       })
//       .then((userDetails)=>{
//           res.render('withdrawal', {
//             title : 'Control Panel',
//             countries : CT,
//             udata : req.session.user,
//             accountDetails : userDetails,
//             btcValue : btc,
//             sipValue : sip
//           });
//       })
//     })
//     .catch((err)=>{
//       console.log("Error while fetching withdrawal page for user : "+req.session.user.user + " :: Error : "+err);
//       res.redirect('/dashboard');
//     })
//   }
// });

////////////////////////////////// OLD ICO//////////////////////////////////////

//referral invitation link - email
	// app.post('/email_send',function(req,res){
  //
	// 	var part1_invite='<head> <title> </title> <style> #one{ position: absolute; top:0%; left:0%; height: 60%; width: 40%; } #gatii{ position: absolute; top:26%; left:5%; height: 20%; width: 20%; } #text_div { position: absolute; top: 10%; left: 5%; } #final_regards { position: absolute; top: 50%; left: 5%; } </style> </head> <body> <div id="text_div"> <b>Welcome, to SIPcoin. You have been invited by ' +req.session.user.name+ ' to join SIPcoin.io </b> <br> <br> Please click on the link below to join <br><br>';
	// 	var part2_invite=' <br><br> <br> P.S.- You are requested to preserve this mail for future references. <br> <br> </div> <iframe id="gatii" src="https://drive.google.com/file/d/1k99fX9I4HOdhKZA1KwrDflM1W-orCSh0/preview" width="40" height="40"></iframe> <br> <br> <div id="final_regards"> Thank You, <br> <br> Team SIPcoin.io <br> <br> <a href="http://support.sipcoin.io">Support Team</a> <br> <br> </div> </body>'
  //
  //
	// 	var mailOptions = {
	// 		from: sipCoinEmailId,
	// 		to: req.body.value,
	// 		subject: ' SIPCOIN || Referral Invitation Link',
	// 		html: part1_invite +req.body.link+part2_invite,
	// 	};
  //
	// 	transporter.sendMail(mailOptions, function(error, info){
	// 		if (error) {
	// 			console.log(error);
	// 			console.log("email_not_sent");
	// 			res.send({"val":"-1"})
	// 		} else {
	// 			console.log("Email sent")
	// 			res.send({"val":"1"});
	// 		}
	// 	});
  //
	// });

  //=======================================================================================================================================================================
  //=======================================================================================================================================================================
  //================================================================ ADMIN PANEL CONFIGURATIONS ===========================================================================
  //=======================================================================================================================================================================

  ////////////////////////////////// OLD ICO//////////////////////////////////////

//route for addding coins
// app.get('/addAmount',function(req,res){
//
//   if(req.query.secret == "SIPcoinICO")
//   {
//     console.log("hey_there");
//     if(req.query.username)
//     {
//       console.log("hey_there");
//
//       console.log("Conditioned addAmount : Redirected after Post")
//       var username = req.query.username;
//       var tokens = req.query.tokens;
//       var total = req.query.total;
//       var message={
//             'UserName':username,
//             'CoinsUpdation':tokens,
//             'TotalCoins':total,
//             'wrong_value':'none'
//       }
//
//       var usd;
//       var sip;
//
//       btcCheck().then((USD)=>{
//         usd = USD;
//         return getTokenValue().then((SIP)=>{return SIP});
//       })
//       .then((SIP)=>{
//           sip = SIP;
//
//         // AM.getAccountByEmail(email,function(o){
//         //   if(o != null)
//         //   {
//             res.render('admin',{
//               BTC : usd,
//               SIP : sip,
//               udata : req.session.user,
//               message : message
//             })
//           // }
//           // else {
//           //   res.redirect('/');
//           // }
//         })
//     }
//     else {
//
//       var usd;
//       var sip;
//       btcCheck().then((USD)=>{
//         usd = USD;
//         return getTokenValue().then((SIP)=>{return SIP});
//       })
//       .then((SIP)=>{
//           sip = SIP;
//
//         // AM.getAccountByEmail(email,function(o){
//         //   if(o != null)
//         //   {
//
//         var message={
//               'UserName':'none',
//               'CoinsUpdation':'none',
//               'TotalCoins':'none',
//               'wrong_value':'none'
//         }
//
//             res.render('admin',{
//               BTC : usd,
//               SIP : sip,
//               udata : req.session.user,
//               message : message
//             })
//           // }
//           // else {
//           //   res.redirect('/');
//           // }
//         })
//
//       console.log("Simple addAmount : First Load")
//     }
//   }else {
//     res.redirect('/');
//   }
//
// })

////////////////////////////////// OLD ICO//////////////////////////////////////

//add tokens of already registered user
// app.post('/addAmount',function(req,res){
//   var username = req.body['username'];
//   var tokens = parseFloat(req.body['tokens']);
//   var USD = parseFloat(req.body['USD']);
//   var tokenValue = parseFloat(req.body['tokenValue']);
//
//   var TID = (username).substr(0,3) + moment().format('x');
//
//   var dataCollection = {
//     username : username,
//     email : "",
//     demandedTokens : tokens, // get the input box value
//     BTCofTokens : (tokens*tokenValue)/USD, //calculate (tokens*valueOfOneToken/BTCtoUSD)
//     valueOfOneToken : tokenValue,
//     BTCtoUSD : USD,
//     BTCpaid : (tokens*tokenValue)/USD,
//     tokens : tokens,
//     publicAddressWallet : "Direct Payment to Wallet",
//     amountPaid : true,
//     Expired : true,
//     TimeOfPaymentPlaced : moment().format('MMMM Do YYYY, h:mm:ss a'),
//     TransactionID : TID,
//     TimeOfPaymentReceived : moment().format('MMMM Do YYYY, h:mm:ss a'),
//     Transaction_hash : "Offline Payment",
//   }
//
//   var data = {
//     BTCvalue : (tokens*tokenValue)/USD,
//     transaction_hash : "Offline Payment",
//     address : "Direct Payment to Wallet",
//     TID : TID
//   }
//
//   AM.getAccountByUsername(username, function(result){
//     if(result != null)
//     {
//       console.log(result);
//       console.log("ADMIN PANEL : ACCOUNT FOUND FOR THE USERNAME");
//
//       AM.insertResponse(data, function(){console.log(data);})
//       AM.incrementTokens(username, tokens, function(message){
//         console.log("Tokens Updated : " + username + " :: " + tokens);
//         AM.checkForPlanAmtSet(username, function(isSet){
//           var value = parseFloat(tokens)*parseFloat(tokenValue);
//           if(isSet == false){
//             AM.incrementTokensAmtInReferral(username,value , function(message){console.log(message);})
//           }
//           else console.log("plan amount already set");
//         })
//       });
//       AM.incrementTotalCoins(tokens, function(message){console.log(message + " :: " + tokens)});
//       AM.getDataForResend(username, function(account){dataCollection.email=account.email;AM.insertTransaction(dataCollection);});
//
//       res.redirect('/addAmount?secret=SIPcoinICO&username='+username+"&tokens="+tokens+"&total="+(parseFloat(result.tokens)+parseFloat(tokens)));
//
//     }
//     else {
//       console.log("ADMIN PANEL ERROR : ACCOUNT NOT FOUND FOR THE USERNAME");
//       var message={
//             'UserName':'none',
//             'CoinsUpdation':'none',
//             'TotalCoins':'none',
//             'wrong_value':'yes'
//       }
//
//       res.render('admin',{message:message});
//     }
//   })
//
// })

////////////////////////////////// OLD ICO//////////////////////////////////////

// app.get('/pendingWithdrawal',function(req,res){
//   if(req.query.secret == "SIPcoinICO") {																		/// http://sipcoin.io/print?secret=SIPcoinIC        if(req.session.user!=null)
//     if(req.session.user == null)
//     {
//       res.redirect('/');
//     }else{
//
//       var usd;
//       var sip;
//
//       btcCheck().then((USD)=>{
//         usd = USD;
//         return getTokenValue().then((SIP)=>{return SIP});
//       })
//       .then((SIP)=>{
//         sip = SIP;
//         AM.getPendingWithdrawals(function(withdrawalList){
//           res.render('pendingWithdrawals',{
//             title : 'Withdarwal Pending List',
//             listWithdrawal : JSON.stringify(withdrawalList),
//             SIP:sip,
//             USD:usd,
//             udata:req.session.user
//           });
//         })
//       })
//     }
//   }
//   else {
//     res.redirect('/');
//   }
//
// });

////////////////////////////////// OLD ICO//////////////////////////////////////

//post request for transaction hash insertion and completion of withdrawal request
// app.post('/pendingWithdrawal',function(req,res){
//   console.log("pending withdrawals POST request")
//   var TID = req.body['TID'];
//   var transactionHash = req.body['transactionHash'];
//
//   AM.updateWithdrawal(TID, transactionHash, function(message){
//     console.log("Withdrawal Doc :: "+message+" :: for TID : " + TID);
//     res.redirect('/pendingWithdrawal?secret=SIPcoinICO');
//   })
// })

////////////////////////////////// OLD ICO//////////////////////////////////////

//withdrawals list
// app.get('/withdrawals',function(req,res){
//   if(req.query.secret == "SIPcoinICO") {																		/// http://sipcoin.io/print?secret=SIPcoinIC        if(req.session.user!=null)
//     if(req.session.user == null)
//     {
//       res.redirect('/');
//     }else{
//       var usd;
//       var sip;
//
//       btcCheck().then((USD)=>{
//         usd = USD;
//         return getTokenValue().then((SIP)=>{return SIP});
//       })
//       .then((SIP)=>{
//         sip = SIP;
//         AM.getAllWithdrawals(function(o){
//           console.log(o)
//           res.render('allWithdrawals',{
//             title : 'Withdrawals List',
//             withList : JSON.stringify(o),
//             SIP:sip,
//             USD:usd,
//             udata:req.session.user });
//         })
//       })
//     }
//   }
//   else {
//     res.redirect('/');
//   }
// })


//Contact form Email sent without Validation.
//Code by Harsh
//Validate before you deploy.
app.post('/contact-form',function(req,res){

    console.log("Inside Contact Form");

        var name = "<br><h3> User Name: " + req.body["name"];
        var email = "<br><h3> Email: " + req.body["email"];
        var phone = "<br><h3> Phone No: " + req.body["phone"];
        var message = "<br><br><h3> Query: " + req.body["message"];
        var finalMessage = name + email + phone + message;


        console.log("Message : " + message);

        var mailOptions = {
          from: sipCoinEmailId,
          to: sipCoinEmailId,
          subject: 'User Query || SIPCOIN',
          html: finalMessage,
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            console.log("Email_NOT_Sent");
            res.send("ERROR IN SENDING MAIL");
          } else {
            console.log('Email sent: ' + info.response);
            res.redirect('/contact');
          }
        })

});



//redirect to main page if wrong routes tried
app.get('*', function(req, res) { res.redirect('/') });

};
