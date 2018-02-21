
function enable_twofa_function()
{
  $.ajax({
    type: 'GET',
    crossOrigin:true,
    contentType: 'application/json',
    url: '/enable2FA',
    success: function(result) {
      document.getElementById('qr_image').setAttribute('src', result.image);
      $('.secret_class').html(result.secret);
      $('.afterGeneration').css('display','block');
      $('.generateSecret').css('display','none');
    },error:function(err){

    }
  });
}

function start_twofa_function(){

    var input_data={twoFAcode:$('#authCodeEnable').val()};

    $.ajax({
    type: 'POST',
    crossOrigin:true,
    data: JSON.stringify(input_data),
    contentType: 'application/json',
    url: '/start2FA',
    success: function(result) {
        window.location.href = '/user';
    },error:function(err){

    }
  });

}

function disable2fa_function(){

  console.log('hey');
  var input_data={twoFAcode:$('#authCodeDisable').val()};

  $.ajax({
  type: 'POST',
  crossOrigin:true,
  data: JSON.stringify(input_data),
  contentType: 'application/json',
  url: '/disable2FA',
  success: function(result) {
      console.log(result);
      window.location.href = '/user';
  },error:function(err){

  }
});

}
