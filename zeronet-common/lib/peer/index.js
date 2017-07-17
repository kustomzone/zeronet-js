"use strict"

const crypto = require("crypto")

const sha5 = text => crypto.createHash('sha512').update(text).digest('hex')
const multiaddr = require("multiaddr")
const Id = require("peer-id")
const Peer = require("peer-info")

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)

const assert = require("assert")

const debug = require("debug")
const log = debug("zeronet:peer")

const ip2multi = require("zeronet-common/lib/util/ip2multi")

function multi2ip(multi) {
  const s = multi.split("/")
  s.shift()
  return s[1] + ":" + s[3]
}

function ZitePeerInfo(addr) {
  const self = this
  /*let opt = self.optional = []

  function setHashfield(hf) {
    //TODO: add
  }*/

  self.zite = addr
}

module.exports = function ZeroNetPeer(peerInfo) {
  const self = this
  assert(Peer.isPeerInfo(peerInfo), "not a peerInfo")
  const pi = self.info = peerInfo

  self.id = pi.id.toB58String()
  assert.equal(pi.multiaddrs._multiaddrs.length, 1, "peer must have exactly 1 address for now")
  self.multiaddr = pi.multiaddrs._multiaddrs[0].toString()
  self.addr = multi2ip(self.multiaddr)

  log("creating", self.multiaddr)

  let known_zites = self.zites_info = []

  let zites = self.zites = []
  let zites_id = self.zites_id = {}

  function updateZites() {
    zites_id = {}
    zites = known_zites.map(z => {
      zites_id[z.zite] = z
      return z.zite
    })
  }

  function setZite(zite) {
    if (hasZite(zite)) return
    log("%s now seeds %s", self.multiaddr, zite)
    known_zites.push(new ZitePeerInfo(zite))
    updateZites()
  }

  function hasZite(zite) {
    return zites_id[zite]
  }

  function toJSON() {
    return {
      addr: self.multiaddr,
      zites
    }
  }

  self.setZite = setZite
  self.hasZite = hasZite

  self.toJSON = toJSON
}

module.exports.piFromAddr = (pi, cb) => {
  if (Peer.isPeerInfo(pi)) {
    return cb(null, pi)
  }

  if (ip2multi.isIp(pi)) {
    pi = multiaddr(ip2multi(pi, "tcp"))
  }

  if (multiaddr.isMultiaddr(pi)) {
    const ad = pi.toString()
    const md = pi
    let pid = Id.createFromB58String("Q" + bs58.encode(sha5(ad).substr(0, 34)))
    Peer.create(pid, (err, pi) => {
      if (err) return cb(err)
      pi.multiaddrs.add(md)
      return cb(null, pi)
    })
  } else cb(new Error("Not a valid ip:port, multiaddr or peerInfo"))
}

module.exports.fromAddr = (pi, cb) => {
  module.exports.piFromAddr(pi, (err, pi) => {
    if (err) return cb(err)
    return cb(null, new module.exports(pi))
  })
}

module.exports.fromJSON = (data, cb) => {
  module.exports.fromAddr(multiaddr(data.addr), (err, peer) => {
    if (err) return cb(err)
    data.zites.forEach(zite => peer.setZite(zite))
  })
}
