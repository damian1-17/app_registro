import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const pedidosDS: TypeOrmModuleOptions = {
  type: "postgres",

  host: process.env.DB1_HOST || "aws-1-us-east-2.pooler.supabase.com", // <-- pon el real
  port: Number(process.env.DB1_PORT || 5432),
  username: process.env.DB1_USER || "postgres.shezolwtzocdjcsrfonh",
  password: process.env.DB1_PASS || "Nnodrik117*", // <-- tu pass
  database: process.env.DB1_NAME || "postgres",   // <-- SIEMPRE ES postgres

  ssl: { rejectUnauthorized: false },

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
};
