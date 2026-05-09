import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../modules/auditoria/services/auditoria.service';
import { AccionAuditoria } from '../../modules/auditoria/entities/auditoria.entity';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
    constructor(private readonly auditoriaService: AuditoriaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, ip, headers } = request;

        // Determinar la acción según el método HTTP
        let accion: AccionAuditoria;
        if (method === 'POST') accion = AccionAuditoria.CREAR;
        else if (method === 'PUT' || method === 'PATCH') accion = AccionAuditoria.ACTUALIZAR;
        else if (method === 'DELETE') accion = AccionAuditoria.ELIMINAR;
        else return next.handle(); // No auditar GET

        return next.handle().pipe(
            tap((response) => {
                // Registrar después de que la operación sea exitosa
                const entidad = this.extractEntidad(url);
                const idEntidad = this.extractId(url, response);

                if (entidad && idEntidad) {
                    this.auditoriaService.registrar({
                        entidad,
                        idEntidad,
                        accion,
                        usuarioId: user?.idUsuario ?? null,
                        usuarioEmail: user?.email ?? null,
                        datosNuevos: response ?? null,
                        ip: (ip ?? request.socket?.remoteAddress) ?? null,
                        userAgent: headers['user-agent'] ?? null,
                        detalles: "Operación realizada vía interceptor de auditoría",
                    });

                }
            }),
        );
    }

    private extractEntidad(url: string): string | null {
        const match = url.match(/\/api\/v1\/([^\/]+)/);
        return match?.[1] ?? null;
    }

    private extractId(url: string, response: any): string | null {
        // Intentar extraer de la URL
        const match = url.match(/\/(\d+)$/);
        if (match) return match?.[1] ?? null;;

        // Intentar extraer de la respuesta
        if (response?.idPedido) return String(response.idPedido);
        if (response?.idProducto) return String(response.idProducto);
        if (response?.idUsuario) return String(response.idUsuario);

        return null;
    }
}