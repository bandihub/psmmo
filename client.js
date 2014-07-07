var client = {
	rooms: new Object(),
	focusedRoom: undefined,
	removeChat: function(roomid) {
		delete this.rooms[roomid];
		if (this.focusedRoom == roomid && Object.keys(this.rooms).length) Tools.focusRoom(Object.keys(this.rooms)[0]);
		$("#" + roomid + "container").remove();
		$("#" + roomid + "battle").remove();
	},
	addChat: function(roomid, type, nojoin) {
		if (type == "battle") {
			this.rooms[roomid] = new Battle(roomid, type, nojoin);
			return false;
		}
		var room = new Object();
		var chatholder = $("#coverbuilder");
		var insides = "<div id=\"" + roomid + "container\" class=\"relative\">";
		insides += '<div id="' + roomid + 'users" class="users"></div>';
		insides += '<div id="' + roomid + 'logs" class="logs"></div>';
		insides += '<textarea id="' + roomid + 'chatmessage" class="chatmessage"></textarea>';
		insides += "</div>";
		chatholder.append(insides);
		
		Tools.focusRoom(roomid);
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
				//Storage.logChat(this.id, '* '+name+message);
			} else if (message.substr(0,10) === '/announce ') {
				this.$chat.append(chatDiv + timestamp + '<strong style="color: ' + color + '">' + clickableName + ':</strong> <span class="message-announce">' + Tools.parseMessage(message.substr(10), name) + '</span></div>');
				//Storage.logChat(this.id, ''+name+': /announce '+message);
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
					if (!$("#" + rid + "-u" + uid).length) {
						$("#" + rid + "users").append('<div id="' + rid + '-u' + uid + '" class="user">' + users[uid] + '</div>');
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
				$('#' + this.roomid + '-u' + userid).remove();
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
					//client.parseFormats(row);
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
		room.addRow = function (line) {
			var name, name2, room, action, silent, oldid;
			if (line && typeof line === 'string') {
				if (line.substr(0,1) !== '|') line = '||'+line;
				var row = line.substr(1).split('|');
				switch (row[0]) {
				/*
					------------------
					ALL OF THIS SHIT IS FOR THE POKEMON CANVAS MMORPG SHIT
					------------------
				*/
				case 's':
				case 'sendMessage':
					var userid = row[1],
						message = row[2];
					vars.ccm.addMessage(userid, message);
					break;

				case 'cu':
				case 'catchUp':
					var users = row[1].split(']');
					for (var i in users) {
						var details = users[i].split('[');
						var who = details[0],
								direction = details[1],
								x = Math.round(details[2]),
								y = Math.round(details[3]);
						vars.ccm.updatePlayer(who, direction, x, y);
					}
					break;
					
				case 'u':
				case 'updateOtherClientsOfMovement':					
					var who = row[1],
							direction = row[2],
							x = Math.round(row[3]),
							y = Math.round(row[4]);
					vars.ccm.updatePlayer(who, direction, x, y);
					break;
				/*
					------------------
					NORMAL
					------------------
				*/

				case 'broadcast':
					var url = row[1];
					var broadcastornaw = client.broadcast;
					if (broadcastornaw == undefined) client.broadcast = confirm("Allow broadcasts?");
					broadcastornaw = client.broadcast;
					if (!broadcastornaw) return false;
					document.getElementById("broadcast").src = url;
					$("#broadcast").attr("src", url);
					$("#broadcast-containment").show();
					break;
					
				//normal shet
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
					//client.parseFormats(row);
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
		this.rooms[roomid] = room;
	},
	send: function (data, room) {
		if (data.split("/leave").length - 1 > 0) vars.me.encounteredMon = false;
		if (room && room !== 'lobby' && room !== true) {
			data = room+'|'+data;
		} else if (room !== true) {
			data = '|'+data;
		}
		if (!this.socket || (this.socket.readyState !== SockJS.OPEN)) {
			if (!this.sendQueue) this.sendQueue = [];
			this.sendQueue.push(data);
			return;
		}
		this.socket.send(data);
	},
	connectServer: function() {
		var sock = new SockJS('http://' + host + ":" + port + "/showdown/");
		sock.onopen = function() {
			console.log('open');
		};
		sock.onmessage = function(event) {
			//console.log = function() {};
			//console.log('receive', JSON.stringify(event.data));
			client.receive(event.data);
		};
		sock.onclose = function() {
			console.log('close');
		};
		client.socket = sock;
		var loopity = function() {
			setTimeout(function() {
				if (client.socket.readyState == 1) {
					client.send('/join lobby');
					clearTimeout(loopity);
					return false;
				}
				loopity();
			}, 500);
		};
		loopity();
	},
	parseFormats: function(formatsList) {
		var isSection = false;
		var section = '';

		var column = 0;
		var columnChanged = false;

		BattleFormats = {};
		for (var j=1; j<formatsList.length; j++) {
			if (isSection) {
				section = formatsList[j];
				isSection = false;
			} else if (formatsList[j] === '' || (formatsList[j].substr(0, 1) === ',' && !isNaN(formatsList[j].substr(1)))) {
				isSection = true;

				if (formatsList[j]) {
					var newColumn = parseInt(formatsList[j].substr(1)) || 0;
					if (column !== newColumn) {
						column = newColumn;
						columnChanged = true;
					}
				}
			} else {
				var searchShow = true;
				var challengeShow = true;
				var team = null;
				var name = formatsList[j];
				if (name.substr(name.length-2) === ',#') { // preset teams
					team = 'preset';
					name = name.substr(0,name.length-2);
				}
				if (name.substr(name.length-2) === ',,') { // search-only
					challengeShow = false;
					name = name.substr(0,name.length-2);
				} else if (name.substr(name.length-1) === ',') { // challenge-only
					searchShow = false;
					name = name.substr(0,name.length-1);
				}
				var id = toId(name);
				var isTeambuilderFormat = searchShow && !team;
				var teambuilderFormat = undefined;
				if (isTeambuilderFormat) {
					var parenPos = name.indexOf('(');
					if (parenPos > 0 && name.charAt(name.length-1) === ')') {
						// variation of existing tier
						teambuilderFormat = toId(name.substr(0, parenPos));
						if (BattleFormats[teambuilderFormat]) {
							BattleFormats[teambuilderFormat].isTeambuilderFormat = true;
						} else {
							BattleFormats[teambuilderFormat] = {
								id: teambuilderFormat,
								name: $.trim(name.substr(0, parenPos)),
								team: team,
								section: section,
								column: column,
								rated: false,
								isTeambuilderFormat: true,
								effectType: 'Format'
							};
						}
						isTeambuilderFormat = false;
					}
				}
				if (BattleFormats[id] && BattleFormats[id].isTeambuilderFormat) {
					isTeambuilderFormat = true;
				}
				BattleFormats[id] = {
					id: id,
					name: name,
					team: team,
					section: section,
					column: column,
					searchShow: searchShow,
					challengeShow: challengeShow,
					rated: searchShow && id.substr(0,7) !== 'unrated',
					teambuilderFormat: teambuilderFormat,
					isTeambuilderFormat: isTeambuilderFormat,
					effectType: 'Format'
				};
			}
		}
		BattleFormats._supportsColumns = columnChanged;
	},
	receive: function(data) {
		var roomid = '';
		if (data.substr(0,1) === '>') {
			var nlIndex = data.indexOf('\n');
			if (nlIndex < 0) return;
			roomid = toRoomid(data.substr(1,nlIndex-1));
			data = data.substr(nlIndex+1);
		}
		if (data.substr(0,6) === '|init|') {
			if (!roomid) roomid = 'lobby';
			var roomType = data.substr(6);
			var roomTypeLFIndex = roomType.indexOf('\n');
			if (roomTypeLFIndex >= 0) roomType = roomType.substr(0, roomTypeLFIndex);
			roomType = toId(roomType);
			if (this.rooms[roomid]) {
				this.addChat(roomid, roomType, true);
			} else {
				this.addChat(roomid, roomType, true);
				//this.joinRoom(roomid, roomType, true);
			}
		} else if ((data+'|').substr(0,8) === '|expire|') {
			var room = this.rooms[roomid];
			if (room) {
				room.expired = true;
				alert("hey mr user, this room expired.");
			}
			return;
		} else if ((data+'|').substr(0,8) === '|deinit|' || (data+'|').substr(0,8) === '|noinit|') {
			if (!roomid) roomid = 'lobby';

			if (this.rooms[roomid] && this.rooms[roomid].expired) {
				// expired rooms aren't closed when left
				return;
			}

			var isdeinit = (data.charAt(1) === 'd');
			data = data.substr(8);
			var pipeIndex = data.indexOf('|');
			var errormessage;
			if (pipeIndex >= 0) {
				errormessage = data.substr(pipeIndex+1);
				data = data.substr(0, pipeIndex);
			}
			// handle error codes here
			// data is the error code
			if (data === 'namerequired') {
				//this.removeRoom(roomid);
				var self = this;
				//this.once('init:choosename', function() {
				//	//self.joinRoom(roomid);
				//});
			} else {
				if (isdeinit) { // deinit
					this.removeChat(roomid);
				} else { // noinit
					this.removeChat(roomid);
					if (roomid === 'lobby') this.joinRoom('rooms');
				}
				if (errormessage) {
					//this.addPopupMessage(errormessage);
				}
			}
			return;
		}
		if (roomid) {
			if (this.rooms[roomid]) {
				this.rooms[roomid].receive(data);
				setTimeout("if (client.rooms['" + roomid + "']) client.rooms['" + roomid + "'].completelyLoaded = true;", 2000);
			}
			return;
		}

		// Since roomid is blank, it could be either a global message or
		// a lobby message. (For bandwidth reasons, lobby messages can
		// have blank roomids.)

		// If it starts with a messagetype in the global messagetype
		// list, we'll assume global; otherwise, we'll assume lobby.

		var parts;
		if (data.charAt(0) === '|') {
			parts = data.substr(1).split('|');
		} else {
			parts = [];
		}

		switch (parts[0]) {
			case 'challenge-string':
			case 'challstr':
				client.challengekeyid = parseInt(parts[1], 10);
				client.challenge = parts[2];
				break;

			case 'updateuser':
			case 'formats':
				//this use to be formats only but for some reason it doesn't get called on formats so i switched it to updateuser which does get called and does have the right info for some reason
				if (typeof BattleFormats == "undefined") this.parseFormats(parts);
				break;

			case 'updateuser':
				/*
				var nlIndex = data.indexOf('\n');
				if (nlIndex > 0) {
					this.receive(data.substr(nlIndex+1));
					nlIndex = parts[3].indexOf('\n');
					parts[3] = parts[3].substr(0, nlIndex);
				}
				var name = parts[1];
				var named = !!+parts[2];
				this.user.set({
					name: name,
					userid: toUserid(name),
					named: named,
					avatar: parts[3]
				});
				this.user.setPersistentName(named ? name : null);
				if (named) {
					this.trigger('init:choosename');
				}
				*/
				break;

			case 'nametaken':
				//app.addPopup(LoginPopup, {name: parts[1] || '', reason: parts[2] || ''});
				break;

			case 'queryresponse':
				//var responseData = JSON.parse(data.substr(16+parts[1].length));
				//app.trigger('response:'+parts[1], responseData);
				break;

			case 'updatechallenges':
				var data = JSON.parse(data.substr(18));
				var tos = data.challengeTo;
				var froms = data.challengesFrom;
				var insides = '';
				$(".challenges").empty();
				for (var from in froms) {
					var icons = 'You haven\'t set a team yet. (Hint: go to teambuilder)';
					if (client.team && Tools.teams[client.team]) {
						icons = Tools.teams[client.team].name;
						for (var i in Tools.teams[client.team].pokemon) {
							var info = exports.BattlePokedex[toId(Tools.teams[client.team].pokemon[i].species)];
							icons += '<span class="col iconcol" style="width: 32px;height: 24px;' + Tools.getIcon(info) + '"></span>';
						}
					}
					if (froms[from].split('random').length - 1 > 0) icons = '';
					insides += '<div class="challenge">';
					insides += '<div class="challengeHeader">';
					insides += 'Challenge from: ' + from;
					insides += '</div>';
					insides += 'Tier: ' + froms[from];
					insides += '<center>';
					insides += '<div class="teamselection">' + icons + '</div>';
					insides += '<button onclick="Tools.acceptChallenge(\'' + from + '\', \'' + froms[from] + '\');">Accept</button>';
					insides += ' <button onclick="Tools.rejectChallenge(\'' + from + '\');">Reject</button>';
					insides += '</center>';
					insides += '</div>';
				}
				//can only have one challenge sent out at a time
				if (tos) {
					insides += '<div style="background: white;width: 300px;padding: 10px;border: 1px solid black;border-radius: 10px;">';
					insides += 'Waiting on: ' + tos.to + '(' + tos.format + ')<br />';
					insides += '<button onclick="Tools.cancelChallenge(\'' + tos.to + '\');">Cancel Challenge</button>';
					insides += '</div>';
				}
				$(".challenges").html(insides);
				//if (this.rooms['']) {
				//	this.rooms[''].updateChallenges($.parseJSON(data.substr(18)));
				//}
				break;

			case 'updatesearch':
				//if (this.rooms['']) {
				//	this.rooms[''].updateSearch($.parseJSON(data.substr(14)));
				//}
				break;

			case 'popup':
				//this.addPopupMessage(data.substr(7).replace(/\|\|/g, '\n'));
				//if (this.rooms['']) this.rooms[''].resetPending();
				break;

			case 'pm':
				var message = parts.slice(3).join('|');
				var from = parts[1];
				var fromuserid = toId(from);
				Tools.startPM(fromuserid);
				Tools.addPM(fromuserid, message);
				this.rooms['lobby'].addChat(from, message, parts[2]);
				break;

			case 'roomerror':
				//// deprecated; use |deinit| or |noinit|
				//this.unjoinRoom(parts[1]);
				//this.addPopupMessage(parts.slice(2).join('|'));
				//break;

			default:
				// the messagetype wasn't in our list of recognized global
				// messagetypes; so the message is presumed to be for the
				// lobby.
				if (this.rooms['lobby']) {
					this.rooms['lobby'].receive(data);
				}
				break;
		}
	},
	team: undefined,
	defaultTier: 'randombattle',
	searching: false
};