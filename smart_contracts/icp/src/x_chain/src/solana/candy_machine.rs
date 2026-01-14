use super::{client, solana_wallet::SolanaWallet};
use crate::types::{InstructionData, TransactionType};
use bincode::deserialize;
use ic_cdk::api::canister_self;
use solana_instruction::Instruction;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_transaction::Transaction;
use std::str::FromStr;

/// Signs and sends a pre-built Solana transaction
/// The collection_id is used to derive the candy machine and collection accounts
pub async fn sign_and_send_transaction(
    collection_id: String,
    serialized_message: Vec<u8>,
    transaction_type: TransactionType,
    user_wallet_address: Option<String>,
) -> Result<String, String> {
    let message: Message = deserialize(&serialized_message)
        .map_err(|e| format!("Failed to deserialize message: {:?}", e))?;

    validate_transaction(
        &message,
        &transaction_type,
        &collection_id,
        user_wallet_address.as_deref(),
    )?;

    let canister_wallet = SolanaWallet::new(canister_self()).await;
    let payer = canister_wallet.solana_account();

    ic_cdk::println!(
        "Signing and sending {:?} transaction for collection {}",
        transaction_type,
        collection_id
    );

    let signatures = match transaction_type {
        TransactionType::CreateCandyMachine => {
            vec![
                payer.sign_message(&message).await,
                payer.sign_message(&message).await,
            ]
        }
        TransactionType::TransferAuthority | TransactionType::UpdateCandyMachine => {
            vec![payer.sign_message(&message).await]
        }
    };

    let transaction = Transaction {
        message,
        signatures,
    };

    let multi_result = client().send_transaction(transaction).send().await;

    let signature = match multi_result {
        sol_rpc_types::MultiRpcResult::Consistent(result) => {
            ic_cdk::println!("All RPC providers agree on transaction result");
            result.map_err(|e| format!("Failed to send transaction: {}", e))?
        }
        sol_rpc_types::MultiRpcResult::Inconsistent(results) => {
            ic_cdk::println!(
                "RPC providers returned inconsistent results, using majority consensus"
            );

            let mut successes = Vec::new();
            let mut failures = Vec::new();

            for (source, result) in results.iter() {
                match result {
                    Ok(sig) => {
                        ic_cdk::println!("Provider {:?} succeeded with signature: {}", source, sig);
                        successes.push(sig.clone());
                    }
                    Err(e) => {
                        ic_cdk::println!("Provider {:?} failed with error: {:?}", source, e);
                        failures.push(e);
                    }
                }
            }

            if successes.len() >= 2 {
                ic_cdk::println!(
                    "Majority consensus: {} providers succeeded",
                    successes.len()
                );
                successes[0].clone()
            } else {
                return Err(format!(
                    "Transaction failed consensus: {} successes, {} failures",
                    successes.len(),
                    failures.len()
                ));
            }
        }
    };

    ic_cdk::println!("Transaction sent successfully: {}", signature);

    Ok(signature.to_string())
}

fn validate_transaction(
    message: &Message,
    transaction_type: &TransactionType,
    collection_id: &str,
    user_wallet_address: Option<&str>,
) -> Result<(), String> {
    if message.instructions.is_empty() {
        return Err("Transaction has no instructions".to_string());
    }

    match transaction_type {
        TransactionType::CreateCandyMachine => {
            ic_cdk::println!(
                "Validating CreateCandyMachine transaction for collection {}",
                collection_id
            );
        }
        TransactionType::TransferAuthority => {
            if user_wallet_address.is_none() {
                return Err("User wallet address required for authority transfer".to_string());
            }
            ic_cdk::println!(
                "Validating TransferAuthority transaction for collection {}",
                collection_id
            );
        }
        TransactionType::UpdateCandyMachine => {
            ic_cdk::println!(
                "Validating UpdateCandyMachine transaction for collection {}",
                collection_id
            );
        }
    }

    Ok(())
}

