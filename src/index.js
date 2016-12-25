/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/socket.io-client/socket.io-client.d.ts" />
"use strict";
const jquery = require("jquery");
const euglena_template_1 = require("euglena.template");
const euglena_1 = require("euglena");
const io = require("socket.io-client");
var Exception = euglena_1.euglena.sys.type.Exception;
const OrganelleName = "ReceptionOrganelleImplHttp";
let this_ = null;
class Organelle extends euglena_template_1.euglena_template.being.alive.organelle.NetClientOrganelle {
    constructor() {
        super(OrganelleName);
        this_ = this;
        this.servers = {};
        this.triedToConnect = new euglena_1.euglena.sys.type.Map();
    }
    bindActions(addAction) {
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ThrowImpact, (particle, callback) => {
            this_.throwImpact(particle.data.to, particle.data.impact, callback);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.NetClientOrganelleSap, (particle) => {
            this_.sapContent = particle.data;
            this.send(new euglena_template_1.euglena_template.being.alive.particle.OrganelleHasComeToLife(this_.name, this_.sapContent.euglenaName), this_.name);
        });
    }
    throwImpact(to, impact, callback) {
        let server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact, (impact) => {
                callback(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impact, this_.sapContent.euglenaName));
            });
        }
        else {
            var post_options = {
                host: to.data.url,
                port: Number(to.data.port),
                path: "/",
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            let httpConnector = new HttpRequestManager(post_options);
            httpConnector.sendMessage(JSON.stringify(impact), (message) => {
                if (euglena_1.euglena.sys.type.StaticTools.Exception.isNotException(message)) {
                    try {
                        let impactAssumption = JSON.parse(message);
                        if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                            if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.Particle, impactAssumption.particle)) {
                                this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
                            }
                        }
                        else {
                        }
                    }
                    catch (e) {
                    }
                }
                else {
                    //TODO write a eligable exception message
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.Exception(new Exception(""), this_.sapContent.euglenaName), this_.name);
                }
            });
            if (!this.servers[to.data.name] && !this.triedToConnect.get(to.data.name)) {
                this.connectToEuglena(to);
            }
        }
    }
    connectToEuglena(euglenaInfo) {
        var post_options = {};
        post_options.host = euglenaInfo.data.url;
        post_options.port = Number(euglenaInfo.data.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        this.triedToConnect.set(euglenaInfo.data.name, true);
        let server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.data.name] = server;
        server.on("connect", (socket) => {
            server.emit("bind", new euglena_template_1.euglena_template.being.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), (done) => {
                if (done) {
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                }
            });
            server.on("impact", (impactAssumption, callback) => {
                if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.Particle, impactAssumption.particle)) {
                        this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
                    }
                }
                else {
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template_1.euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
        });
    }
}
exports.Organelle = Organelle;
class HttpRequestManager {
    constructor(post_options) {
        this.post_options = post_options;
    }
    sendMessage(message, callback) {
        var req = jquery.post(this.post_options.url, (data, textStatus, jqXHR) => {
            if (textStatus === "200") {
                callback(data);
            }
            else {
                callback(new Exception("problem with request: " + data));
            }
        });
    }
}
exports.HttpRequestManager = HttpRequestManager;
//# sourceMappingURL=index.js.map