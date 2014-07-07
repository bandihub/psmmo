var Tools = {
	saveChanges: function() {
		var t = Tools.teamsToText();
		$.get("action.php", {action: "save", teams: t, userid: toId(search.username)}, function() {
			popup("Your teams have been saved ^_^\n Now you can take them anywhere hehe");
		});
	},
	login: function(name, password) {
		postProxy("./proxy.php", {
			act: 'login',
			name: name,
			pass: password,
			challengekeyid: client.challengekeyid,
			challenge: client.challenge
		}, function(data) {
			if (data.charAt(0) == "]") {
				data = data.substr(1);
			}
			data = JSON.parse(data);
			if (data.curuser.loggedin) {
				$("#usernumber").html(data.curuser.usernum).parent().show();
				search.username = name;
				$.get("action.php", {userid: toId(name), action: "teams"}, function(teamstxt) {
					var teams = Tools.parseText(teamstxt);
					if (teamstxt != "") for (var i in teams) Tools.teams.push(teams[i]);
					Tools.teamList();
					$("#loginmessage").hide();
				});
				$("#loginform").fadeOut();
				if (client.socket.readyState) {
					client.send('/trn ' + name + ',0,' + data.assertion);
					setTimeout(function() {
						Tools.focusRoom('lobby');
						client.send('/u j|' + vars.character.coordinates.x + '|' + vars.character.coordinates.y);
					}, 1500);
				}
			} else {
				alert("Info is wrong or you're not registered.");
			}
		}, 'text');
	},
	focusRoom: function(roomid) {
		$("#" + client.focusedRoom + "container").hide();
		$("#" + roomid + "container").show();
		client.focusedRoom = roomid;
	},
	chooseChallengeTier: function(userid) {
		var insides = '';
		var t = new Date() / 1;
		insides += '<div id="baby' + t + '" onclick="$(this).remove();$(\'#daddy' + t + '\').remove();" class="opaque" style="z-index: 16;"></div>';
		insides += '<div id="daddy' + t + '" class="challengebox">';
		insides += '<div>' + Tools.tierSelect(t) + '</div>';
		if (client.team !== undefined && Tools.teams[client.team]) {
			var icons = '';
			for (var i in Tools.teams[client.team].pokemon) {
				var info = exports.BattlePokedex[toId(Tools.teams[client.team].pokemon[i].species)];
				icons += '<span class="col iconcol" style="width: 32px;height: 24px;' + Tools.getIcon(info) + '"></span>';
			}
			insides += '<div><b>' + Tools.teams[client.team].name + '</b></div>';
			insides += '<div style="height: 26px;margin: auto;width: 192px;margin: auto;">' + icons + '</div>';
		} else {
			insides += '<div>You haven\'t chosen a team to use yet on the teambuilder.</div>';
		}
		insides += '<div><button onclick="Tools.challenge(\'' + userid + '\', $(\'#tier' + t + '\').val());$(\'#baby' + t + '\').click();">Send Challenge</button></div>';
		insides += '</div>';
		$("body").append(insides);
	},
	dragPM: false,
	startPM: function(to) {
		if (!search.username) return false;
		if (toId(to) == toId(search.username)) return false;
		var pmbox = $("#pm" + to + "-" + toId(search.username));
		if (!pmbox.length) {
			var from = toId(search.username);
			var insides = '';
			insides += '<div id="pm' + to + '-' + from + '" class="pmbox">';
			insides += '<div onmousedown="Tools.dragPM = \'pm' + to + "-" + from + '\';" ontouchstart="Tools.dragPM = \'pm' + to + "-" + from + '\';" class="pmheader">' + to + '<span onmousedown="$(\'#pm' + to + "-" + from + '\').hide();" class="pmexit">x</span></div>';
			insides += '<div id="pmlogs' + to + '-' + from + '" class="pmlogs"></div>';
			insides += '<input id="pminput' + to + '-' + from + '" class="pminput" />';
			insides += '<button onclick="Tools.chooseChallengeTier(\'' + to + '\');">Challenge</button>';
			insides += '</div>';
			$("body").append(insides);
		} else pmbox.show();
	},
	addPM: function(from, message, to) {
		var uid = toId(search.username);
		var logs = $('#pmlogs' + from + "-" + uid);
		if (from == uid) logs = $("#pmlogs" + to + "-" + from);
		logs.append('<div><font color="' + ((uid == from) ? "blue" : "red") + '"><b>' + ((client.rooms.lobby && client.rooms.lobby.users[from]) ? client.rooms.lobby.users[from] : from) + ':</b></font> ' + message + '</div>');
		logs.scrollTop(logs.prop("scrollHeight"));
	},
	noHighlight: function() {
		if (!$("body").hasClass("unselectable")) $("body").addClass("unselectable");
	},
	tierSelect: function(t) {
		if (!t) t = "";
		var insides = '';
		insides += 'Tier: <select onchange="client.defaultTier = this.value;" id="tier' + t + '"><option>' + client.defaultTier + '</option>';
		for (var i in BattleFormats) if (BattleFormats[i].challengeShow && BattleFormats[i].section) insides += '<option value="' + BattleFormats[i].id + '">' + BattleFormats[i].name + '</option>';
		insides += '</select>';
		return insides;
	},
	teamIcons: function() {
		var insides = '';
		if (client.team !== undefined && Tools.teams[client.team]) {
			var icons = '';
			for (var i in Tools.teams[client.team].pokemon) {
				var info = exports.BattlePokedex[toId(Tools.teams[client.team].pokemon[i].species)];
				icons += '<span class="col iconcol" style="width: 32px;height: 24px;' + Tools.getIcon(info) + '"></span>';
			}
			insides += '<div><b>' + Tools.teams[client.team].name + '</b></div>';
			insides += '<div style="height: 26px;margin: auto;width: 192px;margin: auto;">' + icons + '</div>';
		} else {
			insides += '<div>You haven\'t chosen a team to use yet on the teambuilder.</div>';
		}
		return insides;
	},
	showMenu: function() {
		var insides = '';
		var t = new Date() / 1;
		var onclickClose = '$(\'#baby' + t + '\').click()';
		insides += '<div id="baby' + t + '" onclick="$(this).remove();$(\'#daddy' + t + '\').remove();" class="opaque" style="z-index: 16;"></div>';
		insides += '<div id="daddy' + t + '" class="challengebox">';
		insides += '<div><span class="link" onclick="Tools.showTeambuilder();' + onclickClose + '">Open Teambuilder</span></div>';
		insides += Tools.teamIcons();
		insides += '<div>' + Tools.tierSelect(t) + ' <button onclick="Tools.' + ((!client.searching) ? "findBattle" : "cancelFindBattle")	+ '($(\'#tier' + t + '\').val(), this);' + onclickClose + '">'  + ((!client.searching) ? "Look for Battle" : "Cancel Search") + '</button></div>';
		for (var i in client.rooms) insides += '<div>Open <span class="link" onclick="Tools.focusRoom(\'' + client.rooms[i].id + '\');' + onclickClose + '">' + client.rooms[i].title + '</span> or <span class="link" onclick="client.send(\'/leave\', \'' + client.rooms[i].id + '\');' + onclickClose + '">exit</span></div>';
		insides += '<div onclick="' + onclickClose + '">Logout (not done)</div>';
		insides += '<div onclick="' + onclickClose + '">Change Nickname (not done)</div>';
		insides += '<div onclick="' + onclickClose + '">View Registry (not done)</div>';
		insides += '</div>';
		$("body").append(insides);
	},
	showTeambuilder: function() {
		$("#coverbuilder").hide();
		$("#challenges").hide();
		$("#loadteams, #results, #results-scroll, #rightside, #header").show();
		search.updateResults();
	},
	showChat: function() {
		$("#coverbuilder").show();
		$("#challenges").show();
		$("#loadteams, #results, #results-scroll, #rightside, #header").hide();
	},
	escapeQuotes: function (str) {
		str = (str?''+str:'');
		str = str.replace(/'/g, '\\\'');
		return str;
	},
	getTypeIcon: function() {},
	unescapeHTML: function (str) {
		str = (str?''+str:'');
		return str.replace(/&quot;/g, '"').replace(/&gt;/g, '>').
			replace(/&lt;/g, '<').replace(/&amp;/g, '&');
	},
	parseMessage: function (str, linkclass) {
		str = Tools.escapeHTML(str);
		// Don't format console commands (>>).
		if (str.substr(0, 8) === '&gt;&gt;') return str;
		// Don't format console results (<<).
		if (str.substr(0, 8) === '&lt;&lt;') return str;

		var options = {};

		// ``code``
		str = str.replace(/\`\`([^< ]([^<`]*?[^< ])?)\`\`/g,
				options.hidemonospace ? '$1' : '<code>$1</code>');
		// ~~strikethrough~~
		str = str.replace(/\~\~([^< ]([^<]*?[^< ])?)\~\~/g,
				options.hidestrikethrough ? '$1' : '<s>$1</s>');
		// linking of URIs
		if (!options.hidelinks) {
			var classbit = '';
			if (linkclass) {
				classbit = ' class="message-link-' + toId(linkclass) + '"';
			}
			str = str.replace(/(https?\:\/\/[a-z0-9-.]+(\:[0-9]+)?(\/([^\s]*[^\s?.,])?)?|[a-z0-9.]+\@[a-z0-9.]+\.[a-z0-9]{2,3}|([a-z0-9]([a-z0-9-\.]*[a-z0-9])?\.(com|org|net|edu|us)(\:[0-9]+)?|qmark\.tk|hisouten\.koumakan\.jp)((\/([^\s]*[^\s?.,])?)?|\b))/ig, function(uri) {
				if (/[a-z0-9.]+\@[a-z0-9.]+\.[a-z0-9]{2,3}/ig.test(uri)) {
					return '<a href="mailto:'+uri+'" target="_blank"'+classbit+'>'+uri+'</u>';
				}
				// Insert http:// before URIs without a URI scheme specified.
				var fulluri = uri.replace(/^([a-z]*[^a-z:])/g, 'http://$1');
				var onclick;
				var r = new RegExp('^https?://' +
					document.location.hostname.replace(/\./g, '\\.') +
					'/([a-zA-Z0-9-]+)$');
				var m = r.exec(fulluri);
				if (m) {
					onclick = "return selectTab('" + m[1] + "');";
				} else {
					var event;
					if (1 == 1) {
						event = 'External link';
					} else {
						event = 'Interstice link';
						fulluri = Tools.escapeHTML(Tools.interstice.getURI(
								Tools.unescapeHTML(fulluri)
						));
					}
					onclick = 'if (window.ga) ga(\'send\', \'event\', \'' +
							event + '\', \'' + Tools.escapeQuotes(fulluri) + '\');';
				}
				return '<a href="' + fulluri +
					'" target="_blank" onclick="' + onclick + '"' + classbit +
						'>' + uri + '</a>';
			});
			// google [blah]
			// google[blah]
			//   Google search for 'blah'
			str = str.replace(/(\bgoogle ?\[([^\]<]+)\])/ig, function(p0, p1, p2) {
				p2 = Tools.escapeHTML(encodeURIComponent(Tools.unescapeHTML(p2)));
				return '<a href="http://www.google.com/search?ie=UTF-8&q=' + p2 +
					'" target="_blank"' + classbit + '>' + p1 + '</a>';
			});
			// gl [blah]
			// gl[blah]
			//   Google search for 'blah' and visit the first result ("I'm feeling lucky")
			str = str.replace(/(\bgl ?\[([^\]<]+)\])/ig, function(p0, p1, p2) {
				p2 = Tools.escapeHTML(encodeURIComponent(Tools.unescapeHTML(p2)));
				return '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=' + p2 +
					'" target="_blank"' + classbit + '>' + p1 + '</a>';
			});
			// wiki [blah]
			//   Search Wikipedia for 'blah' (and visit the article for 'blah' if it exists)
			str = str.replace(/(\bwiki ?\[([^\]<]+)\])/ig, function(p0, p1, p2) {
				p2 = Tools.escapeHTML(encodeURIComponent(Tools.unescapeHTML(p2)));
				return '<a href="http://en.wikipedia.org/w/index.php?title=Special:Search&search=' +
					p2 + '" target="_blank"' + classbit + '>' + p1 + '</a>';
			});
			// [[blah]]
			//   Short form of gl[blah]
			str = str.replace(/\[\[([^< ]([^<`]*?[^< ])?)\]\]/ig, function(p0, p1) {
				var q = Tools.escapeHTML(encodeURIComponent(Tools.unescapeHTML(p1)));
				return '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=' + q +
					'" target="_blank"' + classbit + '>' + p1 +'</a>';
			});
		}
		// __italics__
		str = str.replace(/\_\_([^< ]([^<]*?[^< ])?)\_\_/g,
				options.hideitalics ? '$1' : '<i>$1</i>');
		// **bold**
		str = str.replace(/\*\*([^< ]([^<]*?[^< ])?)\*\*/g,
			options.hidebold ? '$1' : '<b>$1</b>');

		if (!options.hidespoiler) {
			var spoilerIndex = str.toLowerCase().indexOf('spoiler:');
			if (spoilerIndex < 0) spoilerIndex = str.toLowerCase().indexOf('spoilers:');
			if (spoilerIndex >= 0) {
				var offset = spoilerIndex+8;
				if (str.charAt(offset) === ':') offset++;
				if (str.charAt(offset) === ' ') offset++;
				str = str.substr(0, offset)+'<span class="spoiler">'+str.substr(offset)+'</span>';
			}
		}

		return str;
	},
	acceptChallenge: function(username, tier) {
		if (BattleFormats[tier].team == "preset") {
			//random you don't need a team
			client.send('/accept ' + username);
			return false;
		}
		if (client.team !== undefined && Tools.teams[client.team]) {
			client.send('/utm ' + Tools.packTeam(Tools.teams[client.team].pokemon));
			client.send('/accept ' + username);
			return false;
		}
		alert("You have not set your team yet. To set your team open the teambuilder and click 'use' in the options list.");
	},
	rejectChallenge: function(username) {
		client.send('/reject ' + username);
	},
	cancelChallenge: function(username) {
		client.send('/cancelchallenge ' + username);
	},
	challenge: function(username, tier) {
		if (BattleFormats[tier].team == "preset") {
			//random you don't need a team
			client.send('/challenge ' + username + ", " + tier);
			return false;
		}
		if (client.team !== undefined && Tools.teams[client.team]) {
			client.send('/utm ' + Tools.packTeam(Tools.teams[client.team].pokemon));
			client.send('/challenge ' + username + ", " + tier);
			return false;
		}
		alert("You have not set your team yet. To set your team open the teambuilder and click 'use' in the options list.");
	},
	findBattle: function(tier, el) {
		if (BattleFormats[tier].team == "preset") {
			//random you don't need a team
			client.send('/search ' + tier);
			client.searching = true;
			el.value = "Cancel Search";
			return false;
		}
		if (client.team !== undefined && Tools.teams[client.team]) {
			client.send('/utm ' + Tools.packTeam(Tools.teams[client.team].pokemon));
			client.send('/search ' + tier);
			client.searching = true;
			return false;
		}
		alert("You have not set your team yet. To set your team open the teambuilder and click 'use' in the options list.");
	},
	cancelFindBattle: function(tier, el) {
		client.send('/cancelsearch');
		el.value = "Look for Battle";
		el.value = "Cancel Search";
		client.searching = false;
	},
	packTeam: function (team) {
		//team = Tools.teams[teamkey].pokemon
		var buf = '';
		if (!team) return '';
		for (var i=0; i<team.length; i++) {
			var set = team[i];
			if (buf) buf += ']';
			// name
			buf += (set.nickname || set.species);
			// species
			var id = toId(set.species || set.nickname);
			buf += '|' + (toId(set.nickname || set.species) === id ? '' : id);
			// item
			buf += '|' + toId(set.item);
			// ability
			var template = Tools.getTemplate(set.species || set.nickname);
			var abilities = template.abilities;
			id = toId(set.ability);
			if (abilities) {
				if (id == toId(abilities['0'])) {
					buf += '|';
				} else if (id === toId(abilities['1'])) {
					buf += '|1';
				} else if (id === toId(abilities['H'])) {
					buf += '|H';
				} else {
					buf += '|' + id;
				}
			} else {
				buf += '|' + id;
			}
			// moves
			buf += '|' + set.moves.map(toId).join(',');
			// nature
			buf += '|' + set.nature;
			// evs
			var evs = '|';
			if (set.evs) {
				evs = '|' + (set.evs['hp']||'') + ',' + (set.evs['atk']||'') + ',' + (set.evs['def']||'') + ',' + (set.evs['spa']||'') + ',' + (set.evs['spd']||'') + ',' + (set.evs['spe']||'');
			}
			if (evs === '|,,,,,') {
				buf += '|';
			} else {
				buf += evs;
			}
			// gender
			if (set.gender && set.gender !== template.gender) {
				buf += '|'+set.gender;
			} else {
				buf += '|'
			}
			// ivs
			var ivs = '|';
			if (set.ivs) {
				ivs = '|' + (set.ivs['hp']===31||set.ivs['hp']===undefined ? '' : set.ivs['hp']) + ',' + (set.ivs['atk']===31||set.ivs['atk']===undefined ? '' : set.ivs['atk']) + ',' + (set.ivs['def']===31||set.ivs['def']===undefined ? '' : set.ivs['def']) + ',' + (set.ivs['spa']===31||set.ivs['spa']===undefined ? '' : set.ivs['spa']) + ',' + (set.ivs['spd']===31||set.ivs['spd']===undefined ? '' : set.ivs['spd']) + ',' + (set.ivs['spe']===31||set.ivs['spe']===undefined ? '' : set.ivs['spe']);
			}
			if (ivs === '|,,,,,') {
				buf += '|';
			} else {
				buf += ivs;
			}
			// shiny
			if (set.shiny) {
				buf += '|S';
			} else {
				buf += '|'
			}
			// level
			if (set.level && set.level != 100) {
				buf += '|'+set.level;
			} else {
				buf += '|'
			}
			// happiness
			if (set.happiness !== undefined && set.happiness !== 255) {
				buf += '|'+set.happiness;
			} else {
				buf += '|';
			}
		}
		return buf;
	},
	sanitizeHTML: function (input) {
		return input;
	},
	escapeHTML: function (str, jsEscapeToo) {
		str = (str?''+str:'');
		str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		if (jsEscapeToo) str = str.replace(/'/g, '\\\'');
		return str;
	},
	getTemplate: function(template) {
		if (!template || typeof template === 'string') {
			var name = template;
			var id = toId(name);
			if (exports.BattleAliases && BattleAliases[id]) {
				name = BattleAliases[id];
				id = toId(name);
			}
			if (!exports.BattlePokedex) exports.BattlePokedex = {};
			if (!exports.BattlePokedex[id]) {
				template = exports.BattlePokedex[id] = {};
				for (var k in baseSpeciesChart) {
					if (id.length > k.length && id.substr(0, k.length) === k) {
						template.baseSpecies = k;
						template.forme = id.substr(k.length);
					}
				}
				if (id !== 'yanmega' && id.substr(id.length-4) === 'mega') {
					template.baseSpecies = id.substr(0, id.length-4);
					template.forme = id.substr(id.length-4);
				}
				template.exists = false;
			}
			template = exports.BattlePokedex[id];
			if (template.species) name = template.species;
			if (template.exists === undefined) template.exists = true;
			if (exports.BattleFormatsData && exports.BattleFormatsData[id]) {
				template.tier = exports.BattleFormatsData[id].tier;
				template.isNonstandard = exports.BattleFormatsData[id].isNonstandard;
			}
			if (exports.BattleLearnsets && exports.BattleLearnsets[id]) {
				template.learnset = exports.BattleLearnsets[id].learnset;
			}
			if (!template.id) template.id = id;
			if (!template.name) template.name = name = Tools.escapeHTML(name);
			if (!template.speciesid) template.speciesid = id;
			if (!template.species) template.species = name;
			if (!template.baseSpecies) template.baseSpecies = name;
			if (!template.forme) template.forme = '';
			if (!template.formeLetter) template.formeLetter = '';
			if (!template.spriteid) {
				var formeid = '';
				if (template.baseSpecies !== name) {
					formeid = '-'+toId(template.forme);
					if (formeid === '-megax') formeid = '-mega-x';
					if (formeid === '-megay') formeid = '-mega-y';
				}
				template.spriteid = toId(template.baseSpecies)+formeid;
			}
			if (!template.effectType) template.effectType = 'Template';
		}
		return template;
	},
	getBattleSprite: function(pokemon, backSprite) {
		if (!pokemon) return '';
		var id = toId(pokemon);
		if (pokemon.spriteid) id = pokemon.spriteid;
		if (pokemon.species && !id) {
			var template = Tools.getTemplate(pokemon.species);
			if (template.spriteid) {
				id = template.spriteid;
			} else {
				id = toId(pokemon.species);
			}
		}
		var shiny = (pokemon.shiny?'-shiny':'');
		if (BattlePokemonSprites && BattlePokemonSprites[id] && BattlePokemonSprites[id].front && BattlePokemonSprites[id].front.anif && pokemon.gender === 'F') {
			id+='-f';
		}
		if (backSprite) backSprite = "-back"; else backSprite = '';
		return search.resourcePrefix + 'sprites/bw'+backSprite+shiny+'/'+id+'.png';
	},
	getTeambuilderSprite: function (pokemon) {
		if (!pokemon) return '';
		var id = toId(pokemon);
		if (pokemon.spriteid) id = pokemon.spriteid;
		if (pokemon.species && !id) {
			var template = Tools.getTemplate(pokemon.species);
			if (template.spriteid) {
				id = template.spriteid;
			} else {
				id = toId(pokemon.species);
			}
		}
		var shiny = (pokemon.shiny?'-shiny':'');
		if (BattlePokemonSprites && BattlePokemonSprites[id] && BattlePokemonSprites[id].front && BattlePokemonSprites[id].front.anif && pokemon.gender === 'F') {
			id+='-f';
		}
		return search.resourcePrefix + 'sprites/xyani'+shiny+'/'+id+'.gif';
	},
	getItemIcon: function (item) {
		var num = 0;
		if (typeof item === 'string' && exports.BattleItems) item = exports.BattleItems[toId(item)];
		if (item && item.spritenum) num = item.spritenum;

		var top = Math.floor(num / 16) * 24;
		var left = (num % 16) * 24;
		return 'background:transparent url(' + search.resourcePrefix + 'sprites/itemicons-sheet.png) no-repeat scroll -' + left + 'px -' + top + 'px';
	},
	getIcon: function (pokemon) {
		var num = 0;
		if (pokemon === 'pokeball') {
			return 'background:transparent url(' + search.resourcePrefix + 'sprites/bwicons-pokeball-sheet.png) no-repeat scroll -0px -8px';
		} else if (pokemon === 'pokeball-statused') {
			return 'background:transparent url(' + search.resourcePrefix + 'sprites/bwicons-pokeball-sheet.png) no-repeat scroll -32px -8px';
		} else if (pokemon === 'pokeball-none') {
			return 'background:transparent url(' + search.resourcePrefix + 'sprites/bwicons-pokeball-sheet.png) no-repeat scroll -64px -8px';
		}
		var id = toId(pokemon);
		if (pokemon && pokemon.species) id = toId(pokemon.species);
		if (pokemon && pokemon.volatiles && pokemon.volatiles.formechange && !pokemon.volatiles.transform) id = toId(pokemon.volatiles.formechange[2]);
		if (pokemon && pokemon.num !== undefined) num = pokemon.num;
		else if (window.BattlePokemonSprites && BattlePokemonSprites[id] && BattlePokemonSprites[id].num) num = BattlePokemonSprites[id].num;
		else if (window.BattlePokedex && window.BattlePokedex[id] && BattlePokedex[id].num) num = BattlePokedex[id].num;
		if (num < 0) num = 0;
		if (num > 718) num = 0;
		var altNums = {
			"egg": 731,
			"rotomfan": 779,
			"rotomfrost": 780,
			"rotomheat": 781,
			"rotommow": 782,
			"rotomwash": 783,
			"giratinaorigin": 785,
			"shayminsky": 787,
			"basculinbluestriped": 789,
			"darmanitanzen": 792,
			"deoxysattack": 763,
			"deoxysdefense": 764,
			"deoxysspeed": 766,
			"wormadamsandy": 771,
			"wormadamtrash": 772,
			"cherrimsunshine": 774,
			"castformrainy": 760,
			"castformsnowy": 761,
			"castformsunny": 762,
			"meloettapirouette": 804,
			"meowsticf": 809,
			"floetteeternalflower": 810,
			"tornadustherian": 816,
			"thundurustherian": 817,
			"landorustherian": 818,
			"kyuremblack": 819,
			"kyuremwhite": 820,
			"keldeoresolute": 821,
			"venusaurmega": 864,
			"charizardmegax": 865,
			"charizardmegay": 866,
			"blastoisemega": 867,
			"alakazammega": 868,
			"gengarmega": 869,
			"kangaskhanmega": 870,
			"pinsirmega": 871,
			"gyaradosmega": 872,
			"aerodactylmega": 873,
			"mewtwomegax": 874,
			"mewtwomegay": 875,
			"ampharosmega": 876,
			"scizormega": 877,
			"heracrossmega": 878,
			"houndoommega": 879,
			"tyranitarmega": 880,
			"blazikenmega": 881,
			"gardevoirmega": 882,
			"mawilemega": 883,
			"aggronmega": 884,
			"medichammega": 885,
			"manectricmega": 886,
			"banettemega": 887,
			"absolmega": 888,
			"garchompmega": 889,
			"lucariomega": 890,
			"abomasnowmega": 891,
			"latiasmega": 892,
			"latiosmega": 893,
			"syclant": 832+0,
			"revenankh": 832+1,
			"pyroak": 832+2,
			"fidgit": 832+3,
			"stratagem": 832+4,
			"arghonaut": 832+5,
			"kitsunoh": 832+6,
			"cyclohm": 832+7,
			"colossoil": 832+8,
			"krilowatt": 832+9,
			"voodoom": 832+10,
			"tomohawk": 832+11,
			"necturna": 832+12,
			"mollux": 832+13,
			"aurumoth": 832+14,
			"malaconda": 832+15,
			"cawmodore": 832+16,
		};
		if (altNums[id]) {
			num = altNums[id];
		}
		if (pokemon && pokemon.gender === 'F') {
			if (id === 'unfezant') num = 788;
			else if (id === 'frillish') num = 801;
			else if (id === 'jellicent') num = 802;
			else if (id === 'meowstic') num = 809;
		}

		var top = 8 + Math.floor(num / 16) * 32;
		var left = (num % 16) * 32;
		var fainted = (pokemon && pokemon.fainted?';opacity:.4':'');
		return 'background:transparent url(' + search.resourcePrefix + 'sprites/bwicons-sheet-g6.png?v0.9xyb1) no-repeat scroll -' + left + 'px -' + top + 'px' + fainted;
	},
	importTeam: function() {
		var txt = $("#importer").val();
		var list = false;
		if (txt.split('===').length - 1 > 0) {
			list = true;
		}
		var importedTeams = Tools.parseText(txt, list);
		if (list) {
			var list = "";
			var keyIds = new Array();
			for (var i in importedTeams) {
				var name = importedTeams[i].name;
				var txt = Tools.toText(importedTeams[i].team);
				list += name + "*" + txt + "*|";
				keyIds.push(Tools.teams.length);
				Tools.teams.push(importedTeams[i]);
			}
			tb.showLoad("save");
			
			$.post("action.php", {
				action: "import",
				username: search.username,
				list: list
			}).done(function(data) {
				var splint = data.split(',');
				for (var i in keyIds) {
					Tools.teams[keyIds[i]].id = splint[i];
				}
				$("#showload").hide();
			});
			tb.updateHome();
		}
		else {
			openTeam(false, importedTeams);
			$("#home").hide();
			$("#showload").hide();
		}
	},
	exportTeam: function(cid) {
		if (!Tools.teams[cid]) {
			return false;
		}
		var txt = Tools.toText(Tools.teams[cid].team);
		document.write(txt);
	},
	parseText: function(text) {
		var text = text.split("\n");
		var team = [];
		var curSet = null;
		var list = new Array();
		var teams = false;
		for (var i=0; i<text.length; i++) {
			var line = $.trim(text[i]);
			if (line === '' || line === '---') {
				curSet = null;
			} else if (line.substr(0, 3) === '===') {
				teams = true;
				team = [];
				line = $.trim(line.substr(3, line.length-6));
				var format = '';
				var bracketIndex = line.indexOf(']');
				if (bracketIndex >= 0) {
					format = line.substr(1, bracketIndex-1);
					line = $.trim(line.substr(bracketIndex+1));
				}
				list.push({
					name: line,
					tier: format,
					pokemon: team
				});
			} else if (!curSet) {
				curSet = {nickname: '', species: '', gender: ''};
				team.push(curSet);
				var atIndex = line.lastIndexOf(' @ ');
				if (atIndex !== -1) {
					curSet.item = line.substr(atIndex+3);
					line = line.substr(0, atIndex);
				}
				if (line.substr(line.length-4) === ' (M)') {
					curSet.gender = 'M';
					line = line.substr(0, line.length-4);
				}
				if (line.substr(line.length-4) === ' (F)') {
					curSet.gender = 'F';
					line = line.substr(0, line.length-4);
				}
				var parenIndex = line.lastIndexOf(' (');
				if (line.substr(line.length-1) === ')' && parenIndex !== -1) {
					line = line.substr(0, line.length-1);
					curSet.species = line.substr(parenIndex+2);
					line = line.substr(0, parenIndex);
					curSet.nickname = line;
				} else {
					curSet.nickname = line;
					curSet.species = line;
				}
			} else if (line.substr(0, 7) === 'Trait: ') {
				line = line.substr(7);
				curSet.ability = line;
			} else if (line === 'Shiny: Yes') {
				curSet.shiny = true;
			} else if (line.substr(0, 7) === 'Level: ') {
				line = line.substr(7);
				curSet.level = +line;
			} else if (line.substr(0, 11) === 'Happiness: ') {
				line = line.substr(11);
				curSet.happiness = +line;
			} else if (line.substr(0, 9) === 'Ability: ') {
				line = line.substr(9);
				curSet.ability = line;
			} else if (line.substr(0, 5) === 'EVs: ') {
				line = line.substr(5);
				var evLines = line.split('/');
				curSet.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
				for (var j=0; j<evLines.length; j++) {
					var evLine = $.trim(evLines[j]);
					var spaceIndex = evLine.indexOf(' ');
					if (spaceIndex === -1) continue;
					var statid = BattleStatIDs[evLine.substr(spaceIndex+1)];
					var statval = parseInt(evLine.substr(0, spaceIndex));
					if (!statid) continue;
					curSet.evs[statid] = statval;
				}
			} else if (line.substr(0, 5) === 'IVs: ') {
				line = line.substr(5);
				var ivLines = line.split(' / ');
				curSet.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
				for (var j=0; j<ivLines.length; j++) {
					var ivLine = ivLines[j];
					var spaceIndex = ivLine.indexOf(' ');
					if (spaceIndex === -1) continue;
					var statid = BattleStatIDs[ivLine.substr(spaceIndex+1)];
					var statval = parseInt(ivLine.substr(0, spaceIndex));
					if (!statid) continue;
					curSet.ivs[statid] = statval;
				}
			} else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
				var natureIndex = line.indexOf(' Nature');
				if (natureIndex === -1) natureIndex = line.indexOf(' nature');
				if (natureIndex === -1) continue;
				line = line.substr(0, natureIndex);
				curSet.nature = line;
			} else if (line.substr(0,1) === '-' || line.substr(0,1) === '~') {
				line = line.substr(1);
				if (line.substr(0,1) === ' ') line = line.substr(1);
				if (!curSet.moves) curSet.moves = [];
				if (line.substr(0,14) === 'Hidden Power [') {
					var hptype = line.substr(14, line.length-15);
					line = 'Hidden Power ' + hptype;
					if (!curSet.ivs) {
						curSet.ivs = {};
						for (var stat in exports.BattleTypeChart[hptype].HPivs) {
							curSet.ivs[stat] = exports.BattleTypeChart[hptype].HPivs[stat];
						}
					}
				}
				curSet.moves.push(line);
			}
		}
		if (teams) {
			for (var x in list) {
				var timestoadd = 6 - list[x].pokemon.length;
				for (var i = 0; i < timestoadd; i++) list[x].pokemon.push(Tools.missingno());
				for (var i in list[x].pokemon) {
					if (!list[x].pokemon[i].ivs) list[x].pokemon[i].ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
					if (!list[x].pokemon[i].level) list[x].pokemon[i].level = 100;
				}
			}
		} else {
			var timestoadd = 6 - team.length;
			for (var i = 0; i < timestoadd; i++) team.push(Tools.missingno());
			for (var i in team.pokemon) {
				if (!team.pokemon[i].ivs) team.pokemon[i].ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
				if (!team.pokemon[i].level) team.pokemon[i].level = 100;
			}
		}
		if (teams) return list;
		return [{
			name: "Untitled",
			pokemon: team,
			tier: ""
		}];
	},
	teamsToText: function() {
		var buf = '';
		for (var i=0,len=Tools.teams.length; i<len; i++) {
			var team = Tools.teams[i];
			buf += '=== '+team.name+' ===\n\n';
			buf += this.toText(team.pokemon);
			buf += '\n';
		}
		return buf;
	},
	toText: function(team) {
		var text = '';
		for (var i=0; i<team.length; i++) {
			var curSet = team[i];
			if (curSet.species != "Missingno.") {
				if (curSet.nickname !== curSet.species && curSet.nickname != "") {
					text += ''+curSet.nickname+' ('+curSet.species+')';
				} else {
					text += ''+curSet.species;
				}
				if (curSet.gender === 'M') text += ' (M)';
				if (curSet.gender === 'F') text += ' (F)';
				if (curSet.item) {
					text += ' @ '+curSet.item;
				}
				text += "\n";
				if (curSet.ability) {
					text += 'Trait: '+curSet.ability+"\n";
				}
				if (curSet.level && curSet.level != 100) {
					text += 'Level: '+curSet.level+"\n";
				}
				if (curSet.shiny) {
					text += 'Shiny: Yes\n';
				}
				if (curSet.happiness && curSet.happiness !== 255) {
					text += 'Happiness: '+curSet.happiness+"\n";
				}
				var first = true;
				for (var j in curSet.evs) {
					if (!curSet.evs[j]) continue;
					if (first) {
						text += 'EVs: ';
						first = false;
					} else {
						text += ' / ';
					}
					text += ''+curSet.evs[j]+' '+BattlePOStatNames[j];
				}
				if (!first) {
					text += "\n";
				}
				if (curSet.nature) {
					text += ''+curSet.nature+' Nature'+"\n";
				}
				var first = true;
				if (curSet.ivs) {
					var defaultIvs = true;
					var hpType = false;
					for (var j=0; j<curSet.moves.length; j++) {
						var move = curSet.moves[j];
						if (move.substr(0,13) === 'Hidden Power ' && move.substr(0,14) !== 'Hidden Power [') {
							hpType = move.substr(13);
							for (var stat in BattleStatNames) {
								if (curSet.ivs[stat] !== exports.BattleTypeChart[hpType].HPivs[stat]) {
									if (!(typeof curSet.ivs[stat] === 'undefined' && exports.BattleTypeChart[hpType].HPivs[stat] == 31) &&
										!(curSet.ivs[stat] == 31 && typeof exports.BattleTypeChart[hpType].HPivs[stat] === 'undefined')) {
										defaultIvs = false;
										break;
									}
								}
							}
						}
					}
					if (defaultIvs && !hpType) {
						for (var stat in BattleStatNames) {
							if (curSet.ivs[stat] !== 31 && typeof curSet.ivs[stat] !== undefined) {
								defaultIvs = false;
								break;
							}
						}
					}
					if (!defaultIvs) {
						for (var stat in curSet.ivs) {
							if (typeof curSet.ivs[stat] === 'undefined' || curSet.ivs[stat] == 31) continue;
							if (first) {
								text += 'IVs: ';
								first = false;
							} else {
								text += ' / ';
							}
							text += ''+curSet.ivs[stat]+' '+BattlePOStatNames[stat];
						}					
					}
				}
				if (!first) {
					text += "\n";
				}
				if (curSet.moves) for (var j=0; j<curSet.moves.length; j++) {
					var move = curSet.moves[j];
					if (move.substr(0,13) === 'Hidden Power ') {
						move = move.substr(0,13) + '[' + move.substr(13) + ']';
					}
					text += '- '+move+"\n";
				}
				text += "\n";
			}
		}
		return text.split("Happiness: 255\n").join("");
	},
	missingno: function() {
		return {
			nickname: "",
			species: "Missingno.",
			item: "",
			ability: "",
			evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
			ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
			nature: "Serious",
			moves: ["", "", "", ""],
			gender: "",
			level: 100,
			shiny: "No",
			happiness: 255
		};
	},
	newTeam: function(addto) {
		Tools.team = addto;
		Tools.teams.splice(addto, 0, {
			name: "Untitled",
			pokemon: [Tools.missingno(), Tools.missingno(), Tools.missingno(), Tools.missingno(), Tools.missingno(), Tools.missingno()],
			tier: ""
		});
		Tools.focusedSlot = 0;
		$("#loadteams").hide();
		Tools.monInfo(0);
	},
	team: undefined,
	teams: [],
	focusedSlot: 0,
	monInfo: function(slot) {
		if (!slot) var slot = Tools.focusedSlot;
		var info = Tools.teams[Tools.team].pokemon[slot];
		var dontleaveblank = ["species", "item", "ability", "nature"];
		var insteadofblank = ["PKMN", "ITEM", "ABILITY", "Serious"];
		for (var i in info) {
			var index = dontleaveblank.indexOf(i);
			if (index != -1) {
				var val = info[i];
				if (i == "species" && val == "Missingno.") val = "";
				if (val == "") val = insteadofblank[index];
				$(".edit-" + i).html(val);
			}
		}
		for (var i in info.moves) {
			var val = info.moves[i];
			if (val == "") val = "MOVE" + (Math.floor(i) + 1);
			$(".edit-move" + i).html(val);
		}
		for (var i in info.evs) {
			$(".edit-ev-" + i).html(info.evs[i]);
			if (info.evs[i]) $(".evc-" + i).show(); else $(".evc-" + i).hide();
		}
		var src = Tools.getTeambuilderSprite(info);
		if ($(".edit-img").attr("src") == src) return false;
		$(".edit-img").attr("src", src);
		if (info.species == "Missingno.") $(".edit-img").attr("src", search.resourcePrefix + "sprites/bw/" + toId(info.species) + ".png");
	},
	getStats: function(mon) {
		var stats = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
		function stat(mon, stat, ev, iv, level, nature) {
			var statval = 0;
			var base = exports.BattlePokedex[toId(mon.species)].baseStats;
			var natureval = 1;
			var nature = BattleNatures[nature];
			if (Object.keys(nature).length) {
				//not a neutral nature
				if (nature.plus == stat) natureval = 1.1;
				if (nature.minus == stat) natureval = 0.9;
			}
			if (stat == "hp") statval = ((iv + 2 * base.hp + (ev / 4) ) * level / 100) + 10 + level;
			if (stat != "hp") statval = (((iv + 2 * base[stat] + (ev / 4) ) * level / 100 ) + 5) * natureval;
			return Math.floor(statval);
		}
		for (var i in mon.evs) stats[i] = stat(mon, i, mon.evs[i], mon.ivs[i], mon.level, mon.nature);
		return stats;
	},
	pickMon: function(slot) {
		if (slot == Tools.focusedSlot) return false;
		Tools.focusedSlot = slot;
		Tools.updateTeambar();
		Tools.monInfo();
	},
	updateTeambar: function() {
		var insides = '';
		for (var i = 0; i < 6; i++) {
			var disabled = "";
			if (i == Tools.focusedSlot) disabled = " disabled=\"disabled\"";
			var species = Tools.teams[Tools.team].pokemon[i].species;
			insides += '<button' + disabled + ' onmousedown="Tools.pickMon(' + i + ');" class="pokemon"><span class="pokemonicon" style="' + Tools.getIcon(exports.BattlePokedex[toId(species)]) + '"></span>' + species + '</button>';
		}
		$(".teambar").html(insides);
	},
	setAttribute: function(attr, val, arraytype) {
		if (arraytype == "move") arraytype = "moves";
		var mon = Tools.teams[Tools.team].pokemon[Tools.focusedSlot];
		if (arraytype) mon[arraytype][attr] = val; else mon[attr] = val;
		if (attr == "species") {
			Tools.updateTeambar();
		}
		Tools.monInfo();
	},
	addTeam: function(addto) {
		Tools.newTeam(addto);
		Tools.updateTeambar();
	},
	deleteTeam: function(team) {
		var t = Tools.teams[team];
		var areusure = confirm("Are you sure you want to delete team '" + t.name + "'?");
		if (areusure) {
			Tools.teams.splice(team, 1);
			Tools.teamList();
		}
	},
	teamList: function() {
		var insides = '';
		for (var i in Tools.teams) {
			insides += '<div style="margin: 5px;background: rgb(240, 240, 240);"><b contenteditable="true" onkeyup="if (this.innerHTML == \'\') {this.innerHTML = \'Untitled\';} Tools.teams[' + i + '].name = this.innerHTML;">' + Tools.teams[i].name + '</b><div style="width: 192px;height: 6px;margin: auto;">';
			for (var x in Tools.teams[i].pokemon) {
				var info = exports.BattlePokedex[toId(Tools.teams[i].pokemon[x].species)];
				insides += '<span class="col iconcol" style="width: 32px;height: 24px;' + Tools.getIcon(info) + '"></span>';
			}
			insides += '</div><br /><span class="link" onclick="Tools.selectTeam(' + i + ');">Edit</span> || <span class="link" onclick="Tools.deleteTeam(' + i + ');">Delete</span> || <span class="link" onclick="popup(Tools.toText(Tools.teams[' + i + '].pokemon));">Export</span> || <span class="link" onclick="Tools.setTeam(' + i + ');">USE</span></div>';
		}
		$("#teamList").html(insides);
	},
	selectTeam: function(teamid) {
		Tools.team = teamid;
		Tools.focusedSlot = 0;
		$("#loadteams").hide();
		Tools.monInfo(0);
		Tools.updateTeambar();
	},
	setTeam: function(teamid) {
		client.team = teamid;
		eatcookie("defaultTeam");
		bake("defaultTeam", teamid, 365);
	},
	importPrompty: function() {
		var txt = prompt("Paste your teams to import.");
		if (!txt) return false;
		var teams = Tools.parseText(txt);
		if (!(!teams || !txt || !teams.length)) for (var i in teams) Tools.teams.push(teams[i]);
		Tools.teamList();
	}
};
