
/// <reference path="../typings/index.d.ts" />

"use strict";
import * as jquery from "jquery";
import { euglena_template } from "euglena.template";
import { euglena } from "euglena";
import Particle = euglena.being.Particle;
import * as io from "socket.io-client";
import Exception = euglena.sys.type.Exception;
import Impact = euglena.being.interaction.Impact;

const OrganelleName = "ReceptionOrganelleImplHttp";

let this_: Organelle = null;
export class Organelle extends euglena_template.being.alive.organelle.NetClientOrganelle {
    private servers: any;
    private httpConnector: HttpRequestManager;
    private triedToConnect: euglena.sys.type.Map<string, boolean>;
    private sapContent: euglena_template.being.alive.particle.NetClientOrganelleSapContent;
    constructor() {
        super(OrganelleName);
        this_ = this;
        this.servers = {};
        this.triedToConnect = new euglena.sys.type.Map<string, boolean>();
    }
    protected bindActions(addAction: (particleName: string, action: (particle: Particle, callback: euglena.being.interaction.Callback) => void) => void): void {
        addAction(euglena_template.being.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template.being.alive.constants.particles.ThrowImpact, (particle, callback) => {
            this_.throwImpact(particle.data.to, particle.data.impact, callback);
        });
        addAction(euglena_template.being.alive.constants.particles.NetClientOrganelleSap, (particle) => {
            this_.sapContent = particle.data;
            this.send(new euglena_template.being.alive.particle.OrganelleHasComeToLife(this_.name, this_.sapContent.euglenaName), this_.name);
        });
    }
    private throwImpact(to: euglena_template.being.alive.particle.EuglenaInfo, impact: euglena.being.interaction.Impact, callback: (particle: Particle) => void): void {
        let server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact, (impact: Impact) => {
                callback(new euglena_template.being.alive.particle.ImpactReceived(impact, this_.sapContent.euglenaName));
            });
        } else {
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
            httpConnector.sendMessage(JSON.stringify(impact), (message: any) => {
                if (euglena.sys.type.StaticTools.Exception.isNotException<string>(message)) {
                    try {
                        let impactAssumption = JSON.parse(message);
                        if (euglena.js.Class.instanceOf(euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                            if (euglena.js.Class.instanceOf<euglena.being.Particle>(euglena_template.reference.being.Particle, impactAssumption.particle)) {
                                this.send(new euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
                            }
                        } else {
                            //TODO log
                        }
                    } catch (e) {
                        //TODO
                    }
                } else {
                    //TODO write a eligable exception message
                    this_.send(new euglena_template.being.alive.particle.Exception(new Exception(""), this_.sapContent.euglenaName), this_.name);
                }

            });
            if (!this.servers[to.data.name] && !this.triedToConnect.get(to.data.name)) {
                this.connectToEuglena(to);
            }
        }
    }
    private connectToEuglena(euglenaInfo: euglena_template.being.alive.particle.EuglenaInfo) {
        var post_options: any = {};
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
        server.on("connect", (socket: SocketIOClient.Socket) => {
            server.emit("bind", new euglena_template.being.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), (done: boolean) => {
                if (done) {
                    this_.send(new euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                }
            });
            server.on("impact", (impactAssumption: any, callback: (impact: euglena.being.interaction.Impact) => void) => {
                this.send(new euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
        });
    }
}

export class HttpRequestManager {
    constructor(public post_options: any) { }
    public sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void {
        var req = jquery.post(this.post_options.url, (data, textStatus, jqXHR) => {
            if (textStatus === "200") {
                callback(data);
            } else {
                callback(new Exception("problem with request: " + data));
            }
        });
    }
}