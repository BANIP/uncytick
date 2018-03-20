const uniqid = require("uniqid");

module.exports = function(server){
    const io = require('socket.io')(server, { wsEngine: 'ws' }).of("uncytick")
    let clients = {};
    let sessions = {};
    const getRequestPull = (target) => clients[target.id]["requestPull"];
    const setRequestPull = (target,id) => clients[target.id]["requestPull"] = id;

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
            sessions[socket.id] = socket;
            socket.username = username;

            socket.broadcast.emit("newuser",client);
            io.emit("getuserlist",Object.values(clients));
        });
    
        socket.on("disconnect", function(data){
            delete clients[socket.id];
            delete sessions[socket.id];
            
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
            const { targetId: enemyId } = data;
            const enemy = sessions[enemyId];
            socket = sessions[socket.id];

            const isNotEndGame = (enemy) => enemy.enemy;
            const sendMessage = (target, message) => target.emit("servermessage", {message});
            setRequestPull(socket,enemy.id);

            if( isNotEndGame(socket) ) sendMessage(socket,`아직 게임이 끝나지 않았어요.`);
            else if( isNotEndGame(enemy) ) sendMessage(socket,`${enemy.username}은 아직 게임이 끝나지 않았어요.`);
            else if( getRequestPull(enemy) === socket.id )  new Game(socket,enemy);
            else sendMessage(enemy,`${socket.username}이 게임 신청을 보냈어요. 이 유저에게 게임신청을 하면 시작되요.`);
            
        });

        class Game{
            constructor(user1, user2){
                this.user1 = user1;
                this.user2 = user2;
                this.users = [user1,user2];
                this.user1.enemy = user2;
                this.user2.enemy = user1;

                this.gamepan = [[0,0,0],[0,0,0],[0,0,0]];

                this.toUsers( user => {
                    this.initListener(user);
                });
                this.initTurn();
                this.turnNext();
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
                const isMyTurn = (user) => user.id === this.turn.id;
                const isDrawn = ([x,y]) => this.gamepan[x][y];
                const isGameEnd = (result) => result !== null;

                user.emit("gamestart",{
                    enemyUsername : user.enemy.username,
                    enemyId : user.enemy.id
                });

                user.on("draw",({ axis }) => {
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

                user.on("disconnect",this.disconnectListener);
            }

            gameEnd(result){
                const getWinner = ( result ) => {
                    if(result === 1) return this.user1;
                    if(result === -1) return this.user2;
                    return null;
                }
                const isGameDraw =  (result) => result === 0;

                if( getWinner( result ) ){
                    const winner = getWinner( result );
                    const looser = winner.enemy;
                    winner.emit("gameend",{state: "win"});
                    looser.emit("gameend",{state: "lose"});
                } else if ( isGameDraw(result) ){
                    console.log( isGameDraw(result))
                    this.toUsers(user => user.emit("gameend",{state: "draw"}));
                } else {
                    this.toUsers(user => user.emit("servermessage",{message: "상대가 게임 도중에 나가버려서 강제종료됬어요!"}));
                    this.toUsers(user => user.emit("gameend",{state: "draw"}));
                }
                this.toUsers(user => delete user.enemy);
                this.removeListener();
            }
        
            removeListener(){
                this.users.map(user => {
                    try{
                        user.removeAllListeners("draw");
                        user.removeListener("disconnect",this.disconnectListener);
                        setRequestPull(user,null);
                        delete user.enemy;
                    } catch (e){
                        console.log(e);
                    }

                });
            }
        
            draw(user,axis){
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
