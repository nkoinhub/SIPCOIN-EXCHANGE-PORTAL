
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

function change_password_function(){

    var input_data={currPassChange:$('#currPass').val(),newPassChange:$('#newPass').val(),confPassChange:$('#confPass').val(),pinPassChange:$('#pinSecret').val()};

    if($('#currPass').val()=='' || $('#newPass').val()=='' || $('#confPass').val()=='' || $('#pinSecret').val()=='')
    {
      $('.responseText').html('Please fill all the fields');
      $("#myModal").modal("show");
      return;
    }

    if($('#newPass').val()!=$('#confPass').val())
    {
      $('.responseText').html("New password doesn't Match");
      $("#myModal").modal("show");
      return;
    }

    if($('#newPass').val().length<6)
    {
      $('.responseText').html("Password should be of atleast 6 characters");
      $("#myModal").modal("show");
      return;
    }


    $.ajax({
    type: 'POST',
    crossOrigin:true,
    data: JSON.stringify(input_data),
    contentType: 'application/json',
    url: '/changePassword',
    success: function(result) {

      if(result.result=='New Password Updated')
      {
        $('.modal-title').html('Successfully Changed Password')
        $('.responseText').html(result.result);
        $("#myModal").modal("show");

      }else {
        
        $('.responseText').html(result.result);
        $("#myModal").modal("show");

      }


      $('#currPass').val('');
      $('#newPass').val('');
      $('#confPass').val('');
      $('#pinSecret').val('');

    },error:function(err){
      console.log(error);
    }
  });

}
