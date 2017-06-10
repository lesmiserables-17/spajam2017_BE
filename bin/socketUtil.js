exports.socketUtil = function(io) {
  var judge_time = 300;
  var result_time = 20000;
  var start_flg = 0;
  var speed_flg = 0;
  // {userid: score}
  users = {};
  // {userid: "None"}
  status = {};
  io.on('connection', function(socket){
    console.log('a user connected');
    //join & start
    socket.on("join", function (data) {
      console.log(data);
      var user_id = data.user_id;
      var mode = data.mode;
      if(Object.keys(users).length < 2){
        users[user_id] = 0;
        status[user_id] = "None";
      }
      //start
      if(Object.keys(users).length == 2 && !start_flg && mode == "chambara"){
        console.log("start");
        start_flg = 1;
        io.sockets.emit("start", null);
        setTimeout(result, result_time);
        //socket.broadcast.emit("start", null);
      }
      //speed_start
      if(Object.keys(users).length == 2 && !speed_flg && mode == "speed"){
        console.log("speed_start");
        speed_flg = 1;
        var date = new Date();
        var interval = Math.floor(Math.random()*(10-3)+3);
        console.log(interval);
        date = date.setSeconds(date.getSeconds()+interval);
        date = new Date(date);
        console.log(date.getTime().toString());
        io.sockets.emit("speed_start", date.getTime().toString());
      }
    });

    socket.on("speed_attack", function (user_id) {
      if (speed_flg) {
        console.log("speed_attack: "+user_id);
        users[user_id] = 100;
        result();
      }
    });

    //atack
    socket.on("attack", function (user_id) {
      if (start_flg) {
        console.log("attack: "+user_id);
        status[user_id] = "attack";
        setTimeout(judge, judge_time);
      }
    });

    //defence
    socket.on("defence", function (user_id) {
      if (start_flg) {
        console.log("defence: "+user_id);
        status[user_id] = "defence";
        setTimeout(judge, judge_time);
      }
    });

    // 切断したときに送信
    socket.on("disconnect", function () {
      console.log("disconnect");
      init();
  //    io.sockets.emit("S_to_C_message", {value:"user disconnected"});
    });

    function init() {
      console.log("init");
      users = {};
      status = {};
      start_flg = 0;
      speed_flg = 0;
    }

    //結果を返す
    function result() {
      var max_score = -1;
      var max_user = "";
      
      Object.keys(users).forEach(
        function(key){
          var score = users[key];
          if (max_score < score) {
            max_score = score;
            max_user = key;
          }
        }
      );
      
      var result_data = Object();
      
      Object.keys(users).forEach(
        function(key){
          result_data[key] = (users[key] == max_score);
        }
      );
      
      console.log(users);
      io.sockets.emit("result", result_data);
      //init();
    }

    //statusを返すための関数
    function judge() {
      attack = 0;
      defence = 0;
      none = 0;
      // ステータスの取得
      for(user_id in status){
        if(status[user_id] == "attack") {
          attack++;
        } else if(status[user_id] == "defence") {
          defence++;
        } else {
          none++;
        }
      }
      
      // attack * defence
      if(attack == 1 && defence == 1) {
        for(user_id in status){
          // 得点の判定
          if(status[user_id] == "defence") {
            // 得点の判定
            users[user_id] += 10;
          }
          status[user_id] = "guard";
        }
      }

      // attack * attack
      if(attack == 2) {
        for(user_id in status){
          status[user_id] = "conflict";
        }
      }

      // defence * Nonoe
      if(defence == 1 && none == 1) {
        for(user_id in status){
          status[user_id] = "None";
        }
      }

      // defence * defence
      if(defence == 2) {
        for(user_id in status){
          status[user_id] = "None";
        }
      }

      // attack * None
      if(attack == 1 && none == 1) {
        for(user_id in status){
          if(status[user_id] == "attack") {
            // 得点の判定
            users[user_id] += 10;
            status[user_id] = "None";
          } else {
            status[user_id] = "injured";
          }
        }
      }

      console.log(status);
      //status
      //{user_id: injured}
      io.sockets.emit("status", status);

      //statusの初期化
      for(user_id in status){
        status[user_id] = "None";
      }
    }
  });
};
