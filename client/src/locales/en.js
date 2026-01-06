export const en = {
    app: {
        title: 'CheckingAll Ledger MVP',
        subtitle: 'Rolling ledger workspace for tracking reusable consumables. Sign in to access your role workflow.',
        api_label: 'API',
        api_connected: 'Connected',
        api_offline: 'Offline',
        role: 'Role',
        factory: 'Factory',
        select_role_workspace: 'Select a role workspace above.',
        clerk_disabled: 'Clerk workflow is not enabled in this version.'
    },
    common: {
        logout: 'Log Out',
        signed_in_as: 'Signed in as',
        close: 'Close'
    },
    login: {
        title: 'Sign In',
        subtitle: 'Enter your credentials to continue.',
        username: 'Username',
        password: 'Password',
        username_placeholder: 'Enter username',
        password_placeholder: 'Enter password',
        submit: 'Sign In',
        submitting: 'Signing in...',
        helper: 'Default admin login: admin / admin.',
        error: 'Invalid username or password.'
    },
    ops: {
        subtitle: {
            default: 'Choose an action to continue.',
            driver: 'Record factory deliveries to the site.',
            clerk: 'Clerk workflow is not enabled.',
            manager: 'Review approvals, distribute inventory, and run reports.'
        },
        manager: {
            title: 'Manager Operations',
            tabs: {
                approvals: 'Approvals',
                adjustments: 'Adjustments',
                reports: 'Reports'
            }
        }
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
            refresh: 'Refresh Master Data',
            factory_list: 'Factory list',
            consumable_list: 'Consumable list',
            empty: 'No items available.'
        },
        role_workspace: {
            title: 'Role Workspace'
        }
    },
    nav: {
        trips: 'Driver Trips',
        approvals: 'Approvals',
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
        daily_return: 'Transfer',
        select_return: 'Select transfer',
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
        location_type: 'Location Type',
        location_factory: 'Factories',
        location_site: 'Sites',
        location_global: 'Global',
        location_external: 'External',
        run_btn: 'Fetch Balances',
        yes: 'Yes',
        include_submitted: 'Include Submitted',
        table: {
            location: 'Location',
            consumable: 'Consumable',
            qty: 'As-of Qty'
        },
        empty: 'No report rows yet.'
    },
    box_counts: {
        admin_title: 'Branch Box Counts',
        manager_title: 'Branch Box Counts',
        loading: 'Loading box counts...',
        empty: 'No factory counts available.',
        refresh: 'Refresh',
        load_error: 'Failed to load box counts.',
        last_updated: 'Last updated: {{time}}',
        view_history: 'View History',
        history_title: 'Box History — {{factory}}',
        history_loading: 'Loading history...',
        history_error: 'Failed to load history.',
        history_empty: 'No history rows yet.',
        table: {
            factory: 'Factory',
            consumable: 'Consumable',
            current: 'Current Qty',
            history: 'History'
        },
        history: {
            time: 'Time',
            type: 'Type',
            consumable: 'Consumable',
            change: 'Change',
            total: 'Total',
            actor: 'By',
            note: 'Note',
            system: 'System'
        },
        events: {
            baseline: 'Baseline',
            driver_trip: 'Driver Trip',
            manager_restock: 'Manager Restock',
            initial_inventory: 'Initial Inventory',
            legacy_outbound: 'Legacy Outbound',
            legacy_return: 'Legacy Return',
            adjustment: 'Adjustment'
        }
    },
    daily_outbound: {
        title: 'Daily Outbound Report',
        subtitle: 'Report the total number of boxes sent out from the factory today.',
        total_quantity: 'Total Outbound Quantity',
        quantity_placeholder: 'e.g. 500',
        saving: 'Saving...',
        update: 'Update Report',
        submit: 'Submit Report',
        saved_notice: 'Current saved total for {{date}} is {{quantity}} boxes.',
        notice_success: 'Daily outbound report saved.',
        notice_error: 'Failed to save report.'
    },
    trip_entry: {
        title: 'Daily Trip Entry',
        select_factory: 'Select Factory',
        select_factory_placeholder: 'Select factory',
        select_site: 'Select Destination Site',
        select_site_placeholder: 'Select site',
        loading_sites: 'Loading sites...',
        lines_title: 'Consumable Lines',
        consumable_label: 'Consumable',
        select_consumable: 'Select consumable',
        qty_label: 'Quantity',
        remove_line: 'Remove',
        add_line: 'Add Line',
        note_label_optional: 'Note (Optional)',
        note_placeholder: 'e.g. Morning delivery',
        submitting: 'Submitting...',
        submit: 'Submit Trip',
        recent_title: 'My Recent Trips',
        table: {
            date: 'Date',
            factory: 'Factory',
            site: 'Site',
            lines: 'Lines',
            status: 'Status'
        },
        empty: 'No trips found.',
        notices: {
            load_error: 'Failed to load trips',
            submit_success: 'Trip submitted for approval',
            submit_error: 'Submission failed'
        }
    },
    restock_confirm: {
        title: 'Incoming Restocks',
        subtitle: 'Please confirm receipt of the following boxes:',
        quantity: '{{quantity}} boxes',
        from: 'from {{manager}} ({{date}})',
        confirm_btn: 'Confirm Receipt'
    },
    manager_dashboard: {
        tabs: {
            approvals: 'Approvals',
            distribute: 'Distribution (Restock)'
        },
        reviews: {
            pending_trips: 'Pending Driver Trips',
            table: {
                date: 'Date',
                driver: 'Driver',
                factory: 'Factory',
                lines: 'Lines',
                action: 'Action'
            },
            approve: 'Approve',
            empty_trips: 'No pending trips.'
        },
        distribute: {
            title: 'Dispatch to Sub-Factory',
            factory_label: 'Factory',
            select_factory: 'Select Factory',
            quantity_label: 'Quantity',
            lines_title: 'Consumable Lines',
            consumable_label: 'Consumable',
            select_consumable: 'Select consumable',
            add_line: 'Add Line',
            remove_line: 'Remove',
            note_placeholder: 'Note (Driver name, etc.)',
            dispatch: 'Dispatch Restock',
            dispatched_notice: 'Restock dispatched!'
        }
    },
    admin: {
        create_factory: 'Create Factory',
        create_consumable: 'Create Consumable',
        create_user: 'Create User',
        tabs: {
            sites: 'Sites',
            factories: 'Factories',
            users: 'Users',
            consumables: 'Consumables'
        },
        titles: {
            view_site: 'View Site',
            edit_site: 'Edit Site',
            create_site: 'Create Site',
            view_factory: 'View Factory',
            edit_factory: 'Edit Factory',
            create_factory: 'Create Factory',
            edit_user: 'Edit User',
            create_user: 'Create User',
            edit_consumable: 'Edit Consumable',
            create_consumable: 'Create Consumable'
        },
        permissions: {
            sites_create: 'You do not have permission to create sites.',
            factories_create: 'You do not have permission to create factories.'
        },
        labels: {
            code: 'Code',
            name: 'Name',
            active: 'Active',
            linked_factories: 'Linked Sub-Factories',
            linked_sites: 'Linked Sites',
            assigned_managers: 'Assigned Managers',
            assigned_staff: 'Assigned Staff',
            no_managers: 'No managers assigned',
            no_staff: 'No staff assigned',
            assign_site: 'Assign to Site',
            assign_factory: 'Assign to Factory',
            baseline_lines: 'Factory Baseline (Consumables)',
            adjust_lines: 'Factory Inventory Adjustment',
            consumable: 'Consumable',
            qty: 'Quantity',
            current_qty: 'Current Qty',
            adjust_qty: 'Adjust Qty (+/-)',
            current_inventory: 'Current Inventory',
            no_inventory: 'No inventory recorded.',
            add_line: 'Add Line',
            remove_line: 'Remove'
        },
        placeholders: {
            code: 'Code',
            name: 'Name',
            unit: 'Unit',
            username: 'Username',
            display_name: 'Display Name',
            no_factory: 'No Factory',
            password: 'Password',
            new_password_optional: 'New Password (Optional)',
            initial_qty: 'Initial Qty',
            adjust_qty: 'Adjust Qty (+/-)',
            select_site: '-- Select Site --',
            select_factory: '-- Select Factory --',
            select_consumable: '-- Select Consumable --'
        },
        buttons: {
            create: 'Create'
        },
        actions: {
            create: 'Create',
            update: 'Update',
            cancel: 'Cancel',
            close: 'Close',
            view: 'View',
            edit: 'Edit',
            remove_entry: 'Remove Entry',
            delete: 'Delete'
        },
        status: {
            inactive: 'Inactive'
        },
        confirm_delete: 'Are you sure? This action cannot be undone.',
        notices: {
            delete_success: 'Deleted successfully',
            delete_error: 'Delete failed (Item might be in use)',
            site_created: 'Site created',
            site_updated: 'Site updated',
            factory_created: 'Factory created',
            factory_updated: 'Factory updated',
            user_created: 'User created',
            user_updated: 'User updated',
            consumable_created: 'Consumable created',
            consumable_updated: 'Consumable updated',
            operation_failed: 'Operation failed'
        },
        roles: {
            driver: 'Driver',
            clerk: 'Clerk',
            manager: 'Manager',
            admin: 'Admin'
        }
    },
    statuses: {
        draft: 'Draft',
        submitted: 'Submitted',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        confirmed: 'Confirmed',
        voided: 'Voided',
        dispatched: 'Dispatched',
        received: 'Received'
    },
    notices: {
        user_not_found: 'User not found. Check the ID header.',
        master_data_error: 'Failed to load master data.',
        daily_returns_error: 'Failed to load transfers.',
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
