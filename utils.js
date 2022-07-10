/** @param {NS} ns */
export async function main(ns) {

}

export function getFlags(args) {
	if (args.length === 0) {
		return null;
	}

	var res = {};
	for (var i = 0; i < args.length; ++i) {
		if (args[i][0] === '-') {
			res[args[i][1]] = [];
			for (var j = i + 1; j < args.length; ++j) {
				if (args[j][0] === '-') {
					break;
				}
				
				res[args[i][1]].push(args[j]);
			}
		}
	}

	return res;
}

export function getAllServers(ns, hackableOnly, noPersonal) {
	let hostName = ns.getHostname();
	let scanArray = [hostName];
	let currentScanLength = 0;
	let servers = [];
	while (currentScanLength < scanArray.length) {
		let previousScanLength = currentScanLength;
		currentScanLength = scanArray.length;
		for (let i = previousScanLength; i < currentScanLength; i++) {
			let currentHost = scanArray[i];
			servers.push(currentHost);
			let newScan = ns.scan(currentHost);
			for (let j = 0; j < newScan.length; j++) {
				if (scanArray.indexOf(newScan[j]) == -1) {
					scanArray.push(newScan[j]);
				}
			}
		}
	}

	if (hackableOnly !== undefined && hackableOnly) {
		servers = getValidServers(ns, hostName, servers);
	}
	if (noPersonal !== undefined && noPersonal) {
		servers = removePurchasedServers(ns, servers);
	}
	return servers;
}

export function getValidServers(ns, parent, servers) {
	var okServers = [];
	var maxPortsRequired = getMaxPortsRequired(ns);

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

export function getMaxPortsRequired(ns) {
	var filenames = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
	var maxPortsRequired = 0;
	for (const f of filenames) {
		if (ns.fileExists(f, "home")) {
			maxPortsRequired++;
		}
	}

	return maxPortsRequired;
}

function removePurchasedServers(ns, servers) {
	var purchased = ns.getPurchasedServers();
	var clean = [];

	for (const server of servers) {
		if (purchased.indexOf(server) < 0) {
			clean.push(server);
		}
	}

	return clean;
}

export function printServer(ns, server) {
	ns.tprint(`${server} (HL:${ns.getServerRequiredHackingLevel(server)}) SEC:${ns.getServerSecurityLevel(server)}, \$${ns.getServerMoneyAvailable(server).toLocaleString()}, ++${ns.getServerGrowth(server)}`);
	ns.tprint(`    - files: ${ns.ls(server).join(', ')}`);
	ns.tprint(`    - active scripts:`);
	printProcesses(ns, ns.ps(server));
}

function printProcesses(ns, processes) {
	for (const p of processes) {
		ns.tprint(`      + (${p.pid}) ${p.filename} [${p.threads}] args: ${p.args.join(', ')}`);
	}
}

export async function downloadFiles(ns, server) {
	var types = ['lit', 'txt', 'js', 'script'];
	var files = [];
	for (const t of types) {
		files = files.concat(ns.ls(server, `.${t}`));
	}	
	files = cleanFiles(ns, files);
	
	if (files.length > 0) {
		ns.tprint(`[-] Downloading ${files.join(', ')}...`);
		await ns.scp(files, server, 'home');
		ns.tprint(`[-] Download complete!`);
	}
}

function cleanFiles(ns, files) {
	// make sure we're not just repeatedly downloading the same thing
	var clean = [];
	var myFiles = ns.ls('home');
	for (const f of files) {
		if (myFiles.indexOf(f) < 0) {
			clean.push(f);
		}
	}
	return clean;
}