import { sys } from "cessnalib";
import * as euglena_template from "@euglena/template";
import * as euglena from "@euglena/core";
import Particle = euglena.ParticleV1;
export declare class Organelle extends euglena_template.alive.organelle.NetClientOrganelle {
    private servers;
    private httpConnector;
    private triedToConnect;
    private sapContent;
    constructor();
    protected bindActions(addAction: (particleName: string, action: (particle: Particle, callback: euglena.interaction.Callback) => void) => void): void;
    private throwImpact;
    private connectToEuglena;
}
export declare class HttpRequestManager {
    post_options: any;
    constructor(post_options: any);
    sendMessage(message: string, callback: sys.type.Callback<string>): void;
}
