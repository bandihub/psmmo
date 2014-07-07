<?php
	$host = "elloworld.noip.me:8000";
	if (isset($_GET['h'])) $host = $_GET['h'];
	if (strpos($host, ".psim.us")) {
		$page = file_get_contents("http://play.pokemonshowdown.com/crossdomain.php?host=" . $host . "&path=");
		$hostExplosion = explode('var config = {"host":"', $page);
		$host = explode('","id":"', $hostExplosion[1])[0];
		$portExplosion = explode('","port":', $page);
		$port = explode(',"', $portExplosion[1])[0];
	}
	if (!isset($port)) {
		$parts = explode(":", $host);
		if (array_keys($parts) == 2) {
			$host = $parts[0];
			$port = $parts[1];
		} else {
			$host = "elloworld.noip.me";
			$port = 8000;
		}
	}
?>
<!DOCTYPE html>
<html>
<head>
<meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' name='viewport' />
<link rel="stylesheet" type="text/css" href="./teambuilderCSS.css" />
<link rel="stylesheet" type="text/css" href="./client.css" />
<link rel="stylesheet" type="text/css" href="./battle.css" />
<link rel="stylesheet" type="text/css" href="./sim-types.css" />
<link rel="stylesheet" type="text/css" href="./canvas.css" />
<link rel="stylesheet" type="text/css" href="./sprites.css" />
<script>var host = "<?php echo $host ?>", port = <?php echo $port; ?>, exports = new Object();</script>
<script src="http://play.pokemonshowdown.com/js/lib/jquery-2.1.0.min.js"></script>
<script src="http://play.pokemonshowdown.com/data/pokedex.js?cf667c49"></script>
<script src="http://play.pokemonshowdown.com/data/formats-data.js?b881ffb8"></script>
<script src="http://play.pokemonshowdown.com/data/moves.js?dcbac874"></script>
<script src="http://play.pokemonshowdown.com/data/items.js?fd5b32f5"></script>
<script src="http://play.pokemonshowdown.com/data/abilities.js?d0217e36"></script>
<script src="http://play.pokemonshowdown.com/js/battledata.js?f9f549a9"></script>
<script src="http://play.pokemonshowdown.com/data/pokedex-mini.js?e197ced9"></script>
<script src="http://play.pokemonshowdown.com/data/typechart.js"></script>
<script src="http://play.pokemonshowdown.com/js/lib/sockjs-0.3.4.min.js"></script>
<script src="http://play.pokemonshowdown.com/js/lib/html-sanitizer-minified.js?949c4200"></script>
<script src="http://play.pokemonshowdown.com/data/learnsets-g6.js?6b67f048"></script>
<script>for (var i in exports) window[i] = exports[i];</script>
<script src="http://play.pokemonshowdown.com/js/utilichart.js?8a651559"></script>
<script src="./tools.js"></script>
<script src="./search.js"></script>
<script src="./client.js"></script>
<script src="./battle.js"></script>
<script src="./onload.js"></script>
<script src="./canvas.js"></script>
</head>
<body>
<div style="display: none;" id="myClient">
	<div id="header">
		<div style="position: relative;width: 100%;height: 100%;">
			<div class="teambar"></div>
			<div id="returntoteamlist" style="position: absolute;top: 0;right: 10px;"><button style="padding: 3px;" onclick="$('#loadteams').show();Tools.teamList();">Team List</button></div>
		</div>
	</div>
	<div id="results"></div>
	<div id="results-scroll"></div>
	<div id="rightside">
		<div style="position: relative;width: 100%;height: 100%;">
			<div class="editmon">
				<img height="100" class="edit-img" src="http://play.pokemonshowdown.com/sprites/bw/missingno.png" /><br />
				<span id="BattlePokedex" class="edit-species" contenteditable="true">PKMN</span> @ <span id="BattleItems" class="edit-item" contenteditable="true">ITEM</span><br /> 
				Ability: <span id="BattleAbilities" class="edit-ability" contenteditable="true">ABILITY</span><br />
				<div style="cursor: pointer;display: inline-block;" onmousedown="popup('evs');">
					EVs:
					<div class="evc evc-hp">
						<span class="edit-ev-hp">0</span>
						HP /
					</div>
					<div class="evc evc-atk">
						<span class="edit-ev-atk">0</span>
						Atk /
					</div>
					<div class="evc evc-def">
						<span class="edit-ev-def">0</span>
						Def /
					</div>
					<div class="evc evc-spa">
						<span class="edit-ev-spa">0</span>
						Sp. Atk /
					</div>
					<div class="evc evc-spd">
						<span class="edit-ev-spd">0</span>
						Sp. Def /
					</div>
					<div class="evc evc-spe">
						<span class="edit-ev-spe">0</span>
						Speed
					</div>
				</div><br />
				<div style="cursor: pointer;display: inline-block;" onmousedown="popup('nature');"><span class="edit-nature">Serious</span> Nature</div><br />
				- <span id="BattleMovedex" class="edit-move0" contenteditable="true">MOVE1</span><br />
				- <span id="BattleMovedex" class="edit-move1" contenteditable="true">MOVE2</span><br />
				- <span id="BattleMovedex" class="edit-move2" contenteditable="true">MOVE3</span><br />
				- <span id="BattleMovedex" class="edit-move3" contenteditable="true">MOVE4</span><br /><br />
				<div class="customedits">
					<span class="edit-nickname" contenteditable="true">NICKNAME&nbsp;</span><br />
					IVs: <span class="edit-iv-hp">31</span> HP / <span class="edit-iv-atk">31</span> Atk / <span class="edit-iv-def">31</span> Def<br />
					&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="edit-iv-spa">31</span> SAtk / <span class="edit-iv-spd">31</span> SDef / <span class="edit-iv-spe">31</span> Spd<br />
					Level: <span>100</span><br />
					Shiny: <select><option>No</option><option>Yes</option></select><br />
					Happiness: <span>255</span><br />
				</div>
			</div>
		</div>
	</div>
	<div id="coverbuilder" style="position: absolute;top: 0;left: 0%;width: 100%;height: 100%;z-index: 12;">
		<div style="display: none;">
			This mediocre version of PS's teambuilder was made because it doesn't lag the crap out of your phone when you use it.<br />
			It's ugly, but hey it works, and it saves the teams online so you can grab them from here on any computer. Other than that, this version is tons worse than PS's.<br />
			<b>If you don't trust me with your password, you don't have to login to use the teambuilder, just use the new team function and export your teams and gtfo.</b><br />
			<br />
			also, js, but im gonna add a box here too :)
		</div>
		<div class="gototeambuilder" style="z-index: 13;" onclick="Tools.showMenu();">Open Menu</div>
	</div>
	<div id="loadteams">
		<div onclick="Tools.showChat();" class="backtochat">Back to Chat</div>
		<div id="opaque" style="position: absolute;top: 0;left: 0;background: rgba(255, 255, 255, 0.5);width: 100%;height: 100%;z-index: 1;"></div>
		<div style="z-index: 1;text-align: center;position: absolute;top: 0;right: 0;width: 300px;height: 100%;overflow: auto;background: white;outline: 1px solid #b6b6b6;">
			<span style="position: absolute;top: 0;right: 5px;display: none;background: yellow;opacity: 0.5;">You're showdown's <span id="usernumber"></span>th user</span>
			<span style="text-decoration: underline;font-size: 20px;font-weight: bold;position: absolute;right: 230px;">Teams</span>
			<br /><button onclick="if (search.username) Tools.saveChanges(); else alert('You must login to save your teams.');">Save Changes</button><br />
			<button onclick="Tools.addTeam(0);">+ Top</button><br />
			<span id="loginmessage">Login to load teams...</span><div id="teamList"></div><br />
			<button onclick="Tools.importPrompty();">Import</button> <button onclick="popup(Tools.teamsToText());">Export</button><br />
			<button onclick="Tools.addTeam(Tools.teams.length);">+ Bottom</button><br />
		</div>
	</div>
	<div id="broadcast-containment"><div class="relative"><button onclick="var url = prompt('Paste a url from youtube here.');if (url) {client.send('/broadcast ' + url, 'lobby');}" style="position: absolute;right: -105px;width: 100px;">Broadcast</button><button onclick="if (this.innerHTML == 'Hide') {this.innerHTML = 'Show';$('#broadcast').hide();} else {this.innerHTML = 'Hide';$('#broadcast').show();}" style="position: absolute;right: -105px;width: 100px;top: 30px;">Hide</button><iframe id="broadcast"></iframe></div></div>
</div>
<div class="challenges"></div>
<div id="loginform" style="position: absolute;top: 0;left: 0;margin: 80px;margin-left: 30px;border: 1px solid #b6b6b6;padding: 5px;background: white;z-index: 1;">
	USERNAME: <input type="text" id="username" onkeypress="if (event.keyCode == 13) $('#password').focus();" /><br />
	PASSWORD: <input type="password" id="password" onkeypress="if (event.keyCode == 13) $('#loginbutton').click();" /><br />
	<button id="loginbutton" onclick="Tools.login($('#username').val(), $('#password').val());">LOGIN (use showdown credentials)</button>
	<script>$(function() {$("#username").focus();})</script>
</div>
<div id="tooltipwrapper">
	<div style="position: relative;">
		<div class="tooltip"></div>
	</div>
</div>
</body>
</html>