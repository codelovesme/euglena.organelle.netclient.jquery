/// <reference path="../typings/index.d.ts" />
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var jquery = require("jquery");
var euglena_template_1 = require("euglena.template");
var euglena_1 = require("euglena");
var io = require("socket.io-client");
var Exception = euglena_1.euglena.sys.type.Exception;
var OrganelleName = "ReceptionOrganelleImplHttp";
var this_ = null;
var Organelle = (function (_super) {
    __extends(Organelle, _super);
    function Organelle() {
        _super.call(this, OrganelleName);
        this_ = this;
        this.servers = {};
        this.triedToConnect = new euglena_1.euglena.sys.type.Map();
    }
    Organelle.prototype.bindActions = function (addAction) {
        var _this = this;
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ConnectToEuglena, function (particle) {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ThrowImpact, function (particle, callback) {
            this_.throwImpact(particle.data.to, particle.data.impact, callback);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.NetClientOrganelleSap, function (particle) {
            this_.sapContent = particle.data;
            _this.send(new euglena_template_1.euglena_template.being.alive.particle.OrganelleHasComeToLife(this_.name, this_.sapContent.euglenaName), this_.name);
        });
    };
    Organelle.prototype.throwImpact = function (to, impact, callback) {
        var _this = this;
        var server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact, function (impact) {
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
            var httpConnector = new HttpRequestManager(post_options);
            httpConnector.sendMessage(JSON.stringify(impact), function (message) {
                if (euglena_1.euglena.sys.type.StaticTools.Exception.isNotException(message)) {
                    try {
                        var impactAssumption = JSON.parse(message);
                        if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                            if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.Particle, impactAssumption.particle)) {
                                _this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
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
    };
    Organelle.prototype.connectToEuglena = function (euglenaInfo) {
        var _this = this;
        var post_options = {};
        post_options.host = euglenaInfo.data.url;
        post_options.port = Number(euglenaInfo.data.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        this.triedToConnect.set(euglenaInfo.data.name, true);
        var server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.data.name] = server;
        server.on("connect", function (socket) {
            server.emit("bind", new euglena_template_1.euglena_template.being.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), function (done) {
                if (done) {
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                }
            });
            server.on("impact", function (impactAssumption, callback) {
                if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.Particle, impactAssumption.particle)) {
                        _this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
                    }
                }
                else {
                }
            });
        });
        server.on("disconnect", function () {
            this_.send(new euglena_template_1.euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
        });
    };
    return Organelle;
}(euglena_template_1.euglena_template.being.alive.organelle.NetClientOrganelle));
exports.Organelle = Organelle;
var HttpRequestManager = (function () {
    function HttpRequestManager(post_options) {
        this.post_options = post_options;
    }
    HttpRequestManager.prototype.sendMessage = function (message, callback) {
        var req = jquery.post(this.post_options.url, function (data, textStatus, jqXHR) {
            if (textStatus === "200") {
                callback(data);
            }
            else {
                callback(new Exception("problem with request: " + data));
            }
        });
    };
    return HttpRequestManager;
}());
exports.HttpRequestManager = HttpRequestManager;
//# sourceMappingURL=index.js.map