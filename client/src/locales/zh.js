export const zh = {
    app: {
        title: 'CheckingAll 循环物资台账',
        subtitle: '由于可重用耗材（周转箱）的跟踪工作台。使用用户ID登录以模拟司机、文员、经理和管理员的工作流程。',
        api_connected: '已连接',
        api_offline: '离线',
        role: '角色',
        factory: '分厂'
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
            placeholder: '输入用户ID',
            load_user: '加载用户',
            clear: '清除',
            signed_in_as: '当前登录：'
        },
        master_data: {
            title: '快速概览',
            subtitle: '从数据库提取的基础数据。插入新工厂或耗材后请刷新。',
            tag_factories: '分厂',
            tag_consumables: '耗材',
            available: '个可用',
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
        delta_qty: '调整数量 (Delta)',
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
    admin: {
        create_factory: '创建分厂',
        create_consumable: '创建耗材',
        create_user: '创建用户',
        placeholders: {
            code: '编码',
            name: '名称',
            unit: '单位',
            username: '用户名',
            display_name: '显示名称',
            no_factory: '无分厂'
        },
        buttons: {
            create: '创建'
        },
        roles: {
            driver: '司机',
            clerk: '文员',
            manager: '经理',
            admin: '管理员'
        }
    },
    notices: {
        user_not_found: '用户未找到。请检查ID。',
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
