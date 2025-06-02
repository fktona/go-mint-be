import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const dbConfig = (): PostgresConnectionOptions => (
     {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production', // Set to false in production
    } 
);
export default dbConfig;
// import { Injectable } from '@nestjs/common'; 