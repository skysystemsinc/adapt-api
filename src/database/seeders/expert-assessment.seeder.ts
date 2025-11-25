import { DataSource } from 'typeorm';
import { ExpertAssessment, AssessmentCategory } from '../../modules/expert-assessment/entities/expert-assessment.entity';

export class ExpertAssessmentSeeder {
    public async run(dataSource: DataSource): Promise<void> {
        const repository = dataSource.getRepository(ExpertAssessment);
        
        const financialAssessments = [
            'Financial',
            'Corporate Legal',
        ]

        const technicalAssessments = [
            'Accessibility',
            'Usage of storage area',
            'Power Supply',
            'Water Supply',
            'Toilet Arrangements',
            'Emergency Fire Exit',
            'Storage Compound',
            'Ancillary requirements',
            'Lab Facility and Equipment',
            'Equipment',
            'Temperature Monitoring System',
            'Weighing Scales',
            'Weighbridge',
            'Conveyor Belt & Forklift',
            'Fire Fighting Equipment',
            'Other requirements',
            'Warehouse Inspection Parameters',
            'Building structure',
            'Walls (Storage Area)',
            'Structural Support',
            'Flooring',
            'Drainage',
            'Ventilation',
            'Doors',
            'Roofs',
            'Others',
        ];

        const securityAssessments = [
            'Perimeter Security',
            'Security Personel',
            'Surviellance and Minitoring',
            'Access Control and Inventory Security',
            'Fire and safety compliance',
            'Pest Control & Environmental Monitoring',
            'Cybersecurity & Digital Infrastructure',
            'Maintenance, Audits, and Compliance',
            'Emergency Response Plan',
            'Continuous Improvement',
        ]

        for (const name of financialAssessments) {
            const exists = await repository.findOne({
                where: { name, category: AssessmentCategory.FINANCIAL },
            });
            if (!exists) {
                const entity = repository.create({
                    name,
                    category: AssessmentCategory.FINANCIAL,
                    isActive: true,
                });
                await repository.save(entity);
                console.log(`✓ Created expert assessment: ${name}`);
            } else {
                console.log(`- Expert assessment already exists: ${name}`);
            }
        }

        for (const name of technicalAssessments) {
            const exists = await repository.findOne({
                where: { name, category: AssessmentCategory.TECHNICAL },
            });

            if (!exists) {
                const entity = repository.create({
                    name,
                    category: AssessmentCategory.TECHNICAL,
                    isActive: true,
                });
                await repository.save(entity);
                console.log(`✓ Created expert assessment: ${name}`);
            } else {
                console.log(`- Expert assessment already exists: ${name}`);
            }
        }

        for (const name of securityAssessments) {
            const exists = await repository.findOne({
                where: { name, category: AssessmentCategory.SECURITY },
            });
            if (!exists) {
                const entity = repository.create({
                    name,
                    category: AssessmentCategory.SECURITY,
                    isActive: true,
                });
                await repository.save(entity);
                console.log(`✓ Created expert assessment: ${name}`);
            } else {
                console.log(`- Expert assessment already exists: ${name}`);
            }
        }
    }
}

