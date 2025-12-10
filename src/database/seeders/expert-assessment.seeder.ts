import { DataSource } from 'typeorm';
import { ExpertAssessment, AssessmentCategory } from '../../modules/expert-assessment/entities/expert-assessment.entity';

export class ExpertAssessmentSeeder {
    public async run(dataSource: DataSource): Promise<void> {
        const repository = dataSource.getRepository(ExpertAssessment);
        
        // Check environment variable - default to production
        const isStaging = process.env.NODE_ENV === 'staging';
        const limit = isStaging ? 2 : undefined;
        
        const financialAssessments = [
            'Financial',
            'Corporate Legal',
        ];

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
        ];

        const hrAssessments = [
            'HR Management',
            'Recruitment and Selection',
            'Training and Development',
            'Performance Management',
            'Employee Relations',
            'Compensation and Benefits',
            'HR Policies and Procedures',
            'Workforce Planning',
            'Employee Engagement',
            'HR Compliance',
        ];

        const legalAssessments = [
            'Legal Compliance',
            'Contract Management',
            'Regulatory Compliance',
            'Intellectual Property',
            'Corporate Governance',
            'Risk Management',
            'Legal Documentation',
            'Compliance Audits',
            'Legal Advisory',
            'Dispute Resolution',
        ];

        const ecgAssessments = [
            'ECG Standards Compliance',
            'Quality Control',
            'Documentation Standards',
            'Process Compliance',
            'ECG Guidelines Adherence',
            'Reporting Standards',
            'ECG Audit Requirements',
            'Compliance Monitoring',
            'ECG Certification',
            'Standards Verification',
        ];

        // Helper function to limit array based on environment
        const getAssessments = (assessments: string[]) => {
            return limit ? assessments.slice(0, limit) : assessments;
        };

        // Use helper function to get limited or full arrays based on environment
        const assessmentsToSeed = {
            financial: getAssessments(financialAssessments),
            technical: getAssessments(technicalAssessments),
            security: getAssessments(securityAssessments),
            hr: getAssessments(hrAssessments),
            legal: getAssessments(legalAssessments),
            ecg: getAssessments(ecgAssessments),
        };

        console.log(`\n🌱 Seeding expert assessments (${isStaging ? 'STAGING' : 'PRODUCTION'} mode - ${limit ? `${limit} per category` : 'all items'})...\n`);

        for (const name of assessmentsToSeed.financial) {
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

        for (const name of assessmentsToSeed.technical) {
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

        for (const name of assessmentsToSeed.security) {
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

        for (const name of assessmentsToSeed.hr) {
            const exists = await repository.findOne({
                where: { name, category: AssessmentCategory.HR },
            });
            if (!exists) {
                const entity = repository.create({
                    name,
                    category: AssessmentCategory.HR,
                    isActive: true,
                });
                await repository.save(entity);
                console.log(`✓ Created expert assessment: ${name}`);
            } else {
                console.log(`- Expert assessment already exists: ${name}`);
            }
        }

        for (const name of assessmentsToSeed.legal) {
            const exists = await repository.findOne({
                where: { name, category: AssessmentCategory.LEGAL },
            });
            if (!exists) {
                const entity = repository.create({
                    name,
                    category: AssessmentCategory.LEGAL,
                    isActive: true,
                });
                await repository.save(entity);
                console.log(`✓ Created expert assessment: ${name}`);
            } else {
                console.log(`- Expert assessment already exists: ${name}`);
            }
        }

        for (const name of assessmentsToSeed.ecg) {
            const exists = await repository.findOne({
                where: { name, category: AssessmentCategory.ECG },
            });
            if (!exists) {
                const entity = repository.create({
                    name,
                    category: AssessmentCategory.ECG,
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

