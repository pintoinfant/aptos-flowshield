// The module declaration.
// It's defined under a named address `veil_addr`, which you will configure to be
// your deployer/operator account address.
module veil_addr::privacy_pool {

    // --- Imports ---
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use std::table::{Self, Table};

    // --- Constants ---
    const E_NOT_OPERATOR: u64 = 1;
    const E_WRONG_AMOUNT: u64 = 2;
    const E_SECRET_ALREADY_USED: u64 = 3;
    const E_DEPOSIT_NOT_FOUND: u64 = 4;
    const E_POOL_ALREADY_EXISTS: u64 = 5;

    // --- Structs ---
    struct Pool<phantom CoinType> has key {
        operator_address: address,
        fixed_amount: u64,
        balance: Coin<CoinType>,
        deposits: Table<vector<u8>, bool>,
        used_secrets: Table<vector<u8>, bool>,
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
    }

    struct DepositEvent has drop, store {
        commitment: vector<u8>,
        amount: u64,
    }

    struct WithdrawEvent has drop, store {
        recipient: address,
        amount: u64,
    }

    // --- Public Functions ---
    public entry fun initialize_pool<CoinType>(deployer: &signer, fixed_deposit_amount: u64) {
        let deployer_addr = signer::address_of(deployer);

        assert!(!exists<Pool<CoinType>>(@veil_addr), E_POOL_ALREADY_EXISTS);

        move_to(deployer, Pool<CoinType> {
            operator_address: deployer_addr,
            fixed_amount: fixed_deposit_amount,
            balance: coin::zero<CoinType>(),
            deposits: table::new(),
            used_secrets: table::new(),
            deposit_events: account::new_event_handle<DepositEvent>(deployer),
            withdraw_events: account::new_event_handle<WithdrawEvent>(deployer),
        });
    }

    public entry fun deposit<CoinType>(
        user: &signer,
        secret_hash: vector<u8>,
        amount: u64
    ) acquires Pool {
        let pool = borrow_global_mut<Pool<CoinType>>(@veil_addr);

        assert!(amount == pool.fixed_amount, E_WRONG_AMOUNT);
        assert!(!table::contains(&pool.deposits, secret_hash), E_SECRET_ALREADY_USED);

        let coins = coin::withdraw<CoinType>(user, amount);
        table::add(&mut pool.deposits, secret_hash, true);
        coin::merge(&mut pool.balance, coins);

        event::emit_event(&mut pool.deposit_events, DepositEvent {
            commitment: secret_hash,
            amount,
        });
    }

    public entry fun withdraw<CoinType>(
        operator: &signer,
        secret_hash: vector<u8>,
        recipient: address
    ) acquires Pool {
        let operator_addr = signer::address_of(operator);
        let pool = borrow_global_mut<Pool<CoinType>>(@veil_addr);

        assert!(operator_addr == pool.operator_address, E_NOT_OPERATOR);
        assert!(!table::contains(&pool.used_secrets, secret_hash), E_SECRET_ALREADY_USED);
        assert!(table::contains(&pool.deposits, secret_hash), E_DEPOSIT_NOT_FOUND);

        table::add(&mut pool.used_secrets, secret_hash, true);
        let _ = table::remove(&mut pool.deposits, secret_hash);

        let withdrawn_coins = coin::extract(&mut pool.balance, pool.fixed_amount);
        coin::deposit(recipient, withdrawn_coins);

        event::emit_event(&mut pool.withdraw_events, WithdrawEvent {
            recipient,
            amount: pool.fixed_amount,
        });
    }
}