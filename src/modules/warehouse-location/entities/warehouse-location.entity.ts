import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Facility } from "../facility/entities/facility.entity";
import { Contact } from "../contacts/entities/contact.entity";
import { Jurisdiction } from "../jurisdiction/entities/jurisdiction.entity";
import { Security } from "../security/entities/security.entity";
import { FireSafety } from "../fire-safety/entities/fire-safety.entity";
import { Weighing } from "../weighings/entities/weighing.entity";
import { HumanResource } from "../human-resource/entities/human-resource.entity";

@Entity('warehouse_location')
export class WarehouseLocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    applicantLegalStatus: string;

    @Column({ type: 'varchar', length: 100 })
    applicantAuthorizedSignatory: string;

    @OneToMany(() => Facility, (facility) => facility.warehouseLocation)
    facilities: Facility[];

    @OneToMany(() => Contact, (contact) => contact.warehouseLocation)
    contacts: Contact[];

    @OneToMany(() => Jurisdiction, (jurisdiction) => jurisdiction.warehouseLocation)
    jurisdictions: Jurisdiction[];

    @OneToMany(() => Security, (security) => security.warehouseLocation)
    securities: Security[];

    @OneToMany(() => FireSafety, (fireSafety) => fireSafety.warehouseLocation)
    fireSafeties: FireSafety[];

    @OneToMany(() => Weighing, (weighing) => weighing.warehouseLocation)
    weighings: Weighing[];

    @OneToMany(() => HumanResource, (hr) => hr.warehouseLocation)
    humanResources: HumanResource[];

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
