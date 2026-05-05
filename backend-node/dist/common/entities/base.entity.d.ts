import { BaseEntity as TypeOrmBaseEntity } from 'typeorm';
export declare abstract class BaseEntity extends TypeOrmBaseEntity {
    id: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
