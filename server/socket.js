 const uniqid = require("uniqid");

 module.exports = function(server){
    const io = require('socket.io')(server, { wsEngine: 'ws' }).of("uncytt")
    let clients = {};
    io.on("connection", function(socket){

        console.log('Socket initiated!');

        socket.on("join",function({ username }){
            console.log("new connection!!");
            if(!username) return;
            delete socket.enemy;
            const client = {
                id:socket.id,
                username,

            }

            clients[socket.id] = client;
            socket.username = username;

            socket.broadcast.emit("newuser",client);
            io.emit("getuserlist",Object.values(clients));
        });
    
        socket.on("disconnect", function(data){
            delete clients[socket.id];
            socket.broadcast.emit("passuser",{
                id:socket.id,
                username: socket.username
            });
            io.emit("getuserlist",Object.values(clients));
        });

        socket.on("sendmessage", function(data){
            io.emit("receivemessage",{
                message:data.message,
                username:socket.username
            });
            
        });
    
        socket.on("requestjoin", function(data){
            const { targetId } = data;
            const target = io.to(targetId)
            socket.on("sendmessage",function(){ console.log(1 ) });
            clients[socket.id]["requestPull"] = targetId;
            if(clients[targetId]["requestPull"] === socket.id && !target.enemy){
                new Game(socket,target);
            } else {
                target.emit("servermessage",{
                    message: `${socket.username}이 게임 신청을 보냈습니다. 이 유저에게 게임 신청을 보내면 게임이 시작됩니다.`
                });
            }

        });

        class Game{
            constructor(user1, user2){
                this.user1 = user1;
                this.user2 = user2;
                this.users = [user1,user2];
                this.user1.enemy = user2;
                this.user2.enemy = user1;

                this.gamepan = [[0,0,0],[0,0,0],[0,0,0]];


                this.initRoom();
                this.toUsers( user => {
                    this.initListener(user);
                });
                this.initTurn();
                this.turnNext();
            }

            initRoom(){
                this.roomname = uniqueid();
                this.room = io.to(this.roomname);
                this.user1.join( this.roomname );
                this.user2.join( this.roomname );
            }
        
            toUsers(callback){
                this.users.forEach((user) => callback(user));
            }
        
            initTurn(){
                const rand = Math.floor( Math.random() * 2 );
                this.turn = rand === 0 ? this.user1 : this.user2;
            }
        
            turnNext(){
                const isUser1Turn = this.turn.id === this.user1.id;
                this.turn = isUser1Turn ? this.user2 : this.user1;
                this.toUsers(user => {
                    user.emit("servermessage",{ message: `${this.turn.username}의 턴이에요!` });
                })
            }
        
            initListener(user){
                const room = this.room;
                const isMyTurn = (user) => user.id === this.turn.id;
                const isDrawn = ([x,y]) => this.gamepan[x][y];
                const isGameEnd = (result) => result !== null;

                room.emit("gamestart",{
                    enemyUsername : user.enemy.username,
                    enemyId : user.enemy.id
                });

                room.on("draw",({ axis }) => {
                    console.log(axis)
                    try{
                        if( !isMyTurn(user) ) throw {message: "내 턴이 아니에요."}
                        if( isDrawn(axis) ) throw {message: "이미 둔 장소에요."}
        
                        const result = this.draw(user, axis);
                        this.toUsers(user => user.emit("renewgamepan",{ gamepan: this.gamepan }));
        
                        if( isGameEnd( result ) ) this.gameEnd(result);
                        else this.turnNext();

                    } catch( data ) {
                        if(data instanceof Error) throw data;
                        user.emit("servermessage",data);
                    }
                })

                this.disconnectListener = ()=>{
                    this.gameEnd(false);
                }

                room.on("disconnect",this.disconnectListener);
            }

            gameEnd(result){
                const getWinner = ( result ) => {
                    if(result === 1) return this.user1;
                    if(result === -1) return this.user2;
                    return null;
                }
                const isGameDraw =  (result) => result === 0;

                if( getWinner( result ) ){
                    const winner = isGameEnd( result );
                    const looser = winner.enemy;
                    winner.emit("gameend",{state: "win"});
                    looser.emit("gameend",{state: "lose"});
                } else if ( isGameDraw(result) ){
                    console.log( isGameDraw(result))
                    this.toUsers(user => user.emit("gameend",{state: "draw"}));
                } else {
                    this.toUsers(user => user.emit("servermessage",{message: "게임 도중에 나가버려서 강제종료됬어요!"}));
                    this.toUsers(user => user.emit("gameend",{state: "draw"}));
                }
                this.toUsers(user => delete user.enemy);
                this.removeListener();
            }
        
            removeListener(){
                this.room.removeAllListeners("draw");
                this.room.removeListener("disconnect",this.disconnectListener);

                this.users.map(user => {
                   delete user.enemy;
                });
            }
        
            draw(user,axis){
                console.log(axis)
                const [x,y] = axis;
                this.gamepan[x][y] = this.user1 === user ? 1: -1;
                return this.isWin();
            }
            /**
             * @return {number | null}
             *  1 : 플레이어1 승리
             *  2 : 플레이어2 승리
             *  0 : 무승부
             *  null : 겜 안끝남
             *              
             */
            isWin(){
                var winner = null;
                const { gamepan, isLine } = this;
                const setWinner = (array) => { 
                    const result = isLine(array);
                    if(result) winner = result;
                }
                //가로 
                    gamepan.forEach( (array) => setWinner(array) )
                //세로
                    for(let i = 0; i < 3;i++){
                        const array = [0,1,2].map(v => gamepan[v][i]);
                        setWinner(array)
                    }
                //대각선
                    {
                        const array = [0,1,2].map(v => gamepan[v][v]);
                        setWinner(array)
                    }
                    {
                        const array = [0,1,2].map(v => gamepan[2-v][v]);
                        setWinner(array)
                    }
                if(winner) return winner
                return gamepan.every( vert => vert.every( v => v) ) ? 0 : null;
            }
        
            isLine(array){
                // 1: user1승리 -1: user2승리
                // 0: 채워짐 null: 제대로 안채워진
                const first = array[0]
                let isFill = true;
                const isCorrect = array.every(v => {
                    if(v === 0){
                        isFill = false;
                        return false;
                    }
                    return v === first;
                })
                if( isCorrect ) return first
                return isFill ? 0 : null;
            }
        }

    })

    
}
