import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WarehouseOperatorApplicationRequest } from "../../entities/warehouse-operator-application-request.entity";
import { WarehouseLocation } from "../../../warehouse-location/entities/warehouse-location.entity";
import { User } from "../../../users/entities/user.entity";
import { AssessmentDetailsEntity } from "./assessment_details.entity";

@Entity('warehouse_final_assessment')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string;

  @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: WarehouseOperatorApplicationRequest;

  @Column({ type: 'uuid', nullable: true })
  applicationLocationId: string;

  @ManyToOne(() => WarehouseLocation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationLocationId' })
  applicationLocation: WarehouseLocation;

  @Column({ type: 'varchar', nullable: false })
  type: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: false })
  isSubmitted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @OneToMany(() => AssessmentDetailsEntity, (details) => details.assessment)
  details: AssessmentDetailsEntity[];
}
