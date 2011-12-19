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
    
    onMessage: function(mes){
        var e = JSON.parse(mes);
        if (!(e.user in this.colors)) {
            this.colors[e.user] = this.randomColor('hex');
        }
        
        if (e.writing === undefined) {
            $('#output').append('<div><b style="color:' + this.colors[e.user] + '">' + e.user + '</b>: ' + e.message + '</div>');
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
        this.name = prompt('Your name please', $.cookie('name') || '') || 'Anon';
        $.cookie('name', this.name);
    },
    
    send: function(object, str){
        this.socket.send(JSON.stringify(object));
        if(str !== ''){
            $('#output').append(str || object.message);
            $('#output').scrollTop($('#output')[0].scrollHeight);
        }
    },
    
    joined: function(){
        this.send({
            user: this.name,
            message: 'joined the chat'
        }, this.name + ' joined the chat');
    },
    
    setKeyEvent: function(){
        var entry = $('#entry');
        var $this = this;
        entry.keyup(function(e) {
            if (e.keyCode == 13) {
                $this.send({
                    user: $this.name,
                    message: entry.val()
                }, '<div><b>You</b>: ' + entry.val() + '</div>');
                entry.val('');
            }
            
            $this.send({
                user: $this.name,
                writing: (entry.val().trim() !== '')
            }, '');
        });
    },
    
    init: function(){
        this.socket = io.connect('http://basic_chat.serkanyersen.c9.io/');
        this.setSocketEvents();
        this.setName();
        this.joined();
        this.setKeyEvent();
    }
};

$(function() {
    Chat.init();
});