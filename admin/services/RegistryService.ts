import { ActorSubclass } from "@dfinity/agent";
import {
  REGISTRY_SERVICE,
  Collection,
  CollectionsResult,
  Blockchain,
  CollectionCategory,
  SetFeaturedArgs,
  SetVerifiedArgs,
} from "@/constants/canisters-config";

export class RegistryService {
  private actor: ActorSubclass<REGISTRY_SERVICE>;

  constructor(actor: ActorSubclass<REGISTRY_SERVICE>) {
    this.actor = actor;
  }

  // Query methods
  async getAllCollections(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_all_collections(offset, limit);
  }

  async getCollectionsPaginated(offset: bigint, limit: bigint): Promise<CollectionsResult> {
    return await this.actor.get_collections_paginated(offset, limit);
  }

  async getLatestCollections(limit: bigint): Promise<CollectionsResult> {
    return await this.actor.get_latest_collections(limit);
  }

  async getTotalCollections(): Promise<bigint> {
    return await this.actor.get_total_collections();
  }

  async getCollection(id: string): Promise<Collection | null> {
    const result = await this.actor.get_collection(id);
    return result.length > 0 ? result[0] ?? null : null;
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const result = await this.actor.get_collection_by_slug(slug);
    return result.length > 0 ? result[0] ?? null : null;
  }

  async getCollectionsByBlockchain(
    blockchain: Blockchain,
    offset: number,
    limit: number
  ): Promise<Collection[]> {
    return await this.actor.get_collections_by_blockchain(blockchain, offset, limit);
  }

  async getCollectionsByCategory(
    category: CollectionCategory,
    offset: number,
    limit: number
  ): Promise<Collection[]> {
    return await this.actor.get_collections_by_category(category, offset, limit);
  }

  async getVerifiedCollections(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_verified_collections(offset, limit);
  }

  async getFeaturedCollections(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_featured_collections(offset, limit);
  }

  async getAllDraftCollections(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_all_draft_collections(offset, limit);
  }

  async getLiveSales(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_live_sales(offset, limit);
  }

  async getUpcomingSales(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_upcoming_sales(offset, limit);
  }

  async getEndedSales(offset: number, limit: number): Promise<Collection[]> {
    return await this.actor.get_ended_sales(offset, limit);
  }

  // Admin methods
  async setVerified(args: SetVerifiedArgs): Promise<void> {
    const result = await this.actor.admin_set_verified(args);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async setFeatured(args: SetFeaturedArgs): Promise<void> {
    const result = await this.actor.admin_set_featured(args);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
  }

  async removeCollection(collectionId: string): Promise<string> {
    const result = await this.actor.admin_remove_collection(collectionId);
    if ("Err" in result) {
      throw new Error(result.Err);
    }
    return result.Ok;
  }

  async migrateCollections(): Promise<bigint> {
    const result = await this.actor.admin_migrate_collections();
    if ("Err" in result) {
      throw new Error(result.Err);
    }
    return result.Ok;
  }

  // Helper to get blockchain counts
  async getBlockchainCounts(): Promise<Record<string, number>> {
    const blockchains: Blockchain[] = [
      { Solana: null },
      { ICP: null },
      { Ethereum: null },
      { Movement: null },
    ];

    const counts: Record<string, number> = {};

    for (const blockchain of blockchains) {
      const collections = await this.getCollectionsByBlockchain(blockchain, 0, 1000);
      const name = Object.keys(blockchain)[0];
      counts[name] = collections.length;
    }

    return counts;
  }
}
