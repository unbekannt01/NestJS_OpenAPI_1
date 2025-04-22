import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class RecentSearchInterceptor implements NestInterceptor{
    intercept(context: ExecutionContext, next: CallHandler<any>) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();

        console.log(request.query);
        
        return next.handle().pipe(
            tap((result) => {
                console.log(result);
            })
        );
    }
}