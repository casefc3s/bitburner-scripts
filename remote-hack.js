/** @param {NS} ns */
export async function main(ns) {
	var server = ns.args[0];

	// Defines how much money a server should have before we hack it
	// In this case, it is set to 75% of the server's max money
	var moneyThresh = ns.getServerMaxMoney(server) * 0.75;

	// Defines the maximum security level the target server can
	// have. If the server's security level is higher than this,
	// we'll weaken it before doing anything else
	var securityThresh = ns.getServerMinSecurityLevel(server) + 5;

	while (true) {
		if (!ns.hasRootAccess(server)) {
			await ns.sleep(2000);
		}
		if (ns.getServerSecurityLevel(server) > securityThresh) {
			// If the server's security level is above our threshold, weaken it
			await ns.weaken(server);
		} else if (ns.getServerMoneyAvailable(server) < moneyThresh) {
			// If the server's money is less than our threshold, grow it
			await ns.grow(server);
		} else {
			// hack it
			await ns.hack(server);
		}
	}
}