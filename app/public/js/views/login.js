
$(document).ready(function(){

	var lv = new LoginValidator();
	var lc = new LoginController();

// main login form //

	$('#login').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (lv.validateForm() == false){
				return false;
			} 	else{
			// append 'remember-me' option to formData to write local cookie //
				formData.push({name:'remember-me', value:$('.button-rememember-me-glyph').hasClass('glyphicon-ok')});
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if(responseText=='Captcha_not_selected')
			{
				$('.modal-form-errors .modal-body p').text('Please correct the following problems :');
				var ul = $('.modal-form-errors .modal-body ul');
					ul.empty();
					ul.append('<li> Captcha Not Selected </li>')
				//
				// for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
				// this.alert.modal('show');
				//
				//
				// $('.modal-form-errors .modal-body p').text('Captch Not Selected');
				$('.modal-form-errors').modal('show');
				console.log("Captha not selected");

			}

			if(responseText=='captcha_not_validated')
			{
				$('.modal-form-errors .modal-body p').text('Please correct the following problems :');
				var ul = $('.modal-form-errors .modal-body ul');
					ul.empty();
					ul.append('<li> Captcha Not Validated <br> Please try again after some time </li>')

				$('.modal-form-errors').modal('show');

				// $('.modal-form-errors .modal-body p').text('Captch Not Validated.<br> Try Again After some time');
				// $('.modal-form-errors').modal('show');
				console.log('captcha not validated ');
				grecaptcha.reset();
			}

			if(responseText=='open_2fa')
			{
				window.location.href = '/twofa';
			}

			if(responseText=='open_dasboard')
			{
				window.location.href = '/dashboard';
			}

			if(responseText=='open_active_mail_jade')
			{
				window.location.href = '/ActiveMail';
			}

			// if (status == 'success') window.location.href = '/dashboard';
		},
		error : function(e){
			lv.showLoginError('Login Failure', 'Please check your username and/or password');
			grecaptcha.reset();

		}
	});
	$('#user-tf').focus();

// login retrieval form via email //

	var ev = new EmailValidator();

	$('#get-credentials-form').ajaxForm({
		url: '/lost-password',
		beforeSubmit : function(formData, jqForm, options){
			if (ev.validateEmail($('#email-tf').val())){
				ev.hideEmailAlert();
				return true;
			}	else{
				ev.showEmailAlert("<b>Error!</b> Please enter a valid email address");
				return false;
			}
		},
		success	: function(responseText, status, xhr, $form){
			$('#cancel').html('OK');
			$('#retrieve-password-submit').hide();
			ev.showEmailSuccess("Check your email on how to reset your password.");
		},
		error : function(e){
			if (e.responseText == 'email-not-found'){
				ev.showEmailAlert("Email not found. Are you sure you entered it correctly?");
			}	else{
				$('#cancel').html('OK');
				$('#retrieve-password-submit').hide();
				ev.showEmailAlert("Sorry. There was a problem, please try again later.");
			}
		}
	});

});