/// Creates a candy machine from instruction data
/// The collection_id is used to derive deterministic addresses for candy machine and collection mint
pub async fn create_candy_machine_from_instruction(
    collection_id: String,
    instructions_data: Vec<InstructionData>,
) -> Result<String, String> {
    ic_cdk::println!(
        "Creating Candy Machine from instruction for collection {}",
        collection_id
    );

    let canister_wallet = SolanaWallet::new(canister_self()).await;
    let payer = canister_wallet.solana_account();
    let candy_machine_account = canister_wallet.candy_machine_account(&collection_id);
    let collection_mint_account = canister_wallet.collection_account(&collection_id);

    let payer_pubkey = *payer.as_ref();
    let candy_machine_pubkey = *candy_machine_account.as_ref();
    let collection_mint_pubkey = *collection_mint_account.as_ref();

    ic_cdk::println!(
        "Canister payer address: {}",
        bs58::encode(payer.as_ref()).into_string()
    );
    ic_cdk::println!(
        "Derived candy machine address: {}",
        bs58::encode(candy_machine_account.as_ref()).into_string()
    );
    ic_cdk::println!(
        "Derived collection mint address: {}",
        bs58::encode(collection_mint_account.as_ref()).into_string()
    );

    let mut instructions: Vec<Instruction> = Vec::new();

    for (idx, instruction_data) in instructions_data.into_iter().enumerate() {
        ic_cdk::println!(
            "[create_cm] Instruction {} program_id={} data_len={}",
            idx,
            instruction_data.program_id,
            instruction_data.data.len()
        );

        let program_id = Pubkey::from_str(&instruction_data.program_id)
            .map_err(|e| format!("Invalid program ID: {:?}", e))?;

        let mut account_metas = Vec::new();
        let mut found_candy_machine = false;

        for (acct_idx, account) in instruction_data.accounts.into_iter().enumerate() {
            let pubkey = Pubkey::from_str(&account.pubkey)
                .map_err(|e| format!("Invalid account pubkey: {:?}", e))?;

            ic_cdk::println!(
                "[create_cm]   Instruction {} Account {}: {} signer={} writable={}",
                idx,
                acct_idx,
                bs58::encode(pubkey.to_bytes()).into_string(),
                account.is_signer,
                account.is_writable
            );

            if account.is_signer {
                let is_payer = pubkey == payer_pubkey;
                let is_candy_machine = pubkey == candy_machine_pubkey;
                let is_collection_mint = pubkey == collection_mint_pubkey;

                if !is_payer && !is_candy_machine && !is_collection_mint {
                    return Err(format!(
                        "Transaction requires signer {} that the canister cannot authorize. Payer={}, CandyMachine={}, CollectionMint={}",
                        bs58::encode(pubkey.to_bytes()).into_string(),
                        bs58::encode(payer_pubkey.to_bytes()).into_string(),
                        bs58::encode(candy_machine_pubkey.to_bytes()).into_string(),
                        bs58::encode(collection_mint_pubkey.to_bytes()).into_string()
                    ));
                }
            }

            if pubkey == candy_machine_pubkey {
                found_candy_machine = true;
            }

            account_metas.push(solana_instruction::AccountMeta {
                pubkey,
                is_signer: account.is_signer,
                is_writable: account.is_writable,
            });
        }

        // Note: We don't require candy_machine to be present in every instruction
        // Collection NFT creation instructions won't have it, only Candy Machine creation will
        ic_cdk::println!(
            "[create_cm]   Instruction {} includes candy_machine: {}",
            idx,
            found_candy_machine
        );

        instructions.push(Instruction {
            program_id,
            accounts: account_metas,
            data: instruction_data.data,
        });
    }

    let blockhash = client()
        .estimate_recent_blockhash()
        .send()
        .await
        .map_err(|e| format!("Failed to get recent blockhash: {:?}", e))?;

    ic_cdk::println!("Got recent blockhash: {:?}", blockhash);

    let message =
        Message::new_with_blockhash(instructions.as_slice(), Some(payer.as_ref()), &blockhash);

    let num_signatures = message.header.num_required_signatures as usize;

    ic_cdk::println!("Number of required signatures: {}", num_signatures);
    let num_signed_writable =
        num_signatures.saturating_sub(message.header.num_readonly_signed_accounts as usize);
    let total_unsigned = message.account_keys.len().saturating_sub(num_signatures);
    let num_unsigned_writable =
        total_unsigned.saturating_sub(message.header.num_readonly_unsigned_accounts as usize);

    for (index, key) in message.account_keys.iter().enumerate() {
        let signer = index < num_signatures;
        let writable = if signer {
            index < num_signed_writable
        } else {
            let unsigned_index = index - num_signatures;
            unsigned_index < num_unsigned_writable
        };

        ic_cdk::println!(
            "Account {}: {} signer={} writable={}",
            index,
            bs58::encode(key).into_string(),
            signer,
            writable
        );
    }

    let mut signatures = Vec::new();
    for (index, signer) in message.account_keys.iter().take(num_signatures).enumerate() {
        if signer == payer.as_ref() {
            ic_cdk::println!("Signing as payer at position {}", index);
            signatures.push(payer.sign_message(&message).await);
        } else if signer == candy_machine_account.as_ref() {
            ic_cdk::println!("Signing as candy machine at position {}", index);
            signatures.push(candy_machine_account.sign_message(&message).await);
        } else if signer == collection_mint_account.as_ref() {
            ic_cdk::println!("Signing as collection mint at position {}", index);
            signatures.push(collection_mint_account.sign_message(&message).await);
        } else {
            return Err(format!(
                "Transaction requires signer {} that the canister cannot authorize",
                bs58::encode(signer).into_string()
            ));
        }
    }

    let transaction = Transaction {
        message,
        signatures,
    };

    let multi_result = client().send_transaction(transaction).send().await;

    let signature = match multi_result {
        sol_rpc_types::MultiRpcResult::Consistent(result) => {
            ic_cdk::println!("All RPC providers agree on transaction result");
            result.map_err(|e| format!("Failed to send transaction: {}", e))?
        }
        sol_rpc_types::MultiRpcResult::Inconsistent(results) => {
            ic_cdk::println!(
                "RPC providers returned inconsistent results, using majority consensus"
            );

            let mut successes = Vec::new();
            let mut failures = Vec::new();

            for (source, result) in results.iter() {
                match result {
                    Ok(sig) => {
                        ic_cdk::println!("Provider {:?} succeeded with signature: {}", source, sig);
                        successes.push(sig.clone());
                    }
                    Err(e) => {
                        ic_cdk::println!("Provider {:?} failed with error: {:?}", source, e);
                        failures.push(e);
                    }
                }
            }

            if successes.len() >= 2 {
                ic_cdk::println!(
                    "Majority consensus: {} providers succeeded, using transaction",
                    successes.len()
                );
                successes[0].clone()
            } else {
                return Err(format!(
                    "Transaction failed consensus: {} successes, {} failures. Errors: {:?}",
                    successes.len(),
                    failures.len(),
                    failures
                ));
            }
        }
    };

    ic_cdk::println!("Transaction sent successfully: {}", signature);

    Ok(signature.to_string())
}

