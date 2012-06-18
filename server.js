var express = require(__dirname + '/node_modules/express/');
var app = express.createServer(express.static(__dirname + '/public'));
var os = require('os');
var io = require(__dirname + '/node_modules/socket.io/').listen(app);

app.listen(process.env.PORT || 1337);
// List off all sockets
var sockets = {};

// I hope this will match the heroku hostname.
// If you are not going to use heroku just remove this block
// I need this because heroku does not support websockets
// so I have to force socket.io to long-polling

if(os.hostname().match(/\d+\-\d+/)){
    io.configure(function(){
        io.set("transports", ["xhr-polling"]); 
        io.set("polling duration", 10); 
    });
}



io.sockets.on('connection', function(socket) {
    //keep everyone in a list
    sockets[socket.id] = socket; 
    
    var onJoin = function(data){
        var list = []; // Create a participant list
        
        // Go through all sockets and tell them 
        // this new person has joined the chat
        for (var id in sockets) {
            socket.name = data.name; // Keep the entered name in socket data
            data.id = socket.id;     // Also include the socket id in join data
            sockets[id].emit('join', data); // Send join information to sockets
            list.push(sockets[id].name);    // build up the participant list
        }
        
        // Tell everyone to update their participant list
        for (id in sockets) {
            sockets[id].emit('updateParticipantList', {list: list});
        }
    };
    
    // When someone enters a name and joins the chat
    socket.on('join', onJoin);
    
    // Call this whenever someone connects, so they 
    // can see the participant list before joining the chat.
    onJoin({name:''}); 
    
    // When someone sends a message just broadcast it to
    // all participants
    socket.on('message', function(e) {
        // I could have used broadcast method but it sends the message
        // to everyone except me. So I decided to send one by one
        
        // `socket.broadcast.send(e);` would do the same except will not send OP
        for (var id in sockets) {
            if(e.length > 250){ // Some people may send messages too large. it may disturb others
                return this.emit('serverMessage', {message: 'You have exceeded the character length.'});
            }
            sockets[id].send(e);
        }
    });
    
    
    // When someone disconnects
    socket.on('disconnect', function() {
        var list = []; // participant list
        if(!this.name){ return false; } // This socket has never joined the chat so it cannot leave yet.
        for (var id in sockets) {
            // Send everyone that this person is leaving
            sockets[id].emit('leave', {id:this.id, name: this.name});
            // Add everyone in participants list except this leaving person
            if(id !== this.id){
                list.push(sockets[id].name);
            }
        }
        
        // Tell everyone to update their participant
        // list according to this new list
        for (id in sockets) {
            sockets[id].emit('updateParticipantList', {list: list});
        }
        
        // Try to delete leaving person's socket from sockets list
        try {
            delete sockets[this.id];
        }catch (er) {}
    });
});
