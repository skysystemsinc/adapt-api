import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Facility } from "../facility/entities/facility.entity";
import { Contact } from "../contacts/entities/contact.entity";
import { Jurisdiction } from "../jurisdiction/entities/jurisdiction.entity";
import { Security } from "../security/entities/security.entity";
import { FireSafety } from "../fire-safety/entities/fire-safety.entity";
import { Weighing } from "../weighings/entities/weighing.entity";
import { HumanResource } from "../human-resource/entities/human-resource.entity";
import { User } from "src/modules/users/entities/user.entity";

@Entity('warehouse_location')
export class WarehouseLocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, (user) => user.warehouseLocations)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToOne(() => Facility, (facility) => facility.warehouseLocation)
    @JoinColumn({ name: 'facilityId' })
    facility: Facility;

    @OneToOne(() => Contact, (contact) => contact.warehouseLocation)
    @JoinColumn({ name: 'contactId' })
    contact: Contact;

    @OneToOne(() => Jurisdiction, (jurisdiction) => jurisdiction.warehouseLocation)
    @JoinColumn({ name: 'jurisdictionId' })
    jurisdiction: Jurisdiction;

    @OneToOne(() => Security, (security) => security.warehouseLocation)
    @JoinColumn({ name: 'securityId' })
    security: Security;

    @OneToOne(() => FireSafety, (fireSafety) => fireSafety.warehouseLocation)
    @JoinColumn({ name: 'fireSafetyId' })
    fireSafety: FireSafety;

    @OneToOne(() => Weighing, (weighing) => weighing.warehouseLocation)
    @JoinColumn({ name: 'weighingId' })
    weighing: Weighing;

    @OneToMany(() => HumanResource, (hr) => hr.warehouseLocation)
    @JoinColumn({ name: 'humanResourcesId' })
    humanResources: HumanResource[];

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