/// Adds items to an existing candy machine
/// The collection_id is used to derive the candy machine address
pub async fn add_items_to_candy_machine(
    collection_id: String,
    instruction_data: InstructionData,
) -> Result<String, String> {
    ic_cdk::println!(
        "add_items_to_candy_machine: program_id={} data_len={}",
        instruction_data.program_id,
        instruction_data.data.len()
    );
    let preview: Vec<String> = instruction_data
        .data
        .iter()
        .take(16)
        .map(|b| format!("{:02x}", b))
        .collect();
    ic_cdk::println!(
        "add_items_to_candy_machine: data preview (first 16 bytes hex): {:?}",
        preview
    );

    ic_cdk::println!(
        "Adding items to candy machine for collection {}",
        collection_id
    );

    let canister_wallet = SolanaWallet::new(canister_self()).await;
    let payer = canister_wallet.solana_account();
    let candy_machine_account = canister_wallet.candy_machine_account(&collection_id);
    let collection_mint_account = canister_wallet.collection_account(&collection_id);

    let payer_pubkey = *payer.as_ref();
    let candy_machine_pubkey = *candy_machine_account.as_ref();
    let collection_mint_pubkey = *collection_mint_account.as_ref();

    ic_cdk::println!(
        "Payer: {}, Candy Machine: {}, Collection Mint: {}",
        bs58::encode(payer.as_ref()).into_string(),
        bs58::encode(candy_machine_account.as_ref()).into_string(),
        bs58::encode(collection_mint_account.as_ref()).into_string()
    );

    let program_id = Pubkey::from_str(&instruction_data.program_id)
        .map_err(|e| format!("Invalid program ID: {:?}", e))?;

    let mut account_metas = Vec::new();
    let mut found_candy_machine = false;

    for (idx, account) in instruction_data.accounts.into_iter().enumerate() {
        let pubkey = Pubkey::from_str(&account.pubkey)
            .map_err(|e| format!("Invalid account pubkey: {:?}", e))?;

        ic_cdk::println!(
            "[add_items] Account {}: {} signer={} writable_in_data={}",
            idx,
            bs58::encode(pubkey.to_bytes()).into_string(),
            account.is_signer,
            account.is_writable
        );

        if account.is_signer {
            let is_payer = pubkey == payer_pubkey;
            let is_candy_machine = pubkey == candy_machine_pubkey;
            let is_collection_mint = pubkey == collection_mint_pubkey;

            if !is_payer && !is_candy_machine && !is_collection_mint {
                return Err(format!(
                    "Transaction requires signer {} that the canister cannot authorize. Payer={}, CandyMachine={}, CollectionMint={}",
                    bs58::encode(pubkey.to_bytes()).into_string(),
                    bs58::encode(payer_pubkey.to_bytes()).into_string(),
                    bs58::encode(candy_machine_pubkey.to_bytes()).into_string(),
                    bs58::encode(collection_mint_pubkey.to_bytes()).into_string()
                ));
            }
        }

        if pubkey == candy_machine_pubkey {
            found_candy_machine = true;
        }

        let is_writable = account.is_writable || pubkey == candy_machine_pubkey;

        ic_cdk::println!(
            "[add_items] Final meta {} signer={} writable_final={}",
            bs58::encode(pubkey.to_bytes()).into_string(),
            account.is_signer,
            is_writable
        );

        account_metas.push(solana_instruction::AccountMeta {
            pubkey,
            is_signer: account.is_signer,
            is_writable,
        });
    }

    if !found_candy_machine {
        return Err(
            "Instruction data does not reference the derived candy machine account".to_string(),
        );
    }

    let instruction = Instruction {
        program_id,
        accounts: account_metas,
        data: instruction_data.data,
    };

    let blockhash = client()
        .estimate_recent_blockhash()
        .send()
        .await
        .map_err(|e| format!("Failed to get recent blockhash: {:?}", e))?;

    let message = Message::new_with_blockhash(&[instruction], Some(payer.as_ref()), &blockhash);

    let num_signatures = message.header.num_required_signatures as usize;

    ic_cdk::println!("Number of required signatures: {}", num_signatures);

    let num_signed_writable =
        num_signatures.saturating_sub(message.header.num_readonly_signed_accounts as usize);
    let total_unsigned = message.account_keys.len().saturating_sub(num_signatures);
    let num_unsigned_writable =
        total_unsigned.saturating_sub(message.header.num_readonly_unsigned_accounts as usize);

    for (index, key) in message.account_keys.iter().enumerate() {
        let signer = index < num_signatures;
        let writable = if signer {
            index < num_signed_writable
        } else {
            let unsigned_index = index - num_signatures;
            unsigned_index < num_unsigned_writable
        };

        ic_cdk::println!(
            "Account {}: {} signer={} writable={}",
            index,
            bs58::encode(key).into_string(),
            signer,
            writable
        );
    }

    let mut signatures = Vec::new();
    for (index, signer) in message.account_keys.iter().take(num_signatures).enumerate() {
        if signer == payer.as_ref() {
            ic_cdk::println!("Signing as payer at position {}", index);
            signatures.push(payer.sign_message(&message).await);
        } else if signer == candy_machine_account.as_ref() {
            ic_cdk::println!("Signing as candy machine at position {}", index);
            signatures.push(candy_machine_account.sign_message(&message).await);
        } else if signer == collection_mint_account.as_ref() {
            ic_cdk::println!("Signing as collection mint at position {}", index);
            signatures.push(collection_mint_account.sign_message(&message).await);
        } else {
            return Err(format!(
                "Transaction requires signer {} that the canister cannot authorize",
                bs58::encode(signer).into_string()
            ));
        }
    }

    let transaction = Transaction {
        message,
        signatures,
    };

    let multi_result = client().send_transaction(transaction).send().await;

    let signature = match multi_result {
        sol_rpc_types::MultiRpcResult::Consistent(result) => {
            ic_cdk::println!("All RPC providers agree on transaction result");
            result.map_err(|e| format!("Failed to send transaction: {}", e))?
        }
        sol_rpc_types::MultiRpcResult::Inconsistent(results) => {
            ic_cdk::println!(
                "RPC providers returned inconsistent results, using majority consensus"
            );

            let mut successes = Vec::new();
            let mut failures = Vec::new();

            for (source, result) in results.iter() {
                match result {
                    Ok(sig) => {
                        ic_cdk::println!("Provider {:?} succeeded with signature: {}", source, sig);
                        successes.push(sig.clone());
                    }
                    Err(e) => {
                        ic_cdk::println!("Provider {:?} failed with error: {:?}", source, e);
                        failures.push(e);
                    }
                }
            }

            if successes.len() >= 2 {
                ic_cdk::println!(
                    "Majority consensus: {} providers succeeded, using transaction",
                    successes.len()
                );
                successes[0].clone()
            } else {
                return Err(format!(
                    "Transaction failed consensus: {} successes, {} failures. Errors: {:?}",
                    successes.len(),
                    failures.len(),
                    failures
                ));
            }
        }
    };

    ic_cdk::println!("Items added transaction sent: {}", signature);

    Ok(signature.to_string())
}
