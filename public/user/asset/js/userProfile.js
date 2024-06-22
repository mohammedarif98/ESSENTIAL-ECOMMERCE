
// ------------ user profile image adding button ----------------
    function showSubmitButton() {
        var fileInput = document.getElementById("profilepic");
        var submitButton = document.getElementById("submitButton");
        
        if (fileInput.files.length > 0) {
            submitButton.style.display = "block";
        } else {
            submitButton.style.display = "none";
        }
    }

    function hideProfilePic(){
        var profilePicLabel = document.querySelector('label[for="profilepic"]');
        profilePicLabel.style.display = "none";
    }
    
//----------------  delete address without referesh the  page ---------------


    function deleteAddress(aid){
        $.ajax({
            url: `/deleteAddress?aid=${aid}`,
            method: 'POST',
            success: function (response){
                console.log(response.message);
                $('#aid').hide();
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
            }
        });
    }

