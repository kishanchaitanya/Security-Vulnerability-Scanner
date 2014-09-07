function submitUrl() {
    var url = $('#url').val();
    console.log(url);
    $.post('/eye/scanurl',  {'url':url}).done(
    function (data){
        var redirectUrl = '/eye/status/'  + data.id;
        location.href = redirectUrl;
    });
}

function updateStausText() {
   
}