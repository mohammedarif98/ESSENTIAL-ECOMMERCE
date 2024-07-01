
//! ------------------- mens product page ---------------------------

function sortProducts(sortOption) {
    $.ajax({
        url: '/mensProductSort',
        type: 'GET',
        data: { sort: sortOption },
        success: function(data) {
            updateProduct(data);
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
        }
    });
}

// Function to update the product list based on data
function updateProduct(data) {
    $('.product__item').each(function(index) {
        $(this).find('.product__item__pic').css('background-image', 'url("/admin/asset/img/product/' + data[index]?.images[0] + '")');
        $(this).find('.product__item__text h6 a').text(data[index]?.productName);
        $(this).find('.product__price span').text('₹ ' + data[index]?.price);
    });
}




//! -------------- product category filtering  --------------


//! -------------- product Size filtering  --------------
