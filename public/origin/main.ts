declare const io: Function;


interface IOStruct{
    emit(eventType: string,callback:object): void;
    on(eventType: string,data: Function): IOStruct;
    off(eventType: string,data?: Function): IOStruct;
}

class Socket{
    public socket :IOStruct;
    public game: Game;
    constructor(url: string,private username: any = Math.random().toString() ){
        this.socket = io(url) as any;
        this.defineJoin();
        this.bindSocketListener();
    }

    defineJoin(){
        this.socket.emit("join",{ username: this.username });
    }

    bindSocketListener(){
        const socket :IOStruct = this.socket;

        socket.on("newuser",({ username }: { username: string }) => {
            Chat.server(`${username}님이 들어왔어요.`);
        });

        socket.on("passuser",({ username }: { username: string }) => {
            Chat.server(`${username}님이 나갔어요.`);
        });

        socket.on("getuserlist",(data) => {
            const buttonClickListener = ($li:JQuery,username: string, id: string) => {
                socket.emit("requestjoin",{ targetId : id });
                $(".activePull").removeClass();
                $li.addClass("activePull");
                Chat.server(username + "에게 게임신청을 했어요." );
            }
            const $lis = data
                .map((userData) => {
                    if(userData == null) return;
                    const {username, id} : {username: string, id: string} = userData;
                    const $li = $("<li />")
                        .text(username)
                        .data("id",id);

                    if(username != this.username){
                        const $button = $("<button>").text("게임 신청").addClass("btn-request");
                        $button.click(() => buttonClickListener($li, username, id));
                        $li.append($button);
                    }
                    return $li
                });
            $("#userlist").html($lis);
        });

        socket.on("servermessage",function(data){
            Chat.server(data.message);
        })

        socket.on("receivemessage",function(data){
            Chat.client(data.username,data.message);
        })

        socket.on("gamestart",({enemyUsername} : {enemyUsername: string}) => {
            const canStartGame: boolean = this.game == undefined || this.game.isGameEnd == true;
            if( canStartGame ){
                this.game = new Game(socket, this.username, enemyUsername);
            } else {
                Chat.server(`${this.game.enemyUsername}과의 게임이 아직 끝나지 않았어요.`);
            }            
        })
    }
}

class Chat{
    static server(message :string): void{
        const $li  = $("<li></li>").text(message)
        $("#messages").append( $li );
        Chat.moveBottom();
    }

    static client(username: string, message: string): void{
        const $li = $(`
            <li>
                <span class='username' /> : <span class='message'>
            </li>`);
        $li.find(".username").text(username);
        $li.find(".message").text(message);
        $("#messages").append($li);
        Chat.moveBottom();
    }

    private static moveBottom(){
        $("#messages").scrollTop( $("#messages")[0].scrollHeight )
    }
}

class Game{
    
    public isGameEnd: boolean = false;
    public enemyUsername: string;


    constructor(private socket :IOStruct,username: string, ememyusername :string){
        this.enemyUsername = ememyusername;
        Chat.server(ememyusername + "과의 게임이 시작되었어요!" );
        $(".btn-request").fadeOut();
        const bindClick = ($target :JQuery,axis: [number,number]) => {
            const [x,y] = axis;
            $target.text("H").click(() => {
                console.log([x,y])
                socket.emit("draw",{
                    axis: [x,y]
                });
            });
        }
        
        $("#gamepan").slideDown().find("> div")
            .each(function(x){
                $(this).find("> a").each(function(y){ bindClick($(this), [x,y]) });
            });

        this.bindSocketListener();
    }

    private bindSocketListener(){
        const socket :IOStruct = this.socket;
        const self: Game = this;
        socket.on("renewgamepan",function({ gamepan } : { gamepan : number[][]}){
            gamepan.forEach( (hori:number[] ,x : number) => 
                hori.forEach( (cell:number, y:number) => {
                    const textType = {
                        "1": "O",
                        "0": "H",
                        "-1": "X",
                    };
                    let text: String = textType[cell];
        
                    $("#gamepan").find("div").eq(x).find("a").eq(y)
                        .data("x",x).data("y",y)
                        .text(text as any);
                    console.log(x,y)
                })
            );            
        });
        
        socket.on("gameend",function({state} : {state: string}){
            const hideGamePan = () => $("#gamepan").slideUp();
            const messageType = {
                "win":"게임 승리!! 축하드려요!",
                "lose":"윽... 져버렸네요...",
                "draw":"비겼어요!",
            }
            const endMessage = messageType[state];
            Chat.server(endMessage);

            $(".btn-request").fadeIn();
            setTimeout(hideGamePan,3000);
            self.isGameEnd = true;
            self.removesocketListener();
        });
        
    }

    private removesocketListener(){
        
        $("#gamepan").find("a").off("click");
        this.socket.off("gameend").off("renewgamepan");
    }
}


const thisSocket: Socket = new Socket(window.location.href);

$("#chat").keypress(function(e){
    if(e.key === "Enter" && $(this).val() != ""){
        thisSocket.socket.emit("sendmessage",{ message : $(this).val() });
        $(this).val("")
    }
})


