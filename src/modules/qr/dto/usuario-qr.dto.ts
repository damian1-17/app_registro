// src/modules/qr/dto/usuario-qr.dto.ts
import { Expose, Type } from 'class-transformer';
import { TipoQrResponseDto } from './tipo-qr.dto';

export class UsuarioQrResponseDto {
  @Expose()
  idUsuarioQr: string;

  @Expose()
  idUsuario: number;

  @Expose()
  idTipoQr: number;

  @Expose()
  token: string;

  @Expose()
  estado: string;

  @Expose()
  usado: boolean;

  @Expose()
  fechaUso: Date;

  @Expose()
  expiracion: Date;

  @Expose()
  activo: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => TipoQrResponseDto)
  tipoQr: TipoQrResponseDto;
}

export class QrContenidoDto {
  token: string;
  idUsuario: number;
  idTipoQr: number;
  codigoTipo: string;
}