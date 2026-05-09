import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const facturacionDS: TypeOrmModuleOptions = {
  type: "postgres",

  host: process.env.DB2_HOST || "aws-1-us-east-2.pooler.supabase.com", // <-- pon el real
  port: Number(process.env.DB2_PORT || 6543),
  username: process.env.DB2_USER || "postgres.bmetejwtnaulmukcorsp",
  password: process.env.DB2_PASS || "factswemp123.", // <-- tu pass
  database: process.env.DB2_NAME || "postgres",   // <-- SIEMPRE ES postgres

  ssl: { rejectUnauthorized: false },

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
};
