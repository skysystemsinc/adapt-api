import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";
import { Declaration } from "./declaration.entity";

@Entity('hr_declarations_history')
export class DeclarationHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    declarationId: string;

    @ManyToOne(() => Declaration, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'declarationId' })
    declaration: Declaration;

    @Column({ type: 'uuid' })
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

    @ManyToOne(() => HumanResource, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;
}

