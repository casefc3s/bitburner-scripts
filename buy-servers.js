let waitTime = 60000;

/** @param {NS} ns */
export async function main(ns) {
	var ram = 8; 
	if (ns.args.length < 1) {
		ns.tprint("Please pass how much initial RAM you want the servers to have if you wish to specify, default 8GB.");
	}
	else {
		ram = parseInt(ns.args[0]);
	}

	ns.tprint(`Purchasing servers with ${ram}GB RAM.`);
	var prefix = "s";
	var maxServers = ns.getPurchasedServerLimit();

	while (true) {
		var serverCost = ns.getPurchasedServerCost(ram);
		ns.print(`Purchasing servers with ${ram}GB RAM.`);
		ns.print(`Server cost: ${serverCost.toLocaleString()}`);

		var cash = ns.getServerMoneyAvailable('home');
		if (cash < serverCost) {
			ns.print(`You're too poor! Server cost: ${serverCost.toLocaleString()}`);
			await ns.sleep(waitTime);
			continue;
		}

		var numPurchased = 0;
		for (var i = 0; i < maxServers; ++i) {
			var serverName = prefix + i.toString();
			if (ns.serverExists(serverName)) {
				if (ns.getServerMaxRam(serverName) < ram &&
					ns.getServerMoneyAvailable('home') > serverCost) {
					ns.killall(serverName);
					ns.deleteServer(serverName);
				}
				else {
					continue;
				}
			}
			else if (ns.getServerMoneyAvailable('home') < serverCost) {
				break;
			}

			var newServer = ns.purchaseServer(serverName, ram);
			if (!newServer || newServer.length === 0)
				break;
			
			
			// restart hacks
			var target = await ns.read('target.txt');
			var scriptName = 'remote-hack.js';
			await ns.scp(scriptName, newServer);
			var mem = ns.getServerMaxRam(newServer);
			var rmem = ns.getScriptRam(scriptName);
			var t = Math.floor(mem / rmem);
			ns.exec(scriptName, newServer, t, target);

			numPurchased++;
		}

		if (numPurchased > 0) {
			ns.tprint(`Purchased ${numPurchased} new ${ram}GB RAM servers.`);
		}
		else {
			ram = ram * 2 * 2 * 2;
			ns.tprint(`Bumped RAM requirement to ${ram}GB, all servers upgraded.`);
		}

		await ns.sleep(waitTime);
	}
}