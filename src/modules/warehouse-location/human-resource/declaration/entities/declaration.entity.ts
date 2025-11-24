import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";

@Entity('hr_declarations')
export class Declaration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    humanResourceId: string;

    @Column({ type: 'boolean', default: false })
    writeOffAvailed: boolean;

    @Column({ type: 'boolean', default: false })
    defaultOfFinance: boolean;

    @Column({ type: 'boolean', default: false })
    placementOnECL: boolean;

    @Column({ type: 'boolean', default: false })
    convictionOrPleaBargain: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => HumanResource, (hr) => hr.declaration)
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;
}

