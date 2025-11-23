import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum OrganizationStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum OrganizationType {
    INTERNAL = 'INTERNAL',
    EXTERNAL = 'EXTERNAL',
}

@Entity('organization')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    slug: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'createdBy' })
    createdByUser: User;
    
    @Column({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.ACTIVE })
    @Index('status_index')
    status: OrganizationStatus;

    @Column({ type: 'enum', enum: OrganizationType, default: OrganizationType.INTERNAL })
    @Index('type_index')
    type: OrganizationType;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
