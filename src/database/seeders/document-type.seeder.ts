import { DataSource } from 'typeorm';
import { DocumentType } from '../../modules/document-type/entities/document-type.entity';

export class DocumentTypeSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const documentTypeRepository = dataSource.getRepository(DocumentType);

    console.log('🌱 Seeding document types...\n');

    const documentTypes = [
      { name: 'eCIB', isActive: true },
      { name: 'CNIC', isActive: true },
      { name: 'Passport', isActive: true },
      { name: 'Power of Attorney', isActive: true },
      { name: 'Board Resolution', isActive: true },
      { name: 'Bank Slip', isActive: true },
      { name: 'Financial Authorization', isActive: true },
      { name: 'Utility Bill', isActive: true },
      { name: 'Business License', isActive: true },
    ];

    for (const docType of documentTypes) {
      const exists = await documentTypeRepository.findOne({
        where: { name: docType.name },
      });

      if (!exists) {
        const documentType = documentTypeRepository.create(docType);
        await documentTypeRepository.save(documentType);
        console.log(`✓ Created document type: ${docType.name}`);
      } else {
        console.log(`- Document type already exists: ${docType.name}`);
      }
    }

    console.log('\n✅ Document types seeding completed\n');
  }
}

