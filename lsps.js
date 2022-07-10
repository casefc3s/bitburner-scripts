import * as utils from "utils.js";

let servers = [];
let waitTime = 100;

/** @param {NS} ns */
export async function main(ns) {
	var yargs = utils.getFlags(ns.args);
	if (yargs && yargs.hasOwnProperty('s') && yargs['s'].length > 0) {
		servers = yargs['s'];
	}
	else {
		servers = utils.getAllServers(ns, true, true);
	}

	var badSteal = false;
	if (yargs && yargs.hasOwnProperty('d')) {
		// download everything, you clepto
		badSteal = true;
	}

	await spewOnScreen(ns, badSteal);
}

async function spewOnScreen(ns, doDownload) {
	for (const server of servers) {
		utils.printServer(ns, server);
		await ns.sleep(waitTime);

		if (doDownload) {
			await utils.downloadFiles(ns, server);
		}
	}
}