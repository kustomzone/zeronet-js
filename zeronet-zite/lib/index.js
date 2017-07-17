"use strict"

const verify = require("zeronet-common/lib/verify")
const Nonces = require("zeronet-common/lib/nonce")

const Tracker = require("zeronet-common/lib/tracker")
const Pool = require("./pool.js")

module.exports = function newZite(config, zeronet) { // describes a single zite
  const self = this

  if (!verify.verifyAddress(config.address))
    throw new Error("Invalid address")

  if (!config.wrapper_key) config.wrapper_key = verify.genNonce()

  self.config = config

  const address = self.address = config.address
  zeronet.newZite(address, self)

  /* Nonce */

  const nonce = new Nonces()
  self.getNonce = nonce.add
  self.redemNonce = nonce.redem

  /* Peers */

  const tracker = self.tracker = Tracker(address, zeronet)
  const pool = new Pool(address, zeronet)

  zeronet.trackers.add(tracker, address)

  /* App */

  function handleGet(req, res, next) {
    //const path=req.url
  }
}
