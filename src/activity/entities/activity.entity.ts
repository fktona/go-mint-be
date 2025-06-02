import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    walletAddress: string;

    @Column()
    type: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    username: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @CreateDateColumn()
    createdAt: Date;
}
