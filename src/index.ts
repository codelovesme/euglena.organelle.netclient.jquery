
"use strict";
import * as jquery from "jquery";
import {sys, js} from "cessnalib";
import * as euglena_template from "@euglena/template";
import * as euglena from "@euglena/core";
import Particle = euglena.ParticleV1;
import * as io from "socket.io-client";
import Exception = sys.type.Exception;
import Impact = euglena.interaction.Impact;

const OrganelleName = "ReceptionOrganelleImplHttp";

let this_: Organelle = null;
export class Organelle extends euglena_template.alive.organelle.NetClientOrganelle {
    private servers: any;
    private httpConnector: HttpRequestManager;
    private triedToConnect: sys.type.Map<string, boolean>;
    private sapContent: euglena_template.alive.particle.NetClientOrganelleSapContent;
    constructor() {
        super(OrganelleName);
        this_ = this;
        this.servers = {};
        this.triedToConnect = new sys.type.Map<string, boolean>();
    }
    protected bindActions(addAction: (particleName: string, action: (particle: Particle, callback: euglena.interaction.Callback) => void) => void): void {
        addAction(euglena_template.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template.alive.constants.particles.ThrowImpact, (particle, callback) => {
            this_.throwImpact(particle.data.to, particle.data.impact, callback);
        });
        addAction(euglena_template.alive.constants.particles.NetClientOrganelleSap, (particle) => {
            this_.sapContent = particle.data;
            this.send(new euglena_template.alive.particle.OrganelleHasComeToLife(this_.name, this_.sapContent.euglenaName), this_.name);
        });
    }
    private throwImpact(to: euglena_template.alive.particle.EuglenaInfo, impact: euglena.interaction.Impact, callback: (particle: Particle) => void): void {
        let server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact, (impact: Impact) => {
                callback(impact);
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
                if (sys.type.StaticTools.Exception.isNotException<string>(message)) {
                    try {
                        let impactAssumption = JSON.parse(message);
                        this.send(impactAssumption, this_.name);
                    } catch (e) {
                        //TODO
                    }
                } else {
                    //TODO write a eligable exception message
                    this_.send(new euglena_template.alive.particle.Exception(new Exception(""), this_.sapContent.euglenaName), this_.name);
                }

            });
            if (!this.servers[to.data.name] && !this.triedToConnect.get(to.data.name)) {
                this.connectToEuglena(to);
            }
        }
    }
    private connectToEuglena(euglenaInfo: euglena_template.alive.particle.EuglenaInfo) {
        var post_options: any = {};
        post_options.host = euglenaInfo.data.url;
        post_options.port = Number(euglenaInfo.data.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        this.triedToConnect.set(euglenaInfo.data.name, true);
        let socketio = io();
        this.servers[euglenaInfo.data.name] = socketio;
        socketio.on("connect", (socket: SocketIOClient.Socket) => {
            socketio.emit("bind", new euglena_template.alive.particle.EuglenaInfo({name: this_.sapContent.euglenaName, url: "", port: ""}, this_.sapContent.euglenaName), (done: boolean) => {
                if (done) {
                    this_.send(new euglena_template.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                }
            });
            socketio.on("impact", (impactAssumption: any, callback: (impact: euglena.interaction.Impact) => void) => {
                this.send(impactAssumption, this_.name);
            });
        });
        socketio.on("disconnect", () => {
            this_.send(new euglena_template.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
        });
    }
}

export class HttpRequestManager {
    constructor(public post_options: any) {}
    public sendMessage(message: string, callback: sys.type.Callback<string>): void {
        var req = jquery.post(this.post_options.url, (data, textStatus, jqXHR) => {
            if (textStatus === "200") {
                callback(data);
            } else {
                callback(new Exception("problem with request: " + data));
            }
        });
    }
}