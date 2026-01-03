import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function MasterDataSummary({ factories, consumables, loadMasterData }) {
    const { t } = useTranslation();

    return (
        <section className="card" style={{ '--delay': '120ms' }}>
            <div className="card-header">
                <h2>{t('components.master_data.title')}</h2>
                <button className="button ghost small" type="button" onClick={loadMasterData}>
                    {t('components.master_data.refresh')}
                </button>
            </div>
            <p className="subtitle" style={{ marginBottom: '20px' }}>
                {t('components.master_data.subtitle')}
            </p>
            <div className="stats-grid">
                <div className="stat-box">
                    <div className="stat-label">{t('components.master_data.tag_factories')}</div>
                    <div className="stat-value">{factories.length}</div>
                    <div className="stat-sub">{t('components.master_data.available')}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('components.master_data.tag_consumables')}</div>
                    <div className="stat-value">{consumables.length}</div>
                    <div className="stat-sub">{t('components.master_data.available')}</div>
                </div>
            </div>
        </section>
    );
}
