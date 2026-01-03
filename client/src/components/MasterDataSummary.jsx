import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function MasterDataSummary({ factories, consumables, loadMasterData }) {
    const { t } = useTranslation();
    const factoryItems = factories.map((factory) => ({
        id: factory.id,
        label: `${factory.code} - ${factory.name}`
    }));
    const consumableItems = consumables.map((item) => ({
        id: item.id,
        label: `${item.code} - ${item.name}`
    }));

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
                <div className="stat-box has-tooltip">
                    <div className="stat-label">{t('components.master_data.tag_factories')}</div>
                    <div className="stat-value">{factories.length}</div>
                    <div className="stat-sub">{t('components.master_data.available')}</div>
                    <div className="stat-tooltip">
                        <div className="stat-tooltip-title">{t('components.master_data.factory_list')}</div>
                        {factoryItems.length === 0 ? (
                            <div className="text-muted">{t('components.master_data.empty')}</div>
                        ) : (
                            <ul className="stat-tooltip-list">
                                {factoryItems.map((item) => (
                                    <li key={item.id}>{item.label}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="stat-box has-tooltip">
                    <div className="stat-label">{t('components.master_data.tag_consumables')}</div>
                    <div className="stat-value">{consumables.length}</div>
                    <div className="stat-sub">{t('components.master_data.available')}</div>
                    <div className="stat-tooltip">
                        <div className="stat-tooltip-title">{t('components.master_data.consumable_list')}</div>
                        {consumableItems.length === 0 ? (
                            <div className="text-muted">{t('components.master_data.empty')}</div>
                        ) : (
                            <ul className="stat-tooltip-list">
                                {consumableItems.map((item) => (
                                    <li key={item.id}>{item.label}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
