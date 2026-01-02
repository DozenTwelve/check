-- ==========================================
-- 1. 扩展与枚举 (Enums)
-- ==========================================

-- 撤销旧类型（如果存在）
DROP TYPE IF EXISTS verification_level CASCADE;
DROP TYPE IF EXISTS doc_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS in_mode CASCADE;

CREATE TYPE user_role AS ENUM ('driver', 'clerk', 'manager', 'admin');
CREATE TYPE doc_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'confirmed', 'voided');
CREATE TYPE in_mode AS ENUM ('per_trip', 'daily_summary');
CREATE TYPE verification_level AS ENUM ('verbal_only', 'visual_estimate', 'full_count', 'factory_directive');

-- 自动化更新时间戳的通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 2. 基础数据表 (Master Data)
-- ==========================================

-- 耗材定义
CREATE TABLE consumables (
    id          bigserial PRIMARY KEY,
    code        text NOT NULL UNIQUE,          -- A/B/C...
    name        text,
    unit        text DEFAULT 'pcs',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 分厂定义
CREATE TABLE factories (
    id          bigserial PRIMARY KEY,
    code        text NOT NULL UNIQUE,
    name        text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 客户现场 (黑箱终端)
CREATE TABLE client_sites (
    id          bigserial PRIMARY KEY,
    code        text NOT NULL UNIQUE,
    name        text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 用户与权限
CREATE TABLE users (
    id           bigserial PRIMARY KEY,
    role         user_role NOT NULL,
    username     text NOT NULL UNIQUE,
    display_name text NOT NULL,
    factory_id   bigint REFERENCES factories(id) ON DELETE RESTRICT,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    -- 约束：司机和职员必须有所属分厂，经理和管理员可以没有
    CONSTRAINT role_factory_check CHECK (
        (role IN ('driver','clerk') AND factory_id IS NOT NULL) OR (role IN ('manager','admin'))
    )
);

-- ==========================================
-- 3. 业务流水表 (Ledger Events)
-- ==========================================

-- 事件 ①：送箱 (分厂 -> 平台)
CREATE TABLE deliveries_in (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    factory_id    bigint NOT NULL REFERENCES factories(id),
    mode          in_mode NOT NULL,
    submitted_by  bigint NOT NULL REFERENCES users(id),
    submitted_at  timestamptz NOT NULL DEFAULT now(),
    status        doc_status NOT NULL DEFAULT 'submitted',
    approved_by   bigint REFERENCES users(id),
    approved_at   timestamptz,
    voided_at     timestamptz,
    note          text
);

CREATE TABLE deliveries_in_lines (
    id             bigserial PRIMARY KEY,
    delivery_in_id bigint NOT NULL REFERENCES deliveries_in(id) ON DELETE RESTRICT,
    consumable_id  bigint NOT NULL REFERENCES consumables(id),
    qty            integer NOT NULL CHECK (qty >= 0)
);

-- 事件 ②：发往现场 (平台 -> 客户) - 低信度存证
CREATE TABLE deliveries_out (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    site_id       bigint NOT NULL REFERENCES client_sites(id),
    recorded_by   bigint NOT NULL REFERENCES users(id),
    recorded_at   timestamptz NOT NULL DEFAULT now(),
    note          text
);

CREATE TABLE deliveries_out_lines (
    id              bigserial PRIMARY KEY,
    delivery_out_id bigint NOT NULL REFERENCES deliveries_out(id) ON DELETE RESTRICT,
    consumable_id   bigint NOT NULL REFERENCES consumables(id),
    qty             integer NOT NULL CHECK (qty >= 0)
);

-- 事件 ③：当日回流结算 (平台 -> 分厂) - 核心声明凭证
CREATE TABLE daily_returns (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    factory_id    bigint NOT NULL REFERENCES factories(id),
    
    -- 核心：确权声明的质量
    v_level       verification_level NOT NULL DEFAULT 'verbal_only',
    
    created_by    bigint NOT NULL REFERENCES users(id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    status        doc_status NOT NULL DEFAULT 'submitted',
    
    -- 确认逻辑
    confirmed_by  bigint REFERENCES users(id), -- 分厂侧人员确认
    confirmed_at  timestamptz,
    
    -- 版本链：如果这一单是用来修正之前的单据
    parent_id     bigint REFERENCES daily_returns(id),
    note          text
);

CREATE TABLE daily_return_lines (
    id               bigserial PRIMARY KEY,
    daily_return_id  bigint NOT NULL REFERENCES daily_returns(id) ON DELETE RESTRICT,
    consumable_id    bigint NOT NULL REFERENCES consumables(id),
    
    book_balance     integer DEFAULT 0,            -- 录入时的账面应还余额
    declared_qty     integer NOT NULL CHECK (declared_qty >= 0), -- 双方认可的实际带回数
    discrepancy_note text                           -- 若有差额，在此记录共识理由
);

-- ==========================================
-- 4. 索引与约束增强
-- ==========================================

-- 部分唯一索引：确保每个分厂每天只有一个“非作废”的结算单
-- 这允许你保留作废的单据做审计，但当前的账只有一个
CREATE UNIQUE INDEX idx_one_active_return_per_day 
ON daily_returns (biz_date, factory_id) 
WHERE status != 'voided';

-- 确认约束：状态为 confirmed 时，确认人不能为空
ALTER TABLE daily_returns ADD CONSTRAINT confirmed_logic_check 
CHECK ( (status = 'confirmed' AND confirmed_by IS NOT NULL) OR (status != 'confirmed') );

-- ==========================================
-- 5. 触发器绑定
-- ==========================================
CREATE TRIGGER trg_upd_consumables BEFORE UPDATE ON consumables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_factories BEFORE UPDATE ON factories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();