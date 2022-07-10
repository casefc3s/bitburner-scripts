// from u/xFoopy <3
// https://www.reddit.com/r/Bitburner/comments/s793dp/comment/htam9x4/?utm_source=share&utm_medium=web2x&context=3

/** @param {NS} ns **/
export async function main(ns) { 
    var hosts = ns.scan()
    for (const host of hosts) {
    	hosts.push(...ns.scan(host).slice(1))
    }
    hosts = [hosts.find(x => x.includes(ns.args))]
    for (var i = 0; hosts[i] != 'home'; i++) {
    	hosts.push(ns.scan(hosts[i])[0])
    }
    ns.tprint(`connect ${hosts.reverse().join("; connect ")}`);
}