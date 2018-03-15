
 module.exports = function(server){
    const io = require('socket.io')(server);

    io.on("connection", function(socket){
        console.log("new connection!!");
        console.log('Socket initiated!');

        socket.on("setname",function(data){
            socket.broadcast.emit("newuser",data);
            socket.username = data.username; console.log("new connection!!");
        })
    
        socket.on("sendmessage", function(data){
            socket.broadcast.emit("receivemessage",data); console.log("new connection!!");
        })
    
        socket.on("disconnect", function(socket){
            socket.broadcast.emit("passuser",{username:socket.username}); console.log("new connection!!");
        })
    
        socket.on("joinrequest", function(socket){
            
        })
    
        socket.on("joinresponse", function(socket){
    
        })
    
        socket.on("start", function(socket){
    
        })
    
        socket.on("draw", function(socket){
    
        })
    })

    
}
