export const en = {
    app: {
        title: 'CheckingAll Ledger MVP',
        subtitle: 'Rolling ledger workspace for tracking reusable consumables. Sign in with a user id to simulate the driver, clerk, manager, and admin workflows.',
        api_connected: 'Connected',
        api_offline: 'Offline',
        role: 'Role',
        factory: 'Factory'
    },
    roles: {
        driver: 'Driver',
        clerk: 'Clerk',
        manager: 'Manager',
        admin: 'Admin'
    },
    components: {
        session: {
            title: 'Session Control',
            user_id: 'User ID',
            placeholder: 'Enter user id',
            load_user: 'Load User',
            clear: 'Clear',
            signed_in_as: 'Signed in as'
        },
        master_data: {
            title: 'Quick Context',
            subtitle: 'Master data pulled from the database. Reload after inserting new factories or consumables.',
            tag_factories: 'Factories',
            tag_consumables: 'Consumables',
            available: 'available',
            refresh: 'Refresh Master Data'
        },
        role_workspace: {
            title: 'Role Workspace'
        }
    },
    nav: {
        daily_returns: 'Daily Returns',
        confirmations: 'Confirmations',
        adjustments: 'Adjustments',
        reports: 'As-Of Report',
        master_data: 'Master Data'
    },
    daily_return: {
        form: {
            biz_date: 'Business Date',
            factory: 'Factory',
            select_factory: 'Select factory',
            v_level: 'Verification Level',
            line_items: 'Line Items',
            consumable: 'Consumable',
            select_consumable: 'Select consumable',
            book_balance: 'Book Balance',
            declared_qty: 'Declared Qty',
            discrepancy_note: 'Discrepancy Note',
            remove: 'Remove',
            add_line: 'Add Line',
            note: 'Note',
            submit: 'Submit Daily Return',
            submitting: 'Submitting...'
        },
        v_levels: {
            verbal_only: 'Verbal only',
            visual_estimate: 'Visual estimate',
            full_count: 'Full count',
            factory_directive: 'Factory directive'
        }
    },
    confirmations: {
        subtitle: 'Confirm submitted returns to lock the evidence.',
        table: {
            id: 'ID',
            biz_date: 'Biz Date',
            factory: 'Factory',
            status: 'Status',
            verification: 'Verification',
            actions: ''
        },
        confirm_btn: 'Confirm',
        empty: 'No returns available.'
    },
    adjustments: {
        daily_return: 'Daily Return',
        select_return: 'Select return',
        note: 'Note',
        lines_title: 'Adjustment Lines',
        consumable: 'Consumable',
        delta_qty: 'Delta Qty',
        reason: 'Reason',
        remove: 'Remove',
        add_line: 'Add Line',
        submit: 'Submit Adjustment',
        saving: 'Saving...'
    },
    reports: {
        as_of: 'As-Of Timestamp',
        confirmed_only: 'Confirmed Only',
        run_btn: 'Fetch Balances',
        yes: 'Yes',
        include_submitted: 'Include Submitted',
        table: {
            biz_date: 'Biz Date',
            factory: 'Factory',
            consumable: 'Consumable',
            qty: 'As-of Qty'
        },
        empty: 'No report rows yet.'
    },
    admin: {
        create_factory: 'Create Factory',
        create_consumable: 'Create Consumable',
        create_user: 'Create User',
        placeholders: {
            code: 'Code',
            name: 'Name',
            unit: 'Unit',
            username: 'Username',
            display_name: 'Display Name',
            no_factory: 'No Factory'
        },
        buttons: {
            create: 'Create'
        },
        roles: {
            driver: 'Driver',
            clerk: 'Clerk',
            manager: 'Manager',
            admin: 'Admin'
        }
    },
    notices: {
        user_not_found: 'User not found. Check the ID header.',
        master_data_error: 'Failed to load master data.',
        daily_returns_error: 'Failed to load daily returns.',
        report_error: 'Failed to load report rows.',
        daily_return_success: 'Daily return submitted.',
        daily_return_submit_error: 'Failed to submit daily return.',
        confirm_success: 'Daily return #{{id}} confirmed.',
        confirm_error: 'Failed to confirm daily return.',
        adjustment_success: 'Adjustment recorded.',
        adjustment_error: 'Failed to create adjustment.',
        factory_created: 'Factory created.',
        factory_error: 'Failed to create factory.',
        consumable_created: 'Consumable created.',
        consumable_error: 'Failed to create consumable.',
        user_created: 'User created.',
        user_error: 'Failed to create user.'
    }
};
