export enum Permissions {
  // Application permissions
  DELETE_APPLICATION = 'delete_application',
  VIEW_APPLICATION = 'view_application',
  SUBMIT_REGISTRATION = 'submit_registration',
  UPDATE_APPLICATION = 'update_application',

  // Warehouse operator application permissions
  CREATE_OPERATOR_APPLICATION = 'create_operator_application',
  
  // Report permissions
  VIEW_REPORT = 'view_report',
  EXPORT_REPORT = 'export_report',
  
  // Admin permissions
  MANAGE_RBAC = 'manage_rbac',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_PERMISSIONS = 'manage_permissions',
  ASSIGN_ROLES = 'assign_roles',
  
  // User management
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  UPDATE_USERS = 'update_users',
  DELETE_USERS = 'delete_users',
  
  // Registration application admin
  VIEW_ALL_APPLICATIONS = 'view_all_applications',
  APPROVE_APPLICATION = 'approve_application',
  REJECT_APPLICATION = 'reject_application',
  UPDATE_APPLICATION_STATUS = 'update_application_status',
  
  // KYC verification
  VERIFY_KYC = 'verify_kyc',
  REVIEW_KYC = 'review_kyc',
  VIEW_KYC = 'view_kyc',
  REVIEW_KYC_APPROVAL = 'review_kyc_approval',
  
  // Finance
  VIEW_FINANCE_REPORTS = 'view_finance_reports',
  APPROVE_FINANCE = 'approve_finance',


  // P8
  VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT = 'view_warehouse_application_assignment',
  MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT = 'manage_warehouse_application_assignment',

  //HOD
  IS_HOD = 'is_hod',

  //Expert
  IS_EXPERT = 'is_expert',
  IS_HR_EXPERT = 'is_hr_expert',

  // Department permissions
  IS_HR = 'is_hr',
  IS_FINANCE = 'is_finance',
  IS_LEGAL = 'is_legal',
  IS_INSPECTION = 'is_inspection',
  IS_SECURITY = 'is_security',
  IS_TECHNICAL = 'is_technical',
  IS_ESC = 'is_esc',

  // Review permissions
  REVIEW_ASSESSMENT = 'review_assessment',
}

