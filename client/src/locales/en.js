export const en = {
    app: {
        title: 'CheckingAll Ledger MVP',
        subtitle: 'Rolling ledger workspace for tracking reusable consumables. Sign in with a user id to simulate the driver, clerk, manager, and admin workflows.',
        api_label: 'API',
        api_connected: 'Connected',
        api_offline: 'Offline',
        role: 'Role',
        factory: 'Factory',
        select_role_workspace: 'Select a role workspace above.'
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
        quantity_label: 'Quantity Delivered (Boxes)',
        quantity_placeholder: 'e.g. 50',
        note_label_optional: 'Note (Optional)',
        note_placeholder: 'e.g. Morning delivery',
        submitting: 'Submitting...',
        submit: 'Submit Trip',
        recent_title: 'My Recent Trips',
        table: {
            date: 'Date',
            factory: 'Factory',
            site: 'Site',
            qty: 'Qty',
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
            platform: 'Hub Receipt (Platform)',
            distribute: 'Distribution (Restock)'
        },
        reviews: {
            pending_trips: 'Pending Driver Trips',
            pending_reports: 'Pending Clerk Reports',
            table: {
                date: 'Date',
                driver: 'Driver',
                clerk: 'Clerk',
                factory: 'Factory',
                qty: 'Qty',
                action: 'Action'
            },
            approve: 'Approve',
            empty_trips: 'No pending trips.',
            empty_reports: 'No pending reports.'
        },
        platform: {
            title: 'Record Platform Return',
            qty_placeholder: 'Qty Received',
            note_placeholder: 'Note (Optional)',
            submit: 'Submit',
            history_title: 'Recent History',
            table: {
                date: 'Date',
                qty: 'Qty',
                note: 'Note'
            }
        },
        distribute: {
            title: 'Dispatch to Sub-Factory',
            factory_label: 'Factory',
            select_factory: 'Select Factory',
            quantity_label: 'Quantity',
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
            assign_factory: 'Assign to Factory'
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
            select_site: '-- Select Site --',
            select_factory: '-- Select Factory --'
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
