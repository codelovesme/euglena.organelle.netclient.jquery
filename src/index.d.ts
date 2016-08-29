/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/globals/jquery/index.d.ts" />
import { euglena_template } from "euglena.template";
import { euglena } from "euglena";
import Particle = euglena.being.Particle;
export declare class Organelle extends euglena_template.being.alive.organelle.NetClientOrganelle {
    private servers;
    private httpConnector;
    private triedToConnect;
    private sapContent;
    constructor();
    protected bindActions(addAction: (particleName: string, action: (particle: Particle) => void) => void): void;
    private throwImpact(to, impact);
    private connectToEuglena(euglenaInfo);
}
export declare class HttpRequestManager {
    post_options: any;
    constructor(post_options: any);
    sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void;
}
