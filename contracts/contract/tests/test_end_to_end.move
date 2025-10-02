#[test_only]
module veil_addr::privacy_pool_tests {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, MintCapability, BurnCapability};
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use veil_addr::privacy_pool::{initialize_pool, deposit};

    const TEST_FIXED_AMOUNT: u64 = 10_000_000_000; // 10 APT

    // test_deposit_flow simulates the entire process from setup to a successful deposit.
    #[test(aptos_framework = @0x1, deployer = @veil_addr, user = @0xCAFE)]
    fun test_deposit_flow(aptos_framework: &signer, deployer: &signer, user: &signer) {
        // --- 1. Setup Phase ---
        let user_addr = signer::address_of(user);
        let deployer_addr = signer::address_of(deployer);
        
        // Create accounts for testing
        account::create_account_for_test(deployer_addr);
        account::create_account_for_test(user_addr);

        // Initialize AptosCoin for testing
        // NOTE: initialize_for_test returns (BurnCapability, MintCapability)
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        // Register user for AptosCoin and mint test coins
        coin::register<AptosCoin>(user);
        let coins = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        coin::deposit(user_addr, coins);

        // The deployer initializes the pool with a fixed amount of 10 APT.
        coin::register<AptosCoin>(deployer);
        initialize_pool<AptosCoin>(deployer, TEST_FIXED_AMOUNT);

        // --- 2. Action Phase ---
        // The user calls the `deposit` function.
        // We create a fake secret hash for the test.
        let secret_hash = x"01020304"; // A simple byte vector for testing

        // This is the line that executes the function we are testing.
        deposit<AptosCoin>(user, secret_hash, TEST_FIXED_AMOUNT);

        // --- 3. Verification Phase ---
        // Check that user's balance decreased
        let user_balance = coin::balance<AptosCoin>(user_addr);
        assert!(user_balance == 90_000_000_000, 1); // Should have 90 APT left

        // Clean up
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, deployer = @veil_addr, user = @0xCAFE)]
    #[expected_failure(abort_code = 2, location = veil_addr::privacy_pool)] // E_WRONG_AMOUNT
    fun test_deposit_wrong_amount(aptos_framework: &signer, deployer: &signer, user: &signer) {
        // Setup
        let user_addr = signer::address_of(user);
        let deployer_addr = signer::address_of(deployer);
        
        account::create_account_for_test(deployer_addr);
        account::create_account_for_test(user_addr);

        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        coin::register<AptosCoin>(user);
        let coins = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        coin::deposit(user_addr, coins);

        coin::register<AptosCoin>(deployer);
        initialize_pool<AptosCoin>(deployer, TEST_FIXED_AMOUNT);

        // Try to deposit wrong amount - should fail
        let secret_hash = x"01020304";
        deposit<AptosCoin>(user, secret_hash, TEST_FIXED_AMOUNT + 1);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, deployer = @veil_addr, user = @0xCAFE)]
    #[expected_failure(abort_code = 3, location = veil_addr::privacy_pool)] // E_SECRET_ALREADY_USED
    fun test_deposit_duplicate_commitment(aptos_framework: &signer, deployer: &signer, user: &signer) {
        // Setup
        let user_addr = signer::address_of(user);
        let deployer_addr = signer::address_of(deployer);
        
        account::create_account_for_test(deployer_addr);
        account::create_account_for_test(user_addr);

        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        coin::register<AptosCoin>(user);
        let coins = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        coin::deposit(user_addr, coins);

        coin::register<AptosCoin>(deployer);
        initialize_pool<AptosCoin>(deployer, TEST_FIXED_AMOUNT);

        // Make first deposit
        let secret_hash = x"01020304";
        deposit<AptosCoin>(user, secret_hash, TEST_FIXED_AMOUNT);

        // Try to deposit with same commitment - should fail
        deposit<AptosCoin>(user, secret_hash, TEST_FIXED_AMOUNT);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}