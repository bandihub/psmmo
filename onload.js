$(function() {
	//resize to fit
	if ($("#header").width() > 650) $("#header").width(650);
	$("#results").css({
		width: $("#header").width(),
		top: $("#header").height(),
		left: $("#header").position().left
	}).height($("body").height() - $("#header").height());
	search.ogPerScroll = $("#results").height() / search.resultHeight; //amount of results before u have to scroll (remaining pixels / resulheight)
	search.perScroll = Math.ceil(search.ogPerScroll);
	if (search.perScroll - search.ogPerScroll != 0) search.leftovers = true;
	$("#results-scroll").css({
		left: $("#results").width() - $("#results-scroll").width() - 5,
		top: $("#header").height + 5
	});
	$("#rightside").width($("body").width() - $("#results").width() - 10).height($("body").height());
		$(".editmon").css("line-height", "1.5em");
	if ($("body").width() / 2 <= 88 * 6) {
		//small screen
		//there's not enough room for the teambar to fit
		//each button is 88px * 6 = 528px
		var buttonsize = ($("body").width() / 2) / 6;
		$("body").append('<style>.teambar button {width: ' + buttonsize + 'px !important;}</style>');
		$("#returntoteamlist").css({
			"left": $("body").width() - $("#returntoteamlist button").width(),
			"z-index": 1
		});
		$(".edit-img").css({
			position: "absolute",
			bottom: 0,
			right: 0
		});
		$(".editmon").css("line-height", "default");
	}
	Tools.showChat();
	if (cookie("defaultTeam")) client.team = cookie("defaultTeam");
	
	//events
	$("#results").bind('mousewheel DOMMouseScroll', function(event){
		if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
			// scroll up
			search.scrollAt -= 5;
			if (search.scrollAt < 0) search.scrollAt = 0;
		}
		else {
			// scroll down
			search.scrollAt += 5;
			if (search.scrollAt > search.results.length - search.perScroll) search.scrollAt = search.results.length - search.perScroll;
		}
		search.updateResults();
	});
	$(document).on("mousedown touchstart", function(e) {
		var touch = e;
		if (e.originalEvent.touches) touch = e.originalEvent.touches[0];
		search.lastDown = touch;
	}).on("mousedown touchstart", "#results-scroll", function(e) {
		var touch = e;
		if (e.originalEvent.touches) touch = e.originalEvent.touches[0];
		search.draggingScroll = touch;
		$("body").addClass("unselectable");
	}).on("mousemove touchmove", function(e) {
		var touch = e;
		if (e.originalEvent.touches) touch = e.originalEvent.touches[0];
		touch.pageY -= $("#results").position().top;
		if (search.draggingScroll) {
			search.scrollAt = Math.round((((touch.pageY - 5) / ($("#results").height() - 10)) * (search.results.length * search.resultHeight)) / search.resultHeight);
			if (search.scrollAt < 0) search.scrollAt = 0;
			if (search.scrollAt > search.results.length - search.perScroll) search.scrollAt = search.results.length - search.perScroll;
			search.updateResults();
		}
		var inresults = false;
		if ($(e.target).attr("id") == "results") inresults = true;
		if ($(e.target).parent().attr("id") == "results") inresults = true;
		if ($(e.target).parent().parent().attr("id") == "results") inresults = true;
		if ($(e.target).parent().parent().parent().attr("id") == "results") inresults = true;
		if (inresults && e.originalEvent.touches && search.lastDown) {
			var diffY = search.lastDown.pageY - touch.pageY;
			if (diffY < 0) {
				//going down
				search.scrollAt -= 1;
			} else if (diffY > 0) {
				//going up
				search.scrollAt += 1;
			}
			if (search.scrollAt < 0) search.scrollAt = 0;
			if (search.scrollAt > search.results.length - search.perScroll) search.scrollAt = search.results.length - search.perScroll;
			search.updateResults();
		}
		if (search.pully) {
			var val = Math.floor((touch.pageX - $(".pully").offset().left) / 4) * 4;
			if (val > 252) val = 252;
			if (val < 0) val = 0;
			var ev = $(search.pully).attr("id");
			var mon = Tools.teams[Tools.team].pokemon[Tools.focusedSlot];
			var futuretot = 0;
			for (var i in mon.evs) futuretot += mon.evs[i];
			futuretot = futuretot - mon.evs[ev] + val;
			if (futuretot <= 508) {
				$(search.pully).css("left", val + "px").html(val);
				mon.evs[ev] = val;
				$("#stat" + ev).html(Tools.getStats(mon)[ev]);
				var addorremove = "remove";
				var tot = 0;
				for (var i in mon.evs) tot += mon.evs[i];
				if (tot > 508) addorremove = "add";
				var left = 508 - tot;
				$("#evsused")[addorremove + "Class"]("red").html(tot + "/" + 508 + " evs used. " + left + " left.");
			}
		}
		if (Tools.dragPM) {
			var el = $("#" + Tools.dragPM);
			var coordinateY = touch.pageY;
			el.css({
				left: (touch.pageX - el.width() / 2) + "px",
				top: coordinateY + "px",
				margin: 0
			});
			var headerCoordinateY = el.offset().top;
			if ($("#" + Tools.dragPM + " .pmheader").length) headerCoordinateY = $("#" + Tools.dragPM + " .pmheader").offset().top;
			if (headerCoordinateY < 0) el.css("top", (Math.abs(headerCoordinateY) + touch.pageY) + "px");
		}
		if (e.target.id == "results-scroll" || search.pully || Tools.dragPM) {
			Tools.noHighlight();
			e.preventDefault();
			return false;
		}
	}).on("mouseup touchend", function(e) {
		search.draggingScroll = false;
		search.lastDown = false;
		search.pully = undefined;
		Tools.dragPM = false;
		$("body").removeClass("unselectable");
	});
	$("body").on("focus click", ".editmon span", function() {
		var s = this.id;
		if (s) {
			this.innerHTML = replacewithnbsps(this.innerHTML.replace(/ /g, "").replace(/&nbsp;&nbsp;/g, "1"));
			if (this.innerHTML.replace(/ /g, "").replace(/&nbsp;/g, "") == "") this.innerHTML = replacewithnbsps("1234");
			search.attribute = search.translate[s];if (!search.attribute) {search.attribute = $(this).attr("class").replace("edit-move", "");}search.search(this.innerHTML.replace(/ /g, "").replace(/&nbsp;/g, ""), s); //first results
		}
	}).on("blur", ".editmon span", function() {
		var attribute = $(this).attr("class").replace("edit-", "");
		var arraytype;
		if (attribute.split('move').length - 1 > 0) arraytype = "move";
		attribute = attribute.replace("move", "");
		if (this.id) {
			var searchy = this.innerHTML.replace(/ /g, "").replace(/&nbsp;/g, "");
			var item = exports[this.id][toId(searchy)];
			if (item || attribute == "nickname") {
				Tools.setAttribute(attribute, (item.name) ? item.name : item.species, arraytype);
			}
		}
		Tools.monInfo();
	});
	$(".editmon span").keydown(function(e) {
		if (e.keyCode == 13) return false;
	}).keyup(function(e) {
		var s = this.id;
		if (s) {
			search.attribute = search.translate[s];if (!search.attribute) {search.attribute = $(this).attr("class").replace("edit-move", "");}search.search(this.innerHTML.replace(/ /g, "").replace(/&nbsp;/g, ""), s);
			if (this.innerHTML.replace(/ /g, "").replace(/&nbsp;/g, "") == "") this.innerHTML = replacewithnbsps("1234");
		}
		if (e.keyCode == 13) {
			if (search.results.length) this.innerHTML = search.results[0];
			var attribute = $(this).attr("class").replace("edit-", "");
			var arraytype;
			if (attribute.split('move').length - 1 > 0) arraytype = "move";
			attribute = attribute.replace("move", "");
			if (this.id) {
				var searchy = this.innerHTML.replace(/ /g, "").replace(/&nbsp;/g, "");
				var item = exports[this.id][toId(searchy)];
				if (item || attribute == "nickname") {
					Tools.setAttribute(attribute, (item.name) ? item.name : item.species, arraytype);
				}
			}
			Tools.monInfo();
		}
	});
	$("body").on("click", ".user", function() {
		Tools.startPM(this.id.replace("u", "").split("-")[1]);
		return false;
	}).on("keypress", ".pminput", function(e) {
		if (e.keyCode == 13 && this.value) {
			var msg = this.value;
			var to = this.id.split("-")[0].replace("pminput", "");
			client.send('/msg ' + to + ',' + msg);
			Tools.addPM(search.username, msg, to);
			this.value = "";
		}
	}).on("click", ".ilink", function(e) {
		client.send('/join ' + $(this).attr("href").substr(1));
		e.preventDefault();
		return false;
	}).on("click", ".alive", function() {
		var mon = this.id.split("-")[0];
		var roomid = this.id.substr(mon.length + 1);
		if (!mon || !roomid) return false;
		var command = "team";
		var room = client.rooms[roomid];
		if (room.teamPreviewSelectionDone) command = "switch";
		if (room.decision) return false;
		if (command == "team") room.battle.turn = 1;
		var slot = Math.floor(mon) + 1;
		if (slot == 1 && command == "switch") return false;
		var decision = '/' + command + ' ' + slot + "|" + room.battle.turn;
		room.decision = decision;
		room.cancelShow();
		client.send(decision, roomid);
	}).on("click", ".battle .buttons button", function() {
		if (this.disabled) return false;
		var move = this.id.split("---")[0];
		var roomid = this.id.substr(move.length + 3);
		var room = client.rooms[roomid];
		if (room.decision) return false;
		var megaornaw = "";
		if (room.battle.side.pokemon[0].canMegaEvo) megaornaw = ((confirm("Would you like to mega evolve?")) ? " mega" : "");
		var decision = '/choose move ' + move + megaornaw + "|" + room.battle.rqid;
		room.decision = decision;
		room.cancelShow();
		client.send(decision, roomid);
	}).on("click", ".registry a", function(e) {
		var server = this.href;
		if (server.split('.psim.us').length - 1 > 0) {
			server = server.split('.psim.us')[0].replace("http://", "").replace("https://", "").replace("www.", "");
		}
		if (server.split('/servers/').length - 1 > 0) {
			server = server.split('/servers/')[1];
		}
		window.location.href = window.location.origin + window.location.pathname + "?h=" + server + ".psim.us";
		return false;
		e.preventDefault();
	});
	
	search.attribute = "species";search.search("", "BattlePokedex"); //first results
	client.connectServer();
})
function replacewithnbsps(txt) {
	var s = "";
	for (var i in txt) s += "&nbsp;&nbsp;";
	return s;
}
function toId(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return toId(text && text.id);
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function postProxy(a, b, c) {
	var datastring = "?post=";
	for (var i in b) {
		datastring += escape(i) + ":" + escape(b[i]) + "|";
	}
	$.get(a + datastring, c);
}
function getProxy(ab, c) {
	var splint = ab.split('?');
	var datastring = splint[1].split("=").join(":").split("&").join("|");
	$.get(splint[0] + "?post=" + datastring, c);
}
function popup(html) {
	var d = new Date() / 1;
	var other = '<textarea id="baby' + d + '" style="z-index: 11;top: 0;position: absolute;height: 100%;left: 50%;font-size: 12px;background: #f6f6f6;outline: 1px solid #e6e6e6;border-radius: 5px;margin: 0;padding: 0;border: none;margin-left: -150px;width: 300px;">' + html + '</textarea>';
	if (html == "evs") {
		var insides = '<div style="position: relative;width: 100%;height: 100%;">';
		var max = 508;
		var pullies = ["hp", "atk", "def", "spa", "spd", "spe"];
		var namesies = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
		var mon = Tools.teams[Tools.team].pokemon[Tools.focusedSlot];
		var stats = Tools.getStats(mon);
		var tot = 0;
		for (var i in pullies) {
			var val = mon.evs[pullies[i]];
			tot += val;
			insides += '<div class="statline"><span class="pullylabel">' + namesies[i] + ':</span><div class="pullycontainer"><span class="pully"></span><span id="' + pullies[i] + '" class="pullyval" style="left: ' + val + 'px;" onmousedown="search.pully = this;" ontouchstart="search.pully = this;e.preventDefault();return false;">' + val + '</span></div><span id="stat' + pullies[i] + '" class="pullystatval">' + stats[pullies[i]] + '</span></div>';
		}
		var left = 508 - tot;
		insides += '<div id="evsused" class="' + ((tot > 508) ? ' red' : '') + '">' + tot + '/508 evs used. ' + left + ' left.</div>';
		insides += '</div>';
		other = '<div id="baby' + d + '" style="z-index: 11;position: absolute;top: 50%;left: 50%;width: 366px;height: 280px;margin-left: -150px;margin-top: -140px;background: #f6f6f6;outline: 1px solid #e6e6e6;border-radius: 5px;">' + insides + '</div>';
	}
	if (html == "nature") {
		var insides = '<div style="position: relative;width: 100%;height: 100%;">';
		var max = 508;
		var stats = {"Attack": "atk", "Defense": "def", "Sp. Atk": "spa", "Sp. Def": "spd", "Speed": "spe"};
		var bypluses = {};
		for (var stat in stats) {
			for (var nature in BattleNatures) {
				if (!bypluses[stat]) bypluses[stat] = new Array();
				if (BattleNatures[nature].plus == stats[stat]) bypluses[stat].push(nature);
			}
		}
		for (var i in bypluses) {
			var natures = '';
			for (var x in bypluses[i]) natures += '<li><span onclick="Tools.setAttribute(\'nature\', \'' + bypluses[i][x] + '\');Tools.monInfo();$(\'#daddy' + d + '\').click();" class="link">' + bypluses[i][x] + '(-' + BattleNatures[bypluses[i][x]].minus + ')</span></li>';
			insides += "+" + i + "<ul>" + natures + "</ul>";
		}
		insides += '</div>';
		other = '<div id="baby' + d + '" style="overflow: auto;z-index: 11;position: absolute;top: 50%;left: 50%;width: 366px;height: 280px;margin-left: -150px;margin-top: -140px;background: #f6f6f6;outline: 1px solid #e6e6e6;border-radius: 5px;">' + insides + '</div>';
	}
	$("body").append('<div id="daddy' + d + '" onclick="if (Tools.teams[Tools.team]) {Tools.monInfo();}$(this).remove();$(\'#baby' + d + '\').remove();" style="cursor: pointer;position: absolute;z-index: 10;top: 0;left: 0;width: 100%;height: 100%;background: rgba(255, 255, 255, 0.5);"></div>' + other);
}
function toRoomid(roomid) {
		return roomid.replace(/[^a-zA-Z0-9-]+/g, '');
}
function toUserid(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return ''; //???
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function MD5(f) {
    function i(b, c) {
        var d, e, f, g, h;
        f = b & 2147483648;
        g = c & 2147483648;
        d = b & 1073741824;
        e = c & 1073741824;
        h = (b & 1073741823) + (c & 1073741823);
        return d & e ? h ^ 2147483648 ^ f ^ g : d | e ? h & 1073741824 ? h ^ 3221225472 ^ f ^ g : h ^ 1073741824 ^ f ^ g : h ^ f ^ g
    }

    function j(b, c, d, e, f, g, h) {
        b = i(b, i(i(c & d | ~c & e, f), h));
        return i(b << g | b >>> 32 - g, c)
    }

    function k(b, c, d, e, f, g, h) {
        b = i(b, i(i(c & e | d & ~e, f), h));
        return i(b << g | b >>> 32 - g, c)
    }

    function l(b, c, e, d, f, g, h) {
        b = i(b, i(i(c ^ e ^ d, f), h));
        return i(b << g | b >>> 32 - g, c)
    }

    function m(b, c, e, d, f, g, h) {
        b = i(b, i(i(e ^ (c | ~d),
            f), h));
        return i(b << g | b >>> 32 - g, c)
    }

    function n(b) {
        var c = "",
            e = "",
            d;
        for (d = 0; d <= 3; d++) e = b >>> d * 8 & 255, e = "0" + e.toString(16), c += e.substr(e.length - 2, 2);
        return c
    }
    var g = [],
        o, p, q, r, b, c, d, e, f = function (b) {
            for (var b = b.replace(/\r\n/g, "\n"), c = "", e = 0; e < b.length; e++) {
                var d = b.charCodeAt(e);
                d < 128 ? c += String.fromCharCode(d) : (d > 127 && d < 2048 ? c += String.fromCharCode(d >> 6 | 192) : (c += String.fromCharCode(d >> 12 | 224), c += String.fromCharCode(d >> 6 & 63 | 128)), c += String.fromCharCode(d & 63 | 128))
            }
            return c
        }(f),
        g = function (b) {
            var c, d = b.length;
            c =
                d + 8;
            for (var e = ((c - c % 64) / 64 + 1) * 16, f = Array(e - 1), g = 0, h = 0; h < d;) c = (h - h % 4) / 4, g = h % 4 * 8, f[c] |= b.charCodeAt(h) << g, h++;
            f[(h - h % 4) / 4] |= 128 << h % 4 * 8;
            f[e - 2] = d << 3;
            f[e - 1] = d >>> 29;
            return f
        }(f);
    b = 1732584193;
    c = 4023233417;
    d = 2562383102;
    e = 271733878;
    for (f = 0; f < g.length; f += 16) o = b, p = c, q = d, r = e, b = j(b, c, d, e, g[f + 0], 7, 3614090360), e = j(e, b, c, d, g[f + 1], 12, 3905402710), d = j(d, e, b, c, g[f + 2], 17, 606105819), c = j(c, d, e, b, g[f + 3], 22, 3250441966), b = j(b, c, d, e, g[f + 4], 7, 4118548399), e = j(e, b, c, d, g[f + 5], 12, 1200080426), d = j(d, e, b, c, g[f + 6], 17, 2821735955), c =
        j(c, d, e, b, g[f + 7], 22, 4249261313), b = j(b, c, d, e, g[f + 8], 7, 1770035416), e = j(e, b, c, d, g[f + 9], 12, 2336552879), d = j(d, e, b, c, g[f + 10], 17, 4294925233), c = j(c, d, e, b, g[f + 11], 22, 2304563134), b = j(b, c, d, e, g[f + 12], 7, 1804603682), e = j(e, b, c, d, g[f + 13], 12, 4254626195), d = j(d, e, b, c, g[f + 14], 17, 2792965006), c = j(c, d, e, b, g[f + 15], 22, 1236535329), b = k(b, c, d, e, g[f + 1], 5, 4129170786), e = k(e, b, c, d, g[f + 6], 9, 3225465664), d = k(d, e, b, c, g[f + 11], 14, 643717713), c = k(c, d, e, b, g[f + 0], 20, 3921069994), b = k(b, c, d, e, g[f + 5], 5, 3593408605), e = k(e, b, c, d, g[f + 10], 9, 38016083),
        d = k(d, e, b, c, g[f + 15], 14, 3634488961), c = k(c, d, e, b, g[f + 4], 20, 3889429448), b = k(b, c, d, e, g[f + 9], 5, 568446438), e = k(e, b, c, d, g[f + 14], 9, 3275163606), d = k(d, e, b, c, g[f + 3], 14, 4107603335), c = k(c, d, e, b, g[f + 8], 20, 1163531501), b = k(b, c, d, e, g[f + 13], 5, 2850285829), e = k(e, b, c, d, g[f + 2], 9, 4243563512), d = k(d, e, b, c, g[f + 7], 14, 1735328473), c = k(c, d, e, b, g[f + 12], 20, 2368359562), b = l(b, c, d, e, g[f + 5], 4, 4294588738), e = l(e, b, c, d, g[f + 8], 11, 2272392833), d = l(d, e, b, c, g[f + 11], 16, 1839030562), c = l(c, d, e, b, g[f + 14], 23, 4259657740), b = l(b, c, d, e, g[f + 1], 4, 2763975236),
        e = l(e, b, c, d, g[f + 4], 11, 1272893353), d = l(d, e, b, c, g[f + 7], 16, 4139469664), c = l(c, d, e, b, g[f + 10], 23, 3200236656), b = l(b, c, d, e, g[f + 13], 4, 681279174), e = l(e, b, c, d, g[f + 0], 11, 3936430074), d = l(d, e, b, c, g[f + 3], 16, 3572445317), c = l(c, d, e, b, g[f + 6], 23, 76029189), b = l(b, c, d, e, g[f + 9], 4, 3654602809), e = l(e, b, c, d, g[f + 12], 11, 3873151461), d = l(d, e, b, c, g[f + 15], 16, 530742520), c = l(c, d, e, b, g[f + 2], 23, 3299628645), b = m(b, c, d, e, g[f + 0], 6, 4096336452), e = m(e, b, c, d, g[f + 7], 10, 1126891415), d = m(d, e, b, c, g[f + 14], 15, 2878612391), c = m(c, d, e, b, g[f + 5], 21, 4237533241),
        b = m(b, c, d, e, g[f + 12], 6, 1700485571), e = m(e, b, c, d, g[f + 3], 10, 2399980690), d = m(d, e, b, c, g[f + 10], 15, 4293915773), c = m(c, d, e, b, g[f + 1], 21, 2240044497), b = m(b, c, d, e, g[f + 8], 6, 1873313359), e = m(e, b, c, d, g[f + 15], 10, 4264355552), d = m(d, e, b, c, g[f + 6], 15, 2734768916), c = m(c, d, e, b, g[f + 13], 21, 1309151649), b = m(b, c, d, e, g[f + 4], 6, 4149444226), e = m(e, b, c, d, g[f + 11], 10, 3174756917), d = m(d, e, b, c, g[f + 2], 15, 718787259), c = m(c, d, e, b, g[f + 9], 21, 3951481745), b = i(b, o), c = i(c, p), d = i(d, q), e = i(e, r);
    return (n(b) + n(c) + n(d) + n(e)).toLowerCase()
};
var colorCache = {};
var hashColor = function (name) {
    if (colorCache[name]) return colorCache[name];

    var hash = MD5(name);
    var H = parseInt(hash.substr(4, 4), 16) % 360;
    var S = parseInt(hash.substr(0, 4), 16) % 50 + 50;
    var L = parseInt(hash.substr(8, 4), 16) % 20 + 25;

    var rgb = hslToRgb(H, S, L);
    colorCache[name] = "#" + rgbToHex(rgb.r, rgb.g, rgb.b);
    return colorCache[name];
}

function hslToRgb(h, s, l) {
    var r, g, b, m, c, x

    if (!isFinite(h)) h = 0
    if (!isFinite(s)) s = 0
    if (!isFinite(l)) l = 0

    h /= 60
    if (h < 0) h = 6 - (-h % 6)
    h %= 6

    s = Math.max(0, Math.min(1, s / 100))
    l = Math.max(0, Math.min(1, l / 100))

    c = (1 - Math.abs((2 * l) - 1)) * s
    x = c * (1 - Math.abs((h % 2) - 1))

    if (h < 1) {
        r = c
        g = x
        b = 0
    } else if (h < 2) {
        r = x
        g = c
        b = 0
    } else if (h < 3) {
        r = 0
        g = c
        b = x
    } else if (h < 4) {
        r = 0
        g = x
        b = c
    } else if (h < 5) {
        r = x
        g = 0
        b = c
    } else {
        r = c
        g = 0
        b = x
    }

    m = l - c / 2
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return {
        r: r,
        g: g,
        b: b
    }
}

function rgbToHex(R, G, B) {
    return toHex(R) + toHex(G) + toHex(B)
}

function toHex(N) {
    if (N == null) return "00";
    N = parseInt(N);
    if (N == 0 || isNaN(N)) return "00";
    N = Math.max(0, N);
    N = Math.min(N, 255);
    N = Math.round(N);
    return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
}
function bake(c_name, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}
function cookie(c_name) {
	var i, x, y, ARRcookies = document.cookie.split(";");
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g,"");
		if (x == c_name) {
			return unescape(y);
		}
	}
}
function eatcookie(name) {
	document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
}