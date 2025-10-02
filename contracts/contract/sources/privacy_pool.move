module mixer::privacy_pool {

    // --- Imports and Constants (Unchanged) ---
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use std::table::{Self, Table};
    use std::string::{String};
    const E_NOT_OPERATOR: u64 = 1;
    const E_SECRET_ALREADY_USED: u64 = 3;
    const E_DEPOSIT_NOT_FOUND: u64 = 4;
    const E_MIXER_ALREADY_EXISTS: u64 = 5;
    const E_POOL_NOT_FOUND: u64 = 6;
    const E_POOL_DENOMINATION_EXISTS: u64 = 7;

    // --- Structs (Unchanged) ---
    struct Pool<phantom CoinType> has store {
        balance: Coin<CoinType>,
        deposits: Table<vector<u8>, bool>,
    }

    struct Mixer<phantom CoinType> has key {
        operator_address: address,
        used_secrets: Table<vector<u8>, bool>,
        pools: Table<u64, Pool<CoinType>>,
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
        pool_created_events: EventHandle<PoolCreatedEvent>,
    }

    // --- Events (Unchanged) ---
    struct DepositEvent has drop, store { commitment: vector<u8>, amount: u64 }
    struct WithdrawEvent has drop, store { recipient: address, amount: u64 }
    struct PoolCreatedEvent has drop, store { denomination: u64, label: String }

    // --- Management Functions (Updated) ---
    public entry fun initialize_mixer<CoinType>(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        // CORRECTED: Check for existence at the @mixer address.
        assert!(!exists<Mixer<CoinType>>(@mixer), E_MIXER_ALREADY_EXISTS);

        move_to(deployer, Mixer<CoinType> {
            operator_address: deployer_addr,
            used_secrets: table::new(),
            pools: table::new(),
            deposit_events: account::new_event_handle<DepositEvent>(deployer),
            withdraw_events: account::new_event_handle<WithdrawEvent>(deployer),
            pool_created_events: account::new_event_handle<PoolCreatedEvent>(deployer),
        });
    }

    public entry fun add_pool<CoinType>(operator: &signer, denomination: u64, label: String) acquires Mixer {
        // CORRECTED: Borrow from the @mixer address.
        assert!(signer::address_of(operator) == borrow_global<Mixer<CoinType>>(@mixer).operator_address, E_NOT_OPERATOR);
        
        let mixer = borrow_global_mut<Mixer<CoinType>>(@mixer);
        assert!(!table::contains(&mixer.pools, denomination), E_POOL_DENOMINATION_EXISTS);

        let new_pool = Pool<CoinType> {
            balance: coin::zero<CoinType>(),
            deposits: table::new(),
        };

        table::add(&mut mixer.pools, denomination, new_pool);

        event::emit_event(&mut mixer.pool_created_events, PoolCreatedEvent {
            denomination,
            label,
        });
    }

    // --- User-Facing Functions (Updated) ---
    public entry fun deposit<CoinType>(user: &signer, secret_hash: vector<u8>, amount: u64) acquires Mixer {
        // CORRECTED: Borrow from the @mixer address.
        let mixer = borrow_global_mut<Mixer<CoinType>>(@mixer);
        assert!(table::contains(&mixer.pools, amount), E_POOL_NOT_FOUND);
        let pool = table::borrow_mut(&mut mixer.pools, amount);
        assert!(!table::contains(&pool.deposits, secret_hash), E_DEPOSIT_NOT_FOUND);
        let coins = coin::withdraw<CoinType>(user, amount);
        table::add(&mut pool.deposits, secret_hash, true);
        coin::merge(&mut pool.balance, coins);
        event::emit_event(&mut mixer.deposit_events, DepositEvent {
            commitment: secret_hash,
            amount,
        });
    }

    public entry fun withdraw_direct<CoinType>(
        user: &signer,
        secret_hash: vector<u8>,
        amount: u64
    ) acquires Mixer {
        let recipient_address = signer::address_of(user);
        // CORRECTED: Borrow from the @mixer address.
        let mixer = borrow_global_mut<Mixer<CoinType>>(@mixer);

        assert!(table::contains(&mixer.pools, amount), E_POOL_NOT_FOUND);
        assert!(!table::contains(&mixer.used_secrets, secret_hash), E_SECRET_ALREADY_USED);

        let pool = table::borrow_mut(&mut mixer.pools, amount);
        assert!(table::contains(&pool.deposits, secret_hash), E_DEPOSIT_NOT_FOUND);

        table::add(&mut mixer.used_secrets, secret_hash, true);
        let _ = table::remove(&mut pool.deposits, secret_hash);

        let withdrawn_coins = coin::extract(&mut pool.balance, amount);
        coin::deposit(recipient_address, withdrawn_coins);

        event::emit_event(&mut mixer.withdraw_events, WithdrawEvent {
            recipient: recipient_address,
            amount: amount,
        });
    }
}