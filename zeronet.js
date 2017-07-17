"use strict"

const fs      = require("fs")
const path    = require("path")
const cp      = require("child_process")
const mockery = require("mockery")
const _debug  = require("debug")
const FS      = require("zeronet-storage-fs")
const ZeroNet = require("zeronet-swarm")
const MergeRecursive = require("merge-recursive")

const errCB = err => {
  if (!err) return
  console.error("The node failed to start")
  console.error(err)
  process.exit(2)
}

const defaults = {
  tls: "disabled",
  server: {
    host: "0.0.0.0",
    port: 15543
  },
  server6: {
    host: "::",
    port: 15543
  },
  uiserver: {
    listen: {
      host: "127.0.0.1",
      port: 15544
    }
  },
  storage: new FS(path.join(process.cwd(), "data")),
  trackers: [
    //"zero://boot3rdez4rzn36x.onion:15441",
    //"zero://boot.zeronet.io#f36ca555bee6ba216b14d10f38c16f7769ff064e0e37d887603548cc2e64191d:15441",
    "udp://tracker.coppersurfer.tk:6969",
    "udp://tracker.leechers-paradise.org:6969",
    "udp://9.rarbg.com:2710",
    "http://tracker.opentrackr.org:1337/announce",
    "http://explodie.org:6969/announce",
    "http://tracker1.wasabii.com.tw:6969/announce"
    //"http://localhost:25534/announce"
  ],
  debug_file: path.resolve(process.cwd(""), "debug.log"),
  debug_shift_file: path.resolve(process.cwd(""), "debug-last.log")
}

const CONFIG_PATH = path.resolve(process.cwd(""), process.env.CONFIG_FILE || "config.json")

let CONFIG

if (fs.existsSync(CONFIG_PATH)) {
  const CONFIG_DATA = JSON.parse(fs.readFileSync(CONFIG_PATH).toString())
  CONFIG = MergeRecursive(CONFIG_DATA, defaults)
} else {
  CONFIG = defaults
}

// default config
const ZN_PATH     = "ZeroNet"
const ZN_DATA     = "data"
const ZN_DATA_ALT = "data_alt"
const ZN_HOMEPAGE = "1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D"
const ZN_VERSION  = "0.5.1"
const ZN_REV      = 1756

var PEER_ID       = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)
var DATA_PATH     = path.resolve(process.cwd(""), ZN_DATA) // path.Join(".", "data")
var USERS_PATH    = DATA_PATH + "\\users.json" // windoze
var SITES_PATH    = DATA_PATH + "\\sites.json" // windoze
var MUTES_PATH    = DATA_PATH + "\\mutes.json" // windoze

console.log("...")
console.log("Data Folder: " + DATA_PATH)

let USERS
let USERS_DATA
let SITES
let SITES_DATA
let MUTES
let MUTES_DATA

console.log("...")
console.log("User File: " + USERS_PATH)

if (fs.existsSync(USERS_PATH)) {
  USERS_DATA = JSON.parse(fs.readFileSync(USERS_PATH).toString())
  console.log("User Data: " + USERS_DATA)
}

console.log("...")
console.log("Sites File: " + SITES_PATH)

if (fs.existsSync(SITES_PATH)) {
  SITES_DATA = JSON.parse(fs.readFileSync(SITES_PATH).toString())
  console.log("Sites Data: " + SITES_DATA)
}

console.log("...")
console.log("Mutes File: " + MUTES_PATH)

if (fs.existsSync(MUTES_PATH)) {
  MUTES_DATA = JSON.parse(fs.readFileSync(MUTES_PATH).toString())
  console.log("Mutes Data: " + MUTES_DATA)
}

function loadUsers() {
  if (fs.existsSync(USER_PATH)) {
    return JSON.parse(fs.readFileSync(USER_PATH).toString())
  }
}

// loadUsers()

let node
let dwait = []

require("peer-id").create((err, id) => {
  CONFIG.id = id
  node = new ZeroNet(CONFIG)
  dwait.map(d => d())
  dwait = null
  node.start(err => err ? errCB(err) : node.bootstrap(errCB) )
})

console.log("...")
console.log("Peer ID: " + PEER_ID) // todo..
console.log("...")

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
})

mockery.registerMock("debug", function createDebug(name) {
  let que = []
  let qq = false
  let rd
  if (process.env.DEBUG) {
    rd = _debug(name)
  }

  function write(data) {
    if (global.ZeroLogWS) global.ZeroLogWS.write(JSON.stringify(data) + "\n")
    else que.push(data)
  }

  function processQue() {
    if (!qq) {
      dwait.push(processQue)
      qq = true
    }
    que.forEach(d => write(d))
    que = null
  }

  function debug() {
    write({
      debug: true,
      time: new Date().getTime(),
      name,
      data: [...arguments]
    })
    if (rd) rd.apply(rd, arguments)
  }

  return debug
})

