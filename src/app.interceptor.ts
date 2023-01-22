import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rawRequest = context.switchToHttp().getRequest();
    const rawResponse = context.switchToHttp().getResponse();
    const request = this.transformRequest(rawRequest);

    const now = Date.now();
    return next
      .handle()
      .pipe(tap(() => console.log(`After... ${Date.now() - now}ms`)));
  }

  private transformRequest(request: any) {
    return {
      method: request.method,
      path: request.route?.path,
    };
  }
}
