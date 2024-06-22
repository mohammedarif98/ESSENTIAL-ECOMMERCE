
//* ------------------------- otp input field -------------------------

const inputs = document.querySelectorAll(".otp-field > input");
const button = document.querySelector(".btn");

window.addEventListener("load", () => inputs[0].focus());
button.setAttribute("disabled", "disabled");

inputs[0].addEventListener("paste", function (event) {
  event.preventDefault();

  const pastedValue = (event.clipboardData || window.clipboardData).getData(
    "text"
  );
  const otpLength = inputs.length;

  for (let i = 0; i < otpLength; i++) {
    if (i < pastedValue.length) {
      inputs[i].value = pastedValue[i];
      inputs[i].removeAttribute("disabled");
      inputs[i].focus;
    } else {
      inputs[i].value = ""; // Clear any remaining inputs
      inputs[i].focus;
    }
  }
});

inputs.forEach((input, index1) => {
  input.addEventListener("keyup", (e) => {
    const currentInput = input;
    const nextInput = input.nextElementSibling;
    const prevInput = input.previousElementSibling;

    if (currentInput.value.length > 1) {
      currentInput.value = "";
      return;
    }

    if (
      nextInput &&
      nextInput.hasAttribute("disabled") && currentInput.value !== "") {
      nextInput.removeAttribute("disabled");
      nextInput.focus();
    }

    if (e.key === "Backspace") {
      inputs.forEach((input, index2) => {
        if (index1 <= index2 && prevInput) {
          input.setAttribute("disabled", true);
          input.value = "";
          prevInput.focus();
        }
      });
    }

    button.classList.remove("active");
    button.setAttribute("disabled", "disabled");

    const inputsNo = inputs.length;
    if (!inputs[inputsNo - 1].disabled && inputs[inputsNo - 1].value !== "") {
      button.classList.add("active");
      button.removeAttribute("disabled");

      return;
    }
  });
});


//* ------------------------- resent OTP -------------------------


// Function to resend OTP via AJAX
function resendOtp(){
  $.ajax({
      method: 'POST',
      url: '/resendOTP', // Route for resending OTP
      success: function(response){
        // window.location.href = '/userOTPverification';              // Handle successful response (redirect)
          console.log("OTP resent successfully ---");                      // If OTP is resent successfully
      },
      error: function(xhr, status, error) {
          console.error("Error resending OTP:", error);
          // $("#otpError").text("Error resending OTP: ",error);       // display the error message
          // $('#resendOTPBtn').prop('disabled', false);                 // Enable the button after error in OTP resend   
      }
  });
}


//* ------------- resent otp button ------------
$(document).ready(function(){
  // Hide the Resend OTP button initially
  $('#resendOTPBtn').hide();
  // Handle click event for Resend OTP button
  $('#resendOTPBtn').on('click', function(){
      // Disable the button
      $(this).prop('disabled', true);
      // Start the countdown timer
      startCountdownTimer();
      // Call the resendOTP function (if defined)
      if (typeof resendOtp === 'function') {
          resendOtp();
      }
  });

//*------------- Function to start the countdown timer -------------
  function startCountdownTimer() {
      var countdown = 20; // Initial countdown time in seconds
      // Update countdown every second
      var timer = setInterval(function() {
          // Update button text with remaining time 
          $('#resendOTPBtn').text(countdown + 's');
          countdown--;
          // If countdown reaches 0, enable button and clear interval
          if (countdown < 0) {
              $('#resendOTPBtn').prop('disabled', false).text('Resend OTP');
              clearInterval(timer);
          }
      }, 1000); // Update timer every second (1000 milliseconds)
  }

  // Show the Resend OTP button after 1 minute
  setTimeout(function() {
      $('#resendOTPBtn').show();
  }, 60000); // 60000 milliseconds = 1 minute

});

//* -------------- resent otp timer in p tag  -----------------
  // Set the initial time in seconds
  let timeLeft = 60;
  // Function to update the timer
  function updateTimer() {
      // Display the remaining time in the paragraph
      document.getElementById('OtpTimer').textContent = `Please wait ${timeLeft} seconds for resending OTP button`;
      // Decrease time left by 1 second
      timeLeft--;

      // If timeLeft becomes 0, stop the timer and show appropriate message
      if (timeLeft === 0) {
          clearInterval(timerInterval);
          document.getElementById('OtpTimer').textContent = "You can now resend OTP button";
          // Enable the resend OTP button if needed
          document.getElementById('resendOTPBtn').removeAttribute('disabled');
      }
  }
  // Call updateTimer every second
  const timerInterval = setInterval(updateTimer, 1000);