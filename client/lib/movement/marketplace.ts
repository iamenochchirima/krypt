import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MOVEMENT_CONTRACTS, MOVEMENT_NETWORK, getCurrentNetwork, type MovementNetwork } from "@/constants/movement";

export interface ListingData {
  token_data_id: string;
  listing_address: string;
  seller_address: string;
  price: bigint;
  nft_object_address: string;
}

function getAptosConfig(network?: MovementNetwork): AptosConfig {
  const activeNetwork = network ?? getCurrentNetwork();
  const config = MOVEMENT_NETWORK[activeNetwork];
  return new AptosConfig({
    network: Network.CUSTOM,
    fullnode: config.rpcUrl,
  });
}

function getMarketplaceModuleId(network?: MovementNetwork): string {
  const activeNetwork = network ?? getCurrentNetwork();
  const contract = MOVEMENT_CONTRACTS[activeNetwork].marketplace;
  return `${contract.address}::${contract.module}`;
}

export async function getAllListings(
  collectionAddress?: string,
  network?: MovementNetwork
): Promise<ListingData[]> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);
  const moduleId = getMarketplaceModuleId(network);

  try {
    const sellersResult = await aptos.view({
      payload: {
        function: `${moduleId}::get_sellers`,
        typeArguments: [],
        functionArguments: [],
      },
    });

    const sellers = sellersResult[0] as string[];

    if (!sellers || sellers.length === 0) {
      return [];
    }

    const allListings: ListingData[] = [];

    for (const seller of sellers) {
      try {
        const listingsResult = await aptos.view({
          payload: {
            function: `${moduleId}::get_seller_listings`,
            typeArguments: [],
            functionArguments: [seller],
          },
        });

        const listingAddresses = listingsResult[0] as string[];

        for (const listingAddress of listingAddresses) {
          try {
            const listingDetailsResult = await aptos.view({
              payload: {
                function: `${moduleId}::listing`,
                typeArguments: [],
                functionArguments: [listingAddress],
              },
            });

            const nftObjectRaw = listingDetailsResult[0];
            const nftObjectAddress = typeof nftObjectRaw === 'string'
              ? nftObjectRaw
              : (nftObjectRaw as any)?.inner || String(nftObjectRaw);

            const sellerRaw = listingDetailsResult[1];
            const sellerAddress = typeof sellerRaw === 'string'
              ? sellerRaw
              : (sellerRaw as any)?.inner || String(sellerRaw);

            const priceResult = await aptos.view({
              payload: {
                function: `${moduleId}::price`,
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [listingAddress],
              },
            });

            const priceOption = priceResult[0] as { vec: [string] | [] };
            if (!priceOption.vec || priceOption.vec.length === 0) {
              continue;
            }

            const price = BigInt(priceOption.vec[0]);

            allListings.push({
              token_data_id: nftObjectAddress,
              listing_address: listingAddress,
              seller_address: sellerAddress,
              price: price,
              nft_object_address: nftObjectAddress,
            });
          } catch (error) {
            console.warn(`Failed to fetch details for listing ${listingAddress}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch listings for seller ${seller}:`, error);
        continue;
      }
    }

    return allListings;
  } catch (error) {
    console.error("Failed to fetch marketplace listings:", error);
    throw error;
  }
}

export async function getListingPrice(
  listingAddress: string,
  network?: MovementNetwork
): Promise<bigint | null> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);
  const moduleId = getMarketplaceModuleId(network);

  try {
    const priceResult = await aptos.view({
      payload: {
        function: `${moduleId}::price`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [listingAddress],
      },
    });

    const priceOption = priceResult[0] as { vec: [string] | [] };
    if (!priceOption.vec || priceOption.vec.length === 0) {
      return null;
    }

    return BigInt(priceOption.vec[0]);
  } catch (error) {
    console.error(`Failed to fetch price for listing ${listingAddress}:`, error);
    return null;
  }
}

export function buildBuyTransaction(
  listingAddress: string,
  price: string,
  network?: MovementNetwork
) {
  const moduleId = getMarketplaceModuleId(network);

  return {
    data: {
      function: `${moduleId}::purchase`,
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [listingAddress],
    },
  };
}

export async function verifyListingExists(
  listingAddress: string,
  network?: MovementNetwork
): Promise<boolean> {
  try {
    const price = await getListingPrice(listingAddress, network);
    return price !== null;
  } catch (error) {
    console.error(`Failed to verify listing ${listingAddress}:`, error);
    return false;
  }
}

export function buildCancelListingTransaction(
  listingAddress: string,
  network?: MovementNetwork
) {
  const moduleId = getMarketplaceModuleId(network);

  return {
    data: {
      function: `${moduleId}::delist`,
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [listingAddress],
    },
  };
}

export async function verifyAccountExists(
  accountAddress: string,
  network?: MovementNetwork
): Promise<boolean> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);

  try {
    await aptos.getAccountInfo({ accountAddress });
    return true;
  } catch (error) {
    return false;
  }
}
