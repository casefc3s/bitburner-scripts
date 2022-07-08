let waitTime = 60000;
let maxPortsRequired = 0;
let target = null;
let minFreeRam = 50;
let targetUpdated = false;

/** @param {NS} ns */
export async function main(ns) {
	var initialRun = true;
	if (ns.args.length > 0) {
		await setTarget(ns.args[0]);
	}

	while (true) {
		updateMaxPortsRequired(ns);
		var servers = getAllServers(ns);
		
		targetUpdated = false;
		if (target == null || ns.getServerMoneyAvailable(target) == 0) {
			await setTarget(ns, getNewTarget(ns, servers));
			targetUpdated = true;
			ns.tprint(`spread.js now targeting ${target}`);
		}

		if (targetUpdated || initialRun) {
			ns.scriptKill('remote-hack.js', 'home');
			var homeThreads = Math.floor((ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - minFreeRam) / ns.getScriptRam('remote-hack.js'));
			ns.run('run-slaves.js', 1, target);
			ns.run('remote-hack.js', homeThreads, target);
		}

		for (const server of servers) {
			if (!ns.hasRootAccess(server)) {
				ns.run('get-root.js', 1, server);
				await runHack(ns, server);
			} 
			else if ((initialRun || targetUpdated) && ns.hasRootAccess(server)) {
				ns.killall(server);
				await runHack(ns, server);
			}
			else {
				// do nothing, server already hot to trot
			}
		}

		initialRun = false;
		// wait and see if we've improved enough to get some more servers under our thumb
		await ns.sleep(waitTime);
	}
}

async function setTarget(ns, server) {
	target = server;
	targetUpdated = true;
	await ns.write('target.txt', target, 'w');
}

function getNewTarget(ns, servers) {
	var maxMoney = Infinity;
	var bigServer = '';
	// target lowest current funds without being zero
	for (const server of servers) {
		var t = ns.getServerMoneyAvailable(server);
		if ((t < maxMoney && t > 0) || maxMoney === Infinity) {
			if (t > 0 && maxMoney === Infinity) {
				maxMoney = t;
			}
			bigServer = server;
		}
	}

	if (maxMoney === 0 || maxMoney === Infinity) {
		// target highest max money server instead
		for (const server of servers) {
			var t = ns.getServerMaxMoney(server);
			if (t >= maxMoney) {
				maxMoney = t;
				bigServer = server;
			}
		}
	}

	return bigServer;
}

function updateMaxPortsRequired(ns) {
	var filenames = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
	maxPortsRequired = 0;
	for (const f of filenames) {
		if (ns.fileExists(f, "home")) {
			maxPortsRequired++;
		}
		// else if (ns.purchaseProgram(f)) {
		// 	maxPortsRequired++;
		// }
	}
}

async function runHack(ns, server) {
	var scriptName = 'remote-hack.js';
	await ns.scp(scriptName, server);

	if (!ns.hasRootAccess(server)) {
		console.log(`New server: ${server} requires manual run!`);
		return;
	}

	var mem = ns.getServerMaxRam(server);
	var rmem = ns.getScriptRam(scriptName);
	var t = Math.floor(mem / rmem);
	if (t <= 0)
		return;

	if (!target) {
		ns.exec(scriptName, server, t);
	}
	else {
		ns.exec(scriptName, server, t, target);
	}
}

function getValidServers(ns, parent, servers) {
	var okServers = [];

	for (const server of servers) {
		if (server === 'home' || server === parent)
			continue;

		if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server) &&
			ns.getServerNumPortsRequired(server) <= maxPortsRequired) {
				okServers.push(server);
		}
	}

	return okServers;
}

function getAllServers(ns) {
	let hostName = ns.getHostname();
	let scanArray = [hostName];
	let currentScanLength = 0;
	let servers = [];
	while (currentScanLength < scanArray.length) {
		let previousScanLength = currentScanLength;
		currentScanLength = scanArray.length;
		for (let i = previousScanLength; i < currentScanLength; i++) {
			let currentHost = scanArray[i];
			//let minSecurity = ns.getServerSecurityLevel(currentHost);
			//let server = {hostname: currentHost, hacklevel: ns.getServerRequiredHackingLevel(currentHost), maxmoney: ns.getServerMaxMoney(currentHost), growth: ns.getServerGrowth(currentHost), minsecurity: minSecurity};
			servers.push(currentHost);
			/* uncomment this if you'd like to see a printout of the array as it is being made
			ns.tprint(server.hostname);
			ns.tprint('----------------');
			ns.tprint('Difficulty: ' + server.hacklevel + ' | Potential: $' + server.maxmoney);
			ns.tprint('Growth Rate: ' + server.growth + ' | Security: ' + server.minsecurity);
			ns.tprint('----------------'); */
			let newScan = ns.scan(currentHost);
			for (let j = 0; j < newScan.length; j++) {
				if (scanArray.indexOf(newScan[j]) == -1) {
					scanArray.push(newScan[j]);
				}
			}
		}
	}

	servers = getValidServers(ns, hostName, servers);
	return servers;
}