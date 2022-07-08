/** @param {NS} ns */
export async function main(ns) {
	var server = null;
	if (ns.args.length > 0) {
		server = ns.args[0];
	}
	else {
		ns.print('Script requires target server arg!');
		return;
	}

	if (ns.fileExists("BruteSSH.exe", "home")) {
		await ns.brutessh(server);
	}
	if (ns.fileExists("FTPCrack.exe", "home")) {
		await ns.ftpcrack(server);
	}
	if (ns.fileExists("relaySMTP.exe", "home")) {
		await ns.relaysmtp(server);
	}
	if (ns.fileExists("HTTPWorm.exe", "home")) {
		await ns.httpworm(server);
	}
	if (ns.fileExists("SQLInject.exe", "home")) {
		await ns.sqlinject(server);
	}

	if (!ns.hasRootAccess(server)) {
		await ns.nuke(server);
		//await ns.installBackdoor(server);
	}
}