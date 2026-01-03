export const zh = {
    app: {
        title: 'CheckingAll 循环物资台账',
        subtitle: '用于可重用耗材（周转箱）的跟踪工作台。登录后进入对应角色的工作流程。',
        api_label: 'API',
        api_connected: '已连接',
        api_offline: '离线',
        role: '角色',
        factory: '分厂',
        select_role_workspace: '请选择上方的角色工作区。'
    },
    common: {
        logout: '退出登录',
        signed_in_as: '当前登录'
    },
    login: {
        title: '登录',
        subtitle: '请输入账号与密码继续。',
        username: '用户名',
        password: '密码',
        username_placeholder: '输入用户名',
        password_placeholder: '输入密码',
        submit: '登录',
        submitting: '登录中...',
        helper: '默认管理员账号：admin / admin',
        error: '用户名或密码错误。'
    },
    ops: {
        subtitle: {
            default: '请选择操作继续。',
            driver: '记录每日行程并确认补货。',
            clerk: '记录每日出库总量并确认补货。',
            manager: '审批事项、确认回流并查看报表。'
        },
        manager: {
            title: '经理操作台',
            tabs: {
                approvals: '审批',
                confirmations: '确认',
                adjustments: '调整',
                reports: '报表'
            }
        }
    },
    roles: {
        driver: '司机',
        clerk: '文员',
        manager: '经理',
        admin: '管理员'
    },
    components: {
        session: {
            title: '会话控制',
            user_id: '用户 ID',
            placeholder: '输入用户 ID',
            load_user: '加载用户',
            clear: '清除',
            signed_in_as: '当前登录：'
        },
        master_data: {
            title: '快速概览',
            subtitle: '从数据库提取的基础数据。插入新工厂或耗材后请刷新。',
            tag_factories: '分厂',
            tag_consumables: '耗材',
            available: '可用',
            refresh: '刷新基础数据'
        },
        role_workspace: {
            title: '角色工作台'
        }
    },
    nav: {
        daily_returns: '每日回流',
        confirmations: '确认单据',
        adjustments: '调整单',
        reports: '截止报表',
        master_data: '基础数据管理'
    },
    daily_return: {
        form: {
            biz_date: '业务日期',
            factory: '分厂',
            select_factory: '选择分厂',
            v_level: '核验等级',
            line_items: '行项目',
            consumable: '耗材',
            select_consumable: '选择耗材',
            book_balance: '账面余额',
            declared_qty: '申报数量',
            discrepancy_note: '差异说明',
            remove: '移除',
            add_line: '添加行',
            note: '备注',
            submit: '提交回流单',
            submitting: '提交中...'
        },
        v_levels: {
            verbal_only: '仅口头',
            visual_estimate: '目测预估',
            full_count: '全量清点',
            factory_directive: '工厂指令'
        }
    },
    confirmations: {
        subtitle: '确认已提交的回流单以锁定证据链。',
        table: {
            id: '单号',
            biz_date: '业务日期',
            factory: '分厂',
            status: '状态',
            verification: '核验方式',
            actions: '操作'
        },
        confirm_btn: '确认',
        empty: '暂无回流单。'
    },
    adjustments: {
        daily_return: '关联回流单',
        select_return: '选择回流单',
        note: '备注',
        lines_title: '调整行',
        consumable: '耗材',
        delta_qty: '调整数量',
        reason: '原因',
        remove: '移除',
        add_line: '添加行',
        submit: '提交调整',
        saving: '保存中...'
    },
    reports: {
        as_of: '截止时间',
        confirmed_only: '仅已确认',
        run_btn: '查询余额',
        yes: '是',
        include_submitted: '包含未确认',
        table: {
            biz_date: '业务日期',
            factory: '分厂',
            consumable: '耗材',
            qty: '截止数量'
        },
        empty: '暂无报表数据。'
    },
    daily_outbound: {
        title: '每日出库报表',
        subtitle: '填写今天从分厂发出的箱子总数。',
        total_quantity: '出库总数量',
        quantity_placeholder: '例如 500',
        saving: '保存中...',
        update: '更新报表',
        submit: '提交报表',
        saved_notice: '已保存 {{date}} 的总数为 {{quantity}} 箱。',
        notice_success: '每日出库报表已保存。',
        notice_error: '保存报表失败。'
    },
    trip_entry: {
        title: '每日行程录入',
        select_factory: '选择分厂',
        select_factory_placeholder: '选择分厂',
        select_site: '选择目的地站点',
        select_site_placeholder: '选择站点',
        loading_sites: '加载站点中...',
        quantity_label: '送达数量（箱）',
        quantity_placeholder: '例如 50',
        note_label_optional: '备注（可选）',
        note_placeholder: '例如 早班配送',
        submitting: '提交中...',
        submit: '提交行程',
        recent_title: '最近行程',
        table: {
            date: '日期',
            factory: '分厂',
            site: '站点',
            qty: '数量',
            status: '状态'
        },
        empty: '暂无行程记录。',
        notices: {
            load_error: '加载行程失败。',
            submit_success: '行程已提交，等待审批。',
            submit_error: '提交失败。'
        }
    },
    restock_confirm: {
        title: '待确认补货',
        subtitle: '请确认收到以下箱子：',
        quantity: '{{quantity}} 箱',
        from: '来自 {{manager}}（{{date}}）',
        confirm_btn: '确认收货'
    },
    manager_dashboard: {
        tabs: {
            approvals: '审批',
            platform: '平台回收（中转站）',
            distribute: '分发（补货）'
        },
        reviews: {
            pending_trips: '待审批司机行程',
            pending_reports: '待审批文员报表',
            table: {
                date: '日期',
                driver: '司机',
                clerk: '文员',
                factory: '分厂',
                qty: '数量',
                action: '操作'
            },
            approve: '批准',
            empty_trips: '暂无待审批行程。',
            empty_reports: '暂无待审批报表。'
        },
        platform: {
            title: '记录平台回收',
            qty_placeholder: '回收数量',
            note_placeholder: '备注（可选）',
            submit: '提交',
            history_title: '近期记录',
            table: {
                date: '日期',
                qty: '数量',
                note: '备注'
            }
        },
        distribute: {
            title: '向分厂派发补货',
            factory_label: '分厂',
            select_factory: '选择分厂',
            quantity_label: '数量',
            note_placeholder: '备注（司机姓名等）',
            dispatch: '派发补货',
            dispatched_notice: '补货已派发！'
        }
    },
    admin: {
        create_factory: '创建分厂',
        create_consumable: '创建耗材',
        create_user: '创建用户',
        tabs: {
            sites: '站点',
            factories: '分厂',
            users: '用户',
            consumables: '耗材'
        },
        titles: {
            view_site: '查看站点',
            edit_site: '编辑站点',
            create_site: '创建站点',
            view_factory: '查看分厂',
            edit_factory: '编辑分厂',
            create_factory: '创建分厂',
            edit_user: '编辑用户',
            create_user: '创建用户',
            edit_consumable: '编辑耗材',
            create_consumable: '创建耗材'
        },
        permissions: {
            sites_create: '你没有权限创建站点。',
            factories_create: '你没有权限创建分厂。'
        },
        labels: {
            code: '编码',
            name: '名称',
            active: '启用',
            linked_factories: '关联分厂',
            linked_sites: '关联站点',
            assigned_managers: '已分配经理',
            assigned_staff: '已分配员工',
            no_managers: '暂无经理',
            no_staff: '暂无员工',
            assign_site: '分配到站点',
            assign_factory: '分配到分厂'
        },
        placeholders: {
            code: '编码',
            name: '名称',
            unit: '单位',
            username: '用户名',
            display_name: '显示名称',
            no_factory: '无分厂',
            password: '密码',
            new_password_optional: '新密码（可选）',
            select_site: '-- 选择站点 --',
            select_factory: '-- 选择分厂 --'
        },
        buttons: {
            create: '创建'
        },
        actions: {
            create: '创建',
            update: '更新',
            cancel: '取消',
            close: '关闭',
            view: '查看',
            edit: '编辑',
            delete: '删除'
        },
        status: {
            inactive: '已停用'
        },
        confirm_delete: '确定删除？此操作无法撤销。',
        notices: {
            delete_success: '删除成功。',
            delete_error: '删除失败（条目可能正在使用）。',
            site_created: '站点已创建。',
            site_updated: '站点已更新。',
            factory_created: '分厂已创建。',
            factory_updated: '分厂已更新。',
            user_created: '用户已创建。',
            user_updated: '用户已更新。',
            consumable_created: '耗材已创建。',
            consumable_updated: '耗材已更新。',
            operation_failed: '操作失败。'
        },
        roles: {
            driver: '司机',
            clerk: '文员',
            manager: '经理',
            admin: '管理员'
        }
    },
    statuses: {
        draft: '草稿',
        submitted: '已提交',
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        confirmed: '已确认',
        voided: '已作废',
        dispatched: '已发出',
        received: '已接收'
    },
    notices: {
        user_not_found: '用户未找到。请检查 ID 请求头。',
        master_data_error: '加载基础数据失败。',
        daily_returns_error: '加载回流单失败。',
        report_error: '加载报表数据失败。',
        daily_return_success: '回流单已提交。',
        daily_return_submit_error: '提交回流单失败。',
        confirm_success: '回流单 #{{id}} 已确认。',
        confirm_error: '确认回流单失败。',
        adjustment_success: '调整单已记录。',
        adjustment_error: '创建调整单失败。',
        factory_created: '分厂已创建。',
        factory_error: '创建分厂失败。',
        consumable_created: '耗材已创建。',
        consumable_error: '创建耗材失败。',
        user_created: '用户已创建。',
        user_error: '创建用户失败。'
    }
};
