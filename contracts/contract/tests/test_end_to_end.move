#[test_only]
module mixer::privacy_pool_tests {
    use std::signer;
    // We only need the account's address, not account creation functions.
    use aptos_framework::aptos_account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use std::string;

    // --- Import functions and constants from our main module ---
    use mixer::privacy_pool::{
        initialize_mixer,
        add_pool,
        deposit,
        withdraw_direct,
        E_POOL_NOT_FOUND,
        E_DEPOSIT_NOT_FOUND,
        E_SECRET_ALREADY_USED,
    };

    // --- Test Constants ---
    const TEST_POOL_AMOUNT: u64 = 10_000_000_000; // 10 APT
    const MINT_AMOUNT: u64 = 100_000_000_000;     // 100 APT
    const GAS_MONEY: u64 = 1_000_000_000;         // 1 APT

    // --- Deposit Tests ---

    #[test(aptos_framework = @0x1, deployer = @mixer, user = @0xCAFE)]
    fun test_deposit_success(aptos_framework: &signer, deployer: &signer, user: &signer) {
        // --- Setup Phase ---
        // Initialize the AptosCoin framework for minting.
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        // Fund the user's account. The `coin::register` call will create the account if it doesn't exist.
        coin::register<AptosCoin>(user);
        coin::deposit(signer::address_of(user), coin::mint<AptosCoin>(MINT_AMOUNT, &mint_cap));

        // Initialize our mixer and add a pool.
        initialize_mixer<AptosCoin>(deployer);
        add_pool<AptosCoin>(deployer, TEST_POOL_AMOUNT, string::utf8(b"10 APT Test Pool"));
        
        // --- Action Phase ---
        let secret_hash = x"01";
        deposit<AptosCoin>(user, secret_hash, TEST_POOL_AMOUNT);

        // --- Verification Phase ---
        let user_balance = coin::balance<AptosCoin>(signer::address_of(user));
        assert!(user_balance == MINT_AMOUNT - TEST_POOL_AMOUNT, 1);
        
        // --- Cleanup Phase ---
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, deployer = @mixer, user = @0xCAFE)]
    #[expected_failure(abort_code = E_POOL_NOT_FOUND, location = mixer::privacy_pool)]
    fun test_deposit_to_nonexistent_pool(aptos_framework: &signer, deployer: &signer, user: &signer) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::register<AptosCoin>(user);
        coin::deposit(signer::address_of(user), coin::mint<AptosCoin>(MINT_AMOUNT, &mint_cap));

        initialize_mixer<AptosCoin>(deployer);
        add_pool<AptosCoin>(deployer, TEST_POOL_AMOUNT, string::utf8(b"10 APT Test Pool"));

        let secret_hash = x"02";
        // Attempt to deposit to a pool that doesn't exist (11 APT).
        deposit<AptosCoin>(user, secret_hash, TEST_POOL_AMOUNT + 1);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, deployer = @mixer, user = @0xCAFE)]
    #[expected_failure(abort_code = E_DEPOSIT_NOT_FOUND, location = mixer::privacy_pool)]
    fun test_deposit_duplicate_secret_hash(aptos_framework: &signer, deployer: &signer, user: &signer) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::register<AptosCoin>(user);
        coin::deposit(signer::address_of(user), coin::mint<AptosCoin>(MINT_AMOUNT, &mint_cap));

        initialize_mixer<AptosCoin>(deployer);
        add_pool<AptosCoin>(deployer, TEST_POOL_AMOUNT, string::utf8(b"10 APT Test Pool"));

        let secret_hash = x"03";
        deposit<AptosCoin>(user, secret_hash, TEST_POOL_AMOUNT);
        // Attempt second deposit with the same hash.
        deposit<AptosCoin>(user, secret_hash, TEST_POOL_AMOUNT);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // --- Withdraw Tests ---

    #[test(aptos_framework = @0x1, deployer = @mixer, depositor = @0xCAFE, withdrawer = @0xBABE)]
    fun test_withdraw_success(aptos_framework: &signer, deployer: &signer, depositor: &signer, withdrawer: &signer) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::register<AptosCoin>(depositor);
        coin::deposit(signer::address_of(depositor), coin::mint<AptosCoin>(MINT_AMOUNT, &mint_cap));
        
        // Fund the withdrawer's account. `register` will create it.
        coin::register<AptosCoin>(withdrawer);
        coin::deposit(signer::address_of(withdrawer), coin::mint<AptosCoin>(GAS_MONEY, &mint_cap));

        initialize_mixer<AptosCoin>(deployer);
        add_pool<AptosCoin>(deployer, TEST_POOL_AMOUNT, string::utf8(b"10 APT Test Pool"));

        let secret_hash = x"04";
        deposit<AptosCoin>(depositor, secret_hash, TEST_POOL_AMOUNT);
        withdraw_direct<AptosCoin>(withdrawer, secret_hash, TEST_POOL_AMOUNT);

        let withdrawer_balance = coin::balance<AptosCoin>(signer::address_of(withdrawer));
        assert!(withdrawer_balance == GAS_MONEY + TEST_POOL_AMOUNT, 2);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, deployer = @mixer, depositor = @0xCAFE, withdrawer = @0xBABE)]
    #[expected_failure(abort_code = E_DEPOSIT_NOT_FOUND, location = mixer::privacy_pool)]
    fun test_withdraw_with_invalid_secret(aptos_framework: &signer, deployer: &signer, depositor: &signer, withdrawer: &signer) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::register<AptosCoin>(depositor);
        coin::deposit(signer::address_of(depositor), coin::mint<AptosCoin>(MINT_AMOUNT, &mint_cap));
        
        // `register` ensures the withdrawer account exists
        coin::register<AptosCoin>(withdrawer);

        initialize_mixer<AptosCoin>(deployer);
        add_pool<AptosCoin>(deployer, TEST_POOL_AMOUNT, string::utf8(b"10 APT Test Pool"));

        let valid_secret_hash = x"05";
        let invalid_secret_hash = x"FF";
        deposit<AptosCoin>(depositor, valid_secret_hash, TEST_POOL_AMOUNT);
        withdraw_direct<AptosCoin>(withdrawer, invalid_secret_hash, TEST_POOL_AMOUNT);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
    
    #[test(aptos_framework = @0x1, deployer = @mixer, depositor = @0xCAFE, withdrawer1 = @0xBABE, withdrawer2 = @0xFACE)]
    #[expected_failure(abort_code = E_SECRET_ALREADY_USED, location = mixer::privacy_pool)]
    fun test_withdraw_double_spend(aptos_framework: &signer, deployer: &signer, depositor: &signer, withdrawer1: &signer, withdrawer2: &signer) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::register<AptosCoin>(depositor);
        coin::deposit(signer::address_of(depositor), coin::mint<AptosCoin>(MINT_AMOUNT, &mint_cap));
        
        // `register` ensures withdrawer accounts exist.
        coin::register<AptosCoin>(withdrawer1);
        coin::register<AptosCoin>(withdrawer2);
        
        initialize_mixer<AptosCoin>(deployer);
        add_pool<AptosCoin>(deployer, TEST_POOL_AMOUNT, string::utf8(b"10 APT Test Pool"));

        let secret_hash = x"06";
        deposit<AptosCoin>(depositor, secret_hash, TEST_POOL_AMOUNT);
        withdraw_direct<AptosCoin>(withdrawer1, secret_hash, TEST_POOL_AMOUNT);
        withdraw_direct<AptosCoin>(withdrawer2, secret_hash, TEST_POOL_AMOUNT);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}