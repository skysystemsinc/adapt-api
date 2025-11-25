import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Facility } from "../facility/entities/facility.entity";
import { Contact } from "../contacts/entities/contact.entity";
import { Jurisdiction } from "../jurisdiction/entities/jurisdiction.entity";
import { Security } from "../security/entities/security.entity";
import { FireSafety } from "../fire-safety/entities/fire-safety.entity";
import { Weighing } from "../weighings/entities/weighing.entity";
import { TechnicalQualitative } from "../technical-qualitative/entities/technical-qualitative.entity";
import { HumanResource } from "../human-resource/entities/human-resource.entity";
import { User } from "../../users/entities/user.entity";

export enum WarehouseLocationStatus {
    PENDING = 'PENDING',
    IN_PROCESS = 'IN_PROCESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
}

@Entity('warehouse_location')
export class WarehouseLocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, (user) => user.warehouseLocations)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToOne(() => Facility, (facility) => facility.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'facilityId' })
    facility: Facility;

    @OneToOne(() => Contact, (contact) => contact.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'contactId' })
    contact: Contact;

    @OneToOne(() => Jurisdiction, (jurisdiction) => jurisdiction.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'jurisdictionId' })
    jurisdiction: Jurisdiction;

    @OneToOne(() => Security, (security) => security.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'securityId' })
    security: Security;

    @OneToOne(() => FireSafety, (fireSafety) => fireSafety.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'fireSafetyId' })
    fireSafety: FireSafety;

    @OneToOne(() => Weighing, (weighing) => weighing.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'weighingId' })
    weighing: Weighing;

    @OneToOne(() => TechnicalQualitative, (technicalQualitative) => technicalQualitative.warehouseLocation, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'technicalQualitativeId' })
    technicalQualitative: TechnicalQualitative;

    @OneToMany(() => HumanResource, (hr) => hr.warehouseLocation)
    @JoinColumn({ name: 'humanResourcesId' })
    humanResources: HumanResource[];

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({
        type: 'enum',
        enum: WarehouseLocationStatus,
        default: WarehouseLocationStatus.DRAFT,
    })
    status: WarehouseLocationStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
