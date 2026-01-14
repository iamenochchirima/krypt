use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransactionType {
    CreateCandyMachine,
    TransferAuthority,
    UpdateCandyMachine,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SignAndSendTransactionArgs {
    pub collection_id: String,
    pub serialized_message: Vec<u8>,
    pub transaction_type: TransactionType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AccountMeta {
    pub pubkey: String,
    pub is_signer: bool,
    pub is_writable: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InstructionData {
    pub program_id: String,
    pub accounts: Vec<AccountMeta>,
    pub data: Vec<u8>,
}
