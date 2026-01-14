use candid::Principal;

pub const ICP_LEDGER_CANISTER_ID: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
pub const MARKETPLACE_TREASURY_PRINCIPAL_ID: &str = "vwdgl-tlm5z-a3nzv-m65so-jwqzd-lspd5-wlvhh-x4rv6-tvqdg-yr3w6-lae";

pub fn get_icp_ledger_principal() -> Principal {
    Principal::from_text(ICP_LEDGER_CANISTER_ID).expect("Invalid ICP ledger canister ID")
}

pub fn get_treasury_principal() -> Principal {
    Principal::from_text(MARKETPLACE_TREASURY_PRINCIPAL_ID).expect("Invalid treasury principal ID")
}
