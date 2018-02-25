function createBlockchainAccount() {
  $.ajax({
    type : 'POST',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/createAccount',
    success : function(result){
      console.log(result);
      window.location.href = '/dashboard'
      if(result == "Account Already Present"){
        window.location.href = '/dashboard'
      }

    },error : function(err){

    }
  })
}

function getAddr(){
  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getAddressBlockchain',
    success : function(result){
      console.log(result);
      document.getElementById('ethAddressImage').setAttribute('src', result.image);
      $('.eth_address_text').html(result.address);
      if(result == "Account Already Present"){
        window.location.href = '/dashboard'
      }

    },error : function(err){

    }
  })
}

function get_sip_wallet(){

  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getBalance',
    success : function(result){
      $('.sipWalletValue').html(result.sipBalance+' SIP');
      $('.sipWalletButton').remove();
    },error : function(err){
      console.log('Error');
    }
  })

}

function get_eth_wallet(){

  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getBalance',
    success : function(result){
      $('.ethWalletValue').html(result.etherBalance+' ETH');
      $('.ethWalletButton').remove();
    },error : function(err){
      console.log('Error');
    }
  })

}

function get_dollar_Wallet(){

  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getDollarBalance',
    success : function(result){
      $('.dollarWalletValue').html('$ '+result.result);
      $('.dollarWalletValue_exchange').html('Your Dollar Wallet Balance is $ '+result.result);

      $("#amountinDollar").attr({
      "max" : result.result,
      });

    },error : function(err){
      console.log('Error');
    }
  })

}

function get_all_balance(){

  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getBalance',
    success : function(result){

      if(result.sipBalance=='Blockchain Not Accessible')
      {

        $('.responseText').html('Blockhain Not Accessible');
        $("#myModal1").modal("show");
      }else {

        $('.sipWalletValue_trans').html(result.sipBalance+' SIP');
        $('.ethWalletValue_trans').html(result.etherBalance+' ETH');
        $('.sipWalletValue_exchange').html('Your SIP Wallet Balance is ' +result.sipBalance+' SIP');
        $('.ethWalletValue_exchange').html('Your ETH Wallet Balance is ' +result.etherBalance+' ETH');
        $('.getSIPBalanceForInvest').html('Your SIP Wallet Balance is ' +result.sipBalance+' SIP');

        $('#sip_value_ReinvestHidden').attr({
          "max":result.sipBalance
        });

        $("#amountInSIP").attr({
        "max" : result.sipBalance,
        });

        $("#amountINETH").attr({
        "max" : result.etherBalance,
        });

        $('#sip_value_Reinvest').attr({
        "max" : result.sipBalance,
        });
      }

      // $('#amountETH').attr({
      //   "max" : ((result.etherBalance*40)/100).toFixed(6),
      // });

    },error : function(err){
      console.log('Error');
    }
  })

}


function send_ether_to_eher(){

  console.log($('#pinETH').val());
  var input_data={destination:$('#addressETH').val(),dollarInputTransfer:$('#amountETH').val(),pinValue:$('#pinETH').val(),twoFAcode:$('#faETHValue').val(),type:'4'};

  if($('#addressETH').val()=='' || $('#amountETH').val()=='' || $('#pinETH').val()=='')
  {
    $('.responseText').html('Please fill all the fields');
    $("#myModal1").modal("show");
    return;
  }

  if($('#amountETH').attr('max')<$('#amountETH').val())
  {
    $('.responseText').html('Only 40% of the ETH balance can be Transfferred ');
    $("#myModal1").modal("show");
    return;
  }

  if($('#amountETH').val()<=0)
  {
    $('.responseText').html('Please enter proper amount');
    $("#myModal1").modal("show");
    return;

  }

  $.ajax({
    type : 'POST',
    crossOrigin : true,
    contentType : 'application/json',
    data: JSON.stringify(input_data),
    url : '/placeEtherTransaction',
    success : function(result){

      console.log(result);
      if(result.result=='wrong_code')
      {
        $('.responseText').html('Two factor Authentication Failed');
        $("#myModal1").modal("show");
      }else
      if(result.result=='PIN Wrong') {
        $('.responseText').html('Please enter correct PIN ');
        $("#myModal1").modal("show");
      }else
      if(result.result=='BlockchainAccountDoesNotExist'){
        $('.responseText').html('Please create Blockchain Address First ');
        $("#myModal1").modal("show");
      }else
      if(result.result=='TID'){
        window.location.href = '/transactionRequest?TID='+result.TID;
      }else
      if(result.result==false) {
        $('.responseText').html('Browser Verification Session Expired. Refreshing your page in 3 seconds ....');
        $("#myModal1").modal("show");

        setTimeout(function(){
          window.location.href = '/dashboard';
        },3000);

      }

    },error : function(err){
      console.log('transaction error ether')
    }
  })
}

function get_current_Investement(){

  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getInvestmentDetails',
    success : function(result){
      $('.yourInvestValue').html('$ '+result.amount+ ' ( ' + result.SIPcoins +' SIP ) ');

    },error : function(err){
      console.log('Error');
    }
  })

}

function get_current_value_investement(){

  $.ajax({
    type : 'GET',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/getTotalCurrent',
    success : function(result){
      $('.currentValueInvestValue').html('$ '+result.result);
    },error : function(err){
      console.log('Error');
    }
  })

}


function get_verfication_link()
{
  $.ajax({
    type : 'POST',
    crossOrigin : true,
    contentType : 'application/json',
    url : '/sendVerification',
    success : function(result){

      if(result.result==true)
      {
        $('.responseText').html('Please check your email for the Browser Verfication Link');
        $("#myModal1").modal("show");
        $('.textModalHeader').html('Browser Verficaion Mail Sent Successfully');
      }else {

        $('.responseText').html('Sorry !!! Mail could not be sent. Try again after some time.');
        $("#myModal1").modal("show");

      }
    },error : function(err){
      console.log('Error');
    }
  })
}
