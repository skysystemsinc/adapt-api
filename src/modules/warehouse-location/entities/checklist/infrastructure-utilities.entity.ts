import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocationChecklistEntity } from "../warehouse-location-checklist.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('infrastructure_utilities_checklist')
export class InfrastructureUtilitiesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    functionalWeighbridge: boolean;

    @Column({ nullable: true })
    functionalWeighbridgeFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'functionalWeighbridgeFile' })
    functionalWeighbridgeDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    samplingTestingArea: boolean;

    @Column({ nullable: true })
    samplingTestingAreaFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'samplingTestingAreaFile' })
    samplingTestingAreaDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    calibratedInstruments: boolean;

    @Column({ nullable: true })
    calibratedInstrumentsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'calibratedInstrumentsFile' })
    calibratedInstrumentsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    functionalOffice: boolean;

    @Column({ nullable: true })
    functionalOfficeFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'functionalOfficeFile' })
    functionalOfficeDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    operationalToilets: boolean;

    @Column({ nullable: true })
    operationalToiletsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'operationalToiletsFile' })
    operationalToiletsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    electricityGasUtilities: boolean;

    @Column({ nullable: true })
    electricityGasUtilitiesFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'electricityGasUtilitiesFile' })
    electricityGasUtilitiesDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    backupGenerator: boolean;

    @Column({ nullable: true })
    backupGeneratorFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'backupGeneratorFile' })
    backupGeneratorDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    adequateResidentialArrangements: boolean;

    @Column({ nullable: true })
    adequateResidentialArrangementsFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'adequateResidentialArrangementsFile' })
    adequateResidentialArrangementsDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    axialAerationFans: boolean;

    @Column({ nullable: true })
    axialAerationFansFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'axialAerationFansFile' })
    axialAerationFansDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    ventsExhaustFans: boolean;

    @Column({ nullable: true })
    ventsExhaustFansFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'ventsExhaustFansFile' })
    ventsExhaustFansDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    technicalDrawing: boolean;

    @Column({ nullable: true })
    technicalDrawingFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'technicalDrawingFile' })
    technicalDrawingDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    dryingFacility: boolean;

    @Column({ nullable: true })
    dryingFacilityFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'dryingFacilityFile' })
    dryingFacilityDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    temperatureSensorCables: boolean;

    @Column({ nullable: true })
    temperatureSensorCablesFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'temperatureSensorCablesFile' })
    temperatureSensorCablesDocument?: WarehouseDocument;

    @ManyToOne(() => WarehouseLocationChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouseLocationChecklistId' })
    warehouseLocationChecklist: WarehouseLocationChecklistEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

