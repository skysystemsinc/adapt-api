import { RolePermission } from "src/modules/rbac/entities/role-permission.entity";
import { User } from "../../modules/users/entities/user.entity";
import crypto from 'crypto';
import { config } from 'dotenv';
config({
  path: '.env',
});
const ALGO = 'aes-256-gcm';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hasPermission(user: User, permission: string): boolean {
  return user.userRoles[0].role.rolePermissions.some((rolePermission: RolePermission) => rolePermission.permission.name === permission);
}

export function encryptBuffer(buffer: Buffer) {
  const iv = crypto.randomBytes(16);
  const encryptKey = process.env.FILE_ENCRYPT_KEY;
  if (!encryptKey) {
    throw new Error('FILE_ENCRYPT_KEY environment variable is not set');
  }
  const key = Buffer.from(encryptKey, 'hex');

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptBuffer(
  encrypted: Buffer,
  ivHex: string,
  authTagHex: string
) {
  const iv = Buffer.from(ivHex, 'hex');
  const encryptKey = process.env.FILE_ENCRYPT_KEY;
  if (!encryptKey) {
    throw new Error('FILE_ENCRYPT_KEY environment variable is not set');
  }
  const key = Buffer.from(encryptKey, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted;
}

export const ASSIGNMENT_COUNT = 6;

