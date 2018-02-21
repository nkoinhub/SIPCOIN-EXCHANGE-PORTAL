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
