import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function MasterDataSummary({ factories, consumables, inventorySummary = {}, loadMasterData }) {
    const { t } = useTranslation();
    const factoryItems = factories.map((factory) => ({
        id: factory.id,
        label: `${factory.code} - ${factory.name}`
    }));
    const consumableItems = consumables.map((item) => {
        const summary = inventorySummary[String(item.id)] || {};
        return {
            id: item.id,
            label: `${item.code} - ${item.name}`,
            total: summary.total ?? 0,
            global: summary.global ?? 0,
            factory: summary.factory ?? 0,
            site: summary.site ?? 0,
            unit: item.unit || ''
        };
    });

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
                <div
                    className="stat-box has-tooltip"
                    tabIndex={0}
                    aria-label={t('components.master_data.factory_list')}
                >
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
                <div
                    className="stat-box has-tooltip"
                    tabIndex={0}
                    aria-label={t('components.master_data.consumable_list')}
                >
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
                                    <li key={item.id}>
                                        {item.label}: {t('components.master_data.total_label')} {item.total}{item.unit ? ` ${item.unit}` : ''} (
                                        {t('components.master_data.global_label')} {item.global}, {t('components.master_data.factories_label')} {item.factory}, {t('components.master_data.sites_label')} {item.site})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
