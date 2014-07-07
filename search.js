var search = {
	draggingScroll: false,
	resultHeight: 31,
	scrollAt: 0, //current positioning of the scroll
	leftovers: false, //when we scroll the very last result should come into full view (is the last result barely showing, basically)
	ogPerScroll: 0, //how many results fit in the scrolling part? this is how we check how many we'll fit in there
	perScroll: 0, //version of above variable rounded up
	word: "",
	translate: {"BattlePokedex": "species", "BattleMovedex": undefined, "BattleAbilities": "ability", "BattleItems": "item"},
	attribute: "",
	pully: undefined,
	type: "BattlePokedex",
	results: new Array(),
	resourcePrefix: "http://play.pokemonshowdown.com/",
	updateResults: function() {
		$("#results").empty();
		var accepted = 0;
		for (var resultnum in search.results) {
			if (resultnum >= search.scrollAt && accepted < search.perScroll) {
				search.add(search.results[resultnum], search.word);
				accepted++;
			}
		}
		search.scrollUpdate();
	},
	add: function(thing, highlight) {
		var insides = "";
		var el = $("#results");
		var info = exports[search.type][thing];
		switch(search.type) {
			case 'BattlePokedex':
				var types = "";
				for (var i in info.types) types += '<img src="' + search.resourcePrefix + 'sprites/types/' + info.types[i] + '.png" />';
				
				var abilities = "";
				var kindsabilities = new Object();
				for (var i in info.abilities) kindsabilities[i] = true;
				if (kindsabilities[0] && !kindsabilities[1]) abilities += '<span class="col abilitycol">' + info.abilities[0] + '</span>';
				if (kindsabilities[0] && kindsabilities[1]) abilities += '<span class="col twoabilitycol">' + info.abilities[0] + '<br />' + info.abilities[1] + '</span>';
				abilities += '<span class="col abilitycol">';
				if (kindsabilities.H) abilities += '<span style="font-style: italic;">' + info.abilities.H + '</span>';
				abilities += '</span>';
				
				var stats = "";
				var bst = 0;
				for (var i in info.baseStats) {
					stats += '<span class="col statcol"><em>' + i.toUpperCase() + '</em><br />' + info.baseStats[i] + '</span>';
					bst += info.baseStats[i];
				}
				stats += '<span class="col statcol"><em>BST</em><br /><em>' + bst + '</em></span>';
				
				insides += '<span class="col numcol">' + info.num + '</span>';
				insides += '<span class="col iconcol">' + '<span style="' + Tools.getIcon(info) + '"></span>' + '</span>';
				insides += '<span class="col pokemonnamecol">' + info.species + '</span>';
				insides += '<span class="col typecol">' + types + '</span>';
				insides += '<span style="float:left;min-height:26px">' + abilities + '</span>';
				insides += '<span style="float:left;min-height:26px">' + stats + '</span>';
				break;
			
			case 'BattleMovedex':
				insides += '<span class="col movenamecol">' + info.name + '</span>';
				insides += '<span class="col typecol"><img src="' + search.resourcePrefix + 'sprites/types/' + info.type + '.png" alt="' + info.type + '" height="14" width="32" /><img src="' + search.resourcePrefix + 'sprites/categories/' + info.category + '.png" alt="' + info.category + '" height="14" width="32" /></span>';
				insides += '<span class="col labelcol">';
				if (info.basePower) insides += '<em>Power</em><br />' + info.basePower;
				insides += '</span>';
				insides += '<span class="col widelabelcol"><em>Accuracy</em><br />' + ((info.accuracy != true) ? info.accuracy + '%' : "-") + '</span>';
				insides += '<span class="col pplabelcol"><em>PP</em><br />' + info.pp + '</span>';
				insides += '<span class="col movedesccol">' + info.shortDesc + '</span>';
				break;
			
			case 'BattleAbilities':
				insides += '<span class="col namecol">' + info.name + '</span>';
				insides += '<span class="col abilitydesccol">' + info.shortDesc + '</span>';
				break;
			
			case 'BattleItems':
				insides += '<span class="col itemiconcol"><span style="' + Tools.getItemIcon(info) + '"></span></span>';
				insides += '<span class="col namecol">' + info.name + '</span>';
				insides += '<span class="col itemdesccol">' + info.desc + '</span>';
				break;
		}
		el.append('<div onclick="Tools.setAttribute(\'' + search.attribute + '\', \'' + ((search.type == "BattlePokedex") ? info.species : info.name) + '\'' + ((search.type == "BattleMovedex") ? ', \'moves\'' : '') + ');" class="result">' + insides + '</div>');
	},
	search: function(word, type) {
		if (!word) var word = "";
		$("#results").empty();
		search.scrollAt = 0;
		search.word = word;
		search.results = new Array();
		search.type = type;
		var resultnum = 0;
		var kind = exports[type];
		var lookAt = "species";
		if (type != "BattlePokedex") lookAt = "name";
		for (var i in kind) {
			var c = kind[i];
			if (c[lookAt].toLowerCase().split(word.toLowerCase()).length - 1 > 0 || i.split(toId(word)).length - 1 > 0) {
				search.results.push(i);
				if (resultnum < search.perScroll) search.add(i, word);
				resultnum++;
			}
		}
		search.scrollUpdate();
	},
	scrollUpdate: function() {
		var percentheight = $("#results").height() / (search.results.length * search.resultHeight);
		var scrollheight = $("#results").height() * percentheight - 10;
		if (scrollheight <= 15) scrollheight = 15;
		if (scrollheight > $("#results").height() - 10) scrollheight = 0; //there is more or just enough space for all results
		$("#results-scroll").height(scrollheight);
		var pixels = (((search.scrollAt * search.resultHeight) / (search.results.length * search.resultHeight)) * ($("#results").height() - 10)) + 5;
		$("#results-scroll").css({
			top: (pixels + $("#results").position().top) + "px"
		});
	}
};