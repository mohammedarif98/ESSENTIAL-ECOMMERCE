
//! ------------------- mens product page ---------------------------

// -------------- sort feature product  --------------

function sortProducts(sortOption) {
    // Check if the checkbox is checked
    var isChecked = $('#' + sortOption).is(":checked");

    // If checkbox is checked, perform sorting
    if (isChecked) {
        $.ajax({
            url: '/productSort', 
            type: 'GET',
            data: { sort: sortOption },
            success: function(data) {
                updateProduct(data);
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
    } else {
        // If checkbox is not checked, revert back to original order
        $.ajax({
            url: '/productSort', 
            type: 'GET',
            data: { sort: "default" }, // Pass a parameter to indicate reverting to default order
            success: function(data) {
                updateProduct(data);
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
    }
}

// Function to update the product list based on data
function updateProduct(data) {
    $('.product__item').each(function(index) {
        $(this).find('.product__item__pic').css('background-image', 'url("/admin/asset/img/product/' + data[index]?.images[0] + '")');
        $(this).find('.product__item__text h6 a').text(data[index]?.productName);
        $(this).find('.product__price span').text('₹ ' + data[index]?.price);
    });
}


// -------------- product category filtering  --------------


// -------------- product Size filtering  --------------
