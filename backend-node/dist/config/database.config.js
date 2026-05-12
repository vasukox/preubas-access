"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = getDatabaseConfig;
function getDatabaseConfig(config) {
    return {
        type: 'mysql',
        host: config.databaseHost,
        port: config.databasePort,
        username: config.databaseUser,
        password: config.databasePassword,
        database: config.databaseName,
        charset: 'utf8mb4',
        timezone: 'Z',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: config.isDevelopment,
        logging: config.isDevelopment ? ['error', 'warn', 'query'] : ['error'],
        maxQueryExecutionTime: 3000,
        extra: {
            connectionLimit: 10,
            queueLimit: 20,
            waitForConnections: true,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
        },
        retryAttempts: 3,
        retryDelay: 3000,
    };
}
//# sourceMappingURL=database.config.js.map