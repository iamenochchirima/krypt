import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  USERS_SERVICE,
  User,
  AdminUser,
  BannedUser,
  Config,
  AdminRole,
  Permission,
} from "@/constants/canisters-config";

export class UsersService {
  private actor: ActorSubclass<USERS_SERVICE>;

  constructor(actor: ActorSubclass<USERS_SERVICE>) {
    this.actor = actor;
  }

  // User methods
  async getAllUsers(): Promise<User[]> {
    return await this.actor.get_all_users();
  }

  async getUsersPaginated(offset: bigint, limit: bigint): Promise<{ users: User[]; total: bigint }> {
    const [users, total] = await this.actor.get_users_paginated(offset, limit);
    return { users, total };
  }

  async getLatestUsers(count: bigint): Promise<{ users: User[]; total: bigint }> {
    const [users, total] = await this.actor.get_latest_users(count);
    return { users, total };
  }

  async getTotalUsers(): Promise<bigint> {
    return await this.actor.get_total_users();
  }

  async getUserByPrincipal(principal: Principal): Promise<User | null> {
    const result = await this.actor.get_user_by_principal(principal);
    if ("Ok" in result) {
      return result.Ok;
    }
    return null;
  }

  async userExists(principal: Principal): Promise<boolean> {
    return await this.actor.user_exists(principal);
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    return await this.actor.is_username_available(username);
  }

  async isEmailInUse(email: string): Promise<boolean> {
    return await this.actor.is_email_in_use(email);
  }

  // Admin methods
  async getAllAdmins(): Promise<AdminUser[]> {
    const result = await this.actor.get_all_admins();
    if ("Ok" in result) {
      return result.Ok;
    }
    throw new Error(result.Err);
  }

  async getAdmin(principal: Principal): Promise<AdminUser | null> {
    const result = await this.actor.get_admin(principal);
    return result.length > 0 ? result[0] ?? null : null;
  }

  async isAdmin(principal: Principal): Promise<boolean> {
    return await this.actor.is_admin(principal);
  }

  async isSuperAdmin(principal: Principal): Promise<boolean> {
    return await this.actor.is_super_admin(principal);
  }

  async getSuperAdmin(): Promise<Principal> {
    return await this.actor.get_super_admin();
  }

  async addAdmin(
    principal: Principal,
    username: string,
    role: AdminRole,
    imageUrl?: string
  ): Promise<void> {
    const result = await this.actor.add_admin({
      principal,
      username,
      role,
      image_url: imageUrl ? [imageUrl] : [],
    });
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async removeAdmin(principal: Principal): Promise<void> {
    const result = await this.actor.remove_admin(principal);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async suspendAdmin(principal: Principal): Promise<void> {
    const result = await this.actor.suspend_admin(principal);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async reactivateAdmin(principal: Principal): Promise<void> {
    const result = await this.actor.reactivate_admin(principal);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async updateAdminRole(principal: Principal, role: AdminRole): Promise<void> {
    const result = await this.actor.update_admin_role({ principal, role });
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async updateAdminPermissions(principal: Principal, permissions: Permission[]): Promise<void> {
    const result = await this.actor.update_admin_permissions({ principal, permissions });
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async hasPermission(principal: Principal, permission: Permission): Promise<boolean> {
    return await this.actor.has_permission(principal, permission);
  }

  async transferSuperAdmin(newSuperAdmin: Principal): Promise<void> {
    const result = await this.actor.transfer_super_admin(newSuperAdmin);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  // Ban methods
  async banUser(principal: Principal, reason: string): Promise<void> {
    const result = await this.actor.ban_user({ principal, reason });
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async unbanUser(principal: Principal): Promise<void> {
    const result = await this.actor.unban_user(principal);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async isBanned(principal: Principal): Promise<boolean> {
    return await this.actor.is_banned(principal);
  }

  async getBannedUser(principal: Principal): Promise<BannedUser | null> {
    const result = await this.actor.get_banned_user(principal);
    return result.length > 0 ? result[0] ?? null : null;
  }

  async getAllBannedUsers(): Promise<BannedUser[]> {
    const result = await this.actor.get_all_banned_users();
    if ("Ok" in result) {
      return result.Ok;
    }
    throw new Error(result.Err);
  }

  // Config methods
  async getConfig(): Promise<Config> {
    return await this.actor.get_config();
  }

  async updatePlatformName(name: string): Promise<void> {
    const result = await this.actor.update_platform_name(name);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }
}
