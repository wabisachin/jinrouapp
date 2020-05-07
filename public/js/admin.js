'use strict';

$(function() {
    
    let socket = io.connect();
    
    $('#submit').on('click', function() {
        console.log("pushed")
        let password = $('#password').val();
        socket.emit("reset_server_by_admin", password);
    })
    
    socket.on("server_reseted!", () => {
        window.location.replace(`/?reason=reboot`);
    })
    
    socket.on("mismatch_password", () => {
        window.location.replace('/admin');
    })
})