var Chat = {
    name: '',
    colors: {},
    socket: undefined,
    
    randomColor: function (format) {
        var rint = Math.round(0xffffff * Math.random());
        switch (format) {
        case 'hex':
            return ('#0' + rint.toString(16)).replace(/^#0([0-9a-f]{6})$/i, '#$1');
        case 'rgb':
            return 'rgb(' + (rint >> 16) + ',' + (rint >> 8 & 255) + ',' + (rint & 255) + ')';
        default:
            return rint;
        }
    },
    
    fixUserName: function(username){
        return username.replace(/\W/gim, '_');
    },
    
    getUserColor: function(user){
        if (!(user in this.colors)) {
            this.colors[user] = this.randomColor('hex');
        }
        return this.colors[user];
    },
    
    onMessage: function(mes){
        var e = JSON.parse(mes);
        
        
        if (e.writing === undefined) {
            $('#output').append('<div><b style="color:' + this.getUserColor(e.user) + '">' + e.user + '</b>: <pre>' + this.escapeHTML(e.message) + '</pre></div>');
        } else if (e.writing === true) {
            $('#ww-' + this.fixUserName(e.user)).remove();
            $('#writing').append('<div id="ww-' + this.fixUserName(e.user) + '">' + e.user + ' is writing...</div>');
        } else if (e.writing === false) {
            $('#ww-' + this.fixUserName(e.user)).remove();
        } else {
            $('#output').append(mes);
        }
        
        $('#output').scrollTop($('#output')[0].scrollHeight);
    },
    
    setSocketEvents: function(){
        this.socket.on('message', $.proxy(this.onMessage, this));
    },
    
    setName: function(){
        this.name = this.escapeHTML(prompt('Your name please', $.cookie('name') || '') || 'Anon');
        $.cookie('name', this.name);
    },
    
    send: function(object, str){
        this.socket.send(JSON.stringify(object));
        if(str !== ''){
            $('#output').append(str || object.message);
            $('#output').scrollTop($('#output')[0].scrollHeight);
        } 
    },
    
    escapeHTML: function(html){
        return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    
    joined: function(){
        this.socket.emit('join',{
            name: this.name
        });
    },
    
    setKeyEvent: function(){
        var entry = $('#entry');
        var $this = this;
        entry.keyup(function(e) {
            if (e.keyCode == 13) {
                $this.send({
                    user: $this.name,
                    message: entry.val()
                }, '<div><b style="color:'+$this.getUserColor($this.name)+'">'+$this.name+'</b>: <pre>' + $this.escapeHTML(entry.val()) + '</pre></div>');
                entry.val('');
            }
            
            $this.send({
                user: $this.name,
                writing: (entry.val().trim() !== '')
            }, '');
        });
    },
    
    participants: function(){
        var $this = this;
        this.socket.on('join', function(data){
            $('#output').append('<div>' + data.name + ' has joined the chat</div>');
        });
        
        this.socket.on('leave', function(data){
            $('#output').append('<div>' + data.name + ' has left the chat</div>');
        });
        
        this.socket.on('updateParticipantList', function(data){
            $('#participants').html('');
            for(var i in data.list){
                $('#participants').append('<li style="color:'+$this.getUserColor(data.list[i])+'" >'+data.list[i]+'</li>');
            }
        });
        
    },
    
    init: function(){
        this.socket = io.connect('http://basic_chat.serkanyersen.c9.io/');
        this.setSocketEvents();
        this.setName();
        this.joined();
        this.participants();
        this.setKeyEvent();
    }
};

$(function() {
    Chat.init();
});