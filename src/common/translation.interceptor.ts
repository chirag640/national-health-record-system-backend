import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';

/**
 * Interceptor to translate error codes and messages in API responses
 * Uses Accept-Language header or query parameter to determine language
 */
@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const lang = request.headers['accept-language']?.split(',')[0] || 'en';

    return next.handle().pipe(
      map((data) => {
        // If response contains error code, translate it
        if (data && typeof data === 'object' && data.code) {
          const translatedMessage = this.i18n.translate(`errors.${data.code}`, {
            lang,
            defaultValue: data.message,
          });
          return {
            ...data,
            message: translatedMessage,
          };
        }

        // If response contains success message key
        if (data && typeof data === 'object' && data.messageKey) {
          const translatedMessage = this.i18n.translate(`messages.${data.messageKey}`, {
            lang,
            defaultValue: data.message,
          });
          return {
            ...data,
            message: translatedMessage,
          };
        }

        return data;
      }),
    );
  }
}
