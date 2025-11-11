import { DataSource } from 'typeorm';
import { Designation } from '../../modules/common/entities/designation.entity';

export class DesignationSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Designation);

    // Uncomment to delete all existing application types
    // await dataSource.query(`TRUNCATE TABLE "${repository.metadata.tableName}" RESTART IDENTITY CASCADE`);

    const designations = [
      { "slug": "ceo", "title": "CEO", "name": "Chief Executive Officer" },
      { "slug": "coo", "title": "COO", "name": "Chief Operating Officer" },
      { "slug": "cfo", "title": "CFO", "name": "Chief Financial Officer" },
      { "slug": "cto", "title": "CTO", "name": "Chief Technology Officer" },
      { "slug": "cio", "title": "CIO", "name": "Chief Information Officer" },
      { "slug": "cmo", "title": "CMO", "name": "Chief Marketing Officer" },
      { "slug": "chro", "title": "CHRO", "name": "Chief Human Resource Officer" },
      { "slug": "cso", "title": "CSO", "name": "Chief Strategy Officer" },
      { "slug": "clo", "title": "CLO", "name": "Chief Legal Officer" },
      { "slug": "cpo", "title": "CPO", "name": "Chief People Officer" },
      { "slug": "cco", "title": "CCO", "name": "Chief Commercial Officer" },
      { "slug": "ciso", "title": "CISO", "name": "Chief Information Security Officer" },

      { "slug": "managing_director", "title": "Managing Director", "name": "Managing Director" },
      { "slug": "executive_director", "title": "Executive Director", "name": "Executive Director" },
      { "slug": "general_manager", "title": "General Manager", "name": "General Manager" },
      { "slug": "deputy_general_manager", "title": "Deputy General Manager", "name": "Deputy General Manager" },
      { "slug": "assistant_general_manager", "title": "Assistant General Manager", "name": "Assistant General Manager" },
      { "slug": "senior_manager", "title": "Senior Manager", "name": "Senior Manager" },
      { "slug": "manager", "title": "Manager", "name": "Manager" },

      { "slug": "assistant_manager", "title": "Assistant Manager", "name": "Assistant Manager" },
      { "slug": "senior_officer", "title": "Senior Officer", "name": "Senior Officer" },
      { "slug": "executive", "title": "Executive", "name": "Executive" },
      { "slug": "officer", "title": "Officer", "name": "Officer" },
      { "slug": "team_leader", "title": "Team Leader", "name": "Team Leader" },
      { "slug": "project_manager", "title": "Project Manager", "name": "Project Manager" },
      { "slug": "product_manager", "title": "Product Manager", "name": "Product Manager" },
      { "slug": "operations_manager", "title": "Operations Manager", "name": "Operations Manager" },
      { "slug": "hr_manager", "title": "HR Manager", "name": "Human Resources Manager" },
      { "slug": "finance_manager", "title": "Finance Manager", "name": "Finance Manager" },
      { "slug": "sales_manager", "title": "Sales Manager", "name": "Sales Manager" },
      { "slug": "marketing_manager", "title": "Marketing Manager", "name": "Marketing Manager" },
      { "slug": "branch_manager", "title": "Branch Manager", "name": "Branch Manager" },

      { "slug": "mto", "title": "MTO", "name": "Management Trainee Officer" },
      { "slug": "gte", "title": "GTE", "name": "Graduate Trainee Engineer" },
      { "slug": "trainee_officer", "title": "Trainee Officer", "name": "Trainee Officer" },
      { "slug": "associate", "title": "Associate", "name": "Associate" },
      { "slug": "coordinator", "title": "Coordinator", "name": "Coordinator" },
      { "slug": "analyst", "title": "Analyst", "name": "Analyst" },
      { "slug": "junior_executive", "title": "Junior Executive", "name": "Junior Executive" },

      { "slug": "hr_director", "title": "HR Director", "name": "Human Resources Director" },
      { "slug": "hr_business_partner", "title": "HR Business Partner", "name": "Human Resources Business Partner" },
      { "slug": "hr_executive", "title": "HR Executive", "name": "Human Resources Executive" },
      { "slug": "admin_manager", "title": "Admin Manager", "name": "Administration Manager" },
      { "slug": "admin_officer", "title": "Admin Officer", "name": "Administration Officer" },

      { "slug": "finance_controller", "title": "Finance Controller", "name": "Finance Controller" },
      { "slug": "chief_accountant", "title": "Chief Accountant", "name": "Chief Accountant" },
      { "slug": "internal_auditor", "title": "Internal Auditor", "name": "Internal Auditor" },
      { "slug": "tax_manager", "title": "Tax Manager", "name": "Tax Manager" },
      { "slug": "accounts_officer", "title": "Accounts Officer", "name": "Accounts Officer" },
      { "slug": "junior_accountant", "title": "Junior Accountant", "name": "Junior Accountant" },

      { "slug": "bd_manager", "title": "Business Development Manager", "name": "Business Development Manager" },
      { "slug": "sales_executive", "title": "Sales Executive", "name": "Sales Executive" },
      { "slug": "key_account_manager", "title": "Key Account Manager", "name": "Key Account Manager" },
      { "slug": "asm", "title": "Area Sales Manager", "name": "Area Sales Manager" },
      { "slug": "tsm", "title": "Territory Sales Manager", "name": "Territory Sales Manager" },
      { "slug": "rsm", "title": "Regional Sales Manager", "name": "Regional Sales Manager" },

      { "slug": "software_engineer", "title": "Software Engineer", "name": "Software Engineer" },
      { "slug": "senior_software_engineer", "title": "Senior Software Engineer", "name": "Senior Software Engineer" },
      { "slug": "lead_engineer", "title": "Lead Engineer", "name": "Lead Engineer" },
      { "slug": "solution_architect", "title": "Solution Architect", "name": "Solution Architect" },
      { "slug": "devops_engineer", "title": "DevOps Engineer", "name": "DevOps Engineer" },
      { "slug": "qa_engineer", "title": "QA Engineer", "name": "Quality Assurance Engineer" },
      { "slug": "it_support_officer", "title": "IT Support Officer", "name": "IT Support Officer" },
      { "slug": "system_administrator", "title": "System Administrator", "name": "System Administrator" },

      { "slug": "supply_chain_manager", "title": "Supply Chain Manager", "name": "Supply Chain Manager" },
      { "slug": "procurement_manager", "title": "Procurement Manager", "name": "Procurement Manager" },
      { "slug": "operations_executive", "title": "Operations Executive", "name": "Operations Executive" },
      { "slug": "logistics_officer", "title": "Logistics Officer", "name": "Logistics Officer" },
      { "slug": "inventory_manager", "title": "Inventory Manager", "name": "Inventory Manager" },

      { "slug": "legal_advisor", "title": "Legal Advisor", "name": "Legal Advisor" },
      { "slug": "compliance_officer", "title": "Compliance Officer", "name": "Compliance Officer" },
      { "slug": "corporate_lawyer", "title": "Corporate Lawyer", "name": "Corporate Lawyer" },
      { "slug": "company_secretary", "title": "Company Secretary", "name": "Company Secretary" }
    ]


    for (const designation of designations) {
      const exists = await repository.findOne({
        where: { slug: designation.slug },
      });

      if (!exists) {
        const entity = repository.create(designation);
        await repository.save(entity);
        console.log(`✓ Created designation: ${designation.name}`);
      } else {
        console.log(`- Designation already exists: ${designation.name}`);
      }
    }
  }
}