function consoleMock(type) {
  let que = []
  let qq = false
  let rd
  const o = console[type].bind(console)

  function write(data) {
    if (global.ZeroLogWS) global.ZeroLogWS.write(JSON.stringify(data) + "\n")
    else que.push(data)
  }

  function processQue() {
    if (!qq) {
      dwait.push(processQue)
      qq = true
    }
    que.forEach(d => write(d))
    que = null
  }

  const d = {
    "bound consoleCall": function () {
      write({
        console: true,
        time: new Date().getTime(),
        type,
        data: [...arguments]
      })
      o.apply(o, arguments)
    }
  }

  return d["bound consoleCall"]
}

Object.keys(console).forEach(key => {
  console[key] = consoleMock(key)
})

// console.log(process.argv[0])

// const bunyan = cp.spawn(process.argv[0], [__dirname + "/node_modules/.bin/bunyan"], {
//  stdio: ["pipe", process.stderr, process.stderr]
// })
// delete process.stdout
// process.stdout = bunyan.stdin

function checkDataPath() {
	// verify data folder exists and load zite info
	// if (!DATA_PATH) { process.env || os.MkdirAll(DATA, 0777) }
	// PEER_ID = fmt.Sprintf("-ZN0%s-GO%s", strings.Replace(VERSION, ".", "", -1), randomString(10))
}

// checkDataPath()

function getTrackers() {
	trackers = {
	urls: [
		// "zero://boot3rdez4rzn36x.onion:15441",
		// "zero://boot.zeronet.io#f36ca555bee6ba216b14d10f38c16f7769ff064e0e37d887603548cc2e64191d:15441",
		"udp://tracker.coppersurfer.tk:6969",
		"udp://tracker.leechers-paradise.org:6969",
		"udp://9.rarbg.com:2710",
		"http://tracker.tordb.ml:6881/announce",
		"http://explodie.org:6969/announce",
		"http://tracker1.wasabii.com.tw:6969/announce"
	  ]
	}
	return trackers
}

// getTrackers()

// sm = NewSiteManager()
// server = NewServer(43111, sm)
// server.Serve()

var lowerCase = Math.random().toString(36).replace(/[^a-z]+/g, '')
var upperCase = Math.random().toString(36).replace(/[^A-Z]+/g, '')
var letters   = lowerCase + upperCase
var letters2  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

// testing...
function randomString(len) {
	var b
	for (var i; i < len; i++) {
		b += letters.substr(Math.random(letters.length), 1)
	}
	return b
}

/*

function createCerts() {
	template = [
		"IsCA":                  true,
		"BasicConstraintsValid": true,
		"SubjectKeyId":          byte{4, 8, 3},
		"SerialNumber":          9899,
		"Subject": pkix.Name{
			"Country":    "Earth",
			Organization: "Mother Nature"
		},
		"NotBefore": time.Now(),
		"NotAfter":  time.Now().AddDate(5, 5, 5),
		// see http://golang.org/pkg/crypto/x509/#KeyUsage
		"ExtKeyUsage":           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		"KeyUsage":    x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign
	]

	// generate private key
	privatekey = rsa.GenerateKey(rand.Reader, 2048)

	if (err) {
		console.log(err)
	}

	publickey := &privatekey.PublicKey

	// create a self-signed certificate. template = parent
	var parent = template
	cert = x509.CreateCertificate(rand.Reader, template, parent, publickey, privatekey)

	if (err) {
		console.log(err)
	}

	// save private key
	pemfile = os.Create(path.Join(DATA, "key-rsa.pem"))
	var pemkey = [
		"Type":  "PRIVATE KEY",
		"Bytes": x509.MarshalPKCS1PrivateKey(privatekey)
	]
	pem.Encode(pemfile, pemkey)
	pemfile.Close()

	pemfile = os.Create(path.Join(DATA, "cert-rsa.pem"))
	pemkey = [
		"Type":  "CERTIFICATE",
		"Bytes": cert
	]
	pem.Encode(pemfile, pemkey)
	pemfile.Close()
}

// createCerts()

function loadContent(site) {
	filename = path.Join(".", ZN_PATH, ZN_DATA_ALT, site, "content.json")
	return loadJSON(filename)
}

// loadContent()

function loadJSON(filename string) {
	content = ioutil.ReadFile(filename)
	if (!err) {
	  return gabs.ParseJSON(content)
	} else {
	  return errors.New("cant read file")
	}
}

// loadJSON()

function getBytes(key) {
	var buf // bytes.Buffer
	enc = gob.NewEncoder(&buf)
	err = enc.Encode(key)
	if (err) {
	  return err
	} else {
	  return buf.Bytes()
	}
}

// getBytes()

*/

// eof
