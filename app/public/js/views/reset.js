
$(document).ready(function(){

	var rv = new ResetValidator();

	$('#set-password-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			rv.hideAlert();
			if (rv.validatePassword($('#pass-tf').val()) == false || ($('#pass-tf').val() != $('#confirmPass').val())){
				console.log("pass and confirm not same");
				alert('Password not matching !!!!')
				return false;
			} 	else if($('#pass-tf').val() == $('#confirmPass').val()){
				console.log("pass and confirm same")
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if(responseText=='Invalid Pin')
			{
				alert('Invalid PIN !!!');
			}else {
				rv.showSuccess("Your password has been reset.");
				setTimeout(function(){ window.location.href = '/login'; }, 1000);
			}
		},
		error : function(){
			rv.showAlert("Oops! something went wrong, please try again.");
		}
	});

	$('#set-password').modal('show');
	$('#set-password').on('shown', function(){ $('#pass-tf').focus(); })

});
