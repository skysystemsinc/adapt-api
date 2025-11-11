import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { WarehouseOperatorApplicationRequest } from './warehouse-operator-application-request.entity';
  
  @Entity('company_information')
  export class CompanyInformation {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ nullable: true })
    applicationId: string;
  
    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    warehouseOperatorApplicationRequest: WarehouseOperatorApplicationRequest;
  
    @Column({ type: 'varchar', length: 200, nullable: false })
    companyName: string;
  
    @Column({ type: 'varchar', length: 200, nullable: false })
    secpRegistrationNumber: string;
  
    @Column({ type: 'boolean', nullable: false })
    activeFilerStatus: boolean;
  
    @Column({ type: 'date', nullable: false })
    dateOfIncorporation: Date;
  
    @Column({ type: 'date', nullable: true })
    businessCommencementDate: Date;
  
    @Column({ type: 'text', nullable: false })
    registeredOfficeAddress: string;
    
    @Column({ type: 'varchar', length: 10, nullable: true })
    postalCode: string;
    
    @Column({ type: 'varchar', length: 100, nullable: false })
    nationalTaxNumber: string;
    
    /**
     * NTC certificate document ID from warehouse_documents table
     * This is a computed property, not a database column
     * Populated when loading company information with documents
     */
    ntcCertificate?: string;
    
    @Column({ type: 'varchar', length: 100, nullable: false })
    salesTaxRegistrationNumber: string;
    
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  
  