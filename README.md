# bitburner-scripts
These are my core basic scripts for automating in the game Bitburner (NS2). A good chunk of it is just built off the tutorials/docs.

## Basics
If you already have some progression, you can just start off with this script. Run it and let it do its thing and it will progressively upgrade (personal and hacknet servers only) and expand as far as it can. I've applied some base values that seem to work for me, you may wish to modify them. It's too RAM heavy to use without an upgraded home server.

`./build-empire.js`

It does not upgrade your home server, and it does not buy scripts on the black market. Otherwise, the various scripts tend to focus on one purpose. 

At some point you'll likely want to kill the server upgrade scripts and save some coin for augments. For me these scripts were meant to just automate the redundant background things so that I can poke around and explore other things in the game. I'm still pretty early on myself, so this is just where I'm at so far.

Feel free to mix and match, modify, etc as you please. If you have some cool changes/suggestions, feel free to raise an issue or PR!

NOTE: the spread.js target selection currently does not follow the normal "use max money server" approach. it used to, but I found the delay in building funds (longer weaken/grow/hack times due to stronger servers) early on to be more of an issue in seeing progress. it probably doesn't pay as well in the end, but that's just my personal preference. less money faster allows for more upgrades sooner, etc, was my mindset.

## Updates
Added more functions to `utils.js` however it seems that in doing so I've drastically increased RAM requirements in a lot of places, I should really start importing specific functions instead of the whole thing.

Added `./play-stocks.js` with some optional args that can be passed in. Example of args usage: `./play-stocks -o volatility descending` will show all stocks sorted by volatility in descending order. The args were mostly for me trying to figure out what numbers I should be using in the thresholds, but you may find them useful as well. I also really need to abstract my args parser thing better.
