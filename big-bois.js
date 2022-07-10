import * as utils from "utils.js";


/** @param {NS} ns */
export async function main(ns) {
	var servers = utils.getAllServers(ns, false, true);
	servers = getOnlyBigBois(ns, servers);
	ns.tprint("Printing servers beyond our grasp...");
	for (const server of servers) {
		utils.printServer(ns, server);
		await ns.sleep(100);
	}
	ns.tprint("Completed!");
}

function getOnlyBigBois(ns, servers) {
	var big = [];

	for (const server of servers) {
		if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()) {
			big.push(server);
		}
	}

	return big;
}