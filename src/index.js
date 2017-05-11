"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var jquery = require("jquery");
var cessnalib_1 = require("cessnalib");
var euglena_template = require("@euglena/template");
var io = require("socket.io-client");
var Exception = cessnalib_1.sys.type.Exception;
var OrganelleName = "ReceptionOrganelleImplHttp";
var this_ = null;
var Organelle = (function (_super) {
    __extends(Organelle, _super);
    function Organelle() {
        var _this = _super.call(this, OrganelleName) || this;
        this_ = _this;
        _this.servers = {};
        _this.triedToConnect = new cessnalib_1.sys.type.Map();
        return _this;
    }
    Organelle.prototype.bindActions = function (addAction) {
        var _this = this;
        addAction(euglena_template.alive.constants.particles.ConnectToEuglena, function (particle) {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template.alive.constants.particles.ThrowImpact, function (particle, callback) {
            this_.throwImpact(particle.data.to, particle.data.impact, callback);
        });
        addAction(euglena_template.alive.constants.particles.NetClientOrganelleSap, function (particle) {
            this_.sapContent = particle.data;
            _this.send(new euglena_template.alive.particle.OrganelleHasComeToLife(this_.name, this_.sapContent.euglenaName), this_.name);
        });
    };
    Organelle.prototype.throwImpact = function (to, impact, callback) {
        var _this = this;
        var server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact, function (impact) {
                callback(impact);
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
                if (cessnalib_1.sys.type.StaticTools.Exception.isNotException(message)) {
                    try {
                        var impactAssumption = JSON.parse(message);
                        _this.send(impactAssumption, this_.name);
                    }
                    catch (e) {
                        //TODO
                    }
                }
                else {
                    //TODO write a eligable exception message
                    this_.send(new euglena_template.alive.particle.Exception(new Exception(""), this_.sapContent.euglenaName), this_.name);
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
            server.emit("bind", new euglena_template.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), function (done) {
                if (done) {
                    this_.send(new euglena_template.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                }
            });
            server.on("impact", function (impactAssumption, callback) {
                _this.send(impactAssumption, this_.name);
            });
        });
        server.on("disconnect", function () {
            this_.send(new euglena_template.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
        });
    };
    return Organelle;
}(euglena_template.alive.organelle.NetClientOrganelle));
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