/** @param {NS} ns */
export async function main(ns) {
	var target = ns.args[0];
	var servers = ns.getPurchasedServers();
	var scriptName = 'remote-hack.js';
	var rmem = ns.getScriptRam(scriptName);

	for (const server of servers) {
		ns.killall(server);
		await ns.scp(scriptName, server);
		
		var mem = ns.getServerMaxRam(server);
		var t = Math.floor(mem / rmem);
		ns.exec(scriptName, server, t, target);
	}
}