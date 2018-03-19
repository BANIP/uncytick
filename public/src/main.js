var Socket = /** @class */ (function () {
    function Socket(url, port, username) {
        if (username === void 0) { username = Math.random().toString(); }
        this.username = username;
        var socketUrl = new URL(url);
        socketUrl.port = port;
        console.log(socketUrl.href);
        this.socket = io("http://localhost:8080/uncytt");
        this.defineJoin();
        this.bindSocketListener();
    }
    Socket.prototype.defineJoin = function () {
        this.socket.emit("join", { username: this.username });
    };
    Socket.prototype.bindSocketListener = function () {
        var _this = this;
        var socket = this.socket;
        socket.on("newuser", function (_a) {
            var username = _a.username;
            Chat.server(username + "\uB2D8\uC774 \uB4E4\uC5B4\uC654\uC5B4\uC694.");
        });
        socket.on("passuser", function (_a) {
            var username = _a.username;
            Chat.server(username + "\uB2D8\uC774 \uB098\uAC14\uC5B4\uC694.");
        });
        socket.on("getuserlist", function (data) {
            var buttonClickListener = function ($li, username, id) {
                socket.emit("requestjoin", { targetId: id });
                $li.closest("ul").find("li").css("color", "initial");
                $li.css("color", "red");
                Chat.server(username + "에게 게임신청을 했어요.");
            };
            var $lis = data
                .map(function (userData) {
                if (userData == null)
                    return;
                var username = userData.username, id = userData.id;
                var $li = $("<li />")
                    .text(username)
                    .data("id", id);
                if (username != _this.username) {
                    var $button = $("<button>").text("게임 신청");
                    $button.click(function () { return buttonClickListener($li, username, id); });
                    $li.append($button);
                }
                return $li;
            });
            $("#userlist").html($lis);
        });
        socket.on("servermessage", function (data) {
            Chat.server(data.message);
        });
        socket.on("receivemessage", function (data) {
            Chat.client(data.username, data.message);
        });
        socket.on("gamestart", function (_a) {
            var enemyUsername = _a.enemyUsername;
            var canStartGame = _this.game == undefined || _this.game.isGameEnd == true;
            if (canStartGame) {
                _this.game = new Game(socket, _this.username, enemyUsername);
            }
            else {
                Chat.server(_this.game.enemyUsername + "\uACFC\uC758 \uAC8C\uC784\uC774 \uC544\uC9C1 \uB05D\uB098\uC9C0 \uC54A\uC558\uC5B4\uC694.");
            }
        });
    };
    return Socket;
}());
var Chat = /** @class */ (function () {
    function Chat() {
    }
    Chat.server = function (message) {
        var $li = $("<li></li>").text(message);
        $("#messages").append($li);
        Chat.moveBottom();
    };
    Chat.client = function (username, message) {
        var $li = $("\n            <li>\n                <a class='username' /> : <a class='message'>\n            </li>");
        $li.find(".username").text(username);
        $li.find(".message").text(message);
        $("#messages").append($li);
        Chat.moveBottom();
    };
    Chat.moveBottom = function () {
        $("#messages").scrollTop($("#messages").height());
    };
    return Chat;
}());
var Game = /** @class */ (function () {
    function Game(socket, username, ememyusername) {
        this.socket = socket;
        this.isGameEnd = false;
        this.enemyUsername = ememyusername;
        Chat.server(ememyusername + "과의 게임이 시작되었어요!");
        var bindClick = function ($target, axis) {
            var x = axis[0], y = axis[1];
            $target.text("H").click(function () {
                console.log([x, y]);
                socket.emit("draw", {
                    axis: [x, y]
                });
            });
        };
        $("#gamepan").slideDown().find("> div")
            .each(function (x) {
            $(this).find("> a").each(function (y) { bindClick($(this), [x, y]); });
        });
        this.bindSocketListener();
    }
    Game.prototype.bindSocketListener = function () {
        var socket = this.socket;
        socket.on("renewgamepan", function (_a) {
            var gamepan = _a.gamepan;
            gamepan.forEach(function (hori, x) {
                return hori.forEach(function (cell, y) {
                    var textType = {
                        "1": "O",
                        "0": "H",
                        "-1": "X",
                    };
                    var text = textType[cell];
                    $("#gamepan").find("div").eq(x).find("a").eq(y)
                        .data("x", x).data("y", y)
                        .text(text);
                    console.log(x, y);
                });
            });
        });
        socket.on("gameend", function (_a) {
            var state = _a.state;
            var hideGamePan = function () { return $("#gamepan").slideUp(); };
            var messageType = {
                "win": "게임 승리!! 축하드려요!",
                "lose": "윽... 저버렸네요...",
                "draw": "비겼어요!",
            };
            var endMessage = messageType[state];
            setTimeout(hideGamePan, 3000);
            this.removesocketListener();
        });
    };
    Game.prototype.removesocketListener = function () {
        $("#gamepan").find("a").off("click");
        this.socket.off("gameend").off("renewgamepan");
    };
    return Game;
}());
var thisSocket = new Socket(window.location.href, window.location.port);
$("#chat").keypress(function (e) {
    if (e.key === "Enter" && $(this).val() != "") {
        thisSocket.socket.emit("sendmessage", { message: $(this).val() });
        $(this).val("");
    }
});
