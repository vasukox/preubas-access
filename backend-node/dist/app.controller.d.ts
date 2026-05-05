import { ConfigService } from './config/config.service';
export declare class AppController {
    private readonly configService;
    constructor(configService: ConfigService);
    getInfo(): {
        name: string;
        version: string;
        environment: string;
        docs: string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        version: string;
    };
}
