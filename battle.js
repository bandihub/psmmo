var Battle = function(roomid, type, nojoin) {
	var room = this;
	var chatholder = $("body");
	var insides = '<div id="' + roomid + 'battle" class="battle" style="z-index: 3;">';
	insides += '<div id="' + roomid + '"container" class="relative">';
	//battle stuff
	insides += '<div class="battle-containment">';
	insides += '<div id="' + roomid + 'oppbattleteam" class="battleteam"></div>';
	insides += '<div class="hpbar"><div id="' + roomid + 'opphpwidth" class="hpwidth"></div><span class="condition" id="' + roomid + 'oppcondition"></span></div>';
	insides += '<div class="field" id="' + roomid + 'field">';
	insides += '<div class="relative">';
	insides += '<img src="http://play.pokemonshowdown.com/sprites/bw/0.png" onmouseover="vars.tooltip(\'pokemon\', this);" onmouseout="vars.tooltip();" id="' + roomid + 'oppmon" class="oppmon" />';
	insides += '<img src="http://play.pokemonshowdown.com/sprites/bw/0.png" onmouseover="vars.tooltip(\'pokemon\', this);" onmouseout="vars.tooltip();" id="' + roomid + 'youmon" class="youmon" />';
	insides += '</div>';
	insides += '</div>';
	insides += '<div class="hpbar"><div class="hpwidth" id="' + roomid + 'youhpwidth"></div><span class="condition" id="' + roomid + 'youcondition"></span></div>';
	insides += '<div id="' + roomid + 'exp" class="expbar"></div>';
	insides += '<div id="' + roomid + 'youbattleteam" style="height: 26px;" class="battleteam"></div>';
	insides += '<div class="buttons" id="' + roomid + 'buttons"></div>';
	insides += '</div>';
	//chat stuff
	insides += '<div id="' + roomid + 'users" style="width: 250px;" class="users"></div>';
	insides += '<div id="' + roomid + 'logs" class="logs"></div>';
	insides += '<textarea id="' + roomid + 'chatmessage" class="chatmessage" style="width: ' + ($("body").width() - 250) + 'px;margin-left: 250px;"></textarea>';
	insides += '</div></div>';
	chatholder.append(insides);
	if ($("body").width() > 550 * 1.5 && $("body").height() > 330 * 1.5) {
		//the battle window's MINIMUM resolution is 550 x 330
		//so if we're 1.5x the height, keep the dimensions at the minimum so we can drag the battle window around.
		//also edit the size of the chatmessage input
		$('#' + roomid + 'battle').width(550).height(330).css({
			left: $("#canvasContainer").width() + (($("body").width() - $("#canvasContainer").width() - 550) / 2) + "px",
			top: 50 + "px"
		});
		$('#' + roomid + 'chatmessage').width(550 - (250 /* size of the battle part, not the chat */));
		setTimeout('$("#' + roomid + 'oppbattleteam").css("cursor", "move");', 1000);
		//make the opponents pokemons be the draggable part of the chat
		$("body").on("mousedown", '#' + roomid + 'oppbattleteam', function(e) {
			Tools.dragPM = this.id.replace("oppbattleteam", "") + "battle"; //we're gonna just copy the PM drag since it doesn't let the top go into negative coordinates which is...good
			e.preventDefault();
			return false;
		});
	}
	
	$("body").on("keydown", '#' + roomid + 'chatmessage', function(e) {
		if (e.keyCode == 13 && this.value) {
			client.send(this.value, this.id.replace("chatmessage", ""));
			this.value = "";
			return false;
		}
	});
	room.id = roomid;
	room.receive = function(data) {this.add(data);};
	room.$chat = $("#" + roomid + "logs");
	room.parseUserList = function (userList) {
		this.userCount = {};
		this.users = {};
		var commaIndex = userList.indexOf(',');
		if (commaIndex >= 0) {
			this.userCount.users = parseInt(userList.substr(0,commaIndex),10);
			var users = userList.substr(commaIndex+1).split(',');
			for (var i=0,len=users.length; i<len; i++) {
				if (users[i]) this.users[toId(users[i])] = users[i];
			}
		} else {
			this.userCount.users = parseInt(userList);
			this.userCount.guests = this.userCount.users;
		}
		this.userList.construct();
	};
	room.addChat = function (name, message, pm, deltatime) {
		var userid = toUserid(name);
		var color = hashColor(userid);

		// Add this user to the list of people who have spoken recently.
		//this.markUserActive(userid);

		this.$joinLeave = null;
		this.joinLeave = {
			'join': [],
			'leave': []
		};
		var clickableName = '<span class="username" data-name="' + Tools.escapeHTML(name) + '">' + Tools.escapeHTML(name.substr(1)) + '</span>';
		var highlight = '';
		var chatDiv = '<div class="chat' + highlight + '">';
		var timestamp = "";
		if (name.charAt(0) !== ' ') clickableName = '<small>' + Tools.escapeHTML(name.charAt(0)) + '</small>'+clickableName;
		var self = this;
		var outputChat = function() {
			self.$chat.append(chatDiv + timestamp + '<strong style="color: ' + color + '">' + clickableName + ':</strong> <em' + (name.substr(1) === search.username ? ' class="mine"' : '') + '>' + Tools.parseMessage(message, name) + '</em></div>');
		};
		var showme = !(({}).hideme);
		if (pm) {
			var pmuserid = toUserid(pm);
			var oName = pm;
			if (pmuserid === toId(search.username)) oName = name;
			this.$chat.append('<div class="chat">' + timestamp + '<strong style="color: ' + color + '">' + clickableName + ':</strong> <span class="message-pm"><i class="pmnote" data-name="' + Tools.escapeHTML(oName) + '">(Private to ' + Tools.escapeHTML(pm) + ')</i> ' + Tools.parseMessage(message, name) + '</span></div>');
		} else if (message.substr(0,4) === '/me ') {
			message = message.substr(4);
			if (showme) {
				this.$chat.append(chatDiv + timestamp + '<strong style="color: ' + color + '">&bull;</strong> <em' + (name.substr(1) === search.username ? ' class="mine"' : '') + '>' + clickableName + ' <i>' + Tools.parseMessage(message, name) + '</i></em></div>');
			} else {
				outputChat();
			}
		} else if (message.substr(0,5) === '/mee ') {
			message = message.substr(5);
			if (showme) {
				this.$chat.append(chatDiv + timestamp + '<strong style="color: ' + color + '">&bull;</strong> <em' + (name.substr(1) === search.username ? ' class="mine"' : '') + '>' + clickableName + '<i>' + Tools.parseMessage(message, name) + '</i></em></div>');
			} else {
				outputChat();
			}
			Storage.logChat(this.id, '* '+name+message);
		} else if (message.substr(0,10) === '/announce ') {
			this.$chat.append(chatDiv + timestamp + '<strong style="color: ' + color + '">' + clickableName + ':</strong> <span class="message-announce">' + Tools.parseMessage(message.substr(10), name) + '</span></div>');
			Storage.logChat(this.id, ''+name+': /announce '+message);
		} else if (message.substr(0,6) === '/warn ') {
			//app.addPopup(RulesPopup, {warning: message.substr(6)});
		} else if (message.substr(0,14) === '/data-pokemon ') {
			this.$chat.append('<div class="message"><ul class="utilichart">'+Chart.pokemonRow(Tools.getTemplate(message.substr(14)),'',{})+'<li style=\"clear:both\"></li></ul></div>');
		} else if (message.substr(0,11) === '/data-item ') {
			this.$chat.append('<div class="message"><ul class="utilichart">'+Chart.itemRow(Tools.getItem(message.substr(11)),'',{})+'<li style=\"clear:both\"></li></ul></div>');
		} else if (message.substr(0,14) === '/data-ability ') {
			this.$chat.append('<div class="message"><ul class="utilichart">'+Chart.abilityRow(Tools.getAbility(message.substr(14)),'',{})+'<li style=\"clear:both\"></li></ul></div>');
		} else if (message.substr(0,11) === '/data-move ') {
			this.$chat.append('<div class="message"><ul class="utilichart">'+Chart.moveRow(Tools.getMove(message.substr(11)),'',{})+'<li style=\"clear:both\"></li></ul></div>');
		} else {
			// Normal chat message.
			if (message.substr(0,2) === '//') message = message.substr(1);
			outputChat();
		}
	};
	room.users = new Object();
	room.userCount = {users: 0};
	room.joinLeave = {join: new Array(), leave: new Array()};
	room.userList = {
		roomid: room.id,
		added: new Object(),
		add: function(userid) {
			var users = client.rooms[this.roomid].users;
			var rid = this.roomid;
			function addUser(uid) {
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				//add user elements by room as well
				if (!$("#u" + uid).length) {
					$("#" + rid + "users").append('<div id="u' + uid + '" class="user">' + users[uid] + '</div>');
				}
			}
			addUser(userid);
			this.added[userid] = true;
			for (var user_id in users) {
				if (!this.added[user_id]) {
					this.added[user_id] = true;
					addUser(user_id);
				}
			}
		},
		updateUserCount: function() {},
		updateNoUsersOnline: function() {},
		remove: function(userid) {
			$('#u' + userid).remove();
			delete this.added[userid];
		},
		construct: function() {},
	};
	room.addJoinLeave = function (action, name, oldid, silent) {
		var userid = toUserid(name);
		if (!action) {
			this.$joinLeave = null;
			this.joinLeave = {
				'join': [],
				'leave': []
			};
			return;
		} else if (action === 'join') {
			if (oldid) delete this.users[toUserid(oldid)];
			if (!this.users[userid]) this.userCount.users++;
			this.users[userid] = name;
			this.userList.add(userid);
			this.userList.updateUserCount();
			this.userList.updateNoUsersOnline();
		} else if (action === 'leave') {
			if (this.users[userid]) this.userCount.users--;
			delete this.users[userid];
			this.userList.remove(userid);
			this.userList.updateUserCount();
			this.userList.updateNoUsersOnline();
		} else if (action === 'rename') {
			if (oldid) delete this.users[toUserid(oldid)];
			this.users[userid] = name;
			this.userList.remove(oldid);
			this.userList.add(userid);
			return;
		}
		if (silent) return;
		if (!this.$joinLeave) {
			this.$chat.append('<div class="message"><small>Loading...</small></div>');
			this.$joinLeave = this.$chat.children().last();
		}
		this.joinLeave[action].push(name);
		var message = '';
		if (this.joinLeave['join'].length) {
			var preList = this.joinLeave['join'];
			var list = [];
			var named = {};
			for (var j = 0; j < preList.length; j++) {
				if (!named[preList[j]]) list.push(preList[j]);
				named[preList[j]] = true;
			}
			for (var j = 0; j < list.length; j++) {
				if (j >= 5) {
					message += ', and ' + (list.length - 5) + ' others';
					break;
				}
				if (j > 0) {
					if (j == 1 && list.length == 2) {
						message += ' and ';
					} else if (j == list.length - 1) {
						message += ', and ';
					} else {
						message += ', ';
					}
				}
				message += Tools.escapeHTML(list[j]);
			}
			message += ' joined';
		}
		if (this.joinLeave['leave'].length) {
			if (this.joinLeave['join'].length) {
				message += '; ';
			}
			var preList = this.joinLeave['leave'];
			var list = [];
			var named = {};
			for (var j = 0; j < preList.length; j++) {
				if (!named[preList[j]]) list.push(preList[j]);
				named[preList[j]] = true;
			}
			for (var j = 0; j < list.length; j++) {
				if (j >= 5) {
					message += ', and ' + (list.length - 5) + ' others';
					break;
				}
				if (j > 0) {
					if (j == 1 && list.length == 2) {
						message += ' and ';
					} else if (j == list.length - 1) {
						message += ', and ';
					} else {
						message += ', ';
					}
				}
				message += Tools.escapeHTML(list[j]);
			}
			message += ' left<br />';
		}
		this.$joinLeave.html('<small style="color: #555555">' + message + '</small>');
	};
	room.addRaw = function (line) {
		var name, name2, room, action, silent, oldid;
		if (line && typeof line === 'string') {
			if (line.substr(0,1) !== '|') line = '||'+line;
			var row = line.substr(1).split('|');
			switch (row[0]) {
			case 'init':
				// ignore (handled elsewhere)
				break;

			case 'title':
				this.title = row[1];
				//app.topbar.updateTabbar();
				break;

			case 'c':
			case 'chat':
				if (/[a-zA-Z0-9]/.test(row[1].charAt(0))) row[1] = ' '+row[1];
				this.addChat(row[1], row.slice(2).join('|'));
				break;

			case 'tc':
				if (/[a-zA-Z0-9]/.test(row[2].charAt(0))) row[2] = ' '+row[2];
				this.addChat(row[2], row.slice(3).join('|'), false, row[1]);
				break;

			case 'b':
			case 'B':
				/*
				var id = row[1];
				name = row[2];
				name2 = row[3];
				silent = (row[0] === 'B');

				var matches = ChatRoom.parseBattleID(id);
				if (!matches) {
					return; // bogus room ID could be used to inject JavaScript
				}
				var format = Tools.escapeFormat(matches ? matches[1] : '');

				if (silent && !Tools.prefs('showbattles')) return;

				this.addJoinLeave();
				var battletype = 'Battle';
				if (format) {
					battletype = format + ' battle';
					if (format === 'Random Battle') battletype = 'Random Battle';
				}
				this.$chat.append('<div class="notice"><a href="' + app.root+id + '" class="ilink">' + battletype + ' started between <strong style="' + hashColor(toUserid(name)) + '">' + Tools.escapeHTML(name) + '</strong> and <strong style="' + hashColor(toUserid(name2)) + '">' + Tools.escapeHTML(name2) + '</strong>.</a></div>');
				*/
				break;

			case 'j':
			case 'join':
			case 'J':
				this.addJoinLeave('join', row[1], null, row[0] === 'J');
				break;

			case 'l':
			case 'leave':
			case 'L':
				this.addJoinLeave('leave', row[1], null, row[0] === 'L');
				break;

			case 'n':
			case 'name':
			case 'N':
				this.addJoinLeave('rename', row[1], row[2], true);
				break;

			case 'refresh':
				// refresh the page
				document.location.reload(true);
				break;

			case 'users':
				this.parseUserList(row[1]);
				break;

			case 'usercount':
				if (this.id === 'lobby') {
					this.userCount.globalUsers = parseInt(row[1], 10);
					this.userList.updateUserCount();
				}
				break;

			case 'formats':
				// deprecated; please send formats to the global room
				//app.parseFormats(row);
				break;

			case 'raw':
			case 'html':
				this.$chat.append('<div class="notice">' + Tools.sanitizeHTML(row.slice(1).join('|')) + '</div>');
				break;

			case 'unlink':
				// note: this message has global effects, but it's handled here
				// so that it can be included in the scrollback buffer.
				$('.message-link-' + toId(row[1])).each(function() {
					$(this).replaceWith($(this).html());
				});
				break;

			case 'tournament':
			case 'tournaments':
				//if (!this.tournamentBox) this.tournamentBox = new TournamentBox(this, this.$tournamentWrapper);
				//if (!this.tournamentBox.parseMessage(row.slice(1), row[0] === 'tournaments'))
					break;
				// fallthrough in case of unparsed message

			case '':
				this.$chat.append('<div class="notice">' + Tools.escapeHTML(row.slice(1).join('|')) + '</div>');
				break;

			default:
				this.$chat.append('<div class="notice"><code>|' + Tools.escapeHTML(row.join('|')) + '</code></div>');
				break;
			}
		}
	};
	room.battle = {
		p1: new Object(),
		p2: new Object(),
		p1a: new Object(),
		p2a: new Object(),
	};
	room.battle.p1.originalMonOrder = new Array();
	room.battle.p2.originalMonOrder = new Array();
	room.timeline = new Array(),
	room.events = 0,
	room.currentTime = 0,
	room.advancing = false,
	room.who = function(playernum) {
		var playernum = playernum.substr(0, 2);
		var who;
		if (playernum == this.battle.you) who = "you"; else who = "opp";
		return who;
	};
	room.toTimeline = function(data) {
		if (!this.completelyLoaded) data.time = 0;
		if (!data.time) data.time = 0;
		this.timeline.push(data);
		this.events++;
		if (!this.advancing) this.timeTravel();
	};
	room.timeTravel = function(setTimeoutCalled) {
		if (this.currentTime == this.events) return false;
		if (this.advancing && !setTimeoutCalled) return false;
		this.advancing = true;
		for (var currentTime = this.currentTime + 1; currentTime < this.events; currentTime++) {
			var current = this.timeline[currentTime];
			var t = 0;
			if (current.time) t = current.time;
			
			if (current.msg) this.$chat.append(current.msg);
			var player = current.player,
					playerA = "",
					who = current.who,
					roomid = this.id;
			if (current.player) {
				player = current.player.substr(0, 2);
				playerA = player + "a";
			}
			
			//set expEl && originalSlot
			var expEl = $("#" + roomid + "exp");
			var originalSlot = 0;
			var youA = this.battle[playerA],
				youplayer = player;
			if (who == "opp") {
				if (player == "p1") youplayer = "p2";
				if (player == "p2") youplayer = "p1";
				youA = this.battle[youplayer + "a"];
			}
			if (this.battle[youplayer] && this.battle[youplayer].originalMonOrder) for (var i in this.battle[youplayer].originalMonOrder) if (this.battle[youplayer].originalMonOrder[i] == youA.species) originalSlot = i;
			
			if (this.decision) this.cancelShow();
			/*
				--------
				 events
				--------
			*/
			//SWITCH EVENT
			if (current.event == "switch" || current.event == "drag" || current.event == "-start" || current.event == "-end" || current.event == "detailschange") {
				//this updates the condition bar (nickname, %health, %status)
				var A = this.battle[playerA];
				current.newHP = (A.currentHP / A.totalHP * 100); //this makes it so that the heal/damage event below changes the hp :)
				current.updateIcons = true; //does the same for the icons as setting current.newHP
				var status = '<span class="' + A.status + '">' + A.status + '</span>';
				$("#" + roomid + who + "condition").html("<i><b>L</b><small><small>" + A.level + "</small></small></i> " + A.nickname + " - " + (Math.round(current.newHP * 10) / 10) + "% " + status);
				
				//sprite display
				var url = Tools.getBattleSprite(A, ((who == "you") ? true : false));
				if (A.substitute) url = search.resourcePrefix + "sprites/bw" + ((who == "you") ? "-back" : "") + "/substitute.png";
				if (url != $("#" + roomid + who + "mon").attr("src")) $("#" + roomid + who + "mon").attr("src", url).show();
				
				//figure out the actual pokemonKey in the team so we can use something other than [0] and all the right pokemon get their exp
				//for now only the pokemon in the 1st slot will get any exp
				if (who == "you") {
					vars.me.expDivision[originalSlot] = true;
					vars.me.updateExp(expEl, originalSlot, "css");
				} else {
					vars.me.expDivision = new Object();
					vars.me.expDivision[originalSlot] = true;
				}
			}
			//heal / damage HP CHANGE EVENTS
			if (current.newHP || current.event == "-heal" || current.event == "-damage") {
				if (!this.completelyLoaded) {
					$("#" + roomid + who + "hpwidth").css("width", current.newHP + "%");
					current.updateStatus = true;
				} else  {
					var A = this.battle[playerA];
					var status = '<span class="' + A.status + '">' + A.status + '</span>';
					var percent = (A.currentHP / A.totalHP * 100);
					$("#" + roomid + who + "hpwidth").animate({"width": percent + "%"}, 500, function() {
						$("#" + roomid + who + "condition").html("<i><b>L</b><small>" + A.level + "</small></i> " + A.nickname + " - " + (Math.round(percent * 10) / 10) + "% " + status);
					});
				}
			}
			//STATUS OR CONDITION CHANGE EVENTS
			if (current.updateStatus || current.event == "-status" || current.event == "-curestatus") {
				var A = this.battle[playerA];
				var status = '<span class="' + A.status + '">' + A.status + '</span>';
				$("#" + roomid + who + "condition").html("<i><b>L</b><small>" + A.level + "</small></i> " + A.nickname + " - " + (Math.round((A.currentHP / A.totalHP * 100) * 10) / 10) + "% " + status);
			}
			//FAINT EVENT
			if (current.event == "faint") {
				$("#" + roomid + who + "mon").hide();
				current.updateIcons = true;
				
				//exp update
				if (who == "opp") {
					vars.me.gainExp(expEl, originalSlot);
					vars.me.updateExp(expEl, originalSlot, "animate", 500);
				}
			}
			//REQUEST EVENTS
			if (current.event == "request" && this.battle.active) {
				current.updateIcons = true;
				var insides = '',
					moves = this.battle.active[0].moves;
				for (var i in moves) {
					var disabled = "";
					if (moves[i].disabled) disabled = " disabled='true'";
					var type = exports.BattleMovedex[moves[i].id].type;
					insides += '<button' + disabled + ' onmouseover="vars.tooltip(\'move\', \'' + moves[i].move + '\', this);" onmouseout="vars.tooltip();" id="' + moves[i].move + '---' + roomid + '" class="type-' + type + '"><div><span class="movetitlebutton">' + moves[i].move + '</span></div><div><span class="left">' + type + '</span><span class="right">' + moves[i].pp + '/' + moves[i].maxpp + '</span></div></button>';
				}
				$("#" + roomid + "buttons").html(insides);
			}
			if (current.updateIcons || current.event == "start" || current.event == "teampreview") {
				var insides = '';
				var user = this.battle[player];
				var mon = 0;
				for (var i in user.mons) {
					var info = exports.BattlePokedex[toId(i)];
					var dead = " alive";
					if (who == "opp") dead = ""; //they can't have an alive class on the opponents team bcos then u can click there shit and it'll cause you to switch to the slot clicked which is bad
					if (Math.ceil(user.mons[i].currentHP) == 0) dead = " dead";
					var s = ((!user.mons[i].mon && Math.floor(user.mons[i].mon) !== 0) ? mon : user.mons[i].mon);
					insides += '<span onmouseover="vars.tooltip(\'monicon\', ' + s + ', \'' + this.id + '\');" onmouseout="vars.tooltip();" class="col iconcol' + dead + '" id="' + s + '-' + roomid + '" style="width: 32px;height: 24px;' + Tools.getIcon(info) + '"></span>'
					mon++;
				}
				if (who == "you") insides += '<button onclick="client.send(\'/undo\', \'' + this.id + '\');$(this).hide();client.rooms[\'' + this.id + '\'].decision = undefined;" class="cancelbutton">Cancel</button>';
				$("#" + roomid + who + "battleteam").empty().html(insides);
			}
			
			
			this.currentTime = currentTime;
			if (t && this.completelyLoaded) {
				this.advancing = false;
				setTimeout(this.timeTravel, t, true);
				return false;
			}
		}
		this.advancing = false;
	};
	room.cancelShow = function() {
		$("#" + this.id + "youbattleteam .cancelbutton").show();
	};
	room.addRow = function (line) {
		var name, name2, room, action, silent, oldid;
		if (line && typeof line === 'string') {
			if (line.substr(0,1) !== '|') line = '||'+line;
			var row = line.substr(1).split('|');
			//this is basically room.receive (for battle shit)
			if (row[0] == "player") {
				var playernum = row[1];
				var playername = row[2];
				var playeravy = row[3];
				this.battle[row[1]].name = playername;
				this.battle[row[1]].playernum = playernum;
				this.battle[row[1]].avy = (!isNaN(playeravy + 0)) ? search.resourcePrefix + "sprites/trainers/" + playeravy + ".png" : "http://" + host + ":" + port + "/avatars/" + playeravy;
				this.battle.you = "p1";
				this.battle.opp = "p2";
				if (toId(playername) == toId(search.username)) {
					this.battle.you = "p2";
					this.battle.opp = "p1";
				}
			} else if (row[0] == "poke") {
				var player = row[1];
				var species = row[2].split(', ')[0];
				if (!this.battle[player].mons) this.battle[player].mons = new Object();
				this.battle[player].originalMonOrder.push(species);
				this.battle[player].mons[species] = {currentHP: 100, totalHP: 100, status: ""};
				this.toTimeline({event: row[0], player: player, who: this.who(player)});
			} else if (row[0] == "start") {
				this.teamPreviewSelectionDone = true;
				var players = ["p1", "p2"];
				for (var playerKey in players) {
					var player = this.battle[players[playerKey]];
					var moncount = 0;
					for (var monKey in player.mons) {
						player.mons[monKey].mon = moncount;
						moncount++;
					}
				}
				this.toTimeline({event: row[0], player: players[0], who: this.who(players[0])});
				this.toTimeline({event: row[0], player: players[1], who: this.who(players[1])});
			} else if (row[0] == "switch" || row[0] == "drag") {
				var row1 = row[1].split(': ');
				var playernumA = row1[0];
				var player = playernumA.substr(0, 2);
				var nickname = row1[1];
				var row2 = row[2].split(', ');
				var species = row2[0];
				var level = Math.floor(row2[1].replace("L", ""));
				var gender = "";
				if (row2[2]) gender = row2[2];
				var row3 = row[3].split(" ");
				var hpstring = row3[0].split("/");
				var currentHP = Math.abs(hpstring[0]);
				var totalHP = Math.abs(hpstring[1]);
				var status = "";
				if (row3[1]) status = row3[1];
				
				if (this.battle[player].mons && this.battle[player].mons[species]) {
					var oldSlotOfNewActiveMon = this.battle[player].mons[species];
					if (oldSlotOfNewActiveMon) oldSlotOfNewActiveMon = oldSlotOfNewActiveMon.mon; else oldSlotOfNewActiveMon = 0; //fix the 0 and turn it into a request to look into your whole team and select the mon who's species it matches (this probably means its a random battle)
					var oldActiveMonSpecies = this.battle[playernumA].species;
					if (this.battle[player].mons[oldActiveMonSpecies]) this.battle[player].mons[oldActiveMonSpecies].mon = oldSlotOfNewActiveMon;
				}
				if (!this.battle[player].mons) this.battle[player].mons = new Object();
				this.battle[player].mons[species] = {currentHP: currentHP, totalHP: totalHP, status: status, mon: 0};
				this.battle[playernumA].species = species;
				this.battle[playernumA].nickname = nickname;
				this.battle[playernumA].level = level;
				this.battle[playernumA].gender = gender;
				this.battle[playernumA].status = status;
				this.battle[playernumA].currentHP = currentHP;
				this.battle[playernumA].totalHP = totalHP;
				this.battle[playernumA].substitute = false;
				
				var msg = '<div>' + this.battle[player].name + ' sent out ' + species + '!</div>';
				if (row[0] == "drag") msg = '<div>' + this.battle[player].name + '\'s ' + species + ' was dragged out.</div>';
				this.toTimeline({event: row[0], msg: msg, species: species, player: player, who: this.who(player)});
			} else if (row[0] == "-heal" || row[0] == "-damage") {
				var playernumA = row[1].split(': ')[0];
				var newhp = row[2].split(' ')[0].split('/');
				var totalHP;
				if (newhp.length - 1 > 0) totalHP = Math.abs(newhp[1]);
				var currentHP = Math.abs(newhp[0]);
				var oldpercent = this.battle[playernumA].currentHP / this.battle[playernumA].totalHP * 100;
				
				this.battle[playernumA].currentHP = currentHP;
				if (totalHP) this.battle[playernumA].totalHP = totalHP;
				var species = this.battle[playernumA].species;
				this.battle[playernumA.substr(0, 2)].mons[species].currentHP = currentHP;
				if (totalHP) this.battle[playernumA.substr(0, 2)].mons[species].totalHP = totalHP;
				
				//message part
				var lostorgained = " lost ";
				if (row[0] == "-heal") lostorgained = " gained ";
				var playernumA = row[1].split(': ')[0];
				var who;
				if (playernumA == this.battle.you + "a") who = "you"; else who = "opp";
				var species = row[1].split(': ')[1];
				var newpercent = this.battle[playernumA].currentHP / this.battle[playernumA].totalHP * 100;
				var percentchange = Math.abs(newpercent - oldpercent);
				var msg = '<div>' + ((who == "opp") ? 'The opposing ' : '') + species + lostorgained + (Math.round(percentchange * 10) / 10) + "% of its health!</div>";
				this.toTimeline({event: row[0], msg: msg, newHP: (currentHP / totalHP) * 100, time: 500, player: playernumA, who: this.who(playernumA)});
			} else if (row[0] == "-status" || row[0] == "-curestatus") {
				var playernumA = row[1].split(': ')[0];
				var status = row[2];
				if (row[0] == "-curestatus") status = this.battle[playernumA].status.replace(status, "");
				
				this.battle[playernumA].status = status;
				var species = this.battle[playernumA].species;
				this.battle[playernumA.substr(0, 2)].mons[species].status = status;
				this.toTimeline({event: row[0], player: playernumA, who: this.who(playernumA)});
			} else if (row[0] == "detailschange") {
				var playernumA = row[1].split(': ')[0];
				var player = playernumA.substr(0, 2);
				var species = row[2].split(', ')[0];
				var oldspecies = this.battle[playernumA].species;
				
				this.battle[player].mons[species] = JSON.parse(JSON.stringify(this.battle[player].mons[oldspecies]));
				delete this.battle[player].mons[oldspecies];
				this.battle[playernumA].species = species;
				this.toTimeline({event: row[0], player: player, who: this.who(player)});
			} else if (row[0] == "-start" || row[0] == "-end") {
				var playernumA = row[1].split(': ')[0];
				if (row[2] == "Substitute") this.battle[playernumA].substitute = (row[0] == "-start") ? true : false;
				this.toTimeline({event: row[0], player: playernumA, who: this.who(playernumA), substitute: this.battle[playernumA].substitute});
			} else if (row[0] == "win") {
				this.toTimeline({event: row[0], msg: "<div><b>" + row[1] + "</b> won the battle. " + 'The battle is over. Click <button onclick="client.send(\'/leave\', \'' + this.id + '\');">here</button> to leave the battle.' + "</div>"});
				var plusorminus = -1;
				if (row[0] == this.battle[this.battle.you].name) plusorminus = 1;
				vars.me.money += 100 * plusorminus;
				vars.me.encounteredMon = false;
				if (vars.me.money < 0) vars.me.money = 0;
				this.toTimeline({event: row[0], msg: "You " + ((plusorminus == 1) ? "won" : "lost") + ". You now have $" + vars.me.money + "."});
			} else if (row[0] == "request") {
				var objecto = (JSON.parse(row[1]));
				for (var i in objecto) this.battle[i] = objecto[i];
				if (this.battle.side) {
					for (var i in this.battle.side.pokemon) {
						var mon = this.battle.side.pokemon[i];
						var species = mon.ident.split(": ")[1];
						var player = mon.ident.split(": ")[0];
						var condition = mon.condition.split(" ");
						var hpstring = condition[0].split("/");
						var currentHP = Math.abs(hpstring[0]);
						var totalHP = Math.abs(hpstring[1]);
						var status = "";
						if (condition[1]) status = condition[1];
						if (!this.battle[player].mons) this.battle[player].mons = new Object();
						this.battle[player].mons[species] = {currentHP: currentHP, totalHP: totalHP, status: status, mon: Math.abs(i)};
					}
				}
				this.toTimeline({event: row[0], player: this.battle.you, who: this.who(this.battle.you)});
			} else if (row[0] == "-hitcount") {
				this.toTimeline({event: row[0], msg: "<div><small>Hit " + row[2] + " times!</small></div>"});
			} else if (row[0] == "-weather") {
				if (row[2] == "[upkeep]") this.toTimeline({event: row[0], msg: "<div>" + row[1] + " continues.</div>"});
			} else if (row[0] == "-crit") {
				this.toTimeline({event: row[0], msg: "<div><small>It was a critical hit!</small></div>"});
			} else if (row[0] == "-fail") {
				this.toTimeline({event: row[0], msg: "<div><small>But it failed!</small></div>"});
			} else if (row[0] == "message" || row[0] == "rule") {
				this.toTimeline({event: row[0], msg: "<div>" + row[1] + "</div>"});
			} else if (row[0] == "move") {
				this.decision = undefined;
				var playernumA = row[1].split(': ')[0];
				var species = row[1].split(': ')[1];
				var move = row[2];
				var playername = this.battle[playernumA.substr(0, 2)].name;
				this.toTimeline({event: row[0], msg: '<div>' + playername + '\'s ' + species + ' used <b>' + move + '</b>!</div>'});
			} else if (row[0] == "-immune" || row[0] == "-resisted" || row[0] == "-supereffective") {
				if (row[0] == "-resisted" || row[0] == "-supereffective") {
					var effectiveness;
					if (row[0] != "-resisted") effectiveness = "super effective!"; else effectiveness = "not very effective... ";
					this.toTimeline({event: row[0], msg: '<div>It\'s ' + effectiveness + '</div>'});
				} else {
					var playernumA = row[1].split(': ')[0];
					this.toTimeline({event: row[0], msg: '<div>It doesn\'t affect ' + ((playernumA == this.battle.you + "a") ? 'the opposing ' : '') + row[1].split(': ')[1] + "...</div>"});
				}
			} else if (row[0] == "faint") {
				this.decision = undefined;
				var playernumA = row[1].split(': ')[0];
				this.toTimeline({event: row[0], msg: '<div>' + ((playernumA == this.battle.you + "a") ? 'The opposing ' : '') + row[1].split(': ')[1] + " fainted.</div>", player: playernumA, who: this.who(playernumA)});
			} else if (row[0] == "turn") {
				this.decision = undefined;
				this.battle.turn = Math.floor(row[1]);
				this.toTimeline({event: row[0], msg: '<div class="turn">Start of Turn ' + row[1] + '</div>'});
			} else if (row[0] == "teampreview") {
				this.toTimeline({event: row[0], player: this.battle.you, who: "you"});
				this.toTimeline({event: row[0], player: this.battle.opp, who: "opp"});
			}
			switch (row[0]) {
			case 'player':
			case 'request':
			case 'detailschange':
			case '-singleturn':
			case 'poke':
			case 'clearpoke':
			case 'switch':
			case 'teampreview':
			case 'start':
			case '-hitcount':
			case 'win':
			case '-weather':
			case '-crit':
			case '-fail':
			case 'message':
			case 'rule':
			case 'move':
			case '-immune':
			case '-resisted':
			case '-supereffective':
			case '-damage':
			case '-heal':
			case 'faint':
			case 'turn':
				//leave blank so requests don't go on chat
				break;

			case 'init':
				// ignore (handled elsewhere)
				break;

			case 'title':
				this.title = row[1];
				//app.topbar.updateTabbar();
				break;

			case 'c':
			case 'chat':
				if (/[a-zA-Z0-9]/.test(row[1].charAt(0))) row[1] = ' '+row[1];
				this.addChat(row[1], row.slice(2).join('|'));
				break;

			case 'tc':
				if (/[a-zA-Z0-9]/.test(row[2].charAt(0))) row[2] = ' '+row[2];
				this.addChat(row[2], row.slice(3).join('|'), false, row[1]);
				break;

			case 'b':
			case 'B':
				var id = row[1];
				name = row[2];
				name2 = row[3];
				silent = (row[0] === 'B');

				var matches = ChatRoom.parseBattleID(id);
				if (!matches) {
					return; // bogus room ID could be used to inject JavaScript
				}
				var format = Tools.escapeFormat(matches ? matches[1] : '');

				if (silent && !Tools.prefs('showbattles')) return;

				this.addJoinLeave();
				var battletype = 'Battle';
				if (format) {
					battletype = format + ' battle';
					if (format === 'Random Battle') battletype = 'Random Battle';
				}
				this.$chat.append('<div class="notice"><a href="' + app.root+id + '" class="ilink">' + battletype + ' started between <strong style="' + hashColor(toUserid(name)) + '">' + Tools.escapeHTML(name) + '</strong> and <strong style="' + hashColor(toUserid(name2)) + '">' + Tools.escapeHTML(name2) + '</strong>.</a></div>');
				break;

			case 'j':
			case 'join':
			case 'J':
				this.addJoinLeave('join', row[1], null, row[0] === 'J');
				break;

			case 'l':
			case 'leave':
			case 'L':
				this.addJoinLeave('leave', row[1], null, row[0] === 'L');
				break;

			case 'n':
			case 'name':
			case 'N':
				this.addJoinLeave('rename', row[1], row[2], true);
				break;

			case 'refresh':
				// refresh the page
				document.location.reload(true);
				break;

			case 'users':
				this.parseUserList(row[1]);
				break;

			case 'usercount':
				if (this.id === 'lobby') {
					//this.userCount.globalUsers = parseInt(row[1], 10);
					//this.userList.updateUserCount();
				}
				break;

			case 'formats':
				// deprecated; please send formats to the global room
				app.parseFormats(row);
				break;

			case 'raw':
			case 'html':
				this.$chat.append('<div class="notice">' + Tools.sanitizeHTML(row.slice(1).join('|')) + '</div>');
				break;

			case 'unlink':
				// note: this message has global effects, but it's handled here
				// so that it can be included in the scrollback buffer.
				$('.message-link-' + toId(row[1])).each(function() {
					$(this).replaceWith($(this).html());
				});
				break;

			case 'tournament':
			case 'tournaments':
				//if (!this.tournamentBox) this.tournamentBox = new TournamentBox(this, this.$tournamentWrapper);
				//if (!this.tournamentBox.parseMessage(row.slice(1), row[0] === 'tournaments'))
					break;
				// fallthrough in case of unparsed message

			case '':
				this.$chat.append('<div class="notice">' + Tools.escapeHTML(row.slice(1).join('|')) + '</div>');
				break;

			default:
				this.$chat.append('<div class="notice"><code>|' + Tools.escapeHTML(row.join('|')) + '</code></div>');
				break;
			}
		}
	};
	room.add = function (log) {
		if (typeof log === 'string') log = log.split('\n');
		var autoscroll = false;
		if (this.$chat.scrollTop() + 60 >= this.$chat.height() - this.$chat.height()) {
			autoscroll = true;
		}
		var userlist = '';
		for (var i = 0; i < log.length; i++) {
			if (log[i].substr(0,7) === '|users|') {
				userlist = log[i];
			} else {
				this.addRow(log[i]);
			}
		}
		if (userlist) this.addRow(userlist);
		if (autoscroll) {
			this.$chat.scrollTop(this.$chat.height());
		}
		this.$chat.scrollTop(this.$chat.prop("scrollHeight"));
		var $children = this.$chat.children();
		if ($children.length > 900) {
			$children.slice(0,100).remove();
		}
	};
	room.users = new Object();
	room.logs = new Array();
	client.rooms[roomid] = room;
};
