<style>
table, tr, td, h1 {
	padding: 0;
	margin: 0;
}
</style>
<?php
	$page = file_get_contents("http://pokemonshowdown.com/servers/");
	$inactiveandactive = "<h1>Active servers</h1>" . explode("<h1>Active servers</h1>", $page)[1];
	$inactiveandactivesplit = explode("</table>", $inactiveandactive);
	$activeservers = $inactiveandactivesplit[0] . "</table>";
	echo $activeservers;