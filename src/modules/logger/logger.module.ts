import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') !== 'production';

        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info',
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                  },
                }
              : undefined,
            customProps: () => ({
              context: 'HTTP',
            }),
            serializers: {
              req(req) {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  query: req.query,
                  params: req.params,
                  // Do not log body to avoid sensitive data
                };
              },
              res(res) {
                return {
                  statusCode: res.statusCode,
                };
              },
            },
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie'],
              remove: true,
            },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
